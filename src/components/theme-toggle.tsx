"use client"

import * as React from "react"
import { Moon, Sun, Palette } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { motion, AnimatePresence } from "framer-motion"
import ThemeCustomizerModal from "./ThemeCustomizerModal"

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [isCustomizerOpen, setIsCustomizerOpen] = React.useState(false)

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    setMounted(true)
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!mounted) {
    return (
      <div className="flex items-center gap-1">
        <button
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card shadow-xs transition-colors hover:bg-secondary text-foreground cursor-pointer"
          aria-label="Toggle theme"
        >
          <Sun className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Instant Light/Dark Toggle Button */}
        <button
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="relative inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card shadow-xs transition-colors hover:bg-secondary text-foreground overflow-hidden cursor-pointer"
          aria-label="Toggle theme"
          title={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDark ? "dark" : "light"}
              initial={{ y: -16, opacity: 0, rotate: -90 }}
              animate={{ y: 0, opacity: 1, rotate: 0 }}
              exit={{ y: 16, opacity: 0, rotate: 90 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="absolute"
            >
              {isDark ? (
                <Moon className="h-3.5 w-3.5 text-foreground" />
              ) : (
                <Sun className="h-3.5 w-3.5 text-amber-500" />
              )}
            </motion.div>
          </AnimatePresence>
        </button>

        {/* Theme Customizer Trigger */}
        <button
          onClick={() => setIsCustomizerOpen(true)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-card shadow-xs transition-colors hover:bg-secondary text-muted-foreground hover:text-foreground cursor-pointer"
          aria-label="Customize theme"
          title="Open Theme & Dark Mode Customizer"
        >
          <Palette className="h-3.5 w-3.5" />
        </button>
      </div>

      <ThemeCustomizerModal
        open={isCustomizerOpen}
        onOpenChange={setIsCustomizerOpen}
      />
    </>
  )
}
