"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Mail, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function GmailMonitorToggle() {
  const { data: session } = useSession()
  const [watchEnabled, setWatchEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)
  const [hasAccessToken, setHasAccessToken] = useState(false)
  const [hasPlacementCellEmail, setHasPlacementCellEmail] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/gmail/watch")
      const data = await response.json()
      setWatchEnabled(data.watchEnabled || false)
      setHasAccessToken(data.hasAccessToken || false)
      setHasPlacementCellEmail(data.hasPlacementCellEmail || false)
    } catch (error) {
      console.error("Error fetching Gmail watch status:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (session) {
      fetchStatus().catch(console.error)
    }
  }, [session, fetchStatus])
  /* eslint-enable react-hooks/set-state-in-effect */

  const toggleWatch = async (enabled: boolean) => {
    if (!hasAccessToken) {
      toast.error("Gmail not connected", {
        description: "Please sign in again to grant Gmail permissions",
        action: {
          label: "Sign In",
          onClick: () => (window.location.href = "/auth/signin?callbackUrl=/dashboard"),
        },
      })
      return
    }

    if (!hasPlacementCellEmail) {
      toast.error("Placement cell email not set", {
        description: "Please configure your placement cell sender email in profile",
        action: {
          label: "Go to Profile",
          onClick: () => (window.location.href = "/profile"),
        },
      })
      return
    }

    setIsToggling(true)
    try {
      const response = await fetch("/api/gmail/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enable: enabled }),
      })

      const data = await response.json()

      if (response.ok) {
        setWatchEnabled(enabled)
        toast.success(data.message, {
          description: enabled
            ? "Real-time email monitoring is active. Inbound notices will be processed."
            : "Email monitoring has been paused.",
        })
      } else {
        toast.error("Failed to toggle Gmail watch", {
          description: data.error || "Please try again later",
        })
      }
    } catch (error) {
      console.error("Error toggling Gmail watch:", error)
      toast.error("Failed to toggle Gmail watch", {
        description: "Please try again later",
      })
    } finally {
      setIsToggling(false)
    }
  }

  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-4 flex items-center justify-between border border-border animate-pulse">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-muted" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-32 bg-muted rounded" />
            <div className="h-2.5 w-48 bg-muted rounded" />
          </div>
        </div>
        <div className="h-6 w-11 bg-muted rounded-full" />
      </div>
    )
  }

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-border shadow-sm transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left side info */}
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border flex items-center justify-center shrink-0">
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">
                Gmail Ingestion Monitor
              </span>
              {watchEnabled ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground border border-border">
                  Paused
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              {watchEnabled
                ? "Listening for inbound placement notifications and schedules via Pub/Sub."
                : "Enable to automatically detect and parse placement cell emails as they arrive."}
            </p>

            {!hasAccessToken && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
                <AlertCircle className="h-3 w-3 text-amber-500" />
                Gmail authorization missing. Sign in again to grant access.
              </p>
            )}
            {hasAccessToken && !hasPlacementCellEmail && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
                <AlertCircle className="h-3 w-3 text-amber-500" />
                Placement cell email not set.{" "}
                <Link href="/profile" className="underline hover:text-foreground">
                  Configure in profile
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
          {!hasAccessToken ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => (window.location.href = "/auth/signin?callbackUrl=/dashboard")}
              className="text-xs h-8"
            >
              Connect Gmail
            </Button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground hidden md:inline-block">
                {watchEnabled ? "Enabled" : "Disabled"}
              </span>
              <div className="flex items-center gap-2">
                {isToggling && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <Switch
                  checked={watchEnabled}
                  onCheckedChange={toggleWatch}
                  disabled={isToggling || !hasAccessToken || !hasPlacementCellEmail}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
