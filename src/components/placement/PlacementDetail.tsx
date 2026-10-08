"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Placement, PlacementDetailProps } from "@/types/placement"
import { StatusBadge } from "./StatusBadge"
import { AISummaryCard } from "./AISummaryCard"
import { PlacementDetailsCard } from "./PlacementDetailsCard"
import TagManager from "./TagManager"
import { EmailContentCard } from "./EmailContentCard"
import { ApplicationHistoryCard } from "./ApplicationHistoryCard"
import { PlacementNavigation } from "./PlacementNavigation"
import { MatchScoreCard } from "./MatchScoreCard"
import { Button } from "@/components/ui/button"
import { ExternalLink } from "lucide-react"

const NotesEditor = dynamic(() => import("./NotesEditor"), {
  loading: () => <div className="glass-panel rounded-2xl p-6 h-48 animate-pulse bg-muted/20" />,
})
const CalendarEventsList = dynamic(() => import("@/components/calendar/CalendarEventsList"), {
  loading: () => <div className="glass-panel rounded-2xl p-6 h-36 animate-pulse bg-muted/20" />,
})
const PlacementCopilotCard = dynamic(() => import("./PlacementCopilotCard"), {
  loading: () => <div className="glass-panel rounded-2xl p-6 h-64 animate-pulse bg-muted/20" />,
})
const AttachmentsCard = dynamic(() => import("./AttachmentsCard"), {
  loading: () => <div className="glass-panel rounded-2xl p-6 h-36 animate-pulse bg-muted/20" />,
})
const CompanyResearchCard = dynamic(() => import("./CompanyResearchCard"), {
  loading: () => <div className="glass-panel rounded-2xl p-6 h-48 animate-pulse bg-muted/20" />,
})

