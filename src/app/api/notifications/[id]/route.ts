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

// PATCH: Toggle read status of a specific notification
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const newReadState = typeof body.read === 'boolean' ? body.read : true;

    const notification = await Notification.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id), userId: user._id },
      {
        $set: {
          read: newReadState,
          readAt: newReadState ? new Date() : undefined,
        },
      },
      { new: true }
    );

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, notification });
  } catch (error: any) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a single notification
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid notification ID' }, { status: 400 });
    }

    const deleted = await Notification.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(id),
      userId: user._id,
    });

    if (!deleted) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Notification deleted' });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete notification' },
      { status: 500 }
    );
  }
}

