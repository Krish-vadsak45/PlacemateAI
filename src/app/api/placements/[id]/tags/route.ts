import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { tags, addTag, removeTag } = body

    await connectDB()

    const placement = await Placement.findOne({
      _id: id,
      userId: session.user.id,
    })

    if (!placement) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 })
    }

    let currentTags = placement.tags || []

    if (Array.isArray(tags)) {
      currentTags = tags.map((t: string) => t.trim()).filter(Boolean)
    }

    if (addTag && typeof addTag === "string") {
      const clean = addTag.trim()
      if (clean && !currentTags.some((t: string) => t.toLowerCase() === clean.toLowerCase())) {
        currentTags.push(clean)
      }
    }

    if (removeTag && typeof removeTag === "string") {
      const clean = removeTag.trim().toLowerCase()
      currentTags = currentTags.filter((t: string) => t.toLowerCase() !== clean)
    }

    placement.tags = Array.from(new Set(currentTags))
    await placement.save()

    return NextResponse.json({
      success: true,
      tags: placement.tags,
      placement,
    })
  } catch (error) {
    console.error("Error updating tags:", error)
    return NextResponse.json(
      { error: "Failed to update tags", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    )
  }
}
