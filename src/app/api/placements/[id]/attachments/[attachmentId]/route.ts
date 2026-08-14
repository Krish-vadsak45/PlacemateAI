import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"
import { unlink } from "fs/promises"
import path from "path"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, attachmentId } = await params
    
    await connectDB()
    
    const placement = await Placement.findOne({
      _id: id,
      userId: session.user.id
    })

    if (!placement) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 })
    }

    const attachment = placement.attachments?.find(a => a.id === attachmentId)
    if (!attachment) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 })
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), 'public', attachment.url)
    try {
      await unlink(filePath)
    } catch (error) {
      console.error("Error deleting file:", error)
      // Continue even if file deletion fails
    }

    // Remove attachment from placement
    const updatedAttachments = placement.attachments?.filter(a => a.id !== attachmentId) || []
    await Placement.findByIdAndUpdate(id, { attachments: updatedAttachments })

    return NextResponse.json({ 
      success: true, 
      attachments: updatedAttachments 
    })
  } catch (error) {
    console.error("Error deleting attachment:", error)
    return NextResponse.json({ 
      error: "Failed to delete attachment",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
