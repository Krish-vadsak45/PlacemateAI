"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Keyboard, Command, Sparkles, Navigation, Search, Plus, Palette } from "lucide-react"

interface KeyboardShortcutsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ShortcutItem {
  keys: string[]
  description: string
  category: "navigation" | "actions" | "global"
}

const SHORTCUTS: ShortcutItem[] = [
  // Navigation
  { keys: ["D"], description: "Go to Dashboard", category: "navigation" },
  { keys: ["P"], description: "Go to Profile Settings", category: "navigation" },
  { keys: ["A"], description: "Go to Analytics & Insights", category: "navigation" },
  { keys: ["C"], description: "Go to Drive Comparison", category: "navigation" },
  { keys: ["H"], description: "Go to Home / Landing Page", category: "navigation" },

  // Actions
  { keys: ["⌘", "K"], description: "Focus Search / Filter", category: "actions" },
  { keys: ["⌘", "N"], description: "Add Manual Placement Drive", category: "actions" },
  { keys: ["T"], description: "Open Theme & Accent Customizer", category: "actions" },

  // Global
  { keys: ["?"], description: "Toggle Shortcuts Help", category: "global" },
  { keys: ["Esc"], description: "Close Modals / Overlays", category: "global" },
]

export default function KeyboardShortcutsModal({
  open,
  onOpenChange,
}: KeyboardShortcutsModalProps) {
  const renderKbd = (keys: string[]) => (
    <div className="flex items-center gap-1">
      {keys.map((key, i) => (
        <React.Fragment key={i}>
          <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-lg border border-border bg-muted/80 px-1.5 font-mono text-[11px] font-bold text-foreground shadow-sm">
            {key}
          </kbd>
          {i < keys.length - 1 && <span className="text-[10px] text-muted-foreground">+</span>}
        </React.Fragment>
      ))}
    </div>
  )

  const navShortcuts = SHORTCUTS.filter((s) => s.category === "navigation")
  const actionShortcuts = SHORTCUTS.filter((s) => s.category === "actions")
  const globalShortcuts = SHORTCUTS.filter((s) => s.category === "global")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 max-w-xl glass-3d-card p-6 border border-border/80 shadow-2xl">
        <DialogHeader className="pb-4 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Keyboard className="h-4.5 w-4.5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground font-heading">
                Keyboard Shortcuts
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Boost your placement productivity with quick keyboard commands
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2 max-h-[65vh] overflow-y-auto pr-1 custom-scrollbar">
          {/* Section 1: Navigation */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Navigation className="h-3.5 w-3.5 text-blue-500" />
              <span>Quick Navigation</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {navShortcuts.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30 text-xs"
                >
                  <span className="text-foreground font-medium">{item.description}</span>
                  {renderKbd(item.keys)}
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Actions */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Quick Actions</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {actionShortcuts.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30 text-xs"
                >
                  <span className="text-foreground font-medium">{item.description}</span>
                  {renderKbd(item.keys)}
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Global */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Command className="h-3.5 w-3.5 text-emerald-500" />
              <span>System &amp; Help</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {globalShortcuts.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/30 text-xs"
                >
                  <span className="text-foreground font-medium">{item.description}</span>
                  {renderKbd(item.keys)}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/70 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Press <kbd className="font-mono font-semibold px-1 rounded bg-muted">Esc</kbd> to close</span>
          <span className="font-semibold text-foreground">PlaceMate AI Shortcuts</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
