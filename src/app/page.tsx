"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Sparkles, 
  ArrowRight, 
  Calendar, 
  Brain, 
  Zap, 
  Check, 
  Mail, 
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkle,
  ArrowUpRight,
  BarChart3,
  Bot
} from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

export default function Home() {
  const [activeTab, setActiveTab] = useState<'gmail' | 'ai' | 'calendar' | 'autofill'>('gmail')

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12 }
    }
  }

  const itemVariants = {
    hidden: { y: 28, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden relative">
      {/* 3D Mesh Glow Orbs */}
      <div className="mesh-orb top-[-100px] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-sky-500/20 via-blue-600/15 to-purple-600/20" />
      <div className="mesh-orb top-[35%] right-[-100px] w-[500px] h-[500px] bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-transparent" />
      <div className="mesh-orb bottom-[25%] left-[-100px] w-[500px] h-[500px] bg-gradient-to-tr from-purple-600/15 via-indigo-500/10 to-transparent" />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="container mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-32 max-w-6xl text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="flex flex-col items-center preserve-3d"
          >
            {/* 3D Glass Pill Tag */}
            <motion.div variants={itemVariants} className="mb-6">
              <span className="glass-3d-pill inline-flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-foreground">
                <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                <span>PlaceMate AI • 3D Campus Placement Co-Pilot</span>
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              variants={itemVariants}
              className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.08] mb-6 font-heading text-foreground drop-shadow-sm"
            >
              Never miss a campus drive.{" "}
              <span className="block mt-2 gradient-brand-text">
                Structured. Automated. AI-Matched.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
            >
              Converts unstructured placement emails into structured opportunities, creates smart Google Calendar deadlines, and calculates 5-tier weighted profile fit scores.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-md mb-20 preserve-3d"
            >
              <Link href="/auth/signin" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto h-13 px-8 text-xs font-bold rounded-2xl bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-2xl shadow-primary/25 border border-white/20 transition-all gap-2 group hover:scale-[1.03]"
                >
                  Start Organizing Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="#features" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="glass-3d-pill w-full sm:w-auto h-13 px-7 text-xs font-semibold text-foreground hover:bg-white/10 transition-all gap-2"
                >
                  Explore Features
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              </Link>
            </motion.div>

            {/* SHOWCASE 3D GLASS PREVIEW CARD */}
            <motion.div 
              variants={itemVariants}
              className="w-full max-w-5xl mx-auto glass-3d-card text-left p-6 sm:p-9 relative"
            >
              {/* Header Badge & Title */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border/60">
                <div className="flex items-center gap-3.5">
                  <div className="h-11 w-11 rounded-2xl bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center font-black text-lg shadow-md border border-border">
                    G
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground font-heading">Google Cloud India</h3>
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                        High Priority Drive
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Software Engineer • 2026 Batch Placement Notice</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="px-3 py-1 rounded-xl bg-secondary/80 border border-border text-foreground flex items-center gap-1.5 text-xs font-bold">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span>94% Match Score</span>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center gap-1.5 text-xs font-extrabold">
                    <span>₹24.0 LPA</span>
                  </div>
                </div>
              </div>

              {/* Pipeline visual steps */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 py-6">
                <div 
                  onClick={() => setActiveTab('gmail')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === 'gmail' 
                      ? 'bg-primary/10 border-primary/40 shadow-sm' 
                      : 'bg-secondary/40 border-border/60 hover:bg-secondary/70'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground mb-1.5">
                    <Mail className="h-4 w-4 text-blue-500" />
                    1. Gmail Sync
                  </div>
                  <p className="text-xs font-semibold text-foreground">Auto-detected notice</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">Real-time Pub/Sub push</span>
                </div>

                <div 
                  onClick={() => setActiveTab('ai')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === 'ai' 
                      ? 'bg-primary/10 border-primary/40 shadow-sm' 
                      : 'bg-secondary/40 border-border/60 hover:bg-secondary/70'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground mb-1.5">
                    <Brain className="h-4 w-4 text-purple-500" />
                    2. AI Extraction
                  </div>
                  <p className="text-xs font-semibold text-foreground">Role, CTC &amp; Criteria</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">Gemini + Groq cascade</span>
                </div>

                <div 
                  onClick={() => setActiveTab('calendar')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === 'calendar' 
                      ? 'bg-primary/10 border-primary/40 shadow-sm' 
                      : 'bg-secondary/40 border-border/60 hover:bg-secondary/70'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground mb-1.5">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    3. Calendar Sync
                  </div>
                  <p className="text-xs font-semibold text-foreground">Deadline: Oct 15, 11:59 PM</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">Google Calendar reminder</span>
                </div>

                <div 
                  onClick={() => setActiveTab('autofill')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    activeTab === 'autofill' 
                      ? 'bg-primary/10 border-primary/40 shadow-sm' 
                      : 'bg-secondary/40 border-border/60 hover:bg-secondary/70'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground mb-1.5">
                    <Zap className="h-4 w-4 text-emerald-500" />
                    4. Auto-Fill Form
                  </div>
                  <p className="text-xs font-semibold text-foreground">Puppeteer pre-fill</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">1-Click registration</span>
                </div>
              </div>

              {/* Dynamic Interactive Detail Panel */}
              <div className="p-4 rounded-xl bg-secondary/50 border border-border/60 text-xs text-muted-foreground space-y-2">
                {activeTab === 'gmail' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
                      <span className="font-semibold text-foreground">Gmail Webhook Filter:</span>
                      <span>Intercepted notice from TPO (`placement-cell@university.edu`)</span>
                    </div>
                    <span className="text-[10px] font-mono bg-background px-2 py-0.5 rounded border">Rule-based 0 Tokens</span>
                  </div>
                )}
                {activeTab === 'ai' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
                      <span className="font-semibold text-foreground">Dual AI Cascade:</span>
                      <span>Extracted Job Role, CTC (24 LPA), Min CGPA (7.5), Eligible Branches (CS/IT)</span>
                    </div>
                    <span className="text-[10px] font-mono bg-background px-2 py-0.5 rounded border text-purple-400">Gemini 1.5 Flash</span>
                  </div>
                )}
                {activeTab === 'calendar' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <span className="font-semibold text-foreground">Calendar API Event:</span>
                      <span>Created idempotent deadline reminder with 24h &amp; 2h push notifications</span>
                    </div>
                    <span className="text-[10px] font-mono bg-background px-2 py-0.5 rounded border text-amber-400">Synced to Google Calendar</span>
                  </div>
                )}
                {activeTab === 'autofill' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="font-semibold text-foreground">Puppeteer Form Engine:</span>
                      <span>Profile CGPA, Resume URL, and Tech Stack pre-populated in registration form</span>
                    </div>
                    <span className="text-[10px] font-mono bg-background px-2 py-0.5 rounded border text-emerald-400">Ready to Submit</span>
                  </div>
                )}
              </div>

              {/* Footer strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-border/60 text-xs text-muted-foreground mt-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                    <Check className="h-4 w-4 text-emerald-500" /> CGPA 8.4 ≥ 7.5
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                    <Check className="h-4 w-4 text-emerald-500" /> B.Tech CSE Eligible
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                    <Check className="h-4 w-4 text-emerald-500" /> React, Node.js, Python Matched
                  </span>
                </div>
                <span className="font-bold text-foreground flex items-center gap-1">
                  PlaceMate AI Co-Pilot
                </span>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* METRICS BENTO STRIP */}
        <section className="border-y border-border/80 bg-secondary/30 py-12">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <div className="bento-card p-6 text-center border border-border/80">
                <p className="text-3xl sm:text-4xl font-extrabold text-foreground font-heading tracking-tight">100%</p>
                <p className="text-xs text-muted-foreground font-semibold mt-1">Placement Email Ingestion</p>
              </div>
              <div className="bento-card p-6 text-center border border-border/80">
                <p className="text-3xl sm:text-4xl font-extrabold text-foreground font-heading tracking-tight">&lt; 3s</p>
                <p className="text-xs text-muted-foreground font-semibold mt-1">Dual AI Extraction Speed</p>
              </div>
              <div className="bento-card p-6 text-center border border-border/80">
                <p className="text-3xl sm:text-4xl font-extrabold text-foreground font-heading tracking-tight">5-Tier</p>
                <p className="text-xs text-muted-foreground font-semibold mt-1">Weighted Profile Match Engine</p>
              </div>
              <div className="bento-card p-6 text-center border border-border/80">
                <p className="text-3xl sm:text-4xl font-extrabold text-foreground font-heading tracking-tight">0</p>
                <p className="text-xs text-muted-foreground font-semibold mt-1">Missed Deadlines</p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES BENTO GRID */}
        <section id="features" className="container mx-auto px-4 py-24 max-w-6xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-3 py-1 rounded-full bg-secondary border border-border">
              Core Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mt-3 mb-3 font-heading">
              Engineered for College Placements
            </h2>
            <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">
              Every feature is purpose-built to automate the chaotic placement drive cycle from notice to offer letter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Email Ingestion (Large) */}
            <div className="bento-card p-8 border border-border/80 md:col-span-2 flex flex-col justify-between group">
              <div>
                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center mb-5 shadow-sm">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground font-heading mb-2">Zero-Cost Email Detection &amp; Ingestion</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                  Connect your college Gmail. Our rule-based pre-filter identifies placement cell emails instantly without wasting LLM tokens. Filtered notices trigger background worker queues for instant structured parsing.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-background/80 border border-border/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-foreground">Google Pub/Sub Webhook</span>
                </div>
                <span className="text-muted-foreground font-mono">0.00ms Latency</span>
              </div>
            </div>

            {/* Feature 2: Dual AI Cascade */}
            <div className="bento-card p-8 border border-border/80 flex flex-col justify-between group">
              <div>
                <div className="h-10 w-10 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center mb-5 shadow-sm">
                  <Brain className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground font-heading mb-2">Dual AI Extraction Cascade</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Gemini 1.5 Flash parses unstructured emails and PDF notices, with automatic Groq LLaMA 3 fallback for 99.9% extraction reliability.
                </p>
              </div>
              <div className="pt-6">
                <span className="text-[11px] font-bold px-3 py-1 rounded-lg bg-purple-500/10 text-purple-500 border border-purple-500/20">
                  ⚡ 99.9% Extraction Accuracy
                </span>
              </div>
            </div>

            {/* Feature 3: Predictive Profile Fit */}
            <div className="bento-card p-8 border border-border/80 flex flex-col justify-between group">
              <div>
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mb-5 shadow-sm">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground font-heading mb-2">Predictive Profile Fit Scoring</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Evaluates weighted profile compatibility across 5 parameters: Skills (40%), CGPA (20%), Branch (15%), Experience (15%), and Location (10%).
                </p>
              </div>
              <div className="pt-6">
                <span className="text-[11px] font-bold px-3 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  🎯 5-Tier Weighted Algorithm
                </span>
              </div>
            </div>

            {/* Feature 4: Google Calendar & Form Autofill (Large) */}
            <div className="bento-card p-8 border border-border/80 md:col-span-2 flex flex-col justify-between group">
              <div>
                <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mb-5 shadow-sm">
                  <Calendar className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold text-foreground font-heading mb-2">Google Calendar &amp; Puppeteer Autofill</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                  Automatically syncs application deadlines, OA tests, and interview schedules into Google Calendar with automated reminders. Puppeteer pre-populates application form fields using your profile data.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-background/80 border border-border/60 font-semibold text-foreground text-center">
                  🗓️ Auto Calendar Events
                </div>
                <div className="p-3 rounded-xl bg-background/80 border border-border/60 font-semibold text-foreground text-center">
                  ⏰ 24h &amp; 2h Reminders
                </div>
                <div className="p-3 rounded-xl bg-background/80 border border-border/60 font-semibold text-foreground text-center col-span-2 sm:col-span-1">
                  🤖 1-Click Form Autofill
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WORKFLOW STEPPER */}
        <section className="border-t border-border/80 bg-secondary/20 py-20">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center max-w-xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-3 py-1 rounded-full bg-secondary border border-border">
                Simple Setup
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight text-foreground mt-3 mb-2 font-heading">
                Four Steps to Automation
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bento-card p-6 border border-border/80 space-y-3">
                <span className="text-xs font-mono font-bold text-muted-foreground px-2 py-1 rounded bg-secondary border border-border">STEP 01</span>
                <h4 className="text-base font-bold text-foreground font-heading">Connect Google Account</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sign in securely with Google OAuth 2.0 to grant Gmail &amp; Calendar API permissions.
                </p>
              </div>

              <div className="bento-card p-6 border border-border/80 space-y-3">
                <span className="text-xs font-mono font-bold text-muted-foreground px-2 py-1 rounded bg-secondary border border-border">STEP 02</span>
                <h4 className="text-base font-bold text-foreground font-heading">Automatic Detection</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Inbound placement notices from your TPO cell are intercepted in real-time.
                </p>
              </div>

              <div className="bento-card p-6 border border-border/80 space-y-3">
                <span className="text-xs font-mono font-bold text-muted-foreground px-2 py-1 rounded bg-secondary border border-border">STEP 03</span>
                <h4 className="text-base font-bold text-foreground font-heading">AI Fit Evaluation</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Extracts company details, role requirements, and calculates your personal match score.
                </p>
              </div>

              <div className="bento-card p-6 border border-border/80 space-y-3">
                <span className="text-xs font-mono font-bold text-muted-foreground px-2 py-1 rounded bg-secondary border border-border">STEP 04</span>
                <h4 className="text-base font-bold text-foreground font-heading">Sync &amp; Apply</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Deadlines are added to your Google Calendar and forms are ready for 1-click submission.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="container mx-auto px-4 py-20 max-w-5xl">
          <div className="bento-card p-8 sm:p-14 text-center border border-border/80 relative overflow-hidden bg-zinc-950 text-white dark:bg-zinc-900 shadow-2xl">
            <div className="max-w-2xl mx-auto space-y-5 relative z-10">
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Ready for Campus Placements 2026?</span>
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight font-heading text-white">
                Never miss another placement deadline.
              </h2>
              <p className="text-xs sm:text-base text-zinc-400 leading-relaxed max-w-lg mx-auto">
                Join thousands of students automating their placement drive workflow from email detection to application.
              </p>
              <div className="pt-3">
                <Link href="/auth/signin">
                  <Button 
                    size="lg" 
                    className="h-12 px-8 text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-100 rounded-2xl transition-all shadow-xl gap-2"
                  >
                    Connect with Google Account
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/80 py-8 bg-card">
        <div className="container mx-auto px-4 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <span className="font-extrabold text-foreground font-heading">PlaceMate AI</span>
            <span>• Placement Automation &amp; Management Platform</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-500 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </span>
            <span className="text-border">|</span>
            <span>© 2026 PlaceMate AI</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
