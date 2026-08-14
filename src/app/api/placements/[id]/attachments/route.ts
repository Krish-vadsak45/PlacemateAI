import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { v4 as uuidv4 } from "uuid"

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
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    await connectDB()
    
    const placement = await Placement.findOne({
      _id: id,
      userId: session.user.id
    })

    if (!placement) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const fileExtension = path.extname(file.name)
    const uniqueFileName = `${uuidv4()}${fileExtension}`
    const filePath = path.join(uploadsDir, uniqueFileName)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create attachment record
    const attachment = {
      id: uuidv4(),
      name: file.name,
      url: `/uploads/${uniqueFileName}`,
      type: fileExtension.replace('.', '')
    }

    // Update placement with new attachment
    const updatedAttachments = [...(placement.attachments || []), attachment]
    await Placement.findByIdAndUpdate(id, { attachments: updatedAttachments })

    return NextResponse.json({ 
      success: true, 
      attachments: updatedAttachments 
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ 
      error: "Failed to upload file",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
