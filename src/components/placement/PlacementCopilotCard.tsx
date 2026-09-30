"use client"

import React, { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Placement } from "@/types/placement"
import { 
  Sparkles, 
  Send, 
  Bot, 
  User as UserIcon, 
  CheckCircle2, 
  ArrowRight, 
  Trash2, 
  AlertCircle, 
  RotateCw,
  Clock,
  ExternalLink,
  ClipboardPaste
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface ProposedChange {
  field: string
  label: string
  oldValue: any
  newValue: any
  applied: boolean
}

interface ChatMessage {
  _id: string
  role: "user" | "assistant"
  content: string
  isUpdateAnnouncement?: boolean
  summary?: string
  proposedChanges?: ProposedChange[]
  createdAt: string
}

interface PlacementCopilotCardProps {
  placement: Placement
  onPlacementUpdated?: (updatedPlacement: Placement) => void
}

export function PlacementCopilotCard({
  placement,
  onPlacementUpdated
}: PlacementCopilotCardProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingHistory, setIsFetchingHistory] = useState(true)
  const [applyingMessageId, setApplyingMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch chat history for this specific placement
  useEffect(() => {
    let isMounted = true

    async function loadChatHistory() {
      try {
        setIsFetchingHistory(true)
        const res = await fetch(`/api/placements/${placement._id}/chat`)
        if (res.ok) {
          const data = await res.json()
          if (isMounted) {
            setMessages(data.messages || [])
          }
        }
      } catch (err) {
        console.error("Failed to load chat history:", err)
      } finally {
        if (isMounted) {
          setIsFetchingHistory(false)
        }
      }
    }

    loadChatHistory()

    return () => {
      isMounted = false
    }
  }, [placement._id])

  // Scroll to bottom on messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputValue).trim()
    if (!text || isLoading) return

    setInputValue("")
    setIsLoading(true)

    // Optimistically add user message to list
    const tempUserMsg: ChatMessage = {
      _id: `temp-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString()
    }
    setMessages(prev => [...prev, tempUserMsg])

    try {
      const response = await fetch(`/api/placements/${placement._id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to process message")
      }

      const data = await response.json()

      // Replace temp message with persisted message and append assistant message
      setMessages(prev => [
        ...prev.filter(m => m._id !== tempUserMsg._id),
        data.userMessage,
        data.assistantMessage
      ])

      if (data.assistantMessage?.isUpdateAnnouncement) {
        toast.info("Announcement analyzed! Review proposed updates below.")
      }
    } catch (err: any) {
      console.error("Error sending message to Copilot:", err)
      toast.error(err.message || "Something went wrong while contacting the Copilot")
      // Remove temp message if failed
      setMessages(prev => prev.filter(m => m._id !== tempUserMsg._id))
    } finally {
      setIsLoading(false)
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
      }
    }
  }

  const handleApplyChanges = async (messageId: string) => {
    try {
      setApplyingMessageId(messageId)
      const res = await fetch(`/api/placements/${placement._id}/chat/apply-changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId })
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to apply changes")
      }

      const data = await res.json()

      // Update message state locally so UI shows applied
      setMessages(prev =>
        prev.map(m => (m._id === messageId ? data.message : m))
      )

      if (data.updatedPlacement && onPlacementUpdated) {
        onPlacementUpdated(data.updatedPlacement)
      }

      toast.success(
        `Applied updates: ${data.appliedFields?.join(", ") || "Changes updated"}`
      )
    } catch (err: any) {
      console.error("Error applying changes:", err)
      toast.error(err.message || "Failed to apply updates")
    } finally {
      setApplyingMessageId(null)
    }
  }

  const handleClearChat = async () => {
    if (!confirm("Are you sure you want to clear the Copilot chat history for this placement?")) {
      return
    }

    try {
      const res = await fetch(`/api/placements/${placement._id}/chat`, {
        method: "DELETE"
      })
      if (res.ok) {
        setMessages([])
        toast.success("Chat history cleared for this placement")
      } else {
        toast.error("Failed to clear chat history")
      }
    } catch (err) {
      console.error("Error clearing chat:", err)
      toast.error("Failed to clear chat history")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatValue = (val: any) => {
    if (val === null || val === undefined || val === "") return <span className="italic text-muted-foreground/60">None</span>
    if (typeof val === "string" && !isNaN(Date.parse(val)) && (val.includes("T") || val.includes("-"))) {
      const d = new Date(val)
      if (!isNaN(d.getTime())) {
        return d.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit"
        })
      }
    }
    return String(val)
  }

  return (
    <div className="glass-panel rounded-2xl border border-border shadow-sm flex flex-col h-[580px] overflow-hidden bg-card/60 backdrop-blur-sm">
      {/* HEADER */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-sm text-foreground">
                Drive Copilot
              </h3>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Isolated context for {placement.companyName}
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearChat}
            className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-lg"
            title="Clear conversation history for this placement"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* MESSAGES FEED */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs sm:text-sm">
        {isFetchingHistory ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
            <RotateCw className="h-5 w-5 animate-spin text-primary" />
            <span className="text-xs">Loading {placement.companyName} chat history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Bot className="h-6 w-6" />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="font-medium text-foreground text-sm">
                Paste any update about {placement.companyName}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Received a WhatsApp announcement, schedule change, or test link from your TPO? Paste it here to detect changes and auto-update this record.
              </p>
            </div>

            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1.5 justify-center pt-2">
              <button
                onClick={() =>
                  handleSendMessage(
                    `What is the current timeline and status for ${placement.companyName}?`
                  )
                }
                className="text-[11px] bg-muted hover:bg-muted/80 text-foreground px-2.5 py-1.5 rounded-lg border border-border/80 transition-colors flex items-center gap-1"
              >
                <Clock className="h-3 w-3 text-muted-foreground" />
                Current Timeline
              </button>
              <button
                onClick={() =>
                  handleSendMessage(
                    `Give me a 3-point preparation tip for ${placement.jobRole} at ${placement.companyName}.`
                  )
                }
                className="text-[11px] bg-muted hover:bg-muted/80 text-foreground px-2.5 py-1.5 rounded-lg border border-border/80 transition-colors flex items-center gap-1"
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                Prep Tips
              </button>
            </div>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg._id}
              className={`flex gap-3 ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {msg.role === "assistant" && (
                <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] space-y-2.5 ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                {/* Bubble Text */}
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 rounded-br-none"
                      : "bg-muted/70 text-foreground border border-border rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Summary Card if present */}
                {msg.summary && (
                  <div className="bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-xl p-3 text-foreground text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-400">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>Executive Update Summary</span>
                    </div>
                    <div className="whitespace-pre-wrap text-muted-foreground leading-normal pl-5">
                      {msg.summary}
                    </div>
                  </div>
                )}

                {/* Proposed Changes Diff Table */}
                {msg.proposedChanges && msg.proposedChanges.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-3 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        Detected Changes
                      </span>
                      {msg.proposedChanges.every(c => c.applied) && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="h-3 w-3" />
                          Applied to Placement
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 divide-y divide-border/60">
                      {msg.proposedChanges.map((change, idx) => (
                        <div
                          key={idx}
                          className="pt-1.5 first:pt-0 flex flex-col gap-1 text-[11px]"
                        >
                          <span className="font-medium text-foreground">
                            {change.label}
                          </span>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="line-through opacity-75">
                              {formatValue(change.oldValue)}
                            </span>
                            <ArrowRight className="h-3 w-3 text-primary shrink-0" />
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                              {formatValue(change.newValue)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Apply Button */}
                    {!msg.proposedChanges.every(c => c.applied) && (
                      <Button
                        size="sm"
                        onClick={() => handleApplyChanges(msg._id)}
                        disabled={applyingMessageId === msg._id}
                        className="w-full h-8 text-xs font-medium gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {applyingMessageId === msg._id ? (
                          <>
                            <RotateCw className="h-3.5 w-3.5 animate-spin" />
                            Updating Placement...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Apply Changes to Placement
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                )}

                <span className="text-[10px] text-muted-foreground/60 block px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>

              {msg.role === "user" && (
                <div className="h-7 w-7 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-foreground flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white flex items-center justify-center shrink-0">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="bg-muted/70 text-muted-foreground rounded-2xl px-4 py-2.5 text-xs flex items-center gap-2 border border-border">
              <RotateCw className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Analyzing update against {placement.companyName} data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-3 border-t border-border bg-card/80 shrink-0 space-y-2">
        <div className="relative flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={2}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Paste a WhatsApp notice, schedule update, or ask a question about ${placement.companyName}...`}
            className="w-full resize-none bg-muted/50 text-foreground placeholder:text-muted-foreground/70 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary border border-border min-h-[44px] max-h-[110px]"
          />

          <Button
            size="icon"
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim() || isLoading}
            className="h-10 w-10 shrink-0 rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/60 text-center">
          Press <kbd className="px-1 py-0.5 bg-muted rounded border border-border text-[9px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-muted rounded border border-border text-[9px]">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  )
}
export default PlacementCopilotCard
