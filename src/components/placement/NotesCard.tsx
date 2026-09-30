"use client"

import React from "react"
import { Placement, PlacementNote } from "@/types/placement"
import NotesEditor from "./NotesEditor"

interface NotesCardProps {
  placement: Placement
  onNotesChange?: (notes: PlacementNote[]) => void
}

export function NotesCard({ placement, onNotesChange }: NotesCardProps) {
  return (
    <div className="glass-panel rounded-3xl p-6 border border-border/80 shadow-md">
      <NotesEditor
        placementId={placement._id}
        notes={placement.notes || []}
        onNotesChange={onNotesChange || (() => {})}
      />
    </div>
  )
}

export default NotesCard
