"use client"

import * as React from "react"

export type ThemeMode = "light" | "dark" | "system"
export type ThemePreset = "default" | "ocean" | "forest" | "sunset" | "amethyst"
export type AccentColor = "default" | "blue" | "emerald" | "violet" | "amber" | "rose" | "teal"

export interface ThemePreferences {
  theme: ThemeMode
  preset: ThemePreset
  accentColor: AccentColor
  highContrast: boolean
}

export interface ThemeContextType extends ThemePreferences {
  resolvedTheme: "light" | "dark"
  setTheme: (theme: ThemeMode) => void
  setPreset: (preset: ThemePreset) => void
  setAccentColor: (accent: AccentColor) => void
  setHighContrast: (enabled: boolean) => void
  resetToDefaults: () => void
}

const DEFAULT_PREFERENCES: ThemePreferences = {
  theme: "system",
  preset: "default",
  accentColor: "default",
  highContrast: false,
}

const STORAGE_KEYS = {
  theme: "placemate-theme",
  preset: "placemate-theme-preset",
  accent: "placemate-theme-accent",
  contrast: "placemate-theme-contrast",
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  defaultPreset = "default",
  defaultAccent = "default",
  defaultHighContrast = false,
  storageKey,
}: {
  children: React.ReactNode
  defaultTheme?: ThemeMode
  defaultPreset?: ThemePreset
  defaultAccent?: AccentColor
  defaultHighContrast?: boolean
  storageKey?: string
}) {
  const [theme, setThemeState] = React.useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEYS.theme) as ThemeMode
      if (stored) return stored
    }
    return defaultTheme
  })

  const [preset, setPresetState] = React.useState<ThemePreset>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEYS.preset) as ThemePreset
      if (stored) return stored
    }
    return defaultPreset
  })

  const [accentColor, setAccentColorState] = React.useState<AccentColor>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEYS.accent) as AccentColor
      if (stored) return stored
    }
    return defaultAccent
  })

  const [highContrast, setHighContrastState] = React.useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEYS.contrast)
      if (stored !== null) return stored === "true"
    }
    return defaultHighContrast
  })

  const [systemTheme, setSystemTheme] = React.useState<"light" | "dark">("dark")

  // Listen to system prefers-color-scheme
  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    setSystemTheme(media.matches ? "dark" : "light")

    const listener = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light")
    }

    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [])

  // Sync with user's backend profile preferences on initial load
  React.useEffect(() => {
    fetch("/api/profile/theme")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.themePreferences) {
          const prefs = data.themePreferences
          if (prefs.theme) {
            setThemeState(prefs.theme)
            localStorage.setItem(STORAGE_KEYS.theme, prefs.theme)
          }
          if (prefs.preset) {
            setPresetState(prefs.preset)
            localStorage.setItem(STORAGE_KEYS.preset, prefs.preset)
          }
          if (prefs.accentColor) {
            setAccentColorState(prefs.accentColor)
            localStorage.setItem(STORAGE_KEYS.accent, prefs.accentColor)
          }
          if (prefs.highContrast !== undefined) {
            setHighContrastState(prefs.highContrast)
            localStorage.setItem(STORAGE_KEYS.contrast, String(prefs.highContrast))
          }
        }
      })
      .catch(() => {
        // Not authenticated or network error; gracefully ignore
      })
  }, [])

  // Resolved active theme
  const resolvedTheme: "light" | "dark" = theme === "system" ? systemTheme : theme

  // Apply DOM classes and attributes
  React.useEffect(() => {
    const root = document.documentElement

    // 1. Dark / Light class
    root.classList.remove("light", "dark")
    root.classList.add(resolvedTheme)

    // 2. Preset data attribute
    root.setAttribute("data-theme-preset", preset)

    // 3. Accent color data attribute
    root.setAttribute("data-accent", accentColor)

    // 4. High contrast class
    root.classList.toggle("high-contrast", highContrast)
  }, [resolvedTheme, preset, accentColor, highContrast])

  // Helper to persist to API asynchronously
  const persistToApi = React.useCallback(
    (updates: Partial<ThemePreferences>) => {
      fetch("/api/profile/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }).catch((err) => {
        console.warn("Failed to persist theme preference to backend:", err)
      })
    },
    []
  )

  const setTheme = React.useCallback(
    (newTheme: ThemeMode) => {
      setThemeState(newTheme)
      localStorage.setItem(STORAGE_KEYS.theme, newTheme)
      persistToApi({ theme: newTheme })
    },
    [persistToApi]
  )

  const setPreset = React.useCallback(
    (newPreset: ThemePreset) => {
      setPresetState(newPreset)
      localStorage.setItem(STORAGE_KEYS.preset, newPreset)
      persistToApi({ preset: newPreset })
    },
    [persistToApi]
  )

  const setAccentColor = React.useCallback(
    (newAccent: AccentColor) => {
      setAccentColorState(newAccent)
      localStorage.setItem(STORAGE_KEYS.accent, newAccent)
      persistToApi({ accentColor: newAccent })
    },
    [persistToApi]
  )

  const setHighContrast = React.useCallback(
    (enabled: boolean) => {
      setHighContrastState(enabled)
      localStorage.setItem(STORAGE_KEYS.contrast, String(enabled))
      persistToApi({ highContrast: enabled })
    },
    [persistToApi]
  )

  const resetToDefaults = React.useCallback(() => {
    setTheme(DEFAULT_PREFERENCES.theme)
    setPreset(DEFAULT_PREFERENCES.preset)
    setAccentColor(DEFAULT_PREFERENCES.accentColor)
    setHighContrast(DEFAULT_PREFERENCES.highContrast)
  }, [setTheme, setPreset, setAccentColor, setHighContrast])

  const value: ThemeContextType = React.useMemo(
    () => ({
      theme,
      resolvedTheme,
      preset,
      accentColor,
      highContrast,
      setTheme,
      setPreset,
      setAccentColor,
      setHighContrast,
      resetToDefaults,
    }),
    [
      theme,
      resolvedTheme,
      preset,
      accentColor,
      highContrast,
      setTheme,
      setPreset,
      setAccentColor,
      setHighContrast,
      resetToDefaults,
    ]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextType {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
