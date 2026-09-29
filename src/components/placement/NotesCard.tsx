import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Clock, StickyNote } from "lucide-react"
import { Placement } from "@/types/placement"
import { useState } from "react"

interface NotesCardProps {
  placement: Placement
  newNote: string
  onNoteChange: (note: string) => void
  onAddNote: () => void
  onDeleteNote: (noteId: string) => void
}

export function NotesCard({ placement, newNote, onNoteChange, onAddNote, onDeleteNote }: NotesCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const notesCount = placement.notes?.length || 0

  return (
    <div className="glass-panel rounded-3xl p-6 border border-border/80 shadow-md space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <StickyNote className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Personal Notes &amp; Preparation</h3>
            <p className="text-[11px] text-muted-foreground">
              {notesCount} {notesCount === 1 ? 'note' : 'notes'} recorded
            </p>
          </div>
        </div>

        {notesCount > 2 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs h-7 text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? 'Show less' : 'View all'}
          </Button>
        )}
      </div>

      {/* ADD NOTE INPUT */}
      <div className="space-y-2">
        <div className="relative">
          <Textarea
            placeholder="Record interview rounds, questions asked, or referral contacts..."
            value={newNote}
            onChange={(e) => onNoteChange(e.target.value)}
            className="rounded-2xl text-xs bg-muted/30 border-border/70 focus:border-teal-500/50 resize-none min-h-[85px] pb-10"
            rows={3}
          />
          <div className="absolute bottom-2.5 right-2.5">
            <Button
              onClick={onAddNote}
              disabled={!newNote.trim()}
              size="sm"
              className="h-7 text-xs font-semibold px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Note
            </Button>
          </div>
        </div>
      </div>

      {/* NOTES LIST */}
      <div className="space-y-2.5 pt-1">
        {placement.notes && placement.notes.length > 0 ? (
          (isExpanded ? placement.notes : placement.notes.slice(0, 3)).map((note) => (
            <div
              key={note.id}
              className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 hover:border-teal-500/30 transition-colors group flex items-start justify-between gap-3"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap break-words">
                  {note.content}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(note.createdAt)}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteNote(note.id)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete note"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No notes yet. Add your prep checklist or round updates above.
          </div>
        )}
      </div>
    </div>
  )
}
