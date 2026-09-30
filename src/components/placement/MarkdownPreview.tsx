"use client"

import React from "react"

interface Props {
  content: string
  className?: string
}

export default function MarkdownPreview({ content, className = "" }: Props) {
  if (!content) return null

  const lines = content.split("\n")
  let inCodeBlock = false
  let codeBlockLines: string[] = []

  const renderInline = (text: string) => {
    // Process bold, italic, code
    const parts: React.ReactNode[] = []
    let remaining = text

    // Very simple inline parser for bold, italic, inline code
    const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g
    let match: RegExpExecArray | null
    let lastIndex = 0

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }

      const matchText = match[0]
      if (matchText.startsWith("**") && matchText.endsWith("**")) {
        parts.push(
          <strong key={match.index} className="font-semibold text-foreground">
            {matchText.slice(2, -2)}
          </strong>
        )
      } else if (matchText.startsWith("*") && matchText.endsWith("*")) {
        parts.push(
          <em key={match.index} className="italic">
            {matchText.slice(1, -1)}
          </em>
        )
      } else if (matchText.startsWith("`") && matchText.endsWith("`")) {
        parts.push(
          <code
            key={match.index}
            className="px-1.5 py-0.5 rounded bg-muted/80 text-[11px] font-mono text-primary border border-border/50"
          >
            {matchText.slice(1, -1)}
          </code>
        )
      }
      lastIndex = match.index + matchText.length
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts.length > 0 ? parts : text
  }

  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith("```")) {
      if (inCodeBlock) {
        elements.push(
          <pre
            key={`code-${i}`}
            className="p-3 my-2 rounded-xl bg-zinc-950 text-zinc-100 text-xs font-mono overflow-x-auto border border-zinc-800"
          >
            <code>{codeBlockLines.join("\n")}</code>
          </pre>
        )
        codeBlockLines = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeBlockLines.push(line)
      continue
    }

    const trimmed = line.trim()

    if (!trimmed) {
      elements.push(<div key={`spacer-${i}`} className="h-2" />)
      continue
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={i} className="text-xs font-bold text-foreground mt-3 mb-1 uppercase tracking-wider text-teal-600 dark:text-teal-400">
          {renderInline(trimmed.substring(4))}
        </h4>
      )
    } else if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-foreground mt-3 mb-1">
          {renderInline(trimmed.substring(3))}
        </h3>
      )
    } else if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-foreground mt-4 mb-2">
          {renderInline(trimmed.substring(2))}
        </h2>
      )
    } else if (trimmed.startsWith("- [ ] ") || trimmed.startsWith("- [x] ") || trimmed.startsWith("- [X] ")) {
      const isChecked = trimmed.startsWith("- [x] ") || trimmed.startsWith("- [X] ")
      const text = trimmed.substring(6)
      elements.push(
        <div key={i} className="flex items-start gap-2 my-1 text-xs">
          <input
            type="checkbox"
            checked={isChecked}
            readOnly
            className="mt-0.5 rounded border-border text-teal-600 focus:ring-teal-500 h-3.5 w-3.5"
          />
          <span className={isChecked ? "line-through text-muted-foreground" : "text-foreground"}>
            {renderInline(text)}
          </span>
        </div>
      )
    } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <div key={i} className="flex items-start gap-2 my-0.5 text-xs text-foreground ml-2">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
          <span>{renderInline(trimmed.substring(2))}</span>
        </div>
      )
    } else if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote
          key={i}
          className="border-l-2 border-teal-500/60 pl-3 py-1 my-1.5 text-xs italic text-muted-foreground bg-teal-500/5 rounded-r-lg"
        >
          {renderInline(trimmed.substring(2))}
        </blockquote>
      )
    } else if (trimmed === "---") {
      elements.push(<hr key={i} className="my-2 border-border/60" />)
    } else {
      elements.push(
        <p key={i} className="text-xs text-foreground leading-relaxed my-0.5">
          {renderInline(trimmed)}
        </p>
      )
    }
  }

  return <div className={`space-y-0.5 ${className}`}>{elements}</div>
}
