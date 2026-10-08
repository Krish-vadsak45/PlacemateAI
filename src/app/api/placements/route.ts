import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"
import { checkSharedAccess, resolveOwnerId } from "@/lib/shared-access"
import { generateCacheKey, getCachedSearch, cacheSearch } from "@/lib/search-cache"

export async function GET(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await connectDB()

    // Check if accessing another user's data via shared access
    const targetOwnerId = resolveOwnerId(request)
    const access = await checkSharedAccess(session.user.id, targetOwnerId, 'viewer')

    if (!access.allowed) {
      return NextResponse.json({ error: "You don't have access to this dashboard" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const tagsParam = searchParams.get("tags")
    const noteQuery = searchParams.get("noteQ")
    const limit = parseInt(searchParams.get("limit") || "20")

    const cacheKey = generateCacheKey(access.effectiveUserId, {
      status: status ? [status] : undefined,
      tags: tagsParam ? tagsParam.split(",") : undefined,
      q: noteQuery,
      limit: limit.toString()
    })

    const cachedData = await getCachedSearch(cacheKey)
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'private, max-age=60, stale-while-revalidate=300'
        }
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { userId: access.effectiveUserId }
    if (status) {
      query.status = status
    }
    if (tagsParam) {
      const tagList = tagsParam.split(",").map((t) => t.trim()).filter(Boolean)
      if (tagList.length > 0) {
        query.tags = { $in: tagList }
      }
    }
    if (noteQuery) {
      query["notes.content"] = { $regex: noteQuery, $options: "i" }
    }

    const placements = await Placement.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)

    const responsePayload = { 
      success: true, 
      placements,
      count: placements.length
    }

    await cacheSearch(cacheKey, responsePayload, 300)

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300'
      }
    })
  } catch (error) {
    console.error("Error fetching placements:", error)
    return NextResponse.json({ 
      error: "Failed to fetch placements",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
