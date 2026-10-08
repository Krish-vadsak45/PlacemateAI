import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getAttachmentStream } from '@/lib/gridfs'
import { Readable } from 'stream'

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
    const attachmentData = await getAttachmentStream(id)

    if (!attachmentData) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    const { file, stream } = attachmentData

    // Check query params for download vs inline preview
    const { searchParams } = new URL(request.url)
    const isDownload = searchParams.get('download') === 'true'

    const disposition = isDownload ? 'attachment' : 'inline'
    const encodedFilename = encodeURIComponent(file.filename)

    const headers = new Headers()
    headers.set('Content-Type', file.contentType || 'application/octet-stream')
    headers.set('Content-Length', String(file.length))
    headers.set(
      'Content-Disposition',
      `${disposition}; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
    )
    headers.set('Cache-Control', 'private, max-age=86400')

    // Convert Node.js Readable stream to standard Web Streams ReadableStream
    const webStream = Readable.toWeb(stream as Readable)

    return new NextResponse(webStream as BodyInit, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('Error streaming attachment:', error)
    return NextResponse.json(
      { error: 'Failed to stream attachment' },
      { status: 500 }
    )
  }
}
