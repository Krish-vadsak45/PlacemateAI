"use client"

import React, { useState } from "react"
import TagBadge from "./TagBadge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Tag as TagIcon, Check } from "lucide-react"
import { toast } from "sonner"

interface Props {
  placementId: string
  tags: string[]
  onTagsChange: (tags: string[]) => void
  readOnly?: boolean
}

const COMMON_TAG_SUGGESTIONS = [
  "Dream Company",
  "Tier 1",
  "Backup",
  "Referral",
  "High CTC",
  "Remote",
  "Product Based",
]

export default function TagManager({
  placementId,
  tags = [],
  onTagsChange,
  readOnly = false,
}: Props) {
  const [isAdding, setIsAdding] = useState(false)
  const [newTagInput, setNewTagInput] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleAddTag = async (tagToAdd: string) => {
    const clean = tagToAdd.trim()
    if (!clean) return

    if (tags.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      toast.info(`Tag "${clean}" already added`)
      setNewTagInput("")
      return
    }

    const updated = [...tags, clean]
    setIsSaving(true)
    try {
      const res = await fetch(`/api/placements/${placementId}/tags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addTag: clean }),
      })

      if (res.ok) {
        onTagsChange(updated)
        setNewTagInput("")
        toast.success(`Tag #${clean} added`)
      } else {
        toast.error("Failed to add tag")
      }
    } catch (err) {
      console.error("Error adding tag:", err)
      toast.error("Failed to add tag")
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveTag = async (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove)
    setIsSaving(true)
    try {
      const res = await fetch(`/api/placements/${placementId}/tags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeTag: tagToRemove }),
      })

      if (res.ok) {
        onTagsChange(updated)
        toast.success(`Tag #${tagToRemove} removed`)
      } else {
        toast.error("Failed to remove tag")
      }
    } catch (err) {
      console.error("Error removing tag:", err)
      toast.error("Failed to remove tag")
    } finally {
      setIsSaving(false)
    }
  }

  const unselectedSuggestions = COMMON_TAG_SUGGESTIONS.filter(
    (s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase())
  )

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {tags.map((tag) => (
          <TagBadge
            key={tag}
            tag={tag}
            onRemove={readOnly ? undefined : () => handleRemoveTag(tag)}
          />
        ))}

        {!readOnly && !isAdding && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            className="h-7 text-[11px] gap-1 px-2.5 rounded-lg border-dashed border-border bg-transparent text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            <span>Add Tag</span>
          </Button>
        )}
      </div>

      {!readOnly && isAdding && (
        <div className="p-3 rounded-2xl bg-card border border-border shadow-md space-y-2.5 animate-in fade-in-50 duration-150">
          <div className="flex items-center gap-2">
            <Input
              placeholder="e.g. Dream Company, Referral..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddTag(newTagInput)
                } else if (e.key === "Escape") {
                  setIsAdding(false)
                }
              }}
              autoFocus
              className="h-8 text-xs rounded-xl bg-background"
            />
            <Button
              type="button"
              size="sm"
              disabled={!newTagInput.trim() || isSaving}
              onClick={() => handleAddTag(newTagInput)}
              className="h-8 text-xs rounded-xl px-3"
            >
              Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAdding(false)}
              className="h-8 text-xs rounded-xl px-2 text-muted-foreground"
            >
              Cancel
            </Button>
          </div>

          {unselectedSuggestions.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/50 text-[11px] text-muted-foreground">
              <span>Suggestions:</span>
              {unselectedSuggestions.slice(0, 4).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAddTag(s)}
                  className="px-2 py-0.5 rounded-md bg-secondary/80 hover:bg-secondary text-foreground transition-colors font-medium cursor-pointer"
                >
                  +{s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
