import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { syncUpcomingDeadlineNotifications } from '@/lib/notification-service';
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

// GET: Fetch notifications for authenticated user
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Automatically sync impending deadlines in background
    syncUpcomingDeadlineNotifications(user._id).catch((err) =>
      console.warn('Deadline notification sync error:', err)
    );

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const type = searchParams.get('type') || undefined;
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const skip = (page - 1) * limit;

    const query: any = { userId: user._id };
    if (unreadOnly) {
      query.read = false;
    }
    if (type && type !== 'ALL') {
      query.type = type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: user._id, read: false }),
    ]);

    const formattedNotifications = notifications.map((n: any) => ({
      _id: n._id.toString(),
      title: n.title,
      message: n.message,
      type: n.type,
      link: n.link || '',
      placementId: n.placementId ? n.placementId.toString() : undefined,
      read: n.read,
      readAt: n.readAt ? n.readAt.toISOString() : undefined,
      createdAt: n.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      total,
      unreadCount,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// DELETE: Clear read notifications or all notifications
export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const clearAll = searchParams.get('all') === 'true';

    if (clearAll) {
      await Notification.deleteMany({ userId: user._id });
    } else {
      // Clear only read notifications
      await Notification.deleteMany({ userId: user._id, read: true });
    }

    return NextResponse.json({ success: true, message: 'Notifications cleared' });
  } catch (error: any) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}

