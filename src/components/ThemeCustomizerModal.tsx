"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  useTheme,
  ThemeMode,
  ThemePreset,
  AccentColor,
} from "@/components/theme-provider"
import {
  Sun,
  Moon,
  Laptop,
  Palette,
  Check,
  RotateCcw,
  Sparkles,
  Contrast,
  Sliders,
} from "lucide-react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PRESET_OPTIONS: Array<{
  id: ThemePreset
  title: string
  subtitle: string
  gradient: string
  borderAccent: string
}> = [
  {
    id: "default",
    title: "Zinc Minimal",
    subtitle: "Clean monochrome balance",
    gradient: "from-zinc-900 via-zinc-800 to-zinc-950",
    borderAccent: "border-zinc-500/40",
  },
  {
    id: "ocean",
    title: "Midnight Ocean",
    subtitle: "Deep navy & sapphire hues",
    gradient: "from-sky-950 via-blue-900 to-slate-950",
    borderAccent: "border-sky-500/40",
  },
  {
    id: "forest",
    title: "Emerald Forest",
    subtitle: "Deep pine & mint tones",
    gradient: "from-emerald-950 via-teal-900 to-zinc-950",
    borderAccent: "border-emerald-500/40",
  },
  {
    id: "sunset",
    title: "Twilight Sunset",
    subtitle: "Warm copper & amber radiance",
    gradient: "from-rose-950 via-amber-900 to-zinc-950",
    borderAccent: "border-amber-500/40",
  },
  {
    id: "amethyst",
    title: "Royal Amethyst",
    subtitle: "Rich violet & purple twilight",
    gradient: "from-purple-950 via-violet-900 to-zinc-950",
    borderAccent: "border-purple-500/40",
  },
]

const ACCENT_OPTIONS: Array<{
  id: AccentColor
  label: string
  colorClass: string
  ringClass: string
}> = [
  { id: "default", label: "Neutral", colorClass: "bg-foreground", ringClass: "ring-foreground" },
  { id: "blue", label: "Sapphire", colorClass: "bg-blue-500", ringClass: "ring-blue-500" },
  { id: "emerald", label: "Emerald", colorClass: "bg-emerald-500", ringClass: "ring-emerald-500" },
  { id: "violet", label: "Violet", colorClass: "bg-purple-500", ringClass: "ring-purple-500" },
  { id: "amber", label: "Amber", colorClass: "bg-amber-500", ringClass: "ring-amber-500" },
  { id: "rose", label: "Rose", colorClass: "bg-rose-500", ringClass: "ring-rose-500" },
  { id: "teal", label: "Teal", colorClass: "bg-teal-500", ringClass: "ring-teal-500" },
]

export default function ThemeCustomizerModal({ open, onOpenChange }: Props) {
  const {
    theme,
    setTheme,
    preset,
    setPreset,
    accentColor,
    setAccentColor,
    highContrast,
    setHighContrast,
    resetToDefaults,
  } = useTheme()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-3xl p-6 bg-card border border-border shadow-2xl space-y-5">
        <DialogHeader className="pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground font-heading">
              <Palette className="h-4 w-4 text-primary" />
              Theme & Dark Mode Customizer
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
              className="h-7 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground"
              title="Reset all settings to default"
            >
              <RotateCcw className="h-3 w-3" />
              Reset Defaults
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Personalize your viewing experience with presets, custom accents, and high-contrast tuning.
          </p>
        </DialogHeader>

        {/* 1. COLOR SCHEME MODE */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
            Color Scheme Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "light" as ThemeMode, label: "Light", icon: Sun },
              { id: "dark" as ThemeMode, label: "Dark", icon: Moon },
              { id: "system" as ThemeMode, label: "Auto (System)", icon: Laptop },
            ].map((mode) => {
              const Icon = mode.icon
              const isSelected = theme === mode.id
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setTheme(mode.id)}
                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-primary/10 border-primary text-foreground shadow-xs font-semibold"
                      : "bg-secondary/40 border-border text-muted-foreground hover:text-foreground hover:bg-secondary/70"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isSelected ? "text-primary" : ""}`} />
                  <span className="text-xs">{mode.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 2. THEME PRESETS */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
              Dark Mode Presets
            </label>
            <span className="text-[11px] text-muted-foreground">Affects dark palette undertones</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
            {PRESET_OPTIONS.map((p) => {
              const isSelected = preset === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreset(p.id)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? `bg-secondary/80 border-primary shadow-xs ${p.borderAccent}`
                      : "bg-card border-border hover:bg-secondary/50"
                  }`}
                >
                  {/* Preset Preview Orb */}
                  <div
                    className={`h-7 w-7 rounded-lg bg-gradient-to-br ${p.gradient} border border-white/20 shrink-0 flex items-center justify-center shadow-xs`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-foreground truncate">
                      {p.title}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {p.subtitle}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 3. CUSTOM ACCENT COLORS */}
        <div className="space-y-2.5">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
            Custom Accent Tint
          </label>
          <div className="flex items-center gap-2.5 flex-wrap">
            {ACCENT_OPTIONS.map((acc) => {
              const isSelected = accentColor === acc.id
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setAccentColor(acc.id)}
                  className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? "bg-secondary border-primary shadow-2xs font-semibold text-foreground ring-1 ring-primary/40"
                      : "bg-card border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    className={`h-3 w-3 rounded-full ${acc.colorClass} border border-border/40 inline-block`}
                  />
                  <span>{acc.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 4. ACCESSIBILITY: HIGH CONTRAST */}
        <div className="pt-2 border-t border-border flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Contrast className="h-4 w-4 text-foreground" />
              <span className="text-xs font-semibold text-foreground">
                High Contrast Mode
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Maximum contrast ratio with prominent borders and solid backgrounds.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={highContrast}
            onClick={() => setHighContrast(!highContrast)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              highContrast ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                highContrast ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs rounded-xl px-4"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
