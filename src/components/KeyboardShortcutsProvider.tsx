"use client"

import React, { useState, useEffect, createContext, useContext } from "react"
import { useRouter, usePathname } from "next/navigation"
import KeyboardShortcutsModal from "./KeyboardShortcutsModal"
import ThemeCustomizerModal from "./ThemeCustomizerModal"
import { toast } from "sonner"

interface KeyboardShortcutsContextType {
  openHelpModal: () => void
  openThemeModal: () => void
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | null>(null)

export function useKeyboardShortcutsContext() {
  const context = useContext(KeyboardShortcutsContext)
  if (!context) {
    return {
      openHelpModal: () => {},
      openThemeModal: () => {},
    }
  }
  return context
}

export function KeyboardShortcutsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isThemeOpen, setIsThemeOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an input/textarea element
      const target = e.target as HTMLElement
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable

      const isCmdOrCtrl = e.metaKey || e.ctrlKey

      // Global Cmd/Ctrl combinations (works even inside inputs)
      if (isCmdOrCtrl && e.key.toLowerCase() === "k") {
        e.preventDefault()
        const searchInput = document.querySelector<HTMLInputElement>("input[type='text'], input[type='search']")
        if (searchInput) {
          searchInput.focus()
          toast.info("Search focused", { duration: 1500 })
        } else {
          router.push("/dashboard")
        }
        return
      }

      if (isCmdOrCtrl && e.key.toLowerCase() === "n") {
        e.preventDefault()
        const newBtn = document.querySelector<HTMLButtonElement>("[data-shortcut-new]")
        if (newBtn) {
          newBtn.click()
        } else {
          router.push("/dashboard")
        }
        return
      }

      // Ignore single-key shortcuts if inside an editable input
      if (isInput) return

      // Single-key shortcuts
      switch (e.key) {
        case "?":
          e.preventDefault()
          setIsHelpOpen((prev) => !prev)
          break
        case "d":
        case "D":
          if (pathname !== "/dashboard") {
            e.preventDefault()
            router.push("/dashboard")
            toast.info("Navigating to Dashboard", { duration: 1200 })
          }
          break
        case "p":
        case "P":
          if (pathname !== "/profile") {
            e.preventDefault()
            router.push("/profile")
            toast.info("Navigating to Profile Settings", { duration: 1200 })
          }
          break
        case "a":
        case "A":
          if (pathname !== "/analytics") {
            e.preventDefault()
            router.push("/analytics")
            toast.info("Navigating to Analytics", { duration: 1200 })
          }
          break
        case "c":
        case "C":
          if (!pathname?.startsWith("/placements/compare")) {
            e.preventDefault()
            router.push("/placements/compare")
            toast.info("Navigating to Drive Comparison", { duration: 1200 })
          }
          break
        case "h":
        case "H":
          if (pathname !== "/") {
            e.preventDefault()
            router.push("/")
          }
          break
        case "t":
        case "T":
          e.preventDefault()
          setIsThemeOpen((prev) => !prev)
          break
        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [router, pathname])

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        openHelpModal: () => setIsHelpOpen(true),
        openThemeModal: () => setIsThemeOpen(true),
      }}
    >
      {children}
      <KeyboardShortcutsModal open={isHelpOpen} onOpenChange={setIsHelpOpen} />
      <ThemeCustomizerModal open={isThemeOpen} onOpenChange={setIsThemeOpen} />
    </KeyboardShortcutsContext.Provider>
  )
}
