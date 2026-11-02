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

      // Escape always closes any open shortcut modals
      if (e.key === "Escape") {
        setIsHelpOpen(false)
        setIsThemeOpen(false)
        return
      }

      // Help Modal: Ctrl + / or Ctrl + ? (or single '?' when not in an input)
      if (
        (isCmdOrCtrl && (e.key === "/" || e.key === "?")) ||
        (!isCmdOrCtrl && !isInput && e.key === "?")
      ) {
        e.preventDefault()
        setIsHelpOpen((prev) => !prev)
        return
      }

      // Ctrl/Cmd + K: Focus Search (allowed inside and outside inputs)
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

      // Ignore remaining shortcuts if user is typing inside an editable field
      if (isInput) return

      // All remaining application shortcuts require Ctrl (or Cmd on macOS)
      if (!isCmdOrCtrl) return

      const key = e.key.toLowerCase()

      switch (key) {
        case "d":
          e.preventDefault()
          if (pathname !== "/dashboard") {
            router.push("/dashboard")
            toast.info("Navigating to Dashboard (Ctrl + D)", { duration: 1200 })
          }
          break

        case "s":
          e.preventDefault()
          if (pathname !== "/placements/saved") {
            router.push("/placements/saved")
            toast.info("Navigating to Saved Placements (Ctrl + S)", { duration: 1200 })
          }
          break

        case "p":
          e.preventDefault()
          if (pathname !== "/profile") {
            router.push("/profile")
            toast.info("Navigating to Profile Settings (Ctrl + P)", { duration: 1200 })
          }
          break

        case "a":
          // If text is selected on the page, keep native Select All behavior
          if (typeof window !== "undefined" && window.getSelection()?.toString().length) {
            return
          }
          e.preventDefault()
          if (pathname !== "/analytics") {
            router.push("/analytics")
            toast.info("Navigating to Analytics (Ctrl + A)", { duration: 1200 })
          }
          break

        case "c":
          // If text is highlighted on the page, preserve standard Copy
          if (typeof window !== "undefined" && window.getSelection()?.toString().trim().length) {
            return
          }
          e.preventDefault()
          if (!pathname?.startsWith("/placements/compare")) {
            router.push("/placements/compare")
            toast.info("Navigating to Drive Comparison (Ctrl + C)", { duration: 1200 })
          }
          break

        case "i":
          e.preventDefault()
          if (pathname !== "/notifications") {
            router.push("/notifications")
            toast.info("Navigating to Notification Hub (Ctrl + I)", { duration: 1200 })
          }
          break

        case "h":
          e.preventDefault()
          if (pathname !== "/") {
            router.push("/")
            toast.info("Navigating to Home (Ctrl + H)", { duration: 1200 })
          }
          break

        case "n":
          e.preventDefault()
          const newBtn = document.querySelector<HTMLButtonElement>("[data-shortcut-new]")
          if (newBtn) {
            newBtn.click()
          } else {
            router.push("/dashboard")
          }
          break

        case "t":
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
