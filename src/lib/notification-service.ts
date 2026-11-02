import connectDB from '@/lib/mongodb';
import Notification, { NotificationType } from '@/models/Notification';
import Placement from '@/models/Placement';
import User from '@/models/User';
import mongoose from 'mongoose';

export interface CreateNotificationParams {
  userId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  placementId?: string | mongoose.Types.ObjectId;
}

/**
 * Creates an in-app notification for a user, avoiding duplicate alerts for the same placement and type
 */
export async function createNotification(params: CreateNotificationParams) {
  try {
    await connectDB();

    const userObjectId =
      typeof params.userId === 'string'
        ? new mongoose.Types.ObjectId(params.userId)
        : params.userId;

    const placementObjectId = params.placementId
      ? typeof params.placementId === 'string'
        ? new mongoose.Types.ObjectId(params.placementId)
        : params.placementId
      : undefined;

    // Avoid duplicate notifications for the same placement & type created in the last 24 hours
    if (placementObjectId) {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existing = await Notification.findOne({
        userId: userObjectId,
        placementId: placementObjectId,
        type: params.type,
        createdAt: { $gte: yesterday },
      });

      if (existing) {
        return existing;
      }
    }

    const notification = await Notification.create({
      userId: userObjectId,
      title: params.title,
      message: params.message,
      type: params.type,
      link: params.link,
      placementId: placementObjectId,
      read: false,
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Scans upcoming deadlines for a user and creates deadline warning notifications
 */
export async function syncUpcomingDeadlineNotifications(userId: string | mongoose.Types.ObjectId) {
  try {
    await connectDB();

    const userObjectId =
      typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

    const now = new Date();
    const urgentThreshold = new Date(now.getTime() + 48 * 60 * 60 * 1000); // within 48 hours

    // Find active placements with deadline in the next 48 hours
    const urgentPlacements = await Placement.find({
      userId: userObjectId,
      applicationDeadline: {
        $gte: now,
        $lte: urgentThreshold,
      },
      status: { $in: ['NEW', 'INTERESTED'] },
    }).lean();

    for (const p of urgentPlacements) {
      if (!p.applicationDeadline) continue;
      const hoursRemaining = Math.max(
        1,
        Math.round((new Date(p.applicationDeadline).getTime() - now.getTime()) / (1000 * 60 * 60))
      );

      await createNotification({
        userId: userObjectId,
        title: `Urgent Deadline: ${p.companyName}`,
        message: `Application for ${p.jobRole} (${p.package || 'CTC not specified'}) closes in ~${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}. Don't miss this opportunity!`,
        type: 'DEADLINE_URGENT',
        link: `/placements/${p._id}`,
        placementId: p._id,
      });
    }
  } catch (error) {
    console.error('Error syncing deadline notifications:', error);
  }
}

