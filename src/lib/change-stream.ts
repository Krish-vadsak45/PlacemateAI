import { startChangeStreamListener, stopChangeStreamListener } from './elasticsearch-sync'

let isStreamRunning = false

/**
 * Start the MongoDB change stream listener
 * This should be called when the application starts
 */
export function initializeChangeStream(): void {
  if (isStreamRunning) {
    console.log('Change stream is already running')
    return
  }

  try {
    startChangeStreamListener()
    isStreamRunning = true
  } catch (error) {
    console.error('Failed to initialize change stream:', error)
    // Don't crash the app if change stream fails
  }
}

/**
 * Stop the MongoDB change stream listener
 */
export function shutdownChangeStream(): void {
  if (isStreamRunning) {
    stopChangeStreamListener()
    isStreamRunning = false
  }
}

/**
 * Get the current status of the change stream
 */
export function getChangeStreamStatus(): boolean {
  return isStreamRunning
}
