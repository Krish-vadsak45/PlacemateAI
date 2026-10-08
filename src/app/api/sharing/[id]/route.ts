import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import SharedAccess from '@/models/SharedAccess';

/**
 * PATCH /api/sharing/[id] — Accept, reject, or update a sharing invitation
 * Body: { action: 'accept' | 'reject' | 'update', permission?: 'viewer' | 'editor' }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, permission } = body;

    if (!['accept', 'reject', 'update'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "accept", "reject", or "update"' },
        { status: 400 }
      );
    }

    await connectDB();

    const invitation = await SharedAccess.findById(id);

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'accept': {
        // Only the invited user can accept
        const isRecipient =
          invitation.sharedWithId?.toString() === session.user.id ||
          invitation.sharedWithEmail === session.user.email?.toLowerCase();

        if (!isRecipient) {
          return NextResponse.json(
            { error: 'You are not authorized to accept this invitation' },
            { status: 403 }
          );
        }

        invitation.status = 'accepted';
        invitation.acceptedAt = new Date();
        invitation.sharedWithId = session.user.id as unknown as typeof invitation.sharedWithId;
        invitation.sharedWithName = session.user.name || undefined;
        invitation.sharedWithImage = session.user.image || undefined;
        await invitation.save();

        return NextResponse.json({
          success: true,
          message: `You now have ${invitation.permission} access to ${invitation.ownerName}'s dashboard.`,
          invitation,
        });
      }

      case 'reject': {
        // The invited user can reject, or the owner can revoke
        const isRecipient =
          invitation.sharedWithId?.toString() === session.user.id ||
          invitation.sharedWithEmail === session.user.email?.toLowerCase();
        const isOwner = invitation.ownerId.toString() === session.user.id;

        if (!isRecipient && !isOwner) {
          return NextResponse.json(
            { error: 'Not authorized' },
            { status: 403 }
          );
        }

        invitation.status = 'revoked';
        invitation.revokedAt = new Date();
        await invitation.save();

        return NextResponse.json({
          success: true,
          message: isOwner ? 'Access revoked.' : 'Invitation declined.',
          invitation,
        });
      }

      case 'update': {
        // Only the owner can update permissions
        if (invitation.ownerId.toString() !== session.user.id) {
          return NextResponse.json(
            { error: 'Only the owner can change permissions' },
            { status: 403 }
          );
        }

        if (permission && ['viewer', 'editor'].includes(permission)) {
          invitation.permission = permission;
          await invitation.save();
        }

        return NextResponse.json({
          success: true,
          message: `Permission updated to ${permission}.`,
          invitation,
        });
      }
    }
  } catch (error) {
    console.error('Error updating sharing:', error);
    return NextResponse.json(
      { error: 'Failed to update sharing' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sharing/[id] — Remove a sharing invitation entirely
 * Either the owner or the shared-with user can delete
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const invitation = await SharedAccess.findById(id);

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    // Either the owner or the recipient can delete
    const isOwner = invitation.ownerId.toString() === session.user.id;
    const isRecipient =
      invitation.sharedWithId?.toString() === session.user.id ||
      invitation.sharedWithEmail === session.user.email?.toLowerCase();

    if (!isOwner && !isRecipient) {
      return NextResponse.json(
        { error: 'Not authorized to delete this invitation' },
        { status: 403 }
      );
    }

    await SharedAccess.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Sharing access removed.',
    });
  } catch (error) {
    console.error('Error deleting sharing:', error);
    return NextResponse.json(
      { error: 'Failed to delete sharing' },
      { status: 500 }
    );
  }
}
