import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Placement from '@/models/Placement'
import { uploadAttachmentToGridFS, deleteAttachmentFromGridFS } from '@/lib/gridfs'
import { attachmentParser } from '@/lib/attachment-parser'

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
    await connectDB()

    const placement = await Placement.findOne({
      _id: id,
      userId: session.user.id,
    })

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Upload to GridFS
    const gridFsId = await uploadAttachmentToGridFS(
      buffer,
      file.name,
      file.type || 'application/octet-stream',
      {
        placementId: id,
        userId: session.user.id,
      }
    )

    // Optionally extract text to summarize using Groq
    let summary: string | null = null
    try {
      const parsed = await attachmentParser.extractText(
        buffer,
        file.type,
        file.name
      )
      if (parsed.text) {
        summary = await attachmentParser.summarizeDocumentWithGroq(
          parsed.text,
          file.name
        )
      }
    } catch (e) {
      console.error('Error generating document summary with Groq:', e)
    }

    const newAttachment = {
      id: gridFsId,
      name: file.name,
      url: `/api/placements/attachments/${gridFsId}`,
      type: file.type || 'application/octet-stream',
    }

    if (!placement.attachments) {
      placement.attachments = []
    }
    placement.attachments.push(newAttachment)

    if (summary) {
      if (!placement.notes) placement.notes = []
      placement.notes.push({
        id: Date.now().toString(),
        content: `[Attached Document Summary for ${file.name}]:\n${summary}`,
        createdAt: new Date(),
      })
    }

    await placement.save()

    return NextResponse.json({
      success: true,
      attachment: newAttachment,
      summary,
    })
  } catch (error) {
    console.error('Error uploading placement attachment:', error)
    return NextResponse.json(
      { error: 'Failed to upload attachment' },
      { status: 500 }
    )
  }
}

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
    const { searchParams } = new URL(request.url)
    const attachmentId = searchParams.get('attachmentId')

    if (!attachmentId) {
      return NextResponse.json({ error: 'attachmentId is required' }, { status: 400 })
    }

    await connectDB()

    const placement = await Placement.findOne({
      _id: id,
      userId: session.user.id,
    })

    if (!placement) {
      return NextResponse.json({ error: 'Placement not found' }, { status: 404 })
    }

    // Delete from GridFS
    await deleteAttachmentFromGridFS(attachmentId)

    // Remove from placement document
    placement.attachments = (placement.attachments || []).filter(
      (a) => a.id !== attachmentId
    )
    await placement.save()

    return NextResponse.json({
      success: true,
      message: 'Attachment deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json(
      { error: 'Failed to delete attachment' },
      { status: 500 }
    )
  }
}
