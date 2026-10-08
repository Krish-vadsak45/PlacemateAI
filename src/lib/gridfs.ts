import mongoose from 'mongoose'
import { Readable } from 'stream'
import connectDB from './mongodb'

export interface StoredAttachmentMetadata {
  emailId?: string
  userId?: string
  placementId?: string
  originalName: string
  fileSize: number
}

/**
 * Upload a binary buffer to MongoDB GridFS in the 'attachments' bucket
 */
export async function uploadAttachmentToGridFS(
  buffer: Buffer,
  filename: string,
  contentType: string,
  metadata?: Partial<StoredAttachmentMetadata>
): Promise<string> {
  await connectDB()
  const db = mongoose.connection.db
  if (!db) {
    throw new Error('Database connection not established for GridFS')
  }

  const bucket = new mongoose.mongo.GridFSBucket(db, {
    bucketName: 'attachments',
  })

  return new Promise((resolve, reject) => {
    const readableStream = Readable.from(buffer)
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        ...metadata,
        contentType,
        originalName: filename,
        fileSize: buffer.length,
        uploadedAt: new Date(),
      },
    })

    readableStream
      .pipe(uploadStream)
      .on('error', (err) => {
        console.error('Error piping attachment to GridFS:', err)
        reject(err)
      })
      .on('finish', () => {
        resolve(uploadStream.id.toString())
      })
  })
}

/**
 * Retrieve an attachment download stream and metadata from GridFS
 */
export async function getAttachmentStream(fileId: string) {
  try {
    await connectDB()
    const db = mongoose.connection.db
    if (!db) {
      throw new Error('Database connection not established for GridFS')
    }

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return null
    }

    const _id = new mongoose.Types.ObjectId(fileId)
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'attachments',
    })

    const files = await bucket.find({ _id }).toArray()
    if (!files || files.length === 0) {
      return null
    }

    const file = files[0]
    const stream = bucket.openDownloadStream(_id)

    return {
      file: {
        id: file._id.toString(),
        filename: file.filename,
        contentType: (file.metadata as any)?.contentType || 'application/octet-stream',
        length: file.length,
        uploadDate: file.uploadDate,
        metadata: file.metadata,
      },
      stream,
    }
  } catch (error) {
    console.error('Error fetching attachment from GridFS:', error)
    return null
  }
}

/**
 * Delete an attachment from GridFS
 */
export async function deleteAttachmentFromGridFS(fileId: string): Promise<boolean> {
  try {
    await connectDB()
    const db = mongoose.connection.db
    if (!db) return false

    if (!mongoose.Types.ObjectId.isValid(fileId)) {
      return false
    }

    const _id = new mongoose.Types.ObjectId(fileId)
    const bucket = new mongoose.mongo.GridFSBucket(db, {
      bucketName: 'attachments',
    })

    await bucket.delete(_id)
    return true
  } catch (error) {
    console.error('Error deleting attachment from GridFS:', error)
    return false
  }
}
