"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, User, LogOut, LogIn, Briefcase, BarChart3, Users, Scale } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { signOut, useSession } from "next-auth/react"
import { useComparison } from "@/context/ComparisonContext"

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { selectedItems } = useComparison()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" })
  }

  const isCompareActive = pathname?.startsWith("/placements/compare")
  const isDashboardActive = (pathname?.startsWith("/dashboard") || pathname?.startsWith("/placements")) && !isCompareActive
  const isAnalyticsActive = pathname?.startsWith("/analytics")
  const isProfileActive = pathname === "/profile"

  return (
    <header className="sticky top-0 z-50 w-full glass-nav transition-colors">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold transition-transform group-hover:scale-105">
            <Briefcase className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight text-foreground font-heading">
                PlaceMate
              </span>
              <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                AI
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline-block -mt-0.5">
              Campus Placement Co-Pilot
            </span>
          </div>
        </Link>

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {session?.user && (
            <nav className="flex items-center gap-1 bg-zinc-100/70 dark:bg-zinc-900/70 p-1 rounded-xl border border-border">
              <Link href="/dashboard">
                <Button
                  variant={isDashboardActive ? "default" : "ghost"}
                  size="sm"
                  className={`h-8 gap-1.5 text-xs font-medium rounded-lg transition-all ${
                    isDashboardActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <Link href="/placements/compare">
                <Button
                  variant={isCompareActive ? "default" : "ghost"}
                  size="sm"
                  className={`h-8 gap-1.5 text-xs font-medium rounded-lg transition-all relative ${
                    isCompareActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Scale className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Compare</span>
                  {selectedItems.length > 0 && (
                    <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary text-primary-foreground">
                      {selectedItems.length}
                    </span>
                  )}
                </Button>
              </Link>
              <Link href="/analytics">
                <Button
                  variant={isAnalyticsActive ? "default" : "ghost"}
                  size="sm"
                  className={`h-8 gap-1.5 text-xs font-medium rounded-lg transition-all ${
                    isAnalyticsActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Analytics</span>
                </Button>
              </Link>
              <Link href="/profile">
                <Button
                  variant={isProfileActive ? "default" : "ghost"}
                  size="sm"
                  className={`h-8 gap-1.5 text-xs font-medium rounded-lg transition-all ${
                    isProfileActive
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
              </Link>
            </nav>
          )}

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 pl-1 border-l border-border">
            <ThemeToggle />

            {session?.user ? (
              <div className="flex items-center gap-2">
                <div
                  onClick={() => router.push("/profile")}
                  className="flex items-center gap-2 py-1 px-2 rounded-xl hover:bg-muted/70 cursor-pointer transition-colors"
                  title={session.user.name || "User Profile"}
                >
                  <div className="h-7 w-7 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center text-xs font-semibold">
                    {session.user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-xs font-medium text-foreground hidden md:inline-block max-w-[100px] truncate">
                    {session.user.name?.split(" ")[0]}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 rounded-lg"
                  title="Sign Out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={() => router.push("/auth/signin")}
                className="h-8 text-xs font-medium gap-1.5 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-lg px-3 shadow-sm"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
