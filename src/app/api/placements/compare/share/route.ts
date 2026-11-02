import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SharedComparison from '@/models/SharedComparison';
import User from '@/models/User';
import Placement from '@/models/Placement';
import { auth } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await auth();

    let user = null;
    let creatorName = 'PlaceMate Student';

    if (session?.user?.email) {
      user = await User.findOne({ email: session.user.email });
      if (user?.name) {
        creatorName = user.name;
      }
    }

    const body = await req.json();
    const { placementIds, placements: clientPlacements, userProfile, title } = body;

    let placements = clientPlacements;

    // If client didn't supply full placement snapshot, fetch from DB
    if ((!placements || placements.length === 0) && Array.isArray(placementIds) && placementIds.length > 0) {
      placements = await Placement.find({
        _id: { $in: placementIds.slice(0, 4) },
      })
        .select('-userId -emailBody -emailFrom -emailSubject')
        .lean();
    }

    if (!placements || placements.length === 0) {
      return NextResponse.json({ error: 'No placements provided to share' }, { status: 400 });
    }

    const shareTitle =
      title ||
      placements.map((p: any) => p.companyName).filter(Boolean).join(' vs ') ||
      'Placement Comparison';

    // Generate a sleek, clean 12-character URL-friendly share ID
    const shareId = uuidv4().replace(/-/g, '').slice(0, 12);

    const shared = await SharedComparison.create({
      shareId,
      userId: user?._id || undefined,
      creatorName,
      title: shareTitle,
      placements,
      userProfile: userProfile || (user?.profile ? {
        skills: user.profile.skills || [],
        cgpa: user.profile.cgpa,
        branch: user.profile.branch,
      } : {}),
      views: 0,
    });

    const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host;
    const forwardedProto = req.headers.get('x-forwarded-proto') || (req.nextUrl.protocol ? req.nextUrl.protocol.replace(':', '') : 'https');
    const origin = `${forwardedProto}://${forwardedHost}`;
    const shareUrl = `${origin}/placements/compare/share/${shareId}`;

    return NextResponse.json({
      success: true,
      shareId: shared.shareId,
      shareUrl,
      title: shared.title,
    });
  } catch (error: any) {
    console.error('Error creating public shared comparison:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create share link' },
      { status: 500 }
    );
  }
}

