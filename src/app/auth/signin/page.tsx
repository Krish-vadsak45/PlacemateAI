"use client"

import { useState, useEffect } from "react"
import { Loader2, AlertCircle } from "lucide-react"

function getErrorMessage(error: string) {
  switch (error) {
    case "OAuthSignin":
    case "OAuthCallback":
      return "Could not connect to Google. Please try again."
    case "OAuthCreateAccount":
    case "EmailCreateAccount":
      return "Could not create user account. Please try again."
    case "Callback":
      return "Authentication callback failed. Please try again."
    case "AccessDenied":
      return "Access was denied. Please grant permissions to continue."
    case "Configuration":
      return "Server authentication configuration error."
    default:
      return "An error occurred during sign-in. Please try again."
  }
}

export default function SignInPage() {
  const [csrfToken, setCsrfToken] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    // 1. Fetch CSRF token immediately on mount
    fetch("/api/auth/csrf")
      .then((res) => res.json())
      .then((data) => {
        if (data?.csrfToken) setCsrfToken(data.csrfToken)
      })
      .catch((err) => console.warn("Could not pre-fetch CSRF token:", err))

    // 2. Read query params safely from window.location
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const err = params.get("error")
      if (err) setErrorMessage(getErrorMessage(err))
    }
  }, [])

  const handleSignIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (isLoading) return
    setIsLoading(true)
    setErrorMessage(null)

    try {
      // Ensure CSRF token is present
      let token = csrfToken
      if (!token) {
        const csrfRes = await fetch("/api/auth/csrf")
        const csrfData = await csrfRes.json()
        token = csrfData?.csrfToken || ""
        setCsrfToken(token)
      }

      // Request Google OAuth URL with X-Auth-Return-Redirect
      const res = await fetch("/api/auth/signin/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Auth-Return-Redirect": "1",
        },
        body: new URLSearchParams({
          csrfToken: token,
          callbackUrl: "/auth/callback",
        }),
      })

      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url
        return
      }

      // Fallback: Submit native form
      submitNativeForm(token)
    } catch (err: any) {
      console.warn("Direct OAuth fetch failed, trying native submission:", err)
      submitNativeForm(csrfToken)
    }
  }

  const submitNativeForm = (token: string) => {
    try {
      const form = document.createElement("form")
      form.method = "POST"
      form.action = "/api/auth/signin/google"

      const csrfInput = document.createElement("input")
      csrfInput.type = "hidden"
      csrfInput.name = "csrfToken"
      csrfInput.value = token
      form.appendChild(csrfInput)

      const callbackInput = document.createElement("input")
      callbackInput.type = "hidden"
      callbackInput.name = "callbackUrl"
      callbackInput.value = "/auth/callback"
      form.appendChild(callbackInput)

      document.body.appendChild(form)
      form.submit()
    } catch (formErr: any) {
      console.error("Native form submit failed:", formErr)
      setErrorMessage("Could not redirect to Google. Please check your browser connection.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden px-4">
      {/* Background Orbs */}
      <div className="mesh-orb top-[-50px] left-1/2 -translate-x-1/2 w-[550px] h-[450px] bg-gradient-to-tr from-sky-500/20 via-blue-600/15 to-purple-600/20 pointer-events-none" />
      <div className="mesh-orb bottom-[-50px] right-[-50px] w-[450px] h-[450px] bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent pointer-events-none" />

      {/* Main Sign-in Card */}
      <div className="glass-3d-card w-full max-w-md p-8 sm:p-10 shadow-2xl relative z-10 pointer-events-auto">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-black text-xl shadow-lg border border-white/20 mb-2">
            P
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground font-heading">
            Sign in to PlaceMate AI
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Automate your placement drives, email notices, deadlines, and AI fit matching
          </p>
        </div>

        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 p-3 text-xs text-red-600 dark:text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="mt-8 relative z-20">
          <button
            type="button"
            id="google-signin-btn"
            onClick={handleSignIn}
            className="relative z-30 pointer-events-auto flex w-full items-center justify-center gap-3 rounded-2xl border border-white/20 bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 px-5 py-3.5 text-xs font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Continue with Google Account</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-center text-muted-foreground mt-6">
          By signing in, you grant secure Gmail &amp; Google Calendar read/sync access.
        </p>
      </div>
    </div>
  )
}
