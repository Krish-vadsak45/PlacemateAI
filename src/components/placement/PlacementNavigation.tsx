import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"

interface PlacementNavigationProps {
  onBack: () => void
  onNext?: () => void
  hasNext?: boolean
}

export function PlacementNavigation({ onBack, onNext, hasNext = false }: PlacementNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-4 mb-6">
      <Button
        onClick={onBack}
        variant="ghost"
        size="sm"
        className="gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-xl"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Button>

      {hasNext && onNext && (
        <Button
          onClick={onNext}
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs rounded-xl"
        >
          Next Drive
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
