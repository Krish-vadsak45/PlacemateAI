import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Placement from '@/models/Placement'
import PlacementChatMessage from '@/models/PlacementChatMessage'
import { placementCopilot } from '@/lib/placement-copilot'

// GET: Retrieve all chat messages for this specific placement
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await connectDB()

    // Validate placement exists and belongs to current user
    const placement = await Placement.findOne({
      _id: id,
      userId: session.user.id
    })

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    const messages = await PlacementChatMessage.find({
      placementId: id,
      userId: session.user.id
    }).sort({ createdAt: 1 })

    return NextResponse.json({
      success: true,
      messages
    })
  } catch (error) {
    console.error('Error fetching placement chat messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chat history' },
      { status: 500 }
    )
  }
}

// POST: Send a message or paste an update to the placement copilot
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
    }

    await connectDB()

    const placement = await Placement.findOne({
      _id: id,
      userId: session.user.id
    })

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    // Save user message
    const userMessageDoc = await PlacementChatMessage.create({
      placementId: id,
      userId: session.user.id,
      role: 'user',
      content: message.trim()
    })

    // Fetch last 8 messages for context
    const recentMessages = await PlacementChatMessage.find({
      placementId: id,
      userId: session.user.id
    })
      .sort({ createdAt: -1 })
      .limit(8)

    const historyForAI = recentMessages
      .reverse()
      .map(m => ({ role: m.role, content: m.content }))

    // Run AI Copilot processing
    const aiResult = await placementCopilot.processMessage(
      placement,
      historyForAI,
      message.trim()
    )

    // Save assistant response
    const assistantMessageDoc = await PlacementChatMessage.create({
      placementId: id,
      userId: session.user.id,
      role: 'assistant',
      content: aiResult.reply,
      isUpdateAnnouncement: aiResult.isUpdateAnnouncement,
      summary: aiResult.summary,
      proposedChanges: aiResult.proposedChanges
    })

    return NextResponse.json({
      success: true,
      userMessage: userMessageDoc,
      assistantMessage: assistantMessageDoc
    })
  } catch (error) {
    console.error('Error processing placement chat:', error)
    return NextResponse.json(
      { error: 'Failed to process message with AI Copilot' },
      { status: 500 }
    )
  }
}

// DELETE: Clear chat history for this specific placement
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await connectDB()

    await PlacementChatMessage.deleteMany({
      placementId: id,
      userId: session.user.id
    })

    return NextResponse.json({
      success: true,
      message: 'Chat history cleared for this placement'
    })
  } catch (error) {
    console.error('Error clearing placement chat:', error)
    return NextResponse.json(
      { error: 'Failed to clear chat history' },
      { status: 500 }
    )
  }
}
