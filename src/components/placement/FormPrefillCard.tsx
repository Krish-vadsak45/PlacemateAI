import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ExternalLink, Sparkles, Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface FormPrefillCardProps {
  formUrl: string
  formType: "company" | "placementCell" | "general"
  formLabel?: string
}

interface PrefillResponse {
  success: boolean
  filledUrl: string
  error?: string
  formStructure?: any
  userProfile?: any
}

export function FormPrefillCard({ formUrl, formType, formLabel }: FormPrefillCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [filledUrl, setFilledUrl] = useState<string | null>(null)
  const [formStructure, setFormStructure] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const generatePrefillUrl = async () => {
    setIsLoading(true)
    setError(null)
    setFilledUrl(null)
    setFormStructure(null)

    try {
      const response = await fetch('/api/forms/puppeteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formUrl })
      })

      const data: PrefillResponse = await response.json()

      console.log('Puppeteer response:', data)

      if (response.ok && data.success) {
        setFilledUrl(data.filledUrl)
        setFormStructure(data.formStructure)
        
        console.log('Form filled successfully, URL:', data.filledUrl)
        console.log('Form structure:', data.formStructure)
        
        toast.success('Form filled successfully using Puppeteer')
      } else {
        setError(data.error || 'Failed to fill form')
        toast.error('Failed to fill form')
      }
    } catch (err) {
      setError('Network error occurred')
      toast.error('Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const openFilledForm = () => {
    if (filledUrl) {
      window.open(filledUrl, '_blank')
      toast.success('Opening filled form...')
    }
  }

  const getFormTypeLabel = () => {
    switch (formType) {
      case "company": return "Company Application Form"
      case "placementCell": return "Placement Cell Registration Form"
      default: return formLabel || "Application Form"
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
      whileHover={{ scale: 1.02 }}
      className="mb-4"
    >
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-red-600 dark:text-red-400" />
              <CardTitle className="text-red-600 dark:text-red-400 text-lg">
                {getFormTypeLabel()}
              </CardTitle>
            </div>
            {formStructure?.fields && (
              <div className="text-sm font-medium text-green-600 dark:text-green-400">
                {formStructure.fields.length} fields found
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!filledUrl ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Button
                  onClick={generatePrefillUrl}
                  disabled={isLoading}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Filling Form with Puppeteer...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Auto-Fill Form
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Form filled successfully
                  </span>
                </div>

                <Button
                  onClick={openFilledForm}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Filled Form
                </Button>

                <Button
                  onClick={() => {
                    setFilledUrl(null)
                    setFormStructure(null)
                  }}
                  variant="outline"
                  className="w-full border-red-500/50 hover:bg-red-500/10"
                >
                  Reset
                </Button>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm"
              >
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </motion.div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
