import Placement, { IPlacement } from '@/models/Placement'
import {
  indexPlacement,
  deletePlacement,
  bulkIndexPlacements,
  createPlacementsIndex,
} from './elasticsearch'
import connectDB from './mongodb'
import { invalidateUserCache } from './search-cache'

/**
 * Transform MongoDB Placement document to Elasticsearch format
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformPlacementToElasticsearch(placement: IPlacement): any {
  return {
    userId: placement.userId.toString(),
    companyName: placement.companyName,
    jobRole: placement.jobRole,
    package: placement.package,
    location: placement.location,
    eligibility: placement.eligibility,
    applicationDeadline: placement.applicationDeadline,
    assessmentDate: placement.assessmentDate,
    interviewDate: placement.interviewDate,
    status: placement.status,
    emailSubject: placement.emailSubject,
    emailBody: placement.emailBody,
    jobRequirements: placement.jobRequirements,
    matchScore: placement.matchScore,
    hasAttachments: placement.attachments && placement.attachments.length > 0,
    hasCalendarEvent: !!(
      placement.calendarEventId ||
      placement.deadlineCalendarEventId ||
      placement.assessmentCalendarEventId ||
      placement.interviewCalendarEventId
    ),
    createdAt: placement.createdAt,
    updatedAt: placement.updatedAt,
  }
}

/**
 * Sync a single placement to Elasticsearch
 */
export async function syncPlacement(
  placement: IPlacement,
  operation: 'create' | 'update' | 'delete'
): Promise<void> {
  try {
    const documentId = placement._id.toString()
    const userId = placement.userId.toString()

    if (operation === 'delete') {
      await deletePlacement(documentId)
      console.log(`Deleted placement ${documentId} from Elasticsearch`)
    } else {
      const esDoc = transformPlacementToElasticsearch(placement)
      await indexPlacement(documentId, esDoc)
      console.log(`Synced placement ${documentId} to Elasticsearch (${operation})`)
    }

    // Invalidate cache for this user
    invalidateUserCache(userId).catch(err => {
      console.error('Error invalidating cache:', err)
    })
  } catch (error) {
    console.error(`Error syncing placement ${placement._id}:`, error)
    throw error
  }
}

/**
 * Sync all placements to Elasticsearch (bulk operation)
 */
export async function syncAllPlacements(userId?: string): Promise<{
  total: number
  synced: number
  failed: number
}> {
  try {
    await connectDB()
    
    // Ensure index exists
    await createPlacementsIndex()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {}
    if (userId) {
      query.userId = userId
    }

    const placements = await Placement.find(query).lean()
    const total = placements.length

    console.log(`Found ${total} placements to sync`)

    // Transform and prepare for bulk indexing
    const bulkData = placements.map((placement) => ({
      id: placement._id.toString(),
      doc: transformPlacementToElasticsearch(placement),
    }))

    // Bulk index in batches of 100
    const batchSize = 100
    let synced = 0
    let failed = 0

    for (let i = 0; i < bulkData.length; i += batchSize) {
      const batch = bulkData.slice(i, i + batchSize)
      try {
        await bulkIndexPlacements(batch)
        synced += batch.length
      } catch (error) {
        console.error(`Error syncing batch ${i}-${i + batchSize}:`, error)
        failed += batch.length
      }
    }

    console.log(`Sync complete: ${synced} synced, ${failed} failed out of ${total}`)

    return { total, synced, failed }
  } catch (error) {
    console.error('Error in syncAllPlacements:', error)
    throw error
  }
}

/**
 * Handle MongoDB change stream events
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handlePlacementChange(change: any): Promise<void> {
  try {
    const operationType = change.operationType
    const fullDocument = change.fullDocument

    if (operationType === 'delete') {
      const documentId = change.documentKey._id.toString()
      // For delete, we need to fetch the document before deletion or use the documentKey
      // Since change stream doesn't include the full doc on delete, we'll use the ID
      await deletePlacement(documentId)
      console.log(`Deleted placement ${documentId} from Elasticsearch via change stream`)
    } else if (operationType === 'insert' || operationType === 'replace') {
      await syncPlacement(fullDocument, 'create')
    } else if (operationType === 'update') {
      await syncPlacement(fullDocument, 'update')
    }
  } catch (error) {
    console.error('Error handling placement change:', error)
    // Don't throw - we don't want to crash the change stream
  }
}

/**
 * Start MongoDB change stream listener for real-time sync
 */
export async function startChangeStreamListener(): Promise<void> {
  try {
    await connectDB()

    console.log('Starting MongoDB change stream listener for placements...')

    const changeStream = Placement.watch([], {
      fullDocument: 'updateLookup',
    })

    changeStream.on('change', async (change) => {
      await handlePlacementChange(change)
    })

    changeStream.on('error', (error) => {
      console.error('Change stream error:', error)
      // Attempt to restart after delay
      setTimeout(() => {
        console.log('Attempting to restart change stream...')
        startChangeStreamListener()
      }, 5000)
    })

    console.log('Change stream listener started successfully')
  } catch (error) {
    console.error('Error starting change stream listener:', error)
    throw error
  }
}

/**
 * Stop change stream listener (if needed)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let changeStreamInstance: any = null

export function stopChangeStreamListener(): void {
  if (changeStreamInstance) {
    changeStreamInstance.close()
    changeStreamInstance = null
    console.log('Change stream listener stopped')
  }
}
