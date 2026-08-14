import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, profile } = body

    await connectDB()

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      {
        name: name || session.user.name,
        profile: profile || {},
      },
      { new: true, runValidators: true }
    )

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Profile updated successfully",
      user: updatedUser 
    })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ 
      error: "Failed to update profile",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
