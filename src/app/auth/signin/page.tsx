"use client"

import { signIn } from "next-auth/react"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden px-4">
      {/* 3D Mesh Glow Orbs */}
      <div className="mesh-orb top-[-50px] left-1/2 -translate-x-1/2 w-[550px] h-[450px] bg-gradient-to-tr from-sky-500/20 via-blue-600/15 to-purple-600/20" />
      <div className="mesh-orb bottom-[-50px] right-[-50px] w-[450px] h-[450px] bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent" />

      <div className="glass-3d-card w-full max-w-md p-8 sm:p-10 shadow-2xl relative preserve-3d">
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
        
        <div className="mt-8">
          <button
            onClick={() => signIn("google", { callbackUrl: "/auth/callback" })}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/20 bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 px-5 py-3.5 text-xs font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
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
            Continue with Google Account
          </button>
        </div>

        <p className="text-[11px] text-center text-muted-foreground mt-6">
          By signing in, you grant secure Gmail &amp; Google Calendar read/sync access.
        </p>
      </div>
    </div>
  )
}
