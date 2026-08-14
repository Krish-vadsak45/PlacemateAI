import { NextResponse } from "next/server"
import crypto from "crypto"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import { createEmailProcessor } from "@/lib/email-processor"
import { OAuth2Client } from "google-auth-library"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message) {
      return NextResponse.json({ error: "No message in request" }, { status: 400 })
    }

    console.log("Gmail webhook received - acknowledging receipt")

    // Process asynchronously to avoid timeout
    // Use setImmediate instead of setTimeout for better error handling
    setImmediate(async () => {
      try {
        console.log("Starting async webhook processing...")
        
        // Decode Pub/Sub message data
        const data = Buffer.from(message.data, "base64").toString("utf-8")
        const notification = JSON.parse(data)

        console.log("Processing Gmail notification:", notification)

        // Extract email address from notification
        const emailAddress = notification.emailAddress

        if (!emailAddress) {
          console.log("No email address in notification")
          return
        }

        // Find the user associated with this email
        await connectDB()
        const user = await User.findOne({ email: emailAddress })

        if (!user) {
          console.log(`No user found for email: ${emailAddress}`)
          return
        }

        if (!user.googleTokens?.gmailWatchEnabled) {
          console.log(`Gmail watch not enabled for user: ${emailAddress}`)
          return
        }

        const historyId = notification.historyId
        const lastHistoryId = user.googleTokens.gmailWatchHistoryId

        if (!historyId) {
          console.log("No historyId in notification")
          return
        }

        console.log(`Processing history changes from ${lastHistoryId} to ${historyId}`)

        // Get Gmail access token
        let accessToken = user.googleTokens.accessToken
        if (!accessToken) {
          console.log("No Gmail access token for user")
          return
        }

        // Try to fetch history changes from Gmail API
        let historyResponse = await fetch(
          `https://www.googleapis.com/gmail/v1/users/me/history?startHistoryId=${lastHistoryId || historyId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        // If token is expired, try to refresh it
        if (!historyResponse.ok && historyResponse.status === 401) {
          console.log("Access token expired, attempting refresh...")
          
          const refreshToken = user.googleTokens.refreshToken
          if (!refreshToken) {
            console.log("No refresh token available, user needs to re-authenticate")
            return
          }

          try {
            const oauth2Client = new OAuth2Client(
              process.env.GOOGLE_CLIENT_ID,
              process.env.GOOGLE_CLIENT_SECRET
            )

            oauth2Client.setCredentials({ refresh_token: refreshToken })
            const { credentials } = await oauth2Client.refreshAccessToken()
            
            const newAccessToken = credentials.access_token
            if (!newAccessToken) {
              throw new Error("No access token returned from refresh")
            }

            // Update user's access token in database
            await User.findByIdAndUpdate(user._id, {
              "googleTokens.accessToken": newAccessToken,
            })

            accessToken = newAccessToken
            console.log("Access token refreshed successfully")

            // Retry the history fetch with new token
            historyResponse = await fetch(
              `https://www.googleapis.com/gmail/v1/users/me/history?startHistoryId=${lastHistoryId || historyId}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            )
          } catch (refreshError) {
            console.error("Failed to refresh access token:", refreshError)
            return
          }
        }

        if (!historyResponse.ok) {
          console.error("Failed to fetch Gmail history:", await historyResponse.text())
          return
        }

        const historyData = await historyResponse.json()
        console.log("History data received:", JSON.stringify(historyData, null, 2))

        // Process each history change
        if (historyData.history) {
          console.log(`Processing ${historyData.history.length} history records`)
          for (const historyRecord of historyData.history) {
            console.log("History record keys:", Object.keys(historyRecord))
            if (historyRecord.messagesAdded) {
              console.log(`Found ${historyRecord.messagesAdded.length} messages added`)
              for (const messageAdded of historyRecord.messagesAdded) {
                const emailId = messageAdded.message.id
                console.log(`Processing new email: ${emailId}`)

                try {
                  const processor = createEmailProcessor(user._id.toString())
                  const result = await processor.processEmail(emailId)
                  console.log(`Email processed for user ${user.email}:`, result)
                } catch (error) {
                  console.error(`Error processing email ${emailId}:`, error)
                  // Continue processing other emails even if one fails
                }
              }
            } else {
              console.log("No messagesAdded in this history record")
            }
          }
        } else {
          console.log("No history array in response")
        }

        // Update the last historyId
        await User.findByIdAndUpdate(user._id, {
          "googleTokens.gmailWatchHistoryId": historyId,
        })

        console.log("Gmail webhook processing completed successfully")
      } catch (error) {
        console.error("Error in async webhook processing:", error)
        // Don't throw - we don't want to crash the process
      }
    })

    return NextResponse.json({ success: true, message: "Webhook received" })
  } catch (error) {
    console.error("Error processing Gmail webhook:", error)
    return NextResponse.json(
      { error: "Failed to process webhook", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

// Verify Pub/Sub signature (optional but recommended for production)
function verifySignature(signature: string, payload: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret)
  const digest = hmac.update(payload).digest("base64")
  return signature === digest
}
