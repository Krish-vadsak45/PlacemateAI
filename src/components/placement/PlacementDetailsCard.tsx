import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Building2, 
  Calendar, 
  ExternalLink, 
  Edit, 
  Save, 
  X, 
  Clock, 
  MapPin, 
  DollarSign, 
  Link2, 
  CheckCircle2, 
  Sparkles
} from "lucide-react"
import { Placement } from "@/types/placement"
import { useState } from "react"

interface PlacementDetailsCardProps {
  placement: Placement
  isEditing: boolean
  editedPlacement: Placement
  onEditToggle: () => void
  onSave: () => void
  onCancel: () => void
  onFieldChange: (field: keyof Placement, value: any) => void
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

  const handleCalendarClick = (eventType: 'deadline' | 'assessment' | 'interview') => {
    onAddToCalendar(eventType)
    setCalendarAdded(eventType)
    setTimeout(() => setCalendarAdded(null), 3000)
  }

  const isEventAdded = (eventType: 'deadline' | 'assessment' | 'interview') => {
    const eventId = {
      deadline: placement.deadlineCalendarEventId,
      assessment: placement.assessmentCalendarEventId,
      interview: placement.interviewCalendarEventId
    }[eventType]
    return !!eventId
  }

  return (
    <div className="glass-panel rounded-2xl p-6 border border-border shadow-sm space-y-6">
      {/* CARD HEADER */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-foreground flex items-center justify-center">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Drive Specifications</h3>
            <p className="text-[11px] text-muted-foreground">Compensation, dates, and registration links</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="h-8 text-xs rounded-xl"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={onSave}
                className="h-8 text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 rounded-xl"
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                Save Changes
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onEditToggle}
              className="h-8 text-xs rounded-xl border-border gap-1.5"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit Details
            </Button>
          )}
        </div>
      </div>

      {/* EDIT MODE FORM */}
      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Compensation / Package</Label>
              <Input
                value={editedPlacement.package || ""}
                onChange={(e) => onFieldChange("package", e.target.value)}
                placeholder="e.g. ₹18 LPA or 15,00,000 INR"
                className="rounded-xl text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Work Location</Label>
              <Input
                value={editedPlacement.location || ""}
                onChange={(e) => onFieldChange("location", e.target.value)}
                placeholder="e.g. Bangalore / Hybrid"
                className="rounded-xl text-xs h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Application Deadline</Label>
              <Input
                type="date"
                value={editedPlacement.applicationDeadline ? new Date(editedPlacement.applicationDeadline).toISOString().split('T')[0] : ""}
                onChange={(e) => onFieldChange("applicationDeadline", e.target.value)}
                className="rounded-xl text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assessment Date</Label>
              <Input
                type="date"
                value={editedPlacement.assessmentDate ? new Date(editedPlacement.assessmentDate).toISOString().split('T')[0] : ""}
                onChange={(e) => onFieldChange("assessmentDate", e.target.value)}
                className="rounded-xl text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Interview Date</Label>
              <Input
                type="date"
                value={editedPlacement.interviewDate ? new Date(editedPlacement.interviewDate).toISOString().split('T')[0] : ""}
                onChange={(e) => onFieldChange("interviewDate", e.target.value)}
                className="rounded-xl text-xs h-9"
              />
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Direct Application URL</Label>
              <Input
                value={editedPlacement.applicationLink || ""}
                onChange={(e) => onFieldChange("applicationLink", e.target.value)}
                placeholder="https://..."
                className="rounded-xl text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Google Form Registration URL</Label>
              <Input
                value={editedPlacement.googleFormLink || ""}
                onChange={(e) => onFieldChange("googleFormLink", e.target.value)}
                placeholder="https://forms.gle/..."
                className="rounded-xl text-xs h-9"
              />
            </div>
          </div>
        </div>
      ) : (
        /* READ-ONLY VIEW */
        <div className="space-y-5">
          {/* SECTION 1: KEY METRICS TILES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/70 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                Package / Compensation
              </div>
              <p className="text-sm font-bold text-foreground">
                {placement.package || "Not specified in notice"}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 border border-border/70 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                Job Location
              </div>
              <p className="text-sm font-bold text-foreground">
                {placement.location || "Not specified / To be decided"}
              </p>
            </div>
          </div>

          {/* SECTION 2: DATES & CALENDAR SYNC */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Milestone Schedule &amp; Calendar Reminders
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Deadline */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 flex flex-col justify-between gap-2.5">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    Application Deadline
                  </span>
                  <p className="text-xs font-semibold text-foreground">
                    {placement.applicationDeadline 
                      ? new Date(placement.applicationDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : "Not specified"}
                  </p>
                </div>
                {placement.applicationDeadline && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCalendarClick('deadline')}
                    className="h-7 text-[11px] gap-1 rounded-lg w-full border-border"
                  >
                    {isEventAdded('deadline') || calendarAdded === 'deadline' ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                        In Calendar
                      </>
                    ) : (
                      <>
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        Sync Calendar
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Assessment */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 flex flex-col justify-between gap-2.5">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    Online Assessment
                  </span>
                  <p className="text-xs font-semibold text-foreground">
                    {placement.assessmentDate 
                      ? new Date(placement.assessmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : "To be announced"}
                  </p>
                </div>
                {placement.assessmentDate && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCalendarClick('assessment')}
                    className="h-7 text-[11px] gap-1 rounded-lg w-full border-border"
                  >
                    {isEventAdded('assessment') || calendarAdded === 'assessment' ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                        In Calendar
                      </>
                    ) : (
                      <>
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        Sync Calendar
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Interview */}
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border/70 flex flex-col justify-between gap-2.5">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    Interview Rounds
                  </span>
                  <p className="text-xs font-semibold text-foreground">
                    {placement.interviewDate 
                      ? new Date(placement.interviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : "To be announced"}
                  </p>
                </div>
                {placement.interviewDate && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCalendarClick('interview')}
                    className="h-7 text-[11px] gap-1 rounded-lg w-full border-border"
                  >
                    {isEventAdded('interview') || calendarAdded === 'interview' ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                        In Calendar
                      </>
                    ) : (
                      <>
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        Sync Calendar
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: APPLICATION FORMS & PORTALS */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Application &amp; Registration Portals
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {placement.applicationLink && (
                <a
                  href={placement.applicationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-card border border-border">
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Company Careers Portal
                      </p>
                      <span className="text-[10px] text-muted-foreground">Direct application link</span>
                    </div>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              )}

              {placement.googleFormLink && (
                <a
                  href={placement.googleFormLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-card border border-border">
                      <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Google Form Registration
                      </p>
                      <span className="text-[10px] text-muted-foreground">Registration link</span>
                    </div>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              )}

              {placement.placementCellFormLink && (
                <a
                  href={placement.placementCellFormLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border flex items-center justify-between transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-card border border-border">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        Placement Cell Form
                      </p>
                      <span className="text-[10px] text-muted-foreground">Internal college drive form</span>
                    </div>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
