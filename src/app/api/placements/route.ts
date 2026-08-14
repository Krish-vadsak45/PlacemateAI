import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"

export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "20")

    const query: any = { userId: session.user.id }
    if (status) {
      query.status = status
    }

    const placements = await Placement.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)

    return NextResponse.json({ 
      success: true, 
      placements,
      count: placements.length
    })
  } catch (error) {
    console.error("Error fetching placements:", error)
    return NextResponse.json({ 
      error: "Failed to fetch placements",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
