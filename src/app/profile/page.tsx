"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Save, 
  User as UserIcon, 
  Mail, 
  Phone, 
  GraduationCap, 
  Link as LinkIcon, 
  Code, 
  Globe, 
  Loader2, 
  Info, 
  Sparkles,
  Building,
  FileText
} from "lucide-react"
import { profileSchema, type ProfileFormData } from "@/lib/validations/profile"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const toastShownRef = useRef(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: session?.user?.name || "",
      email: session?.user?.email || "",
      phone: "",
      college: "",
      collegeEmail: "",
      branch: "",
      semester: undefined,
      cgpa: undefined,
      graduationYear: undefined,
      skills: "",
      resume: "",
      linkedin: "",
      github: "",
      portfolio: "",
      placementCellEmail: "",
    },
  })

  // Watch form fields to compute completion percentage
  const watchedFields = watch()
  const requiredFields = [
    watchedFields.fullName,
    watchedFields.phone,
    watchedFields.college,
    watchedFields.collegeEmail,
    watchedFields.branch,
    watchedFields.cgpa,
    watchedFields.graduationYear,
    watchedFields.skills,
    watchedFields.placementCellEmail
  ]
  const completedCount = requiredFields.filter(Boolean).length
  const completionPercent = Math.round((completedCount / requiredFields.length) * 100)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      reset({
        fullName: session.user.name || "",
        email: session.user.email || "",
        phone: session.user.profile?.phone || "",
        college: session.user.profile?.college || "",
        collegeEmail: session.user.profile?.collegeEmail || "",
        branch: session.user.profile?.branch || "",
        semester: session.user.profile?.semester,
        cgpa: session.user.profile?.cgpa,
        graduationYear: session.user.profile?.graduationYear,
        skills: session.user.profile?.skills?.join(", ") || "",
        resume: session.user.profile?.resume || "",
        linkedin: session.user.profile?.linkedin || "",
        github: session.user.profile?.github || "",
        portfolio: session.user.profile?.portfolio || "",
        placementCellEmail: session.user.profile?.placementCellEmail || "",
      })

      if (!session.user.isProfileComplete && !toastShownRef.current) {
        toast.info("Complete your profile", {
          description: "Provide academic & placement cell details for accurate matching",
          icon: <Info className="h-4 w-4" />,
          duration: 5000,
        })
        toastShownRef.current = true
      }
    }
  }, [session, reset])

  const onSubmit = async (data: ProfileFormData) => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.fullName,
          profile: {
            phone: data.phone || undefined,
            college: data.college || undefined,
            collegeEmail: data.collegeEmail,
            branch: data.branch || undefined,
            semester: data.semester,
            cgpa: data.cgpa,
            graduationYear: data.graduationYear,
            skills: data.skills ? data.skills.split(",").map(s => s.trim()) : [],
            resume: data.resume || undefined,
            linkedin: data.linkedin || undefined,
            github: data.github || undefined,
            portfolio: data.portfolio || undefined,
            placementCellEmail: data.placementCellEmail,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      toast.success("Profile saved successfully!", {
        description: "Your match scores and Gmail filter have been updated.",
      })

      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 1000)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile", {
        description: "Please check your network and try again.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    )
  }

  const currentSkills = watchedFields.skills 
    ? watchedFields.skills.split(",").map(s => s.trim()).filter(Boolean)
    : []

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl pt-8 space-y-8">
        {/* PROFILE HEADER CARD */}
        <div className="glass-panel rounded-2xl p-6 sm:p-7 border border-border shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center font-bold text-xl">
                {session?.user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground font-heading">
                    {session?.user?.name || "Student Profile"}
                  </h1>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border">
                    Candidate
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
              </div>
            </div>

            {/* Profile Strength Indicator */}
            <div className="sm:text-right space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border/70">
              <div className="flex items-center sm:justify-end gap-1.5 text-xs font-medium text-foreground">
                <Sparkles className="h-3 w-3 text-muted-foreground" />
                Profile Strength: {completionPercent}%
              </div>
              <div className="w-32 h-1.5 rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-zinc-900 dark:bg-zinc-100 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {completionPercent >= 80 ? "Optimized for match scores" : "Complete details for better AI matching"}
              </p>
            </div>
          </div>
        </div>

        {/* MAIN PROFILE FORM */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* SECTION 1: PERSONAL & CONTACT */}
          <div className="glass-panel rounded-2xl p-6 border border-border space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-border">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-bold text-foreground">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-xs font-semibold">Full Legal Name *</Label>
                <Input 
                  id="fullName" 
                  placeholder="e.g. John Doe" 
                  className="rounded-xl h-9 text-xs" 
                  {...register("fullName")} 
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs font-semibold flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Phone Number *
                </Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  placeholder="+91 98765 43210" 
                  className="rounded-xl h-9 text-xs" 
                  {...register("phone")} 
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: ACADEMIC CREDENTIALS */}
          <div className="glass-panel rounded-2xl p-6 border border-border space-y-4">
            <div className="flex items-center gap-2 pb-2.5 border-b border-border">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-bold text-foreground">Academic Credentials</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="college" className="text-xs font-semibold flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-muted-foreground" />
                  College / University Name *
                </Label>
                <Input 
                  id="college" 
                  placeholder="e.g. Indian Institute of Technology" 
                  className="rounded-xl h-9 text-xs" 
                  {...register("college")} 
                />
                {errors.college && (
                  <p className="text-xs text-destructive">{errors.college.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="collegeEmail" className="text-xs font-semibold flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Official Student / College Email *
                </Label>
                <Input 
                  id="collegeEmail" 
                  type="email" 
                  placeholder="student@college.edu" 
                  className="rounded-xl h-9 text-xs" 
                  {...register("collegeEmail")} 
                />
                {errors.collegeEmail && (
                  <p className="text-xs text-destructive">{errors.collegeEmail.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="branch" className="text-xs font-semibold">Branch / Department *</Label>
                <Input 
                  id="branch" 
                  placeholder="e.g. Computer Science Engineering" 
                  className="rounded-xl h-9 text-xs" 
                  {...register("branch")} 
                />
                {errors.branch && (
                  <p className="text-xs text-destructive">{errors.branch.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cgpa" className="text-xs font-semibold">CGPA (out of 10) *</Label>
                <Input 
                  id="cgpa" 
                  type="number" 
                  step="0.01" 
                  placeholder="8.50" 
                  className="rounded-xl h-9 text-xs" 
                  {...register("cgpa", { valueAsNumber: true })} 
                />
                {errors.cgpa && (
                  <p className="text-xs text-destructive">{errors.cgpa.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="graduationYear" className="text-xs font-semibold">Grad Year *</Label>
                <Input 
                  id="graduationYear" 
                  type="number" 
                  placeholder="2026" 
                  className="rounded-xl h-9 text-xs" 
                  {...register("graduationYear", { valueAsNumber: true })} 
                />
                {errors.graduationYear && (
                  <p className="text-xs text-destructive">{errors.graduationYear.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: PLACEMENT CELL GMAIL MONITORING */}
          <div className="glass-panel rounded-2xl p-6 border border-border space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-border">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-bold text-foreground">Placement Cell Email</h2>
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                Required for Automation
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="placementCellEmail" className="text-xs font-semibold">
                Sender Email Address of Your Placement Cell / TPO *
              </Label>
              <Input 
                id="placementCellEmail" 
                type="email" 
                placeholder="e.g. placements@college.edu or tpo@university.ac.in" 
                className="rounded-xl h-9 text-xs" 
                {...register("placementCellEmail")} 
              />
              <p className="text-[11px] text-muted-foreground">
                PlaceMate AI uses this address to monitor your inbox and capture new campus drive notices.
              </p>
              {errors.placementCellEmail && (
                <p className="text-xs text-destructive">{errors.placementCellEmail.message}</p>
              )}
            </div>
          </div>

          {/* SECTION 4: TECHNICAL SKILLS & RESUME */}
          <div className="glass-panel rounded-2xl p-6 border border-border space-y-3.5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-border">
              <Code className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-bold text-foreground">Technical Skills &amp; Resume</h2>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="skills" className="text-xs font-semibold">Technical Skills (Comma separated) *</Label>
              <Textarea 
                id="skills" 
                placeholder="Python, React, TypeScript, Node.js, SQL, Machine Learning, AWS, Docker" 
                rows={3} 
                className="rounded-xl text-xs resize-none" 
                {...register("skills")} 
              />
              <p className="text-[11px] text-muted-foreground">
                These skills are matched against job requirements to calculate your profile fit score.
              </p>
              {errors.skills && (
                <p className="text-xs text-destructive">{errors.skills.message}</p>
              )}

              {/* Skill Preview Chips */}
              {currentSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {currentSkills.map((skill, idx) => (
                    <span 
                      key={idx}
                      className="text-xs px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-foreground font-medium border border-border"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5 pt-1">
              <Label htmlFor="resume" className="text-xs font-semibold flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Resume Cloud Link (Google Drive / Dropbox)
              </Label>
              <Input 
                id="resume" 
                placeholder="https://drive.google.com/file/d/your-resume/view" 
                className="rounded-xl h-9 text-xs" 
                {...register("resume")} 
              />
              {errors.resume && (
                <p className="text-xs text-destructive">{errors.resume.message}</p>
              )}
            </div>
          </div>

          {/* SECTION 5: ONLINE PROFILES */}
          <div className="glass-panel rounded-2xl p-6 border border-border space-y-3.5">
            <div className="flex items-center gap-2 pb-2.5 border-b border-border">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-bold text-foreground">Online Profiles &amp; Links</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="linkedin" className="text-xs font-semibold flex items-center gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  LinkedIn URL
                </Label>
                <Input 
                  id="linkedin" 
                  placeholder="https://linkedin.com/in/username" 
                  className="rounded-xl h-9 text-xs" 
                  {...register("linkedin")} 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="github" className="text-xs font-semibold flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5 text-muted-foreground" />
                  GitHub URL
                </Label>
                <Input 
                  id="github" 
                  placeholder="https://github.com/username" 
                  className="rounded-xl h-9 text-xs" 
                  {...register("github")} 
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="portfolio" className="text-xs font-semibold flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                  Portfolio Website
                </Label>
                <Input 
                  id="portfolio" 
                  placeholder="https://myportfolio.dev" 
                  className="rounded-xl h-9 text-xs" 
                  {...register("portfolio")} 
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
              disabled={!isDirty || isSaving}
              className="h-9 text-xs rounded-xl"
            >
              Discard Changes
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !isDirty}
              className="h-9 text-xs font-semibold gap-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 rounded-xl px-5 shadow-sm"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSaving ? "Saving..." : "Save Profile Details"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
