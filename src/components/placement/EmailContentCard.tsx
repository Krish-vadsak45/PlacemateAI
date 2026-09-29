import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Copy, Check, ChevronDown, ChevronUp } from "lucide-react"
import { Placement } from "@/types/placement"
import { useState } from "react"

interface EmailContentCardProps {
  placement: Placement
  showEmail: boolean
  onToggleEmail: () => void
}

export function EmailContentCard({ placement, showEmail, onToggleEmail }: EmailContentCardProps) {
  const [copied, setCopied] = useState(false)
  
  if (!placement.emailSubject && !placement.emailBody) return null

  const stripHtml = (html: string): string => {
    return html.replace(/<[^>]*>/g, '')
  }

  const cleanEmailBody = placement.emailBody 
    ? stripHtml(placement.emailBody).replace(/\*/g, '')
    : ""

  const handleCopyEmail = async () => {
    const emailText = `Subject: ${placement.emailSubject}\nFrom: ${placement.emailFrom}\nDate: ${placement.emailDate ? new Date(placement.emailDate).toLocaleString() : 'N/A'}\n\n${cleanEmailBody}`
    
    try {
      await navigator.clipboard.writeText(emailText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy email:', error)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="glass-panel rounded-3xl p-6 border border-border/80 shadow-md space-y-4">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Source Email Record</h3>
            <p className="text-[11px] text-muted-foreground">Original message received from placement cell</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showEmail && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyEmail}
              className="h-8 text-xs gap-1.5 rounded-xl border-border/80"
              title="Copy Email Text"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onToggleEmail}
            className="h-8 text-xs gap-1 rounded-xl border-border/80"
          >
            <span>{showEmail ? "Collapse" : "Read Raw Email"}</span>
            {showEmail ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* METADATA SUMMARY */}
      <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-1.5 text-xs">
        <div className="flex items-start gap-2">
          <span className="font-semibold text-muted-foreground w-14 shrink-0">Subject:</span>
          <span className="font-medium text-foreground">{placement.emailSubject || "Untitled Email"}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="font-semibold w-14 shrink-0">From:</span>
          <span className="truncate">{placement.emailFrom || "Unknown Sender"}</span>
        </div>
        {placement.emailDate && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="font-semibold w-14 shrink-0">Date:</span>
            <span>{formatDate(placement.emailDate)}</span>
          </div>
        )}
      </div>

      {/* EXPANDABLE BODY */}
      <AnimatePresence>
        {showEmail && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/60 max-h-96 overflow-y-auto font-mono text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {cleanEmailBody || "No email body text available."}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
