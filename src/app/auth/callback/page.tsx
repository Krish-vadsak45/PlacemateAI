"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle, Info } from "lucide-react"
import { toast } from "sonner"

export default function AuthCallbackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }

    if (session?.user) {
      // Redirect based on profile completion
      if (session.user.isProfileComplete) {
        toast.success("Welcome back!", {
          description: "Redirecting to your dashboard...",
          icon: <CheckCircle className="h-4 w-4" />,
        })
        setTimeout(() => {
          router.push("/dashboard")
        }, 1000)
      } else {
        toast.info("Welcome to PlaceMate AI!", {
          description: "Please complete your profile to get started",
          icon: <Info className="h-4 w-4" />,
          duration: 5000,
        })
        setTimeout(() => {
          router.push("/profile")
        }, 1000)
      }
    }
  }, [session, status, router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Setting up your account...</p>
      </div>
    </div>
  )
}
