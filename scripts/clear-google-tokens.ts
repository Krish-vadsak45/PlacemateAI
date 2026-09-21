import 'dotenv/config'
import connectDB from '../src/lib/mongodb'
import User from '../src/models/User'

async function clearGoogleTokens() {
  try {
    console.log('Connecting to database...')
    await connectDB()
    console.log('Database connected successfully')

    const result = await User.updateMany(
      {},
      {
        $unset: { 'googleTokens.accessToken': '', 'googleTokens.refreshToken': '' }
      }
    )

    console.log(`Cleared Google tokens for ${result.modifiedCount} users`)
    console.log('Please sign out and sign back in to get fresh tokens with calendar permissions')
    
    process.exit(0)
  } catch (error) {
    console.error('Error clearing tokens:', error)
    process.exit(1)
  }
}

clearGoogleTokens()
