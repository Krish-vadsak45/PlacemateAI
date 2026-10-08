import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SavedComparison from '@/models/SavedComparison';
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

    const savedComparisons = await SavedComparison.find({ userId: user._id })
      .populate({
        path: 'placementIds',
        select: 'companyName jobRole package location status matchScore',
      })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ savedComparisons });
  } catch (error) {
    console.error('Error fetching saved comparisons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved comparisons' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const { title, placementIds, notes } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!Array.isArray(placementIds) || placementIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 placements are required to save a comparison set' },
        { status: 400 }
      );
    }

    const validIds = placementIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

    const savedDoc = await SavedComparison.create({
      userId: user._id,
      title: title.trim(),
      placementIds: validIds,
      notes: notes || '',
    });

    return NextResponse.json({ savedComparison: savedDoc }, { status: 201 });
  } catch (error) {
    console.error('Error saving comparison set:', error);
    return NextResponse.json(
      { error: 'Failed to save comparison set' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid comparison ID' }, { status: 400 });
    }

    await SavedComparison.deleteOne({ _id: id, userId: user._id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting saved comparison:', error);
    return NextResponse.json(
      { error: 'Failed to delete saved comparison' },
      { status: 500 }
    );
  }
}
