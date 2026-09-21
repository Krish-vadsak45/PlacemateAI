"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { motion } from "framer-motion"
import { Placement, PlacementDetailProps } from "@/types/placement"
import { StatusBadge, getStatusColor } from "./StatusBadge"
import { AISummaryCard } from "./AISummaryCard"
import { PlacementDetailsCard } from "./PlacementDetailsCard"
import { NotesCard } from "./NotesCard"
import { EmailContentCard } from "./EmailContentCard"
import { AttachmentsCard } from "./AttachmentsCard"
import { ApplicationHistoryCard } from "./ApplicationHistoryCard"
import { PlacementNavigation } from "./PlacementNavigation"
import { MatchScoreCard } from "./MatchScoreCard"

export default function PlacementDetail({ placement: initialPlacement }: PlacementDetailProps) {
  const router = useRouter()
  const [placement, setPlacement] = useState<Placement>(initialPlacement)
  const [isEditing, setIsEditing] = useState(false)
  const [editedPlacement, setEditedPlacement] = useState<Placement>(initialPlacement)
  const [newNote, setNewNote] = useState("")
  const [aiSummary, setAiSummary] = useState<string | null>(initialPlacement.aiSummary || null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [showEmail, setShowEmail] = useState(false)

  // Debug logging
  console.log('PlacementDetail - Initial aiSummary:', initialPlacement.aiSummary)
  console.log('PlacementDetail - Current aiSummary state:', aiSummary)

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
        toast.success("Status updated successfully")
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
        console.log("AI Summary Client Response:", data)
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
        toast.success("Added to calendar successfully")
      } else {
        const data = await response.json()
        if (data.requiresReauth) {
          toast.error("Calendar permissions required. Please sign out and sign in again to grant calendar access.")
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

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    try {
      const updatedNotes = [
        ...(placement.notes || []),
        {
          id: Date.now().toString(),
          content: newNote,
          createdAt: new Date().toISOString(),
        },
      ]

      const response = await fetch(`/api/placements/${placement._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: updatedNotes }),
      })

      if (response.ok) {
        setPlacement({ ...placement, notes: updatedNotes })
        setNewNote("")
        toast.success("Note added successfully")
      } else {
        toast.error("Failed to add note")
      }
    } catch (error) {
      console.error("Error adding note:", error)
      toast.error("Failed to add note")
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    try {
      const updatedNotes = placement.notes?.filter((note) => note.id !== noteId) || []

      const response = await fetch(`/api/placements/${placement._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: updatedNotes }),
      })

      if (response.ok) {
        setPlacement({ ...placement, notes: updatedNotes })
        toast.success("Note deleted successfully")
      } else {
        toast.error("Failed to delete note")
      }
    } catch (error) {
      console.error("Error deleting note:", error)
      toast.error("Failed to delete note")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    try {
      const formData = new FormData()
      Array.from(files).forEach((file) => {
        formData.append("files", file)
      })

      const response = await fetch(`/api/placements/${placement._id}/attachments`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setPlacement({ ...placement, attachments: data.attachments })
        toast.success("Files uploaded successfully")
      } else {
        toast.error("Failed to upload files")
      }
    } catch (error) {
      console.error("Error uploading files:", error)
      toast.error("Failed to upload files")
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      const response = await fetch(`/api/placements/${placement._id}/attachments/${attachmentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const updatedAttachments = placement.attachments?.filter((a) => a.id !== attachmentId) || []
        setPlacement({ ...placement, attachments: updatedAttachments })
        toast.success("Attachment deleted successfully")
      } else {
        toast.error("Failed to delete attachment")
      }
    } catch (error) {
      console.error("Error deleting attachment:", error)
      toast.error("Failed to delete attachment")
    }
  }

  const handleBack = () => {
    router.push("/dashboard")
  }

  const handleNext = () => {
    // Implementation would need to fetch next placement
    toast.info("Navigation to next placement - to be implemented")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, -90, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-1/2 -left-40 w-96 h-96 bg-red-600/5 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 45, 0],
          }}
          transition={{
            duration: 35,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute -bottom-40 right-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl relative z-10">
        <PlacementNavigation
          onBack={handleBack}
          onNext={handleNext}
          hasPrevious={true}
          hasNext={false}
        />

        {/* Header Card */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
            whileHover={{ scale: 1.01, rotateX: 2 }}
            style={{ perspective: 1000 }}
            className="bg-white dark:bg-gray-800 backdrop-blur-xl rounded-3xl shadow-2xl shadow-red-500/20 p-8 border border-gray-200 dark:border-gray-700 relative overflow-hidden"
          >
            {/* Header gradient decoration */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-600" />
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-600 to-red-500 dark:from-red-500 dark:to-red-400 bg-clip-text text-transparent mb-2">
                    {placement.companyName}
                  </h1>
                  <p className="text-xl text-gray-600 dark:text-gray-300">{placement.jobRole}</p>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4"
              >
                <StatusBadge
                  status={placement.status}
                  onStatusChange={handleStatusChange}
                  editable={true}
                />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Component Cards */}
        <div className="space-y-6">
          <MatchScoreCard
            matchScore={placement.matchScore}
            matchBreakdown={placement.matchBreakdown}
            missingRequiredSkills={placement.matchBreakdown ? undefined : []}
          />

          <AISummaryCard
            aiSummary={aiSummary}
            isLoadingSummary={isLoadingSummary}
            onGenerateSummary={generateAISummary}
          />

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

          <NotesCard
            placement={placement}
            newNote={newNote}
            onNoteChange={setNewNote}
            onAddNote={handleAddNote}
            onDeleteNote={handleDeleteNote}
          />

          <EmailContentCard
            placement={placement}
            showEmail={showEmail}
            onToggleEmail={() => setShowEmail(!showEmail)}
          />

          {/* <AttachmentsCard
            placement={placement}
            onFileUpload={handleFileUpload}
            onDeleteAttachment={handleDeleteAttachment}
          /> */}

          <ApplicationHistoryCard placement={placement} />
        </div>
      </div>
    </div>
  )
}
