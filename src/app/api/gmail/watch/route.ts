import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { createGmailService } from "@/lib/gmail-service"

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { enable } = body

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const accessToken = user.googleTokens?.accessToken
    const topicId = process.env.GOOGLE_PUBSUB_TOPIC_ID

    if (!accessToken) {
      return NextResponse.json({ error: "No Gmail access token. Please authenticate with Google first." }, { status: 400 })
    }

    if (!topicId) {
      return NextResponse.json({ error: "GOOGLE_PUBSUB_TOPIC_ID not configured" }, { status: 500 })
    }

    const gmailService = createGmailService(accessToken)

    if (enable) {
      // Enable Gmail watch
      // Handle both cases: topicId could be just the topic name or full path
      const topicName = topicId.startsWith('projects/') 
        ? topicId 
        : `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/topics/${topicId}`
      const success = await gmailService.watchGmail(topicName)

      if (success) {
        user.googleTokens.gmailWatchEnabled = true
        await user.save()
        
        return NextResponse.json({ 
          success: true, 
          message: "Gmail watch enabled successfully",
          watchEnabled: true
        })
      } else {
        return NextResponse.json({ error: "Failed to enable Gmail watch" }, { status: 500 })
      }
    } else {
      // Disable Gmail watch
      const success = await gmailService.stopWatching()

      if (success) {
        user.googleTokens.gmailWatchEnabled = false
        user.googleTokens.gmailWatchHistoryId = undefined
        await user.save()
        
        return NextResponse.json({ 
          success: true, 
          message: "Gmail watch disabled successfully",
          watchEnabled: false
        })
      } else {
        return NextResponse.json({ error: "Failed to disable Gmail watch" }, { status: 500 })
      }
    }
  } catch (error) {
    console.error("Error toggling Gmail watch:", error)
    return NextResponse.json({ 
      error: "Failed to toggle Gmail watch",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      watchEnabled: user.googleTokens?.gmailWatchEnabled || false,
      hasAccessToken: !!user.googleTokens?.accessToken,
      hasPlacementCellEmail: !!user.profile?.placementCellEmail
    })
  } catch (error) {
    console.error("Error fetching Gmail watch status:", error)
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 })
  }
}
