import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Copy, Check, RefreshCw, Info, Building2, Calendar, DollarSign, MapPin, FileText } from "lucide-react"
import { useState } from "react"

interface AISummaryCardProps {
  aiSummary: string | null
  isLoadingSummary: boolean
  onGenerateSummary: () => void
}

export function AISummaryCard({ aiSummary, isLoadingSummary, onGenerateSummary }: AISummaryCardProps) {
  const [copied, setCopied] = useState(false)

  const getSectionIcon = (headerText: string) => {
    const text = headerText.toLowerCase()
    if (text.includes('company') || text.includes('role')) return <Building2 className="h-4 w-4" />
    if (text.includes('date') || text.includes('deadline')) return <Calendar className="h-4 w-4" />
    if (text.includes('package') || text.includes('compensation')) return <DollarSign className="h-4 w-4" />
    if (text.includes('location')) return <MapPin className="h-4 w-4" />
    if (text.includes('application') || text.includes('process')) return <FileText className="h-4 w-4" />
    return <Info className="h-4 w-4" />
  }

  const getSectionColor = (headerText: string) => {
    const text = headerText.toLowerCase()
    if (text.includes('company') || text.includes('role')) return 'text-red-600 dark:text-red-400'
    if (text.includes('date') || text.includes('deadline')) return 'text-blue-600 dark:text-blue-400'
    if (text.includes('package') || text.includes('compensation')) return 'text-green-600 dark:text-green-400'
    if (text.includes('location')) return 'text-purple-600 dark:text-purple-400'
    if (text.includes('application') || text.includes('process')) return 'text-orange-600 dark:text-orange-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const parseAISummary = (summary: string) => {
    const sections = summary.split('\n\n').filter(section => section.trim())
    
    return sections.map((section, index) => {
      const lines = section.split('\n').filter(line => line.trim())
      if (lines.length === 0) return null
      
      const headerLine = lines[0]
      const headerMatch = headerLine.match(/\*\*([^*]+):\*\*/)
      const hasHeader = headerMatch !== null
      
      if (hasHeader) {
        const headerText = headerMatch[1].trim()
        const headerContent = headerLine.replace(/\*\*[^*]+:\*\*/, '').trim()
        const contentLines = headerContent ? [headerContent, ...lines.slice(1)] : lines.slice(1)
        const sectionColor = getSectionColor(headerText)
        const sectionIcon = getSectionIcon(headerText)
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3 + (index * 0.1), type: "spring", stiffness: 100 }}
            whileHover={{ scale: 1.01, y: -2 }}
            className="group"
          >
            <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-purple-500/30 dark:hover:border-purple-500/30 transition-all duration-300 hover:shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <motion.div
                  whileHover={{ rotate: 15, scale: 1.1 }}
                  className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm`}
                >
                  {sectionIcon}
                </motion.div>
                <h3 className={`font-semibold ${sectionColor} text-sm uppercase tracking-wider`}>
                  {headerText}
                </h3>
              </div>
              
              <ul className="space-y-2">
                {contentLines.map((line, lineIndex) => {
                  const cleanLine = line.replace(/^[-•]\s*/, '').trim()
                  if (!cleanLine) return null
                  
                  return (
                    <motion.li
                      key={lineIndex}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + (index * 0.1) + (lineIndex * 0.05), type: "spring", stiffness: 100 }}
                      className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + (index * 0.1) + (lineIndex * 0.05) }}
                      />
                      <span className="leading-relaxed">{cleanLine}</span>
                    </motion.li>
                  )
                })}
              </ul>
            </div>
          </motion.div>
        )
      }
      
      return null
    })
  }

  const handleCopySummary = async () => {
    if (!aiSummary) return
    try {
      await navigator.clipboard.writeText(aiSummary)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy summary:', error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: -15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ delay: 0.3, duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
      style={{ perspective: 2000 }}
      whileHover={{ rotateY: 8, rotateX: 5, scale: 1.02, boxShadow: "0 25px 50px -12px rgba(99, 102, 241, 0.25)" }}
      className="mb-6"
    >
      <Card className="bg-white dark:bg-gray-800 backdrop-blur-xl border border-gray-200 dark:border-gray-700 shadow-2xl shadow-purple-500/10 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <motion.div
                animate={{ 
                  rotate: aiSummary ? 0 : 360,
                  scale: aiSummary ? [1, 1.2, 1] : 1
                }}
                transition={{ 
                  duration: aiSummary ? 0.5 : 3, 
                  repeat: aiSummary ? 0 : Infinity, 
                  ease: aiSummary ? "easeOut" : "linear" 
                }}
              >
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </motion.div>
              <CardTitle className="text-purple-600 dark:text-purple-400 text-lg">
                AI Summary
              </CardTitle>
            </motion.div>
            
            <div className="flex items-center gap-2">
              {aiSummary && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopySummary}
                    className="text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </motion.div>
              )}
              
              {!aiSummary && (
                <motion.div 
                  whileHover={{ scale: 1.08, y: -2 }} 
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onGenerateSummary}
                    disabled={isLoadingSummary}
                    className="border-purple-500/50 hover:bg-purple-500/10 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
                  >
                    {isLoadingSummary ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <AnimatePresence mode="wait">
            {aiSummary ? (
              <motion.div
                key="summary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {parseAISummary(aiSummary)}
              </motion.div>
            ) : isLoadingSummary ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-12 px-6"
              >
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative mb-4"
                >
                  <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl" />
                  <div className="relative rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
                </motion.div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Generating AI Summary
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Analyzing placement opportunity...
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-12 px-6"
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
                  <Sparkles className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600" />
                </motion.div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  AI Summary
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Get an instant AI-powered summary of this placement opportunity
                </p>
                <Button
                  variant="outline"
                  onClick={onGenerateSummary}
                  className="border-purple-500/50 hover:bg-purple-500/10 hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Summary
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  )
}
