import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({ email: session.user.email }).select("themePreferences").lean()

    return NextResponse.json({
      success: true,
      themePreferences: user?.themePreferences || {
        theme: "system",
        preset: "default",
        accentColor: "default",
        highContrast: false,
      },
    })
  } catch (error) {
    console.error("Error fetching theme preferences:", error)
    return NextResponse.json(
      { error: "Failed to fetch theme preferences" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { theme, preset, accentColor, highContrast } = body

    await connectDB()

    const updateFields: Record<string, any> = {}
    if (theme !== undefined) updateFields["themePreferences.theme"] = theme
    if (preset !== undefined) updateFields["themePreferences.preset"] = preset
    if (accentColor !== undefined) updateFields["themePreferences.accentColor"] = accentColor
    if (highContrast !== undefined) updateFields["themePreferences.highContrast"] = highContrast

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select("themePreferences").lean()

    return NextResponse.json({
      success: true,
      themePreferences: updatedUser?.themePreferences,
    })
  } catch (error) {
    console.error("Error saving theme preferences:", error)
    return NextResponse.json(
      { error: "Failed to save theme preferences" },
      { status: 500 }
    )
  }
}
