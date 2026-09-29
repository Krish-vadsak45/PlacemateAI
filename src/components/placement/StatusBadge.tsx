import { Badge } from "@/components/ui/badge"
import { ChevronDown } from "lucide-react"

interface StatusBadgeProps {
  status: string
  onStatusChange?: (newStatus: string) => void
  editable?: boolean
}

const statusOptions = [
  "NEW", "INTERESTED", "APPLIED", "ASSESSMENT_SCHEDULED", 
  "INTERVIEW_SCHEDULED", "SELECTED", "REJECTED", "NOT_INTERESTED", "EXPIRED"
]

export const getStatusColor = (status: string) => {
  switch (status) {
    case "NEW": 
      return "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25"
    case "INTERESTED": 
      return "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25"
    case "APPLIED": 
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25"
    case "ASSESSMENT_SCHEDULED": 
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
    case "INTERVIEW_SCHEDULED": 
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25"
    case "SELECTED": 
      return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 font-bold"
    case "REJECTED": 
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
    case "NOT_INTERESTED": 
      return "bg-muted text-muted-foreground border-border"
    case "EXPIRED": 
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25"
    default: 
      return "bg-muted text-muted-foreground border-border"
  }
}

export function StatusBadge({ status, onStatusChange, editable = false }: StatusBadgeProps) {
  if (editable && onStatusChange) {
    return (
      <div className="relative inline-flex items-center">
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className={`appearance-none pl-3 pr-7 py-1 rounded-full text-xs font-semibold border cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary/40 ${getStatusColor(status)}`}
        >
          {statusOptions.map(option => (
            <option key={option} value={option} className="bg-popover text-popover-foreground">
              {option.replace(/_/g, " ")}
            </option>
          ))}
        </select>
        <ChevronDown className="h-3 w-3 absolute right-2 pointer-events-none opacity-60" />
      </div>
    )
  }

  return (
    <Badge className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusColor(status)}`}>
      {status.replace(/_/g, " ")}
    </Badge>
  )
}
