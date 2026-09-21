import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { Building, Calendar, ExternalLink, Edit, Save, X, Clock, MapPin, DollarSign, Link2, CheckCircle, AlertCircle } from "lucide-react"
import { Placement } from "@/types/placement"
import { useState } from "react"

interface PlacementDetailsCardProps {
  placement: Placement
  isEditing: boolean
  editedPlacement: Placement
  onEditToggle: () => void
  onSave: () => void
  onCancel: () => void
  onFieldChange: (field: keyof Placement, value: string) => void
  onAddToCalendar: (eventType: 'deadline' | 'assessment' | 'interview') => void
}

export function PlacementDetailsCard({
  placement,
  isEditing,
  editedPlacement,
  onEditToggle,
  onSave,
  onCancel,
  onFieldChange,
  onAddToCalendar
}: PlacementDetailsCardProps) {
  const [calendarAdded, setCalendarAdded] = useState<string | null>(null)

  const renderEditableField = (
    label: string, 
    field: keyof Placement, 
    type: string = "text",
    icon: React.ReactNode
  ) => {
    const value = placement[field] as string || ""
    const hasValue = !!value

    if (isEditing) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2"
        >
          <Label className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium">
            {icon}
            {label}
          </Label>
          <Input
            type={type}
            value={editedPlacement[field] as string || ""}
            onChange={(e) => onFieldChange(field, e.target.value)}
            className="border-red-500/30 focus:border-red-500 focus:ring-red-500/20 transition-all"
          />
        </motion.div>
      )
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`space-y-2 p-4 rounded-lg border transition-all ${
          hasValue 
            ? 'bg-gradient-to-br from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 border-gray-200 dark:border-gray-700' 
            : 'bg-gray-50/50 dark:bg-gray-800/30 border-dashed border-gray-300 dark:border-gray-600'
        }`}
      >
        <Label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {icon}
          {label}
        </Label>
        <p className={`text-sm ${hasValue ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400 italic'}`}>
          {hasValue ? value : "Not specified"}
        </p>
      </motion.div>
    )
  }

  const renderLinkCard = (
    label: string,
    url: string | undefined,
    icon: React.ReactNode,
    buttonText: string,
    color: string = "red"
  ) => {
    if (!url) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-2 p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30"
        >
          <Label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {icon}
            {label}
          </Label>
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">Not specified</p>
        </motion.div>
      )
    }

    const colorClasses = {
      red: 'from-red-500/10 to-red-600/5 border-red-500/30 hover:border-red-500/60 hover:shadow-red-500/20',
      blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/30 hover:border-blue-500/60 hover:shadow-blue-500/20',
      green: 'from-green-500/10 to-green-600/5 border-green-500/30 hover:border-green-500/60 hover:shadow-green-500/20',
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`block p-4 rounded-lg border bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} transition-all duration-300 hover:shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white dark:bg-gray-800">
                {icon}
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  {label}
                </Label>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{buttonText}</p>
              </div>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </div>
        </a>
      </motion.div>
    )
  }

  const hasDetails = placement.package || placement.location || placement.applicationDeadline || 
                    placement.assessmentDate || placement.interviewDate || placement.applicationLink || 
                    placement.googleFormLink

  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleAddToCalendar = (eventType: 'deadline' | 'assessment' | 'interview') => {
    onAddToCalendar(eventType)
    setCalendarAdded(eventType)
    setTimeout(() => setCalendarAdded(null), 3000)
  }

  // Check if event is already added to calendar
  const isEventAdded = (eventType: 'deadline' | 'assessment' | 'interview') => {
    const eventId = {
      deadline: placement.deadlineCalendarEventId,
      assessment: placement.assessmentCalendarEventId,
      interview: placement.interviewCalendarEventId
    }[eventType]
    return !!eventId
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, rotateX: -15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.8, type: "spring", stiffness: 100, damping: 15 }}
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
                animate={{ rotate: isEditing ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <Building className="h-5 w-5 text-red-600 dark:text-red-400" />
              </motion.div>
              <CardTitle className="text-red-600 dark:text-red-400 text-lg">
                Placement Details
              </CardTitle>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div
                    key="editing"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-2"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onCancel}
                      className="border-red-500/50 hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/20 transition-all"
                    >
                      <X className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Cancel</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onSave}
                      className="border-red-500/50 hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/20 transition-all"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Save</span>
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="viewing"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onEditToggle}
                      className="border-red-500/50 hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/20 transition-all"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </CardHeader>
        <CardContent>
          {!hasDetails ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
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
                <Building className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600" />
              </motion.div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No Details Yet
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Add placement information to track your opportunities
              </p>
              <Button
                variant="outline"
                onClick={onEditToggle}
                className="border-red-500/50 hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/20 transition-all"
              >
                <Edit className="h-4 w-4 mr-2" />
                Add Details
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              {/* Key Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600" />
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Key Information</p>
                  <div className="h-px flex-1 bg-gradient-to-l from-gray-300 to-transparent dark:from-gray-600" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderEditableField("Package", "package", "text", <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />)}
                  {renderEditableField("Location", "location", "text", <MapPin className="h-4 w-4 text-red-600 dark:text-red-400" />)}
                </div>
              </div>

              {/* Important Dates Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600" />
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Important Dates</p>
                  <div className="h-px flex-1 bg-gradient-to-l from-gray-300 to-transparent dark:from-gray-600" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {renderEditableField("Application Deadline", "applicationDeadline", "date", <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />)}
                  {renderEditableField("Assessment Date", "assessmentDate", "date", <Clock className="h-4 w-4 text-red-600 dark:text-red-400" />)}
                  {renderEditableField("Interview Date", "interviewDate", "date", <Calendar className="h-4 w-4 text-red-600 dark:text-red-400" />)}
                </div>

                {/* Calendar Actions */}
                {!isEditing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2 flex-wrap pt-2"
                  >
                    {placement.applicationDeadline && (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToCalendar('deadline')}
                          className={`border-red-500/50 hover:bg-red-500/10 transition-all ${
                            calendarAdded === 'deadline' || isEventAdded('deadline') ? 'bg-green-500/10 border-green-500/50' : ''
                          }`}
                        >
                          {calendarAdded === 'deadline' || isEventAdded('deadline') ? (
                            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                          ) : (
                            <Calendar className="h-4 w-4 mr-1" />
                          )}
                          Add to Calendar
                        </Button>
                      </motion.div>
                    )}
                    {placement.assessmentDate && (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToCalendar('assessment')}
                          className={`border-red-500/50 hover:bg-red-500/10 transition-all ${
                            calendarAdded === 'assessment' || isEventAdded('assessment') ? 'bg-green-500/10 border-green-500/50' : ''
                          }`}
                        >
                          {calendarAdded === 'assessment' || isEventAdded('assessment') ? (
                            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                          ) : (
                            <Clock className="h-4 w-4 mr-1" />
                          )}
                          Add to Calendar
                        </Button>
                      </motion.div>
                    )}
                    {placement.interviewDate && (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddToCalendar('interview')}
                          className={`border-red-500/50 hover:bg-red-500/10 transition-all ${
                            calendarAdded === 'interview' || isEventAdded('interview') ? 'bg-green-500/10 border-green-500/50' : ''
                          }`}
                        >
                          {calendarAdded === 'interview' || isEventAdded('interview') ? (
                            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                          ) : (
                            <Calendar className="h-4 w-4 mr-1" />
                          )}
                          Add to Calendar
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Application Links Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600" />
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Application Links</p>
                  <div className="h-px flex-1 bg-gradient-to-l from-gray-300 to-transparent dark:from-gray-600" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderLinkCard(
                    "Application Link",
                    placement.applicationLink,
                    <Link2 className="h-5 w-5 text-red-600 dark:text-red-400" />,
                    "Apply Now",
                    "red"
                  )}
                  {renderLinkCard(
                    "Google Form",
                    placement.googleFormLink,
                    <Link2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
                    "Open Form",
                    "blue"
                  )}
                </div>
              </div>

              {/* Form Links Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-gray-300 to-transparent dark:from-gray-600" />
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Additional Forms</p>
                  <div className="h-px flex-1 bg-gradient-to-l from-gray-300 to-transparent dark:from-gray-600" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <Link2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      Placement Cell Form
                    </Label>
                    {placement.placementCellFormLink ? (
                      <motion.a
                        href={placement.placementCellFormLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="block p-4 rounded-lg border border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/5 hover:border-green-500/60 hover:shadow-green-500/20 transition-all duration-300 hover:shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white dark:bg-gray-800">
                              <Link2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Open Placement Cell Form</p>
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </div>
                      </motion.a>
                    ) : (
                      <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30">
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">Not specified</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      <Link2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      Company Form
                    </Label>
                    {placement.companyFormLink ? (
                      <motion.a
                        href={placement.companyFormLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="block p-4 rounded-lg border border-green-500/30 bg-gradient-to-br from-green-500/10 to-green-600/5 hover:border-green-500/60 hover:shadow-green-500/20 transition-all duration-300 hover:shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white dark:bg-gray-800">
                              <Link2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Open Company Form</p>
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-gray-400" />
                        </div>
                      </motion.a>
                    ) : (
                      <div className="p-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30">
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">Not specified</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
