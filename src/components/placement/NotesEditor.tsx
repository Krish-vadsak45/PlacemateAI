"use client"

import React, { useState, useMemo, useRef } from "react"
import { PlacementNote } from "@/types/placement"
import MarkdownPreview from "./MarkdownPreview"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Bold,
  Italic,
  Heading,
  List,
  CheckSquare,
  Code,
  Quote,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Clock,
  Search,
  Eye,
  PenLine,
  History,
  Check,
  X,
  FileText,
  StickyNote,
} from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Props {
  placementId: string
  notes: PlacementNote[]
  onNotesChange: (notes: PlacementNote[]) => void
}

const NOTE_TEMPLATES = [
  {
    id: "interview_prep",
    title: "🎯 Interview Prep Template",
    templateType: "interview_prep",
    snippet: `### Round Format & Focus
- Round: [Technical / Coding / System Design / HR]
- Duration: 45-60 mins
- Key Topics: Data Structures, Algorithms, Core CS

### Key Concepts to Review
- [ ] Time & Space Complexity Trade-offs
- [ ] Problem Solving on Arrays / Trees / Graphs
- [ ] Project Architecture & Database Design

### Questions to Ask the Interviewer
- What does the typical engineering workflow look like?
- Which technologies and libraries does the team use daily?`,
  },
  {
    id: "company_research",
    title: "🏢 Company Research Template",
    templateType: "company_research",
    snippet: `### Company Background
- Products & Services:
- Revenue Model & Market Position:
- Recent Engineering News / Milestones:

### Tech Stack & Architecture
- Frontend & Client:
- Backend & Cloud Infra:
- Databases & Queues:

### Core Values & Culture
- Key Principles:`,
  },
  {
    id: "questions_interviewer",
    title: "❓ Questions for Interviewer",
    templateType: "hr_questions",
    snippet: `### Engineering Practices
- How does the team handle code reviews and continuous delivery?
- How is technical debt managed alongside product features?

### Growth & Mentorship
- What does onboarding and mentorship look like for new college grads?
- What are the expectations for the first 90 days?`,
  },
  {
    id: "referral_log",
    title: "🤝 Referral & Networking Log",
    templateType: "custom",
    snippet: `### Referral Contact
- Contact Name:
- Role / Team:
- LinkedIn / Email:
- Date Connected:

### Discussion Summary
- Key advice shared:
- Referral Status: [Submitted / In Review]
- Action item / Follow-up date:`,
  },
  {
    id: "post_interview_debrief",
    title: "📝 Post-Interview Debrief",
    templateType: "follow_up",
    snippet: `### Interview Overview
- Date & Time:
- Interviewer(s):

### Questions Asked
1.
2.

### Self Assessment
- What went well:
- Areas for improvement:
- Follow-up thank you note sent: [ ] Yes`,
  },
]

