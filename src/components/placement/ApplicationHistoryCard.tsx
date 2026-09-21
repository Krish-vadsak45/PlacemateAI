import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
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
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: -15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ delay: 0.9, duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
      style={{ perspective: 2000 }}
      whileHover={{ rotateY: 8, rotateX: 5, scale: 1.03, boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.25)" }}
      className="mb-6"
    >
      <Card className="bg-white dark:bg-gray-800 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-2xl shadow-red-500/20">
        <CardHeader>
          <motion.div 
            className="flex items-center gap-3"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <Clock className="h-5 w-5 text-red-600 dark:text-red-400" />
            <CardTitle className="text-red-600 dark:text-red-400">
              Application History
            </CardTitle>
          </motion.div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {placement.applicationHistory.map((history, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 + (index * 0.1) }}
                whileHover={{ x: 5, scale: 1.02 }}
                className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/20 rounded-lg border border-gray-200 dark:border-gray-700 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(history.status)}`}>
                      {history.status}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {new Date(history.changedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {history.note && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">{history.note}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
