import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SharedComparison from '@/models/SharedComparison';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const { shareId } = await params;

    if (!shareId) {
      return NextResponse.json({ error: 'Missing share ID' }, { status: 400 });
    }

    await connectDB();

    // Find and increment views counter
    const shared = await SharedComparison.findOneAndUpdate(
      { shareId },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();

    if (!shared) {
      return NextResponse.json(
        { error: 'Shared comparison not found or has expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      sharedComparison: {
        shareId: shared.shareId,
        title: shared.title,
        creatorName: shared.creatorName || 'PlaceMate Student',
        placements: shared.placements || [],
        userProfile: shared.userProfile || {},
        views: shared.views || 1,
        createdAt: shared.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Error fetching public shared comparison:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load shared comparison' },
      { status: 500 }
    );
  }
}

