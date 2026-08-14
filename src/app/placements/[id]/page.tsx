import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import PlacementDetail from "@/components/PlacementDetail"
import connectDB from "@/lib/mongodb"
import Placement from "@/models/Placement"

export default async function PlacementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/api/auth/signin")
  }

  const { id } = await params
  
  await connectDB()
  
  const placement = await Placement.findOne({
    _id: id,
    userId: session.user.id
  })

  if (!placement) {
    redirect("/dashboard")
  }

  return <PlacementDetail placement={JSON.parse(JSON.stringify(placement))} />
}
