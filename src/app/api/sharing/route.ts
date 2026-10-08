import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import SharedAccess from '@/models/SharedAccess';
import User from '@/models/User';

/**
 * GET /api/sharing — Get all sharing info for the current user
 * Returns both "shared by me" and "shared with me" lists
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Dashboards I shared with others
    const sharedByMe = await SharedAccess.find({
      ownerId: session.user.id,
      status: { $ne: 'revoked' },
    })
      .sort({ createdAt: -1 })
      .lean();

    // Dashboards shared with me (by email or linked userId)
    const sharedWithMe = await SharedAccess.find({
      $or: [
        { sharedWithId: session.user.id, status: 'accepted' },
        { sharedWithEmail: session.user.email, status: 'pending' },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      sharedByMe,
      sharedWithMe,
    });
  } catch (error) {
    console.error('Error fetching sharing info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sharing info' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sharing — Create a new sharing invitation
 * Body: { email: string, permission: 'viewer' | 'editor' }
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { email, permission = 'viewer' } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Cannot share with yourself
    if (normalizedEmail === session.user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'You cannot share your dashboard with yourself' },
        { status: 400 }
      );
    }

    if (!['viewer', 'editor'].includes(permission)) {
      return NextResponse.json(
        { error: 'Permission must be "viewer" or "editor"' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if invitation already exists
    const existing = await SharedAccess.findOne({
      ownerId: session.user.id,
      sharedWithEmail: normalizedEmail,
      status: { $ne: 'revoked' },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'You have already shared with this email' },
        { status: 409 }
      );
    }

    // Check if the target user already has an account
    const targetUser = await User.findOne({ email: normalizedEmail }).lean();

    const invitation = await SharedAccess.create({
      ownerId: session.user.id,
      ownerName: session.user.name || 'Unknown',
      ownerEmail: session.user.email || '',
      ownerImage: session.user.image || undefined,
      sharedWithEmail: normalizedEmail,
      sharedWithId: targetUser?._id || undefined,
      sharedWithName: targetUser?.name || undefined,
      sharedWithImage: targetUser?.image || undefined,
      permission,
      status: 'pending',
    });

    return NextResponse.json({
      success: true,
      invitation,
      userExists: !!targetUser,
      message: targetUser
        ? `Invitation sent to ${targetUser.name || normalizedEmail}. They will see it when they log in.`
        : `Invitation sent to ${normalizedEmail}. It will activate when they sign up.`,
    });
  } catch (error) {
    // Handle duplicate key error
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'You have already shared with this email' },
        { status: 409 }
      );
    }

    console.error('Error creating sharing invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create sharing invitation' },
      { status: 500 }
    );
  }
}
