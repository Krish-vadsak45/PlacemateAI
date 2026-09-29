import { Clock } from "lucide-react"
import { Placement } from "@/types/placement"
import { getStatusColor } from "./StatusBadge"

interface ApplicationHistoryCardProps {
  placement: Placement
}

export function ApplicationHistoryCard({ placement }: ApplicationHistoryCardProps) {
  if (!placement.applicationHistory || placement.applicationHistory.length === 0) {
    return null
  }

  return (
    <div className="glass-panel rounded-3xl p-6 border border-border/80 shadow-md space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
        <div className="h-8 w-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Clock className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Status Timeline</h3>
          <p className="text-[11px] text-muted-foreground">Progression through recruitment stages</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {placement.applicationHistory.map((history, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3.5 bg-muted/40 rounded-2xl border border-border/60"
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusColor(history.status)}`}>
                  {history.status.replace(/_/g, " ")}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(history.changedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              {history.note && (
                <p className="text-xs text-foreground/80 leading-relaxed pt-1">{history.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
