"use client"

import React from "react"
import { X } from "lucide-react"

interface Props {
  tag: string
  onRemove?: () => void
  onClick?: () => void
  size?: "sm" | "default"
  className?: string
}

export function getTagStyle(tag: string) {
  const lower = tag.toLowerCase().trim()
  if (lower.includes("dream")) {
    return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/20"
  }
  if (lower.includes("tier 1") || lower.includes("tier-1") || lower.includes("top tier")) {
    return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
  }
  if (lower.includes("backup")) {
    return "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30 hover:bg-zinc-500/20"
  }
  if (lower.includes("referral") || lower.includes("referred")) {
    return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
  }
  if (lower.includes("remote") || lower.includes("hybrid")) {
    return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 hover:bg-sky-500/20"
  }
  if (lower.includes("high") || lower.includes("ctc") || lower.includes("package")) {
    return "bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30 hover:bg-teal-500/20"
  }
  if (lower.includes("fintech") || lower.includes("ai") || lower.includes("product")) {
    return "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20"
  }
  return "bg-secondary text-secondary-foreground border-border hover:bg-secondary/80"
}

export default function TagBadge({
  tag,
  onRemove,
  onClick,
  size = "default",
  className = "",
}: Props) {
  const style = getTagStyle(tag)
  const isSm = size === "sm"

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1 font-medium rounded-lg border transition-all ${style} ${
        isSm ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2.5 py-1"
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      <span>#{tag}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="hover:opacity-75 p-0.5 rounded-full"
          title={`Remove #${tag}`}
        >
          <X className={isSm ? "h-2.5 w-2.5" : "h-3 w-3"} />
        </button>
      )}
    </span>
  )
}
