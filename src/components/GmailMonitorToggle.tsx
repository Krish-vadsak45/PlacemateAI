"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Mail, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function GmailMonitorToggle() {
  const { data: session } = useSession()
  const [watchEnabled, setWatchEnabled] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isToggling, setIsToggling] = useState(false)
  const [hasAccessToken, setHasAccessToken] = useState(false)
  const [hasPlacementCellEmail, setHasPlacementCellEmail] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [session])

  const fetchStatus = async () => {
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
  }

  const toggleWatch = async (enabled: boolean) => {
    if (!hasAccessToken) {
      toast.error("Gmail not connected", {
        description: "Please sign in again to grant Gmail permissions",
        action: {
          label: "Sign In",
          onClick: () => window.location.href = "/auth/signin?callbackUrl=/dashboard",
        },
      })
      return
    }

    if (!hasPlacementCellEmail) {
      toast.error("Placement cell email not set", {
        description: "Please complete your profile with placement cell email",
        action: {
          label: "Go to Profile",
          onClick: () => window.location.href = "/profile",
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
          description: enabled ? "Real-time email monitoring is now active" : "Email monitoring has been disabled",
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
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Gmail Monitoring
        </CardTitle>
        <CardDescription>
          Automatically detect placement emails from your placement cell
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {watchEnabled ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {watchEnabled ? "Monitoring Active" : "Monitoring Disabled"}
              </span>
            </div>
            {!hasAccessToken && (
              <p className="text-xs text-destructive">Gmail not connected</p>
            )}
            {!hasPlacementCellEmail && (
              <p className="text-xs text-destructive">Placement cell email not set</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!hasAccessToken && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.location.href = "/auth/signin?callbackUrl=/dashboard"}
              >
                Connect Gmail
              </Button>
            )}
            <Switch
              checked={watchEnabled}
              onCheckedChange={toggleWatch}
              disabled={isToggling || !hasAccessToken || !hasPlacementCellEmail}
            />
          </div>
        </div>
        {isToggling && (
          <div className="mt-4 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              {watchEnabled ? "Disabling..." : "Enabling..."}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
