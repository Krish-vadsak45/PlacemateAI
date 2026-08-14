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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Save, User as UserIcon, Mail, Phone, GraduationCap, Link, Code, Globe, Loader2, Info } from "lucide-react"
import { profileSchema, type ProfileFormData } from "@/lib/validations/profile"

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const toastShownRef = useRef(false)

  const {
    register,
    handleSubmit,
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

      // Show info toast if profile is incomplete (only once)
      if (!session.user.isProfileComplete && !toastShownRef.current) {
        toast.info("Complete your profile", {
          description: "Please fill in your academic details to access the dashboard",
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

      toast.success("Profile saved!", {
        description: "Your profile has been updated successfully",
      })

      // Redirect to dashboard after successful profile completion
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 1000)
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile", {
        description: "Please try again later",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your personal information and skills</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            This information will be used to auto-fill application forms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="John Doe" {...register("fullName")} />
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input id="email" type="email" {...register("email")} disabled />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input id="phone" type="tel" placeholder="+91 98765 43210" {...register("phone")} />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="college">College Name</Label>
                <Input id="college" placeholder="Your College" {...register("college")} />
                {errors.college && (
                  <p className="text-sm text-destructive">{errors.college.message}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="collegeEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  College Email *
                </Label>
                <Input id="collegeEmail" type="email" placeholder="student@college.edu" {...register("collegeEmail")} />
                {errors.collegeEmail && (
                  <p className="text-sm text-destructive">{errors.collegeEmail.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="placementCellEmail" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Placement Cell Email *
                </Label>
                <Input id="placementCellEmail" type="email" placeholder="placement@college.edu" {...register("placementCellEmail")} />
                {errors.placementCellEmail && (
                  <p className="text-sm text-destructive">{errors.placementCellEmail.message}</p>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Input id="branch" placeholder="Computer Engineering" {...register("branch")} />
                {errors.branch && (
                  <p className="text-sm text-destructive">{errors.branch.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="semester">Current Semester</Label>
                <Input 
                  id="semester" 
                  type="number" 
                  placeholder="6" 
                  {...register("semester", { valueAsNumber: true })} 
                />
                {errors.semester && (
                  <p className="text-sm text-destructive">{errors.semester.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cgpa">CGPA</Label>
                <Input 
                  id="cgpa" 
                  type="number" 
                  step="0.01" 
                  placeholder="8.5" 
                  {...register("cgpa", { valueAsNumber: true })} 
                />
                {errors.cgpa && (
                  <p className="text-sm text-destructive">{errors.cgpa.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="graduationYear">Graduation Year</Label>
              <Input 
                id="graduationYear" 
                type="number" 
                placeholder="2027" 
                {...register("graduationYear", { valueAsNumber: true })} 
              />
              {errors.graduationYear && (
                <p className="text-sm text-destructive">{errors.graduationYear.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Technical Skills</Label>
              <Textarea 
                id="skills" 
                placeholder="JavaScript, React, Node.js, MongoDB, Python, etc."
                rows={3}
                {...register("skills")}
              />
              <p className="text-sm text-muted-foreground">Separate skills with commas</p>
              {errors.skills && (
                <p className="text-sm text-destructive">{errors.skills.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume">Resume Link</Label>
              <Input id="resume" placeholder="https://drive.google.com/your-resume" {...register("resume")} />
              {errors.resume && (
                <p className="text-sm text-destructive">{errors.resume.message}</p>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="linkedin" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  LinkedIn
                </Label>
                <Input id="linkedin" placeholder="https://linkedin.com/in/your-profile" {...register("linkedin")} />
                {errors.linkedin && (
                  <p className="text-sm text-destructive">{errors.linkedin.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="github" className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  GitHub
                </Label>
                <Input id="github" placeholder="https://github.com/your-username" {...register("github")} />
                {errors.github && (
                  <p className="text-sm text-destructive">{errors.github.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolio" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Portfolio
                </Label>
                <Input id="portfolio" placeholder="https://your-portfolio.com" {...register("portfolio")} />
                {errors.portfolio && (
                  <p className="text-sm text-destructive">{errors.portfolio.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-border">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => reset()}
                disabled={!isDirty}
              >
                Cancel
              </Button>
              <Button type="submit" className="gap-2" disabled={isSaving || !isDirty}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
