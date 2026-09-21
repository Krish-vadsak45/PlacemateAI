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
    case "NEW": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-700"
    case "INTERESTED": return "bg-red-200 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-300 dark:border-red-700"
    case "APPLIED": return "bg-red-300 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-400 dark:border-red-700"
    case "ASSESSMENT_SCHEDULED": return "bg-red-400 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-500 dark:border-red-700"
    case "INTERVIEW_SCHEDULED": return "bg-red-500 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-600 dark:border-red-700"
    case "SELECTED": return "bg-red-600 text-red-800 dark:bg-red-900/30 dark:text-red-300 border border-red-700 dark:border-red-700"
    case "REJECTED": return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
    case "NOT_INTERESTED": return "bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-500"
    case "EXPIRED": return "bg-gray-300 text-gray-800 dark:bg-gray-500 dark:text-gray-300 border border-gray-400 dark:border-gray-400"
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
