import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import { FileText, Plus, Trash2, Clock, StickyNote, MessageSquare } from "lucide-react"
import { Placement } from "@/types/placement"
import { useState } from "react"

interface NotesCardProps {
  placement: Placement
  newNote: string
  onNoteChange: (note: string) => void
  onAddNote: () => void
  onDeleteNote: (noteId: string) => void
}

export function NotesCard({ placement, newNote, onNoteChange, onAddNote, onDeleteNote }: NotesCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const notesCount = placement.notes?.length || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: -15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ delay: 0.6, duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
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
                animate={{ rotate: isExpanded ? 45 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
              </motion.div>
              <div>
                <CardTitle className="text-red-600 dark:text-red-400 text-lg">
                  Notes
                </CardTitle>
                {notesCount > 0 && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs text-gray-500 dark:text-gray-400"
                  >
                    {notesCount} {notesCount === 1 ? 'note' : 'notes'}
                  </motion.p>
                )}
              </div>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              >
                {isExpanded ? 'Collapse' : 'Expand'}
              </Button>
            </motion.div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {/* Add Note Section */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="relative">
                <Textarea
                  placeholder="Add a note about this placement..."
                  value={newNote}
                  onChange={(e) => onNoteChange(e.target.value)}
                  className="border-red-500/30 focus:border-red-500 focus:ring-red-500/20 min-h-[100px] bg-white/50 dark:bg-gray-700/50 resize-none transition-all"
                  rows={3}
                />
                <motion.div
                  className="absolute bottom-3 right-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: newNote.trim() ? 1 : 0 }}
                >
                  <Button
                    onClick={onAddNote}
                    disabled={!newNote.trim()}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/30 transition-all"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </motion.div>
              </div>
            </motion.div>
            
            {/* Notes List */}
            <AnimatePresence>
              {placement.notes && placement.notes.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {(isExpanded ? placement.notes : placement.notes.slice(0, 2)).map((note, index) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 5, scale: 1.01 }}
                      className="group relative"
                    >
                      <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-red-500/30 dark:hover:border-red-500/30 transition-all duration-300 hover:shadow-lg">
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="h-3 w-3 text-red-600 dark:text-red-400 flex-shrink-0" />
                              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed break-words">
                                {note.content}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>{formatDate(note.createdAt)}</span>
                            </div>
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteNote(note.id)}
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {placement.notes.length > 2 && !isExpanded && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(true)}
                        className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        View {placement.notes.length - 2} more {placement.notes.length - 2 === 1 ? 'note' : 'notes'}
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 px-6"
                >
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      scale: [1, 1.05, 1]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="mb-4"
                  >
                    <StickyNote className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    No Notes Yet
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Add notes to track your progress and thoughts about this placement
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
