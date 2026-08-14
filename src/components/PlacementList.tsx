"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Calendar, Building, ExternalLink, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Placement {
  _id: string
  companyName: string
  jobRole: string
  status: string
  emailSubject?: string
  emailFrom?: string
  emailDate?: string
  extractionConfidence: number
  applicationLink?: string
  createdAt: string
}

export default function PlacementList() {
  const { data: session } = useSession()
  const [placements, setPlacements] = useState<Placement[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.id) {
      fetchPlacements()
    }
  }, [session])

  const fetchPlacements = async () => {
    try {
      const response = await fetch("/api/placements")
      const data = await response.json()
      
      if (response.ok) {
        setPlacements(data.placements || [])
      } else {
        toast.error("Failed to fetch placements")
      }
    } catch (error) {
      console.error("Error fetching placements:", error)
      toast.error("Failed to fetch placements")
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/placements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setPlacements(placements.map(p => p._id === id ? { ...p, status: newStatus } : p))
        toast.success("Status updated successfully")
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update status")
    }
  }

  const deletePlacement = async (id: string) => {
    try {
      const response = await fetch(`/api/placements/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setPlacements(placements.filter(p => p._id !== id))
        toast.success("Placement deleted successfully")
      } else {
        toast.error("Failed to delete placement")
      }
    } catch (error) {
      console.error("Error deleting placement:", error)
      toast.error("Failed to delete placement")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW": return "bg-blue-500"
      case "INTERESTED": return "bg-purple-500"
      case "APPLIED": return "bg-green-500"
      case "ASSESSMENT_SCHEDULED": return "bg-yellow-500"
      case "INTERVIEW_SCHEDULED": return "bg-orange-500"
      case "SELECTED": return "bg-emerald-500"
      case "REJECTED": return "bg-red-500"
      case "NOT_INTERESTED": return "bg-gray-500"
      case "EXPIRED": return "bg-slate-500"
      default: return "bg-gray-500"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (placements.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No placement emails detected yet</h3>
            <p className="text-muted-foreground text-sm">
              Enable Gmail monitoring to automatically detect placement emails from your placement cell.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {placements.map((placement) => (
        <Card key={placement._id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => window.location.href = `/placements/${placement._id}`}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{placement.companyName}</CardTitle>
                <CardDescription className="mt-1">{placement.jobRole}</CardDescription>
              </div>
              <Badge className={getStatusColor(placement.status)}>
                {placement.status.replace(/_/g, " ")}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {placement.emailSubject && (
                <div className="flex items-start gap-2 text-sm">
                  <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{placement.emailSubject}</p>
                    <p className="text-muted-foreground text-xs">{placement.emailFrom}</p>
                  </div>
                </div>
              )}
              
              {placement.emailDate && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(placement.emailDate).toLocaleDateString()}</span>
                </div>
              )}

              {placement.applicationLink && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(placement.applicationLink, "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Apply Now
                </Button>
              )}

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex gap-2">
                  {placement.status === "NEW" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(placement._id, "INTERESTED")}
                      >
                        Mark Interested
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(placement._id, "NOT_INTERESTED")}
                      >
                        Not Interested
                      </Button>
                    </>
                  )}
                  {placement.status === "INTERESTED" && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(placement._id, "APPLIED")}
                    >
                      Mark Applied
                    </Button>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deletePlacement(placement._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
