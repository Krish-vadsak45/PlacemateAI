import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"
import { createAutoFillService } from "@/lib/auto-fill"

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
    const { applicationUrl } = body
    
    await connectDB()
    
    const placement = await Placement.findOne({
      _id: id,
      userId: session.user.id
    })

    if (!placement) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 })
    }

    const autoFillService = createAutoFillService()
    const script = await autoFillService.generateAutoFillScript(
      await autoFillService.getUserProfile(session.user.id),
      applicationUrl
    )

    return NextResponse.json({ 
      success: true, 
      script,
      applicationUrl
    })
  } catch (error) {
    console.error("Error generating auto-fill script:", error)
    return NextResponse.json({ 
      error: "Failed to generate auto-fill script",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
