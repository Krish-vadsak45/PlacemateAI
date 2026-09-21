import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface PlacementNavigationProps {
  onBack: () => void
  onNext: () => void
  hasPrevious: boolean
  hasNext: boolean
}

export function PlacementNavigation({ onBack, onNext, hasPrevious, hasNext }: PlacementNavigationProps) {
  return (
    <motion.div 
      className="flex justify-between items-center mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={onBack}
          variant="outline"
          disabled={!hasPrevious}
          className="border-indigo-500/50 hover:bg-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:shadow-none"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>
      </motion.div>
      
      <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={onNext}
          variant="outline"
          disabled={!hasNext}
          className="border-indigo-500/50 hover:bg-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/20 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:shadow-none"
        >
          Next
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </motion.div>
    </motion.div>
  )
}
