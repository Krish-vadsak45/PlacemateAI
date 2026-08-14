import { NextResponse } from "next/server"
import { signIn } from "next-auth/react"

export async function POST(request: Request) {
  try {
    // Trigger Google sign-in with Gmail scopes
    // This will redirect the user to Google OAuth consent screen
    return NextResponse.json({ 
      success: true, 
      message: "Please sign in again to grant Gmail permissions",
      redirectUrl: "/auth/signin?callbackUrl=/dashboard"
    })
  } catch (error) {
    console.error("Error initiating Gmail re-auth:", error)
    return NextResponse.json({ 
      error: "Failed to initiate re-authentication",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
