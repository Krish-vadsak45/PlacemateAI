import { Badge } from "@/components/ui/badge"
import { Placement } from "@/types/placement"

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
    case "NEW": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700"
    case "INTERESTED": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700"
    case "APPLIED": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700"
    case "ASSESSMENT_SCHEDULED": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-700"
    case "INTERVIEW_SCHEDULED": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-700"
    case "SELECTED": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700"
    case "REJECTED": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-700"
    case "NOT_INTERESTED": return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
    case "EXPIRED": return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
  }
}

export function StatusBadge({ status, onStatusChange, editable = false }: StatusBadgeProps) {
  if (editable && onStatusChange) {
    return (
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className={`px-3 py-1 rounded-full text-sm font-medium border-0 cursor-pointer ${getStatusColor(status)}`}
      >
        {statusOptions.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    )
  }

  return (
    <Badge className={getStatusColor(status)}>
      {status}
    </Badge>
  )
}
