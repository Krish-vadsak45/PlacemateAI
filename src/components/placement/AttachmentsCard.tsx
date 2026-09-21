import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { FileText, ExternalLink, Trash2, Plus } from "lucide-react"
import { Placement } from "@/types/placement"

interface AttachmentsCardProps {
  placement: Placement
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDeleteAttachment: (attachmentId: string) => void
}

export function AttachmentsCard({ placement, onFileUpload, onDeleteAttachment }: AttachmentsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: -15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ delay: 0.8, duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
      style={{ perspective: 2000 }}
      whileHover={{ rotateY: 8, rotateX: 5, scale: 1.03, boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.25)" }}
      className="mb-6"
    >
      <Card className="bg-white dark:bg-gray-800 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-2xl shadow-red-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
              <CardTitle className="text-red-600 dark:text-red-400">
                Attachments
              </CardTitle>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <label>
                <input
                  type="file"
                  onChange={onFileUpload}
                  className="hidden"
                  multiple
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/20 cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Upload
                </Button>
              </label>
            </motion.div>
          </div>
        </CardHeader>
        <CardContent>
          {placement.attachments && placement.attachments.length > 0 ? (
            <div className="space-y-2">
              {placement.attachments.map((attachment) => (
                <motion.div
                  key={attachment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 5, scale: 1.02 }}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/20 rounded-lg border border-gray-200 dark:border-gray-700 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-4 w-4 text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium">{attachment.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(attachment.url, '_blank')}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteAttachment(attachment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-4 text-gray-600 dark:text-gray-300 text-sm"
            >
              No attachments yet. Upload your resume, cover letter, or other documents.
            </motion.p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
