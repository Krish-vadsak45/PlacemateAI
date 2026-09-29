import 'dotenv/config'
import { startGmailPoller } from '../src/lib/gmail-poller'

console.log('Starting email processing worker and Gmail poller...')

// The worker is already started when imported
// Start the Gmail poller
startGmailPoller()

console.log('Worker and poller started successfully')
