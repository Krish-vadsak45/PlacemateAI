import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { auth } from '@/lib/auth';
import mongoose from 'mongoose';

// Helper to find authenticated user by session id or email
async function getAuthUser() {
  const session = await auth();
  if (!session?.user) return null;

  await connectDB();

  const user = await User.findOne({
    $or: [
      ...(session.user.id && mongoose.Types.ObjectId.isValid(session.user.id)
        ? [{ _id: new mongoose.Types.ObjectId(session.user.id) }]
        : []),
      ...(session.user.email
        ? [{ email: session.user.email.toLowerCase().trim() }]
        : []),
    ],
  });

  return user;
}

// GET: Return all saved placement IDs for the current user
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const savedPlacementIds = (user.savedPlacements || []).map((id: any) => id.toString());

    return NextResponse.json({ savedPlacementIds });
  } catch (error: any) {
    console.error('Error fetching saved placements:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch saved placements' },
      { status: 500 }
    );
  }
}

// POST: Toggle save/favourite status for a placement
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { placementId } = body;

    if (!placementId || !mongoose.Types.ObjectId.isValid(placementId)) {
      return NextResponse.json({ error: 'Invalid placement ID' }, { status: 400 });
    }

    const objectId = new mongoose.Types.ObjectId(placementId);

    // Ensure array exists
    if (!Array.isArray(user.savedPlacements)) {
      user.savedPlacements = [];
    }

    const existingList = user.savedPlacements.map((id: any) => id.toString());
    const isCurrentlySaved = existingList.includes(placementId);

    if (isCurrentlySaved) {
      // Remove from saved
      user.savedPlacements = user.savedPlacements.filter(
        (id: any) => id.toString() !== placementId
      );
      await user.save();

      // Also run atomic $pull on collection
      await User.findByIdAndUpdate(
        user._id,
        { $pull: { savedPlacements: objectId } },
        { strict: false }
      );

      console.log(`[SavedPlacements] Successfully removed placement ${placementId} from DB for user ${user.email}`);

      return NextResponse.json({
        isSaved: false,
        placementId,
        message: 'Removed from saved placements',
      });
    } else {
      // Add to saved
      user.savedPlacements.push(objectId);
      await user.save();

      // Also run atomic $addToSet on collection
      await User.findByIdAndUpdate(
        user._id,
        { $addToSet: { savedPlacements: objectId } },
        { strict: false }
      );

      console.log(`[SavedPlacements] Successfully stored placement ${placementId} in permanent DB for user ${user.email}`);

      return NextResponse.json({
        isSaved: true,
        placementId,
        message: 'Added to saved placements in permanent DB',
      });
    }
  } catch (error: any) {
    console.error('Error toggling saved placement in DB:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to toggle saved placement' },
      { status: 500 }
    );
  }
}
