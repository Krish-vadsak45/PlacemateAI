import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import connectDB from "@/lib/mongodb"
import User from "@/models/User"
import Placement from "@/models/Placement"
import mongoose from "mongoose"
import SavedPlacementsClient, { SavedPlacementItem } from "./SavedPlacementsClient"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Saved Placements | PlaceMate",
  description: "Curated shortlist of your saved campus placement drives and target dream companies.",
}

export default async function SavedPlacementsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/api/auth/signin")
  }

  await connectDB()

  // Find user by _id or email
  const user = await User.findOne({
    $or: [
      ...(session.user.id && mongoose.Types.ObjectId.isValid(session.user.id) 
        ? [{ _id: new mongoose.Types.ObjectId(session.user.id) }] 
        : []),
      ...(session.user.email ? [{ email: session.user.email.toLowerCase().trim() }] : []),
    ],
  }).select("savedPlacements").lean()

  const savedIds = (user?.savedPlacements || []).map((id: any) => id.toString())

  let initialPlacements: SavedPlacementItem[] = []

  if (savedIds.length > 0) {
    const validObjectIds = savedIds
      .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
      .map((id: string) => new mongoose.Types.ObjectId(id))

    const rawPlacements = await Placement.find({
      _id: { $in: validObjectIds },
    })
      .sort({ createdAt: -1 })
      .lean()

    initialPlacements = rawPlacements.map((p: any) => ({
      _id: p._id.toString(),
      companyName: p.companyName,
      jobRole: p.jobRole,
      package: p.package || "",
      location: p.location || "",
      applicationDeadline: p.applicationDeadline ? new Date(p.applicationDeadline).toISOString() : undefined,
      status: p.status || "NEW",
      tags: p.tags || [],
      matchScore: p.matchScore,
      applicationLink: p.applicationLink || "",
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
    }))
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 max-w-7xl">
        <SavedPlacementsClient initialPlacements={initialPlacements} />
      </div>
    </div>
  )
}
