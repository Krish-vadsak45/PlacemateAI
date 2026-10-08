import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"
import mongoose from "mongoose"
import { getCachedSearch, cacheSearch } from "@/lib/search-cache"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const cacheKey = `tags:${session.user.id}`
    const cachedTags = await getCachedSearch(cacheKey)
    if (cachedTags) {
      return NextResponse.json(cachedTags, {
        headers: {
          'Cache-Control': 'private, max-age=3600, stale-while-revalidate=86400'
        }
      })
    }

    await connectDB()

    const userObjectId = new mongoose.Types.ObjectId(session.user.id)

    // Aggregate unique tags with frequency count
    const tagStats = await Placement.aggregate([
      { $match: { userId: userObjectId } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ])

    const tags = tagStats.map((item) => ({
      tag: item._id,
      count: item.count,
    }))

    const payload = {
      success: true,
      tags,
    }

    await cacheSearch(cacheKey, payload, 3600)

    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'private, max-age=3600, stale-while-revalidate=86400'
      }
    })
  } catch (error) {
    console.error("Error fetching tags aggregate:", error)
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    )
  }
}
