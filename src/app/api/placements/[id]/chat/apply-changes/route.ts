import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Placement from '@/models/Placement'
import PlacementChatMessage from '@/models/PlacementChatMessage'

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
    const { messageId, fields } = body

    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 })
    }

    await connectDB()

    const placement = await Placement.findOne({
      _id: id,
      userId: session.user.id
    })

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    const chatMessage = await PlacementChatMessage.findOne({
      _id: messageId,
      placementId: id,
      userId: session.user.id
    })

    if (!chatMessage) {
      return NextResponse.json({ error: 'Chat message not found' }, { status: 404 })
    }

    if (!chatMessage.proposedChanges || chatMessage.proposedChanges.length === 0) {
      return NextResponse.json(
        { error: 'No proposed changes found on this message' },
        { status: 400 }
      )
    }

    const appliedFields: string[] = []

    for (const change of chatMessage.proposedChanges) {
      // If specific fields were requested, filter by them; otherwise apply all unapplied
      if (fields && Array.isArray(fields) && !fields.includes(change.field)) {
        continue
      }
      if (change.applied) continue

      switch (change.field) {
        case 'status':
          if (change.newValue) {
            placement.status = change.newValue
            appliedFields.push(`Status: ${change.newValue}`)
          }
          break

        case 'assessmentDate':
          if (change.newValue) {
            placement.assessmentDate = new Date(change.newValue)
            appliedFields.push('Assessment Date')
          }
          break

        case 'interviewDate':
          if (change.newValue) {
            placement.interviewDate = new Date(change.newValue)
            appliedFields.push('Interview Date')
          }
          break

        case 'applicationDeadline':
          if (change.newValue) {
            placement.applicationDeadline = new Date(change.newValue)
            appliedFields.push('Application Deadline')
          }
          break

        case 'applicationLink':
          if (change.newValue) {
            placement.applicationLink = String(change.newValue)
            appliedFields.push('Application Link')
          }
          break

        case 'package':
          if (change.newValue) {
            placement.package = String(change.newValue)
            appliedFields.push('Package')
          }
          break

        case 'location':
          if (change.newValue) {
            placement.location = String(change.newValue)
            appliedFields.push('Location')
          }
          break

        case 'note':
          if (change.newValue) {
            if (!placement.notes) placement.notes = []
            placement.notes.push({
              id: Date.now().toString(),
              content: String(change.newValue),
              createdAt: new Date()
            })
            appliedFields.push('Added Note')
          }
          break

        default:
          break
      }

      change.applied = true
    }

    if (appliedFields.length > 0) {
      // Log update to applicationHistory
      if (!placement.applicationHistory) {
        placement.applicationHistory = []
      }
      placement.applicationHistory.push({
        status: placement.status,
        changedAt: new Date(),
        note: `AI Copilot applied updates from drive announcement: ${appliedFields.join(', ')}`
      })

      await placement.save()
      await chatMessage.save()
    }

    return NextResponse.json({
      success: true,
      appliedFields,
      updatedPlacement: placement,
      message: chatMessage
    })
  } catch (error) {
    console.error('Error applying proposed changes:', error)
    return NextResponse.json(
      { error: 'Failed to apply proposed changes' },
      { status: 500 }
    )
  }
}