export default function PlacementDetail({ placement: initialPlacement }: PlacementDetailProps) {
  const router = useRouter()
  const [placement, setPlacement] = useState<Placement>(initialPlacement)
  const [isEditing, setIsEditing] = useState(false)
  const [editedPlacement, setEditedPlacement] = useState<Placement>(initialPlacement)
  const [aiSummary, setAiSummary] = useState<string | null>(initialPlacement.aiSummary || null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [showEmail, setShowEmail] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/placements/${placement._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setPlacement({ ...placement, status: newStatus })
        setEditedPlacement({ ...editedPlacement, status: newStatus })
        toast.success(`Status updated to ${newStatus.replace(/_/g, " ")}`)
      } else {
        toast.error("Failed to update status")
      }
    } catch (error) {
      console.error("Error updating status:", error)
      toast.error("Failed to update status")
    }
  }

  const generateAISummary = async () => {
    setIsLoadingSummary(true)
    try {
      const response = await fetch(`/api/placements/${placement._id}/summary`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setAiSummary(data.summary)
        toast.success("AI summary generated successfully")
      } else {
        toast.error("Failed to generate AI summary")
      }
    } catch (error) {
      console.error("Error generating AI summary:", error)
      toast.error("Failed to generate AI summary")
    } finally {
      setIsLoadingSummary(false)
    }
  }

  const handleAddToCalendar = async (eventType: 'deadline' | 'assessment' | 'interview') => {
    // Check if event already exists
    const eventField = {
      deadline: 'deadlineCalendarEventId',
      assessment: 'assessmentCalendarEventId',
      interview: 'interviewCalendarEventId'
    }[eventType]

    if (placement[eventField as keyof typeof placement]) {
      toast.info("Event already exists in Google Calendar")
      return
    }

    try {
      const response = await fetch(`/api/placements/${placement._id}/calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType }),
      })

      if (response.ok) {
        const data = await response.json()
        const updateField = {
          deadline: 'deadlineCalendarEventId',
          assessment: 'assessmentCalendarEventId',
          interview: 'interviewCalendarEventId'
        }[eventType]
        setPlacement({ ...placement, [updateField]: data.eventId })
        toast.success("Added to Google Calendar with reminders")
      } else {
        const data = await response.json()
        if (data.requiresReauth) {
          toast.error("Calendar permissions required. Please sign in again to grant access.")
        } else {
          toast.error(data.error || "Failed to add to calendar")
        }
      }
    } catch (error) {
      console.error("Error adding to calendar:", error)
      toast.error("Failed to add to calendar")
    }
  }

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/placements/${placement._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedPlacement),
      })

      if (response.ok) {
        setPlacement(editedPlacement)
        setIsEditing(false)
        toast.success("Placement details updated successfully")
      } else {
        toast.error("Failed to update placement details")
      }
    } catch (error) {
      console.error("Error saving placement details:", error)
      toast.error("Failed to update placement details")
    }
  }

  const handleBack = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 max-w-7xl">
        <PlacementNavigation onBack={handleBack} />

        {/* HEADER HERO CARD */}
        <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-border shadow-sm mb-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            {/* Left: Avatar + Title */}
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center font-bold text-xl sm:text-2xl shrink-0">
                {placement.companyName.charAt(0).toUpperCase()}
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl sm:text-3xl font-bold text-foreground tracking-tight font-heading truncate">
                    {placement.companyName}
                  </h1>
                  <StatusBadge
                    status={placement.status}
                    onStatusChange={handleStatusChange}
                    editable={true}
                  />
                </div>

                <p className="text-sm sm:text-base text-muted-foreground font-medium">
                  {placement.jobRole}
                </p>

                {/* Subtitle details */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5 flex-wrap">
                  {placement.package && (
                    <span className="font-medium text-foreground bg-muted/60 px-2.5 py-0.5 rounded-md">
                      {placement.package}
                    </span>
                  )}
                  {placement.location && (
                    <span>📍 {placement.location}</span>
                  )}
                  {placement.emailDate && (
                    <span>Received {new Date(placement.emailDate).toLocaleDateString()}</span>
                  )}
                </div>

                {/* Tags Management */}
                <div className="pt-1.5">
                  <TagManager
                    placementId={placement._id}
                    tags={placement.tags || []}
                    onTagsChange={(newTags) => {
                      setPlacement({ ...placement, tags: newTags })
                      setEditedPlacement({ ...editedPlacement, tags: newTags })
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex items-center gap-2">
              {placement.applicationLink && (
                <a
                  href={placement.applicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" className="h-9 text-xs font-semibold gap-1.5 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm rounded-xl px-4">
                    Apply on Portal
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT MAIN COLUMN (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <PlacementDetailsCard
              placement={placement}
              isEditing={isEditing}
              editedPlacement={editedPlacement}
              onEditToggle={() => setIsEditing(!isEditing)}
              onSave={handleSave}
              onCancel={() => {
                setIsEditing(false)
                setEditedPlacement(placement)
              }}
              onFieldChange={(field, value) =>
                setEditedPlacement({ ...editedPlacement, [field]: value })
              }
              onAddToCalendar={handleAddToCalendar}
            />

            <CalendarEventsList
              placementId={placement._id}
              onEventUpdated={() => {
                // Refresh placement data to get updated calendar event IDs
                fetch(`/api/placements/${placement._id}`)
                  .then(res => res.json())
                  .then(data => setPlacement(data))
              }}
            />

            <AISummaryCard
              aiSummary={aiSummary}
              isLoadingSummary={isLoadingSummary}
              onGenerateSummary={generateAISummary}
            />

            <div className="glass-panel rounded-3xl p-6 border border-border/80 shadow-md">
              <NotesEditor
                placementId={placement._id}
                notes={placement.notes || []}
                onNotesChange={(updatedNotes) => {
                  setPlacement({ ...placement, notes: updatedNotes })
                  setEditedPlacement({ ...editedPlacement, notes: updatedNotes })
                }}
              />
            </div>

            <AttachmentsCard
              placement={placement}
              onAttachmentAdded={(newAtt) => {
                const updated = [...(placement.attachments || []), newAtt]
                setPlacement({ ...placement, attachments: updated })
                setEditedPlacement({ ...editedPlacement, attachments: updated })
              }}
              onAttachmentDeleted={(attId) => {
                const updated = (placement.attachments || []).filter((a) => a.id !== attId)
                setPlacement({ ...placement, attachments: updated })
                setEditedPlacement({ ...editedPlacement, attachments: updated })
              }}
            />

            <EmailContentCard
              placement={placement}
              showEmail={showEmail}
              onToggleEmail={() => setShowEmail(!showEmail)}
            />

            <ApplicationHistoryCard placement={placement} />
          </div>

          {/* RIGHT SIDEBAR (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <PlacementCopilotCard
              placement={placement}
              onPlacementUpdated={(updatedPlacement) => {
                setPlacement(updatedPlacement)
                setEditedPlacement(updatedPlacement)
                if (updatedPlacement.aiSummary) {
                  setAiSummary(updatedPlacement.aiSummary)
                }
              }}
            />

            <MatchScoreCard
              matchScore={placement.matchScore}
              matchBreakdown={placement.matchBreakdown}
              missingRequiredSkills={placement.matchBreakdown ? undefined : []}
            />

            <CompanyResearchCard placement={placement} />
          </div>
        </div>
      </div>
    </div>
  )
}
