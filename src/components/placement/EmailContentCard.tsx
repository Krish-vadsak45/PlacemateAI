import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, X, Copy, Check, ChevronDown, ChevronUp, Calendar, User } from "lucide-react"
import { Placement } from "@/types/placement"
import { useState } from "react"

interface EmailContentCardProps {
  placement: Placement
  showEmail: boolean
  onToggleEmail: () => void
}

export function EmailContentCard({ placement, showEmail, onToggleEmail }: EmailContentCardProps) {
  const [copied, setCopied] = useState(false)
  
  if (!placement.emailSubject || !placement.emailBody) return null

  const stripHtml = (html: string): string => {
    return html.replace(/<[^>]*>/g, '')
  }

  const cleanEmailBody = stripHtml(placement.emailBody)
    // Remove all asterisks (used for markdown bolding in emails)
    .replace(/\*/g, '')

  const handleCopyEmail = async () => {
    const emailText = `Subject: ${placement.emailSubject}\nFrom: ${placement.emailFrom}\nDate: ${placement.emailDate ? new Date(placement.emailDate).toLocaleString() : 'N/A'}\n\n${cleanEmailBody}`
    
    try {
      await navigator.clipboard.writeText(emailText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy email:', error)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: -15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ delay: 0.7, duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
      style={{ perspective: 2000 }}
      whileHover={{ rotateY: 8, rotateX: 5, scale: 1.02, boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.25)" }}
      className="mb-6"
    >
      <Card className="bg-white dark:bg-gray-800 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-2xl shadow-red-500/20 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <motion.div
                animate={{ rotate: showEmail ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <Mail className="h-5 w-5 text-red-600 dark:text-red-400" />
              </motion.div>
              <CardTitle className="text-red-600 dark:text-red-400 text-lg">
                Email Content
              </CardTitle>
            </motion.div>
            <div className="flex items-center gap-2">
              {showEmail && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyEmail}
                    className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </motion.div>
              )}
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onToggleEmail}
                  className="border-red-500/50 hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300"
                >
                  {showEmail ? (
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4" />
                      <span className="hidden sm:inline">Close</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="hidden sm:inline">View</span>
                    </div>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </CardHeader>
        
        <AnimatePresence>
          {showEmail && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <CardContent className="pt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-6"
                >
                  {/* Email Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/30 dark:to-gray-800/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <User className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">From</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                          {placement.emailFrom}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Calendar className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Date</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {formatDate(placement.emailDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="border-l-4 border-red-500 pl-4">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Subject</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
                      {placement.emailSubject}
                    </p>
                  </div>

                  {/* Email Body */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Message Body</p>
                      <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600" />
                      </div>
                    </div>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-blue-500/5 rounded-lg" />
                      <div className="relative bg-white dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">
                            {cleanEmailBody}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Action Buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-end gap-2 pt-2"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyEmail}
                      className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Email
                        </>
                      )}
                    </Button>
                  </motion.div>
                </motion.div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  )
}
