import connectDB from '@/lib/mongodb';
import SharedAccess, { SharedPermission } from '@/models/SharedAccess';

export interface AccessCheckResult {
  allowed: boolean;
  /** 'owner' = accessing own data, 'viewer'/'editor' = shared access */
  permission: 'owner' | SharedPermission;
  /** The effective userId whose data should be queried */
  effectiveUserId: string;
}

/**
 * Check if the session user has access to target owner's data.
 *
 * Usage in any API route:
 * ```ts
 * const access = await checkSharedAccess(session.user.id, targetOwnerId, 'viewer');
 * if (!access.allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 * // Use access.effectiveUserId for all DB queries
 * ```
 *
 * @param sessionUserId  - The logged-in user's ID
 * @param targetOwnerId  - The owner whose data we want to access (undefined = own data)
 * @param requiredPermission - Minimum permission required ('viewer' or 'editor')
 */
export async function checkSharedAccess(
  sessionUserId: string,
  targetOwnerId: string | undefined | null,
  requiredPermission: SharedPermission = 'viewer'
): Promise<AccessCheckResult> {
  // If no target specified or target is self — always allowed as owner
  if (!targetOwnerId || targetOwnerId === sessionUserId) {
    return {
      allowed: true,
      permission: 'owner',
      effectiveUserId: sessionUserId,
    };
  }

  // Check SharedAccess for permission
  await connectDB();

  const sharedAccess = await SharedAccess.findOne({
    ownerId: targetOwnerId,
    sharedWithId: sessionUserId,
    status: 'accepted',
  }).lean();

  if (!sharedAccess) {
    return {
      allowed: false,
      permission: 'viewer',
      effectiveUserId: sessionUserId,
    };
  }

  // Check if the user has sufficient permission
  const permissionLevel: Record<SharedPermission, number> = {
    viewer: 1,
    editor: 2,
  };

  const hasPermission =
    permissionLevel[sharedAccess.permission] >= permissionLevel[requiredPermission];

  if (hasPermission) {
    // Update lastAccessedAt (fire-and-forget)
    SharedAccess.updateOne(
      { _id: sharedAccess._id },
      { lastAccessedAt: new Date() }
    ).catch(() => {});
  }

  return {
    allowed: hasPermission,
    permission: sharedAccess.permission,
    effectiveUserId: targetOwnerId,
  };
}

/**
 * Resolve `ownerId` from request query params.
 * Use in API routes: `const ownerId = resolveOwnerId(request)`
 */
export function resolveOwnerId(request: Request): string | null {
  const { searchParams } = new URL(request.url);
  return searchParams.get('ownerId');
}

/**
 * Auto-link pending invitations when a new user signs up.
 * Called from the NextAuth signIn callback.
 */
export async function linkPendingInvitations(
  userId: string,
  userEmail: string,
  userName?: string,
  userImage?: string
): Promise<number> {
  await connectDB();

  const result = await SharedAccess.updateMany(
    {
      sharedWithEmail: userEmail.toLowerCase().trim(),
      status: 'pending',
      sharedWithId: { $exists: false },
    },
    {
      sharedWithId: userId,
      sharedWithName: userName,
      sharedWithImage: userImage,
    }
  );

  return result.modifiedCount;
}
