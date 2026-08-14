"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  ArrowLeft, 
  ArrowRight, 
  Mail, 
  Calendar, 
  Building, 
  ExternalLink, 
  Trash2, 
  Edit,
  Save,
  X,
  Clock,
  FileText,
  Plus,
  Sparkles
} from "lucide-react"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface Placement {
  _id: string
  companyName: string
  jobRole: string
  status: string
  emailSubject?: string
  emailFrom?: string
  emailBody?: string
  emailDate?: string
  package?: string
  location?: string
  applicationDeadline?: string
  assessmentDate?: string
  interviewDate?: string
  applicationLink?: string
  googleFormLink?: string
  notes?: Array<{ id: string; content: string; createdAt: string }>
  attachments?: Array<{ id: string; name: string; url: string; type: string }>
  applicationHistory?: Array<{ status: string; changedAt: string; note?: string }>
  calendarEventId?: string
  aiSummary?: string
}

interface PlacementDetailProps {
  placement: Placement
}

export default function PlacementDetail({ placement: initialPlacement }: PlacementDetailProps) {
  const router = useRouter()
  const [placement, setPlacement] = useState<Placement>(initialPlacement)
  const [isEditing, setIsEditing] = useState(false)
  const [editedPlacement, setEditedPlacement] = useState<Placement>(initialPlacement)
  const [newNote, setNewNote] = useState("")
  const [aiSummary, setAiSummary] = useState<string | null>(initialPlacement.aiSummary || null)
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [showEmail, setShowEmail] = useState(false)

  const statusOptions = [
    "NEW", "INTERESTED", "APPLIED", "ASSESSMENT_SCHEDULED", 
    "INTERVIEW_SCHEDULED", "SELECTED", "REJECTED", "NOT_INTERESTED", "EXPIRED"
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "INTERESTED": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "APPLIED": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "ASSESSMENT_SCHEDULED": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
      case "INTERVIEW_SCHEDULED": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
      case "SELECTED": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
      case "REJECTED": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "NOT_INTERESTED": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      case "EXPIRED": return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

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
        toast.success("Placement updated successfully")
      } else {
        toast.error("Failed to update placement")
      }
    } catch (error) {
      console.error("Error updating placement:", error)
      toast.error("Failed to update placement")
    }
  }

  const handleAddNote = async () => {
    if (!newNote.trim()) return

    try {
      const note = {
        id: Date.now().toString(),
        content: newNote,
        createdAt: new Date().toISOString()
      }

      const updatedNotes = [...(placement.notes || []), note]
      
      const response = await fetch(`/api/placements/${placement._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: updatedNotes }),
      })

      if (response.ok) {
        setPlacement({ ...placement, notes: updatedNotes })
        setEditedPlacement({ ...editedPlacement, notes: updatedNotes })
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('placementId', placement._id)

      const response = await fetch(`/api/placements/${placement._id}/attachments`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setPlacement({ ...placement, attachments: data.attachments })
        toast.success("File uploaded successfully")
      } else {
        toast.error("Failed to upload file")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error("Failed to upload file")
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      const response = await fetch(`/api/placements/${placement._id}/attachments/${attachmentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const updatedAttachments = placement.attachments?.filter(a => a.id !== attachmentId) || []
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

  const handleDeleteNote = async (noteId: string) => {
    try {
      const updatedNotes = placement.notes?.filter(note => note.id !== noteId) || []
      
      const response = await fetch(`/api/placements/${placement._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: updatedNotes }),
      })

      if (response.ok) {
        setPlacement({ ...placement, notes: updatedNotes })
        setEditedPlacement({ ...editedPlacement, notes: updatedNotes })
        toast.success("Note deleted successfully")
      } else {
        toast.error("Failed to delete note")
      }
    } catch (error) {
      console.error("Error deleting note:", error)
      toast.error("Failed to delete note")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this placement?")) return

    try {
      const response = await fetch(`/api/placements/${placement._id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Placement deleted successfully")
        router.push("/dashboard")
      } else {
        toast.error("Failed to delete placement")
      }
    } catch (error) {
      console.error("Error deleting placement:", error)
      toast.error("Failed to delete placement")
    }
  }

  const handleAutoFill = async () => {
    if (!placement.applicationLink) {
      toast.error("No application link available")
      return
    }

    try {
      const response = await fetch(`/api/placements/${placement._id}/autofill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationUrl: placement.applicationLink }),
      })

      if (response.ok) {
        const data = await response.json()
        // Open the application link in a new tab
        window.open(placement.applicationLink, "_blank")
        // Show instructions for using the auto-fill
        toast.success("Application opened! Use browser console to run auto-fill script", {
          duration: 5000,
          description: "Copy the script from browser console and paste it in the application form"
        })
      } else {
        toast.error("Failed to generate auto-fill script")
      }
    } catch (error) {
      console.error("Error with auto-fill:", error)
      toast.error("Failed to generate auto-fill script")
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
        setPlacement({ ...placement, calendarEventId: data.eventId })
        toast.success("Event added to Google Calendar")
      } else {
        toast.error("Failed to add event to calendar")
      }
    } catch (error) {
      console.error("Error adding to calendar:", error)
      toast.error("Failed to add event to calendar")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen bg-gradient-to-br from-background via-purple-50/10 to-blue-50/10 dark:via-purple-950/10 dark:to-blue-950/10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between mb-6"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
            >
              <motion.div
                animate={{ x: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <ArrowLeft className="h-4 w-4" />
              </motion.div>
              Back to Dashboard
            </Button>
          </motion.div>
          <div className="flex gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                disabled
                className="hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard")}
                disabled
                className="hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid gap-6">
          {/* Header Card */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
            style={{ perspective: 2000 }}
          >
            <motion.div
              whileHover={{ 
                scale: 1.02, 
                rotateY: 3, 
                rotateX: -2,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                animate={{ opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <Card className="border-2 border-primary/30 shadow-2xl hover:shadow-primary/30 transition-all duration-500 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm relative overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-purple-500 to-primary"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    backgroundSize: ["200% 200%"]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ backgroundSize: "200% 200%" }}
                />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <motion.div 
                      className="flex-1"
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                    >
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                      >
                        <CardTitle className="text-2xl mb-2 bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                          {placement.companyName}
                        </CardTitle>
                        <CardDescription className="text-lg">{placement.jobRole}</CardDescription>
                      </motion.div>
                    </motion.div>
                    <motion.div 
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: 10, y: -5 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Badge className={`${getStatusColor(placement.status)} shadow-lg hover:shadow-xl transition-shadow`}>
                          {placement.status.replace(/_/g, " ")}
                        </Badge>
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.15, rotate: 5 }} 
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditing(!isEditing)}
                          className="hover:bg-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </motion.div>
                      <motion.div 
                        whileHover={{ scale: 1.15, rotate: -5 }} 
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleDelete}
                          className="hover:bg-red-500/10 hover:text-red-500 hover:shadow-lg hover:shadow-red-500/20 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    {placement.applicationLink && (
                      <motion.div 
                        whileHover={{ scale: 1.08, y: -3 }} 
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Button
                          onClick={() => window.open(placement.applicationLink, "_blank")}
                          className="gap-2 bg-gradient-to-r from-primary via-purple-600 to-pink-600 hover:from-primary/90 hover:via-purple-600/90 hover:to-pink-600/90 shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                        >
                          <motion.div
                            animate={{ x: [0, 3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </motion.div>
                          Apply Now
                        </Button>
                      </motion.div>
                    )}
                    <motion.div 
                      whileHover={{ scale: 1.08, y: -3 }} 
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Button
                        variant="outline"
                        onClick={handleAutoFill}
                        className="gap-2 hover:shadow-lg hover:shadow-purple-500/30 border-purple-500/50 hover:bg-purple-500/10 transition-all duration-300"
                      >
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                        >
                          <Sparkles className="h-4 w-4" />
                        </motion.div>
                        Auto-fill Application
                      </Button>
                    </motion.div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* AI Summary Card */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
            style={{ perspective: 2000 }}
          >
            <motion.div
              whileHover={{ 
                scale: 1.02, 
                rotateY: -3, 
                rotateX: 2,
                boxShadow: "0 25px 50px -12px rgba(168, 85, 247, 0.25)"
              }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <Card className="border-2 border-purple-500/30 shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm relative overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    backgroundSize: ["200% 200%"]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ backgroundSize: "200% 200%" }}
                />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="h-5 w-5 text-purple-500" />
                      </motion.div>
                      <CardTitle className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                        AI Summary
                      </CardTitle>
                    </motion.div>
                    {!aiSummary && (
                      <motion.div 
                        whileHover={{ scale: 1.08, y: -2 }} 
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generateAISummary}
                          disabled={isLoadingSummary}
                          className="border-purple-500/50 hover:bg-purple-500/10 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
                        >
                          {isLoadingSummary ? "Generating..." : "Generate Summary"}
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingSummary ? (
                    <div className="flex items-center justify-center py-8">
                      <motion.div
                        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"
                      ></motion.div>
                    </div>
                  ) : aiSummary ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                      className="space-y-4"
                    >
                      {aiSummary.split('\n\n').map((section, index) => {
                        const lines = section.split('\n').filter(line => line.trim())
                        if (lines.length === 0) return null
                        
                        const headerLine = lines[0]
                        const isHeader = headerLine.startsWith('**') && headerLine.endsWith('**')
                        
                        if (isHeader) {
                          const headerText = headerLine.replace(/\*\*/g, '').trim()
                          const contentLines = lines.slice(1)
                          
                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -30, scale: 0.95 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              transition={{ delay: 0.6 + (index * 0.1), type: "spring", stiffness: 100 }}
                              whileHover={{ x: 5, scale: 1.02 }}
                              className="transition-all"
                            >
                              <div className="font-semibold mb-2 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400">
                                {headerText}
                              </div>
                              {contentLines.length > 0 && (
                                <div className="pl-4 space-y-1">
                                  {contentLines.map((line, idx) => (
                                    <motion.div
                                      key={idx}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: 0.7 + (index * 0.1) + (idx * 0.05), type: "spring", stiffness: 100 }}
                                      whileHover={{ x: 3, scale: 1.01 }}
                                      className="flex items-start gap-2 text-sm text-muted-foreground transition-all"
                                    >
                                      <motion.span 
                                        className="text-purple-500 mt-1"
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 + idx * 0.2 }}
                                      >
                                        •
                                      </motion.span>
                                      <span>{line.replace('•', '').trim()}</span>
                                    </motion.div>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          )
                        }
                        
                        return null
                      })}
                    </motion.div>
                  ) : (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="text-muted-foreground text-sm"
                    >
                      Click "Generate Summary" to get an AI-powered summary of this placement opportunity.
                    </motion.p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
            style={{ perspective: 2000 }}
          >
            <motion.div
              whileHover={{ 
                scale: 1.02, 
                rotateY: 3, 
                rotateX: -2,
                boxShadow: "0 25px 50px -12px rgba(59, 130, 246, 0.25)"
              }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <Card className="border-2 border-blue-500/30 shadow-2xl hover:shadow-blue-500/30 transition-all duration-500 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm relative overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    backgroundSize: ["200% 200%"]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ backgroundSize: "200% 200%" }}
                />
                <CardHeader>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  >
                    <CardTitle className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                      Placement Details
                    </CardTitle>
                  </motion.div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
                          <Label>Package</Label>
                          <Input
                            value={editedPlacement.package || ""}
                            onChange={(e) => setEditedPlacement({ ...editedPlacement, package: e.target.value })}
                            placeholder="e.g., 8 LPA"
                            className="hover:border-blue-500/50 focus:border-blue-500 transition-colors"
                          />
                        </motion.div>
                        <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
                          <Label>Location</Label>
                          <Input
                            value={editedPlacement.location || ""}
                            onChange={(e) => setEditedPlacement({ ...editedPlacement, location: e.target.value })}
                            placeholder="e.g., Bangalore"
                            className="hover:border-blue-500/50 focus:border-blue-500 transition-colors"
                          />
                        </motion.div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
                          <Label>Application Deadline</Label>
                          <Input
                            type="date"
                            value={editedPlacement.applicationDeadline?.split('T')[0] || ""}
                            onChange={(e) => setEditedPlacement({ ...editedPlacement, applicationDeadline: e.target.value })}
                            className="hover:border-blue-500/50 focus:border-blue-500 transition-colors"
                          />
                        </motion.div>
                        <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
                          <Label>Assessment Date</Label>
                          <Input
                            type="date"
                            value={editedPlacement.assessmentDate?.split('T')[0] || ""}
                            onChange={(e) => setEditedPlacement({ ...editedPlacement, assessmentDate: e.target.value })}
                            className="hover:border-blue-500/50 focus:border-blue-500 transition-colors"
                          />
                        </motion.div>
                      </div>
                      <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }}>
                        <Label>Interview Date</Label>
                        <Input
                          type="date"
                          value={editedPlacement.interviewDate?.split('T')[0] || ""}
                          onChange={(e) => setEditedPlacement({ ...editedPlacement, interviewDate: e.target.value })}
                          className="hover:border-blue-500/50 focus:border-blue-500 transition-colors"
                        />
                      </motion.div>
                      <div className="flex gap-2">
                        <motion.div whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400 }}>
                          <Button onClick={handleSave} className="hover:shadow-lg hover:shadow-blue-500/30 transition-all">
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400 }}>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false)
                              setEditedPlacement(placement)
                            }}
                            className="hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </motion.div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        {placement.package && (
                          <motion.div
                            initial={{ opacity: 0, x: -30, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ delay: 0.7, type: "spring", stiffness: 100 }}
                            whileHover={{ x: 5, scale: 1.02 }}
                            className="flex items-center gap-2 transition-all"
                          >
                            <span className="text-muted-foreground">Package:</span>
                            <span className="font-medium">{placement.package}</span>
                          </motion.div>
                        )}
                        {placement.location && (
                          <motion.div
                            initial={{ opacity: 0, x: -30, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
                            whileHover={{ x: 5, scale: 1.02 }}
                            className="flex items-center gap-2 transition-all"
                          >
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{placement.location}</span>
                          </motion.div>
                        )}
                        {placement.applicationDeadline && (
                          <motion.div
                            initial={{ opacity: 0, x: -30, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ delay: 0.9, type: "spring", stiffness: 100 }}
                            whileHover={{ x: 5, scale: 1.02 }}
                            className="flex items-center gap-2 transition-all"
                          >
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              Deadline: {new Date(placement.applicationDeadline).toLocaleDateString()}
                            </span>
                            {!placement.calendarEventId && (
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400 }}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddToCalendar('deadline')}
                                  className="hover:bg-blue-500/10 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                                >
                                  Add to Calendar
                                </Button>
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                        {placement.assessmentDate && (
                          <motion.div
                            initial={{ opacity: 0, x: -30, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ delay: 1.0, type: "spring", stiffness: 100 }}
                            whileHover={{ x: 5, scale: 1.02 }}
                            className="flex items-center gap-2 transition-all"
                          >
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              Assessment: {new Date(placement.assessmentDate).toLocaleDateString()}
                            </span>
                            {!placement.calendarEventId && (
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400 }}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddToCalendar('assessment')}
                                  className="hover:bg-blue-500/10 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                                >
                                  Add to Calendar
                                </Button>
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                        {placement.interviewDate && (
                          <motion.div
                            initial={{ opacity: 0, x: -30, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ delay: 1.1, type: "spring", stiffness: 100 }}
                            whileHover={{ x: 5, scale: 1.02 }}
                            className="flex items-center gap-2 transition-all"
                          >
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              Interview: {new Date(placement.interviewDate).toLocaleDateString()}
                            </span>
                            {!placement.calendarEventId && (
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400 }}>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddToCalendar('interview')}
                                  className="hover:bg-blue-500/10 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                                >
                                  Add to Calendar
                                </Button>
                              </motion.div>
                            )}
                          </motion.div>
                        )}
                        {placement.googleFormLink && (
                          <motion.div
                            initial={{ opacity: 0, x: -30, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            transition={{ delay: 1.2, type: "spring", stiffness: 100 }}
                            whileHover={{ x: 5, scale: 1.02 }}
                            className="flex items-center gap-2 transition-all"
                          >
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            <motion.div whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400 }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(placement.googleFormLink, "_blank")}
                                className="hover:bg-blue-500/10 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                              >
                                Google Form
                              </Button>
                            </motion.div>
                          </motion.div>
                        )}
                      </div>
                      
                      {!placement.package && !placement.location && !placement.applicationDeadline && !placement.assessmentDate && !placement.interviewDate && !placement.googleFormLink && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.7, type: "spring", stiffness: 100 }}
                          className="text-center py-8 text-muted-foreground"
                        >
                          <p className="text-sm">No additional details available yet.</p>
                          <p className="text-xs mt-2">Click the Edit button to add placement details.</p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Email Content Card */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
            style={{ perspective: 2000 }}
          >
            <motion.div
              whileHover={{ 
                scale: 1.02, 
                rotateY: -3, 
                rotateX: 2,
                boxShadow: "0 25px 50px -12px rgba(34, 197, 94, 0.25)"
              }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <Card className="border-2 border-green-500/30 shadow-2xl hover:shadow-green-500/30 transition-all duration-500 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm relative overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-green-500"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    backgroundSize: ["200% 200%"]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ backgroundSize: "200% 200%" }}
                />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <Mail className="h-5 w-5 text-green-500" />
                      </motion.div>
                      <CardTitle className="bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent">
                        Original Email
                      </CardTitle>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.08, y: -2 }} 
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEmail(!showEmail)}
                        className="border-green-500/50 hover:bg-green-500/10 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300"
                      >
                        {showEmail ? "Hide" : "Show"}
                      </Button>
                    </motion.div>
                  </div>
                </CardHeader>
                {showEmail && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: "auto", y: 0 }}
                    transition={{ delay: 0.7, type: "spring", stiffness: 100 }}
                  >
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
                          whileHover={{ x: 3 }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="text-muted-foreground">From:</span>
                          <span className="font-medium">{placement.emailFrom}</span>
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.85, type: "spring", stiffness: 100 }}
                          whileHover={{ x: 3 }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="text-muted-foreground">Subject:</span>
                          <span className="font-medium">{placement.emailSubject}</span>
                        </motion.div>
                        {placement.emailDate && (
                          <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.9, type: "spring", stiffness: 100 }}
                            whileHover={{ x: 3 }}
                            className="flex items-center gap-2 text-sm"
                          >
                            <span className="text-muted-foreground">Date:</span>
                            <span className="font-medium">{new Date(placement.emailDate).toLocaleString()}</span>
                          </motion.div>
                        )}
                      </div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.95, type: "spring", stiffness: 100 }}
                        className="border-t pt-4"
                      >
                        <pre className="whitespace-pre-wrap text-sm font-sans text-muted-foreground">
                          {placement.emailBody}
                        </pre>
                      </motion.div>
                    </CardContent>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          </motion.div>

          {/* Notes Card */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
            style={{ perspective: 2000 }}
          >
            <motion.div
              whileHover={{ 
                scale: 1.02, 
                rotateY: 3, 
                rotateX: -2,
                boxShadow: "0 25px 50px -12px rgba(234, 179, 8, 0.25)"
              }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <Card className="border-2 border-yellow-500/30 shadow-2xl hover:shadow-yellow-500/30 transition-all duration-500 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm relative overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    backgroundSize: ["200% 200%"]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ backgroundSize: "200% 200%" }}
                />
                <CardHeader>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
                    className="flex items-center gap-2"
                  >
                    <motion.div
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <FileText className="h-5 w-5 text-yellow-500" />
                    </motion.div>
                    <CardTitle className="bg-gradient-to-r from-yellow-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
                      Notes
                    </CardTitle>
                  </motion.div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
                    className="flex gap-2"
                  >
                    <motion.div whileFocus={{ scale: 1.02 }} transition={{ type: "spring", stiffness: 400 }} className="flex-1">
                      <Textarea
                        placeholder="Add a note about this placement..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        className="hover:border-yellow-500/50 focus:border-yellow-500 transition-colors"
                        rows={3}
                      />
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.08, y: -2 }} whileTap={{ scale: 0.95 }} transition={{ type: "spring", stiffness: 400 }}>
                      <Button onClick={handleAddNote} disabled={!newNote.trim()} className="hover:shadow-lg hover:shadow-yellow-500/30 transition-all">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </motion.div>
                  {placement.notes && placement.notes.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.9 }}
                      className="space-y-2"
                    >
                      {placement.notes.map((note, index) => (
                        <motion.div
                          key={note.id}
                          initial={{ opacity: 0, x: -30, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ delay: 1.0 + (index * 0.1), type: "spring", stiffness: 100 }}
                          whileHover={{ x: 5, scale: 1.02 }}
                          className="flex items-start justify-between p-3 bg-muted rounded-lg hover:bg-accent transition-colors transition-all"
                        >
                          <div className="flex-1">
                            <p className="text-sm">{note.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(note.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <motion.div whileHover={{ scale: 1.15, rotate: 5 }} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400 }}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteNote(note.id)}
                              className="hover:bg-red-500/10 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.p
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9, type: "spring", stiffness: 100 }}
                      className="text-muted-foreground text-sm"
                    >
                      No notes yet. Add your first note above.
                    </motion.p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Attachments Card */}
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
            style={{ perspective: 2000 }}
          >
            <motion.div
              whileHover={{ 
                scale: 1.02, 
                rotateY: -3, 
                rotateX: 2,
                boxShadow: "0 25px 50px -12px rgba(236, 72, 153, 0.25)"
              }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-pink-500/20 via-rose-500/20 to-pink-500/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <Card className="border-2 border-pink-500/30 shadow-2xl hover:shadow-pink-500/30 transition-all duration-500 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm relative overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    backgroundSize: ["200% 200%"]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{ backgroundSize: "200% 200%" }}
                />
                <CardHeader>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8, type: "spring", stiffness: 200 }}
                    className="flex items-center gap-2"
                  >
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <FileText className="h-5 w-5 text-pink-500" />
                    </motion.div>
                    <CardTitle className="bg-gradient-to-r from-pink-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
                      Attachments
                    </CardTitle>
                  </motion.div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.9, type: "spring", stiffness: 100 }}
                  >
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.txt"
                    />
                    <label htmlFor="file-upload">
                      <motion.div
                        whileHover={{ scale: 1.08, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400 }}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer hover:shadow-lg hover:shadow-pink-500/30 transition-all duration-300"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Upload File
                      </motion.div>
                    </label>
                  </motion.div>
                  {placement.attachments && placement.attachments.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.0 }}
                      className="space-y-2"
                    >
                      {placement.attachments.map((attachment, index) => (
                        <motion.div
                          key={attachment.id}
                          initial={{ opacity: 0, x: -30, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ delay: 1.1 + (index * 0.1), type: "spring", stiffness: 100 }}
                          whileHover={{ x: 5, scale: 1.02 }}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-accent transition-colors transition-all"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <motion.div
                              animate={{ rotate: [0, 5, -5, 0] }}
                              transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 + index * 0.3 }}
                            >
                              <FileText className="h-4 w-4 text-muted-foreground" />
                            </motion.div>
                            <span className="text-sm font-medium">{attachment.name}</span>
                            <span className="text-xs text-muted-foreground">({attachment.type})</span>
                          </div>
                          <div className="flex gap-2">
                            <motion.div whileHover={{ scale: 1.15, rotate: 5 }} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(attachment.url, "_blank")}
                                className="hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.15, rotate: -5 }} whileTap={{ scale: 0.9 }} transition={{ type: "spring", stiffness: 400 }}>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAttachment(attachment.id)}
                                className="hover:bg-red-500/10 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </motion.div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.p
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.0, type: "spring", stiffness: 100 }}
                      className="text-muted-foreground text-sm"
                    >
                      No attachments yet. Upload resume, cover letter, or other documents.
                    </motion.p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>

          {/* Application History Card */}
          {placement.applicationHistory && placement.applicationHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 50, rotateX: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              transition={{ delay: 0.8, duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
              style={{ perspective: 2000 }}
            >
              <motion.div
                whileHover={{ 
                  scale: 1.02, 
                  rotateY: 3, 
                  rotateX: -2,
                  boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.25)"
                }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="relative"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-indigo-500/20 rounded-lg blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  animate={{ opacity: [0.2, 0.4, 0.2] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <Card className="border-2 border-indigo-500/30 shadow-2xl hover:shadow-indigo-500/30 transition-all duration-500 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm relative overflow-hidden">
                  <motion.div
                    className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500"
                    animate={{ 
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                      backgroundSize: ["200% 200%"]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                    style={{ backgroundSize: "200% 200%" }}
                  />
                  <CardHeader>
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
                    >
                      <CardTitle className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                        Application History
                      </CardTitle>
                    </motion.div>
                  </CardHeader>
                  <CardContent>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.0 }}
                      className="space-y-2"
                    >
                      {placement.applicationHistory.map((history, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -30, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          transition={{ delay: 1.1 + (index * 0.1), type: "spring", stiffness: 100 }}
                          whileHover={{ x: 5, scale: 1.02 }}
                          className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-accent transition-colors transition-all"
                        >
                          <motion.div
                            whileHover={{ scale: 1.15, rotate: 5 }}
                            transition={{ type: "spring", stiffness: 400 }}
                          >
                            <Badge className={getStatusColor(history.status)}>
                              {history.status.replace(/_/g, " ")}
                            </Badge>
                          </motion.div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(history.changedAt).toLocaleString()}
                          </span>
                          {history.note && (
                            <span className="text-sm">{history.note}</span>
                          )}
                        </motion.div>
                      ))}
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
