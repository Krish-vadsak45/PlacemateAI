import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, noteId } = await params
    const body = await request.json()
    const { title, content, tags } = body

    await connectDB()

    const placement = await Placement.findOne({
      _id: id,
      userId: session.user.id,
    })

    if (!placement) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 })
    }

    const note = placement.notes?.find((n: any) => n.id === noteId)
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 })
    }

    // Versioning: if content changed, save previous version in history
    if (content !== undefined && content.trim() !== note.content) {
      if (!note.history) {
        note.history = []
      }
      note.history.unshift({
        content: note.content,
        editedAt: note.updatedAt || note.createdAt || new Date(),
      })
      note.content = content.trim()
    }

    if (title !== undefined) {
      note.title = title.trim() || undefined
    }

    if (tags !== undefined && Array.isArray(tags)) {
      note.tags = tags.map((t: string) => t.trim()).filter(Boolean)
    }

    note.updatedAt = new Date()

    placement.markModified("notes")
    await placement.save()

    return NextResponse.json({
      success: true,
      note,
      notes: placement.notes,
    })
  } catch (error) {
    console.error("Error updating note:", error)
    return NextResponse.json(
      { error: "Failed to update note", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, noteId } = await params

    await connectDB()

    const placement = await Placement.findOne({
      _id: id,
      userId: session.user.id,
    })

    if (!placement) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 })
    }

    placement.notes = (placement.notes || []).filter((n: any) => n.id !== noteId)
    placement.markModified("notes")
    await placement.save()

    return NextResponse.json({
      success: true,
      notes: placement.notes,
      message: "Note deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting note:", error)
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    )
  }
}
