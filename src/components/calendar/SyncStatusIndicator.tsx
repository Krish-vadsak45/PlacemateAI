"use client"

import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Clock } from "lucide-react"
import { format } from "date-fns"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SyncStatus {
  synced: boolean
  lastSynced?: Date | string
  error?: string
}

interface SyncStatusIndicatorProps {
  status?: SyncStatus
  onRetry?: () => void
  isRetrying?: boolean
  size?: "sm" | "md"
}

export default function SyncStatusIndicator({
  status,
  onRetry,
  isRetrying = false,
  size = "sm"
}: SyncStatusIndicatorProps) {
  if (!status) return null

  const { synced, lastSynced, error } = status

  const getIcon = () => {
    if (error) {
      return XCircle
    }
    if (synced) {
      return CheckCircle2
    }
    return AlertTriangle
  }

  const getColorClass = () => {
    if (error) {
      return "text-red-600 dark:text-red-400"
    }
    if (synced) {
      return "text-green-600 dark:text-green-400"
    }
    return "text-amber-600 dark:text-amber-400"
  }

  const getStatusText = () => {
    if (error) {
      return "Sync Error"
    }
    if (synced) {
      return "Synced"
    }
    return "Not Synced"
  }

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
  const textSize = size === "sm" ? "text-[10px]" : "text-xs"
  /* eslint-disable react-hooks/static-components */
  const Icon = getIcon()
  const colorClass = getColorClass()
  /* eslint-enable react-hooks/static-components */

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`flex items-center gap-1.5 ${colorClass} cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={error && onRetry ? onRetry : undefined}
          >
            {isRetrying ? (
              <RefreshCw className={`${iconSize} animate-spin`} />
            ) : (
              <Icon className={iconSize} />
            )}
            <span className={`${textSize} font-medium`}>{getStatusText()}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{getStatusText()}</p>
            {lastSynced && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Last synced: {format(new Date(lastSynced), "PPp")}
              </p>
            )}
            {error && (
              <>
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">{error}</p>
                {onRetry && (
                  <p className="text-xs text-muted-foreground mt-1">Click to retry</p>
                )}
              </>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
