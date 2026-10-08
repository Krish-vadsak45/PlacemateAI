import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PlacementDetail from "@/components/PlacementDetail"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"
import { checkSharedAccess } from "@/lib/shared-access"

export default async function PlacementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/api/auth/signin")
  }

  const { id } = await params
  
  await connectDB()
  
  // First try finding by own userId
  let placement = await Placement.findOne({
    _id: id,
    userId: session.user.id
  })

  let sharedPermission: string | undefined = undefined

  // If not found, check if user has shared access to the placement owner's data
  if (!placement) {
    const anyPlacement = await Placement.findById(id)
    if (anyPlacement) {
      const access = await checkSharedAccess(
        session.user.id,
        anyPlacement.userId.toString(),
        'viewer'
      )
      if (access.allowed) {
        placement = anyPlacement
        sharedPermission = access.permission
      }
    }
  }

  if (!placement) {
    redirect("/dashboard")
  }

  return (
    <PlacementDetail
      placement={JSON.parse(JSON.stringify(placement))}
      sharedPermission={sharedPermission}
    />
  )
}
