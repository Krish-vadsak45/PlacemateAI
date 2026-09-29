"use client"

import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  Info, 
  Building2, 
  Calendar, 
  DollarSign, 
  MapPin, 
  FileText 
} from "lucide-react"
import { useState } from "react"

interface AISummaryCardProps {
  aiSummary: string | null
  isLoadingSummary: boolean
  onGenerateSummary: () => void
}

export function AISummaryCard({ aiSummary, isLoadingSummary, onGenerateSummary }: AISummaryCardProps) {
  const [copied, setCopied] = useState(false)

  const getSectionIcon = (headerText: string) => {
    const text = headerText.toLowerCase()
    if (text.includes('company') || text.includes('role')) return <Building2 className="h-4 w-4 text-muted-foreground" />
    if (text.includes('date') || text.includes('deadline')) return <Calendar className="h-4 w-4 text-muted-foreground" />
    if (text.includes('package') || text.includes('compensation')) return <DollarSign className="h-4 w-4 text-muted-foreground" />
    if (text.includes('location')) return <MapPin className="h-4 w-4 text-muted-foreground" />
    if (text.includes('application') || text.includes('process')) return <FileText className="h-4 w-4 text-muted-foreground" />
    return <Info className="h-4 w-4 text-muted-foreground" />
  }

  const parseAISummary = (summary: string) => {
    const sections = summary.split('\n\n').filter(section => section.trim())
    
    return sections.map((section, index) => {
      const lines = section.split('\n').filter(line => line.trim())
      if (lines.length === 0) return null
      
      const headerLine = lines[0]
      const headerMatch = headerLine.match(/\*\*([^*]+):\*\*/)
      const hasHeader = headerMatch !== null
      
      if (hasHeader) {
        const headerText = headerMatch[1].trim()
        const headerContent = headerLine.replace(/\*\*[^*]+:\*\*/, '').trim()
        const contentLines = headerContent ? [headerContent, ...lines.slice(1)] : lines.slice(1)
        const sectionIcon = getSectionIcon(headerText)
        
        return (
          <div
            key={index}
            className="rounded-xl p-3.5 bg-muted/30 border border-border/70 space-y-1.5"
          >
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-card border border-border">
                {sectionIcon}
              </div>
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                {headerText}
              </h4>
            </div>
            
            <ul className="space-y-1 pl-1">
              {contentLines.map((line, lineIndex) => {
                const cleanLine = line.replace(/^[-•]\s*/, '').trim()
                if (!cleanLine) return null
                
                return (
                  <li
                    key={lineIndex}
                    className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed"
                  >
                    <span className="h-1 w-1 rounded-full bg-zinc-400 mt-1.5 shrink-0" />
                    <span>{cleanLine}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      }
      
      return (
        <div key={index} className="text-xs text-muted-foreground leading-relaxed p-3 bg-muted/20 rounded-xl">
          {section}
        </div>
      )
    })
  }

  const handleCopySummary = async () => {
    if (!aiSummary) return
    try {
      await navigator.clipboard.writeText(aiSummary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy summary:', error)
    }
  }

  return (
    <div className="glass-panel rounded-2xl p-6 border border-border shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-foreground flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">AI Opportunity Brief</h3>
            <p className="text-[11px] text-muted-foreground">Synthesized via Gemini &amp; Groq</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {aiSummary && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySummary}
              className="h-8 text-xs gap-1.5 rounded-xl border-border"
              title="Copy Summary Markdown"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
              <span>{copied ? "Copied" : "Copy Brief"}</span>
            </Button>
          )}
          
          <Button
            size="sm"
            variant={aiSummary ? "ghost" : "default"}
            onClick={onGenerateSummary}
            disabled={isLoadingSummary}
            className={`h-8 text-xs gap-1.5 rounded-xl ${
              !aiSummary 
                ? "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {isLoadingSummary ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>{aiSummary ? "Regenerate" : "Generate Brief"}</span>
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div>
        <AnimatePresence mode="wait">
          {aiSummary ? (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2.5"
            >
              {parseAISummary(aiSummary)}
            </motion.div>
          ) : isLoadingSummary ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-3">
              <div className="h-8 w-8 rounded-full border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent animate-spin" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-foreground">
                  Analyzing Placement Email...
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Extracting key requirements, package, and dates
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 px-4 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-muted text-muted-foreground mx-auto flex items-center justify-center">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="text-xs font-bold text-foreground">No Brief Generated</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Generate an instant concise executive brief highlighting deadlines and criteria.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={onGenerateSummary}
                className="text-xs rounded-xl gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                Generate Brief
              </Button>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
