"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, DollarSign, ExternalLink, Clock } from "lucide-react"
import { motion } from "framer-motion"

interface PlacementCardProps {
  companyName: string
  jobRole: string
  package?: string
  location?: string
  applicationDeadline?: Date
  status: string
  applicationLink?: string
}

export default function PlacementCard({
  companyName,
  jobRole,
  package: salary,
  location,
  applicationDeadline,
  status,
  applicationLink,
}: PlacementCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "NEW":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
      case "APPLIED":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
      case "INTERVIEW_SCHEDULED":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      case "SELECTED":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
        <CardHeader>
          <motion.div 
            className="flex justify-between items-start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <CardTitle className="text-xl">{companyName}</CardTitle>
            <motion.span 
              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            >
              {status.replace(/_/g, " ")}
            </motion.span>
          </motion.div>
          <p className="text-muted-foreground">{jobRole}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {salary && (
              <motion.div 
                className="flex items-center gap-2 text-sm text-muted-foreground"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <DollarSign className="h-4 w-4 text-primary" />
                <span>{salary}</span>
              </motion.div>
            )}
            {location && (
              <motion.div 
                className="flex items-center gap-2 text-sm text-muted-foreground"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <MapPin className="h-4 w-4 text-primary" />
                <span>{location}</span>
              </motion.div>
            )}
            {applicationDeadline && (
              <motion.div 
                className="flex items-center gap-2 text-sm text-muted-foreground"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Calendar className="h-4 w-4 text-primary" />
                <span>Deadline: {new Date(applicationDeadline).toLocaleDateString()}</span>
              </motion.div>
            )}
            <motion.div 
              className="flex gap-2 pt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              {applicationLink && (
                <motion.a 
                  href={applicationLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button size="sm" variant="outline" className="w-full gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Apply
                  </Button>
                </motion.a>
              )}
              <motion.div 
                className="flex-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button size="sm" variant="ghost" className="w-full">
                  <Clock className="h-4 w-4 mr-2" />
                  Details
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
