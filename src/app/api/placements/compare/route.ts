import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Placement from '@/models/Placement';
import User from '@/models/User';
import { auth } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json({ error: 'No placement IDs provided' }, { status: 400 });
    }

    const ids = idsParam
      .split(',')
      .map((id) => id.trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    if (ids.length === 0) {
      return NextResponse.json({ error: 'Invalid placement IDs' }, { status: 400 });
    }

    // Limit to max 4 for comparison
    const validIds = ids.slice(0, 4);

    const placements = await Placement.find({
      _id: { $in: validIds },
      userId: user._id,
    }).lean();

    return NextResponse.json({
      placements,
      userProfile: {
        skills: user.profile?.skills || [],
        cgpa: user.profile?.cgpa,
        branch: user.profile?.branch,
        graduationYear: user.profile?.graduationYear,
        targetRole: user.profile?.targetRole,
        preferredLocation: user.profile?.preferredLocation,
      },
    });
  } catch (error) {
    console.error('Error fetching placements for comparison:', error);
    return NextResponse.json(
      { error: 'Failed to fetch placements for comparison' },
      { status: 500 }
    );
  }
}
