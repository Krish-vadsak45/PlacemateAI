import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"
import { v4 as uuidv4 } from "uuid"
import { invalidateAnalyticsCache } from "@/lib/analytics-cache"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")?.toLowerCase()

    const placement = await Placement.findOne({
      _id: id,
      userId: session.user.id,
    })

    if (!placement) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 })
    }

    let notes = placement.notes || []

    if (q) {
      notes = notes.filter(
        (n: any) =>
          n.content?.toLowerCase().includes(q) ||
          n.title?.toLowerCase().includes(q) ||
          (n.tags && n.tags.some((t: string) => t.toLowerCase().includes(q)))
      )
    }

    return NextResponse.json({
      success: true,
      notes,
      count: notes.length,
    })
  } catch (error) {
    console.error("Error fetching notes:", error)
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const { content, title, templateType = "custom", tags = [] } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Note content cannot be empty" }, { status: 400 })
    }

    await connectDB()

    const placement = await Placement.findOne({
      _id: id,
      userId: session.user.id,
    })

    if (!placement) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 })
    }

    const newNote = {
      id: uuidv4(),
      title: title?.trim() || undefined,
      content: content.trim(),
      templateType,
      tags: Array.isArray(tags) ? tags.map((t: string) => t.trim()).filter(Boolean) : [],
      history: [],
      createdAt: new Date(),
    }

    if (!placement.notes) {
      placement.notes = []
    }

    placement.notes.unshift(newNote)
    await placement.save()
    await invalidateAnalyticsCache(session.user.id)

    return NextResponse.json({
      success: true,
      note: newNote,
      notes: placement.notes,
    })
  } catch (error) {
    console.error("Error adding note:", error)
    return NextResponse.json(
      { error: "Failed to add note", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    )
  }
}
