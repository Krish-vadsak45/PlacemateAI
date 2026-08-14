import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"
import { createAISummaryService } from "@/lib/ai-summary"

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
    
    await connectDB()
    
    const placement = await Placement.findOne({
      _id: id,
      userId: session.user.id
    })

    if (!placement) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 })
    }

    if (!placement.emailBody) {
      return NextResponse.json({ error: "No email content available" }, { status: 400 })
    }

    const aiService = createAISummaryService()
    const result = await aiService.generateSummary({
      subject: placement.emailSubject || "",
      body: placement.emailBody,
      from: placement.emailFrom || ""
    })

    console.log("AI Summary Response:", {
      success: true,
      summary: result.summary,
      provider: result.provider
    })

    // Save the AI summary to the placement document
    await Placement.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { aiSummary: result.summary },
      { returnDocument: 'after' }
    )

    return NextResponse.json({ 
      success: true, 
      summary: result.summary,
      provider: result.provider
    })
  } catch (error) {
    console.error("Error generating AI summary:", error)
    return NextResponse.json({ 
      error: "Failed to generate AI summary",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
