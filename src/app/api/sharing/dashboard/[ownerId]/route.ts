import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Placement from '@/models/Placement';
import User from '@/models/User';
import { checkSharedAccess } from '@/lib/shared-access';

/**
 * GET /api/sharing/dashboard/[ownerId] — Fetch a shared user's dashboard data
 * Returns the same structure as the main dashboard but for the shared user
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ ownerId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ownerId } = await params;

    // Check shared access
    const access = await checkSharedAccess(session.user.id, ownerId, 'viewer');

    if (!access.allowed) {
      return NextResponse.json(
        { error: "You don't have access to this dashboard" },
        { status: 403 }
      );
    }

    await connectDB();

    // Fetch the owner's profile info (limited fields)
    const owner = await User.findById(ownerId)
      .select('name email image profile.college profile.branch profile.skills')
      .lean();

    if (!owner) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const now = new Date();

    // Fetch dashboard stats for the owner
    const [total, highMatch, deadlines, applied, selected] = await Promise.all([
      Placement.countDocuments({ userId: ownerId }),
      Placement.countDocuments({ userId: ownerId, matchScore: { $gte: 80 } }),
      Placement.countDocuments({ userId: ownerId, applicationDeadline: { $gte: now } }),
      Placement.countDocuments({
        userId: ownerId,
        status: { $in: ['APPLIED', 'ASSESSMENT_SCHEDULED', 'INTERVIEW_SCHEDULED', 'SELECTED'] },
      }),
      Placement.countDocuments({ userId: ownerId, status: 'SELECTED' }),
    ]);

    return NextResponse.json({
      success: true,
      permission: access.permission,
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        image: owner.image,
        college: owner.profile?.college,
        branch: owner.profile?.branch,
      },
      stats: {
        totalPlacements: total,
        highMatchCount: highMatch,
        activeDeadlines: deadlines,
        appliedCount: applied,
        selectedCount: selected,
      },
    });
  } catch (error) {
    console.error('Error fetching shared dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared dashboard' },
      { status: 500 }
    );
  }
}
