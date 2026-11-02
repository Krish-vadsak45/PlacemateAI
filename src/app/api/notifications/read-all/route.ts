import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Notification from '@/models/Notification';
import mongoose from 'mongoose';

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

// PATCH: Mark all notifications for the user as read
export async function PATCH() {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await Notification.updateMany(
      { userId: user._id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    return NextResponse.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark all notifications as read' },
      { status: 500 }
    );
  }
}

