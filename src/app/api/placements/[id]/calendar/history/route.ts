import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"
import CalendarEventHistory from "@/models/CalendarEventHistory"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const operation = searchParams.get('operation')
    
    await connectDB()
    
    const placement = await Placement.findOne({
      _id: id,
      userId: session.user.id
    })

    if (!placement) {
      return NextResponse.json({ error: "Placement not found" }, { status: 404 })
    }

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {
      placementId: id,
      userId: session.user.id,
    }

    if (operation) {
      query.operation = operation
    }

    const history = await CalendarEventHistory
      .find(query)
      .sort({ timestamp: -1 })
      .limit(50)

    return NextResponse.json({ 
      history,
      count: history.length
    })
  } catch (error) {
    console.error("Error fetching calendar event history:", error)
    return NextResponse.json({ 
      error: "Failed to fetch calendar event history",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
