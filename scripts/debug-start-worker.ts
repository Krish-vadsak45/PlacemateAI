import 'dotenv/config'

async function main() {
  console.log('Attempting to import worker module...')

  try {
    const worker = await import('../src/workers/email-processor-worker')
    console.log('Worker module imported successfully')
  } catch (error) {
    console.error('Error importing worker module:', error)
    process.exit(1)
  }

  console.log('Starting Gmail poller...')
  try {
    const { startGmailPoller } = await import('../src/lib/gmail-poller')
    startGmailPoller()
    console.log('Gmail poller started')
  } catch (error) {
    console.error('Error starting Gmail poller:', error)
    process.exit(1)
  }

  console.log('Worker and poller started successfully')
}

main().catch(console.error)