export default function NotesEditor({ placementId, notes = [], onNotesChange }: Props) {
  const [isCreating, setIsCreating] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteTitle, setNoteTitle] = useState("")
  const [noteContent, setNoteContent] = useState("")
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write")
  const [searchQuery, setSearchQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [historyModalNote, setHistoryModalNote] = useState<PlacementNote | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Markdown formatting helpers
  const insertFormatting = (prefix: string, suffix: string = "", placeholder: string = "text") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = noteContent.substring(start, end) || placeholder
    const replacement = `${prefix}${selected}${suffix}`

    const updated =
      noteContent.substring(0, start) +
      replacement +
      noteContent.substring(end)

    setNoteContent(updated)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      )
    }, 10)
  }

  const handleApplyTemplate = (snippet: string, title: string) => {
    setNoteTitle(title.replace(/[🎯🏢❓🤝📝]/g, "").trim())
    setNoteContent(snippet)
    setIsCreating(true)
    setActiveTab("write")
  }

  const handleSaveNote = async () => {
    if (!noteContent.trim()) {
      toast.error("Note content cannot be empty")
      return
    }

    setIsSubmitting(true)
    try {
      if (editingNoteId) {
        // Edit existing note
        const res = await fetch(`/api/placements/${placementId}/notes/${editingNoteId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: noteTitle,
            content: noteContent,
          }),
        })

        if (!res.ok) throw new Error("Failed to update note")
        const json = await res.json()
        onNotesChange(json.notes)
        toast.success("Note updated successfully")
        setEditingNoteId(null)
      } else {
        // Create new note
        const res = await fetch(`/api/placements/${placementId}/notes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: noteTitle,
            content: noteContent,
          }),
        })

        if (!res.ok) throw new Error("Failed to add note")
        const json = await res.json()
        onNotesChange(json.notes)
        toast.success("Note created successfully")
        setIsCreating(false)
      }

      setNoteTitle("")
      setNoteContent("")
      setActiveTab("write")
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartEdit = (note: PlacementNote) => {
    setEditingNoteId(note.id)
    setNoteTitle(note.title || "")
    setNoteContent(note.content)
    setActiveTab("write")
    setIsCreating(false)
  }

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return

    try {
      const res = await fetch(`/api/placements/${placementId}/notes/${noteId}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete note")
      const json = await res.json()
      onNotesChange(json.notes)
      toast.success("Note deleted")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete note")
    }
  }

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes
    const q = searchQuery.toLowerCase()
    return notes.filter(
      (n) =>
        n.content.toLowerCase().includes(q) ||
        (n.title && n.title.toLowerCase().includes(q))
    )
  }, [notes, searchQuery])

  return (
    <div className="space-y-4">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div>
          <div className="flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <h3 className="text-sm font-bold text-foreground">
              Preparation Notes & Checklists
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {notes.length}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Rich markdown notes with checklists, interview debriefs, and version history
          </p>
        </div>

        <div className="flex items-center gap-2">
          {notes.length > 2 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 text-xs rounded-xl w-36 sm:w-48 bg-background"
              />
            </div>
          )}

          {!isCreating && !editingNoteId && (
            <Button
              size="sm"
              onClick={() => {
                setIsCreating(true)
                setNoteTitle("")
                setNoteContent("")
                setActiveTab("write")
              }}
              className="h-8 gap-1.5 text-xs rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Note</span>
            </Button>
          )}
        </div>
      </div>

      {/* QUICK TEMPLATES CAROUSEL / STRIP */}
      {!isCreating && !editingNoteId && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>Quick Start with Placement Templates:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {NOTE_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleApplyTemplate(tmpl.snippet, tmpl.title)}
                className="shrink-0 text-xs px-2.5 py-1.5 rounded-xl border border-border/80 bg-card hover:bg-secondary/80 transition-all font-medium text-foreground flex items-center gap-1.5 shadow-2xs"
              >
                <span>{tmpl.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CREATE / EDIT NOTE FORM */}
      {(isCreating || editingNoteId) && (
        <div className="glass-panel p-4 rounded-2xl border border-teal-500/30 bg-card space-y-3 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">
              {editingNoteId ? "Edit Note" : "Create New Note"}
            </span>

            {/* Tab switch: Write vs Preview */}
            <div className="flex items-center bg-secondary p-0.5 rounded-lg border border-border/60">
              <button
                type="button"
                onClick={() => setActiveTab("write")}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                  activeTab === "write"
                    ? "bg-card text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <PenLine className="h-3 w-3" />
                Write
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-all ${
                  activeTab === "preview"
                    ? "bg-card text-foreground shadow-2xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Eye className="h-3 w-3" />
                Preview
              </button>
            </div>
          </div>

          <Input
            placeholder="Note title (optional, e.g. Technical Round 1 - LeetCode & DB)"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            className="h-8 text-xs rounded-xl bg-background"
          />

          {activeTab === "write" ? (
            <div className="space-y-2">
              {/* Markdown Toolbar */}
              <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-xl border border-border/60 flex-wrap">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("**", "**", "bold text")}
                  className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                  title="Bold"
                >
                  <Bold className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("*", "*", "italic text")}
                  className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                  title="Italic"
                >
                  <Italic className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("### ", "", "Heading")}
                  className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                  title="Heading"
                >
                  <Heading className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("- ", "", "List item")}
                  className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                  title="Bullet List"
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("- [ ] ", "", "Checklist task")}
                  className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                  title="Checklist Item"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("`", "`", "code")}
                  className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                  title="Inline Code"
                >
                  <Code className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => insertFormatting("> ", "", "Quote")}
                  className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                  title="Quote"
                >
                  <Quote className="h-3.5 w-3.5" />
                </Button>
              </div>

              <Textarea
                ref={textareaRef}
                placeholder="Type note in markdown... (- [ ] tasks, **bold**, ### headers)"
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                rows={7}
                className="text-xs bg-background rounded-xl resize-y font-mono focus:border-teal-500/60"
              />
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-background border border-border min-h-[160px] max-h-[300px] overflow-y-auto">
              {noteContent.trim() ? (
                <MarkdownPreview content={noteContent} />
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Nothing to preview. Switch to Write tab to add notes.
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsCreating(false)
                setEditingNoteId(null)
                setNoteTitle("")
                setNoteContent("")
              }}
              className="h-8 text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!noteContent.trim() || isSubmitting}
              onClick={handleSaveNote}
              className="h-8 text-xs rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium"
            >
              {isSubmitting ? "Saving..." : editingNoteId ? "Update Note" : "Save Note"}
            </Button>
          </div>
        </div>
      )}

      {/* NOTES LIST */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border/80 space-y-2">
            <div className="p-2.5 rounded-xl bg-secondary/80 text-muted-foreground inline-flex">
              <FileText className="h-5 w-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">
              {searchQuery ? "No notes matched your search query" : "No notes yet for this placement"}
            </p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Use notes to log interview questions, technical concepts to revise, and referral details.
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const hasHistory = note.history && note.history.length > 0
            const createdFormatted = new Date(note.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })

            return (
              <div
                key={note.id}
                className="p-4 rounded-2xl bg-card border border-border/80 hover:border-teal-500/40 transition-all duration-150 space-y-2.5 group shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {note.title && (
                      <h4 className="text-xs font-bold text-foreground mb-1 truncate">
                        {note.title}
                      </h4>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {createdFormatted}
                      </span>
                      {note.updatedAt && (
                        <span>• Edited</span>
                      )}
                      {hasHistory && (
                        <button
                          type="button"
                          onClick={() => setHistoryModalNote(note)}
                          className="flex items-center gap-0.5 text-teal-600 dark:text-teal-400 font-medium hover:underline ml-1"
                        >
                          <History className="h-3 w-3" />
                          <span>{note.history?.length} revisions</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleStartEdit(note)}
                      className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                      title="Edit Note"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-rose-500"
                      title="Delete Note"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Render Note Markdown Content */}
                <div className="pt-1 border-t border-border/40">
                  <MarkdownPreview content={note.content} />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* VERSION HISTORY MODAL */}
      <Dialog open={!!historyModalNote} onOpenChange={() => setHistoryModalNote(null)}>
        <DialogContent className="sm:max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <History className="h-4 w-4 text-teal-600" />
              Note Revision History
            </DialogTitle>
          </DialogHeader>

          {historyModalNote && (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20">
                <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 block mb-1">
                  Current Version:
                </span>
                <MarkdownPreview content={historyModalNote.content} />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground block">
                  Past Revisions ({historyModalNote.history?.length || 0}):
                </span>
                {historyModalNote.history?.map((h, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-secondary/50 border border-border/80 space-y-1 text-xs"
                  >
                    <div className="text-[10px] text-muted-foreground font-medium">
                      Revision {historyModalNote.history!.length - i} •{" "}
                      {new Date(h.editedAt).toLocaleString()}
                    </div>
                    <MarkdownPreview content={h.content} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
