import 'dotenv/config'
import worker from '../src/workers/email-processor-worker'
import { startGmailPoller } from '../src/lib/gmail-poller'

console.log('Starting email processing worker and Gmail poller...')

// The worker is already started when imported
// Start the Gmail poller
startGmailPoller()

console.log('Worker and poller started successfully')
