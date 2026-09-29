"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Sparkles, 
  ArrowRight, 
  Calendar, 
  Brain, 
  Zap, 
  Briefcase, 
  Check, 
  Mail, 
  Clock, 
  ChevronRight,
  TrendingUp,
  FileText
} from "lucide-react"
import { motion } from "framer-motion"

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { y: 24, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-x-hidden">
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="container mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-28 max-w-5xl text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="flex flex-col items-center"
          >
            {/* Pill Tag */}
            <motion.div variants={itemVariants} className="mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                <Sparkles className="h-3 w-3 text-zinc-600 dark:text-zinc-400" />
                <span>AI Placement Assistant • Gmail &amp; Calendar Integration</span>
              </span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              variants={itemVariants}
              className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight max-w-4xl leading-[1.1] mb-6 font-heading text-foreground"
            >
              Never miss a campus drive.{" "}
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                Structured. Automated.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              variants={itemVariants}
              className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Converts unstructured placement emails into structured opportunities, creates smart Google Calendar deadlines, and calculates weighted eligibility scores.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-3 justify-center items-center w-full max-w-sm mb-16"
            >
              <Link href="/auth/signin" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto h-11 px-7 text-xs font-semibold rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm transition-all gap-2"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="#features" className="w-full sm:w-auto">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto h-11 px-6 text-xs font-medium rounded-xl border-border bg-card hover:bg-muted/70 transition-all gap-1.5"
                >
                  Learn More
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </Link>
            </motion.div>

            {/* SHOWCASE PREVIEW CARD */}
            <motion.div 
              variants={itemVariants}
              className="w-full max-w-4xl mx-auto rounded-2xl border border-border bg-card shadow-sm text-left p-6 sm:p-8"
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 flex items-center justify-center font-bold text-base">
                    G
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">Google Cloud</h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium border border-zinc-200 dark:border-zinc-700">
                        Campus Drive
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">Software Engineer • 2026 Batch</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border">
                    94% Match Score
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-foreground border border-border">
                    ₹24.0 LPA
                  </span>
                </div>
              </div>

              {/* Pipeline visual steps */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 py-6">
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                    <Mail className="h-3.5 w-3.5" />
                    1. Gmail Ingestion
                  </div>
                  <p className="text-xs font-medium text-foreground">Auto-detected notice</p>
                  <span className="text-[10px] text-muted-foreground mt-1 inline-block">Processed in 0.8s</span>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                    <Brain className="h-3.5 w-3.5" />
                    2. AI Extraction
                  </div>
                  <p className="text-xs font-medium text-foreground">Extracted role, CTC, dates</p>
                  <span className="text-[10px] text-muted-foreground mt-1 inline-block">Gemini + Groq cascade</span>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                    <Calendar className="h-3.5 w-3.5" />
                    3. Google Calendar
                  </div>
                  <p className="text-xs font-medium text-foreground">Deadline: Oct 15, 11:59 PM</p>
                  <span className="text-[10px] text-muted-foreground mt-1 inline-block">Reminder set 24h prior</span>
                </div>

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60">
                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground mb-1">
                    <Zap className="h-3.5 w-3.5" />
                    4. Form Autofill
                  </div>
                  <p className="text-xs font-medium text-foreground">Pre-filled with profile data</p>
                  <span className="text-[10px] text-muted-foreground mt-1 inline-block">Ready to submit</span>
                </div>
              </div>

              {/* Footer strip */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-zinc-500" /> CGPA &gt;= 7.5
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-zinc-500" /> CS / IT Eligible
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-zinc-500" /> Skills Matched
                  </span>
                </div>
                <span className="font-medium text-foreground">
                  PlaceMate AI
                </span>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* METRICS STRIP */}
        <section className="border-y border-border bg-muted/20 py-8">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-bold text-foreground font-heading">100%</p>
                <p className="text-xs text-muted-foreground font-medium">Email Ingestion</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-bold text-foreground font-heading">&lt; 5s</p>
                <p className="text-xs text-muted-foreground font-medium">Extraction Speed</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-bold text-foreground font-heading">5-Tier</p>
                <p className="text-xs text-muted-foreground font-medium">Weighted Match Engine</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-bold text-foreground font-heading">0</p>
                <p className="text-xs text-muted-foreground font-medium">Missed Deadlines</p>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section id="features" className="container mx-auto px-4 py-20 max-w-5xl">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1 mb-2 font-heading">
              A Complete Placement Workflow
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Built to simplify college placement recruitment drives from email to application.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1 */}
            <div className="rounded-2xl p-6 border border-border bg-card space-y-3">
              <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground flex items-center justify-center">
                <Mail className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-foreground">Zero-Cost Email Detection</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect your Gmail inbox. Our rule-based filter identifies placement notices without wasteful tokens, triggering BullMQ queue jobs.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl p-6 border border-border bg-card space-y-3 md:col-span-2">
              <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground flex items-center justify-center">
                <Brain className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-foreground">Dual AI Extraction Cascade</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Gemini 1.5 Flash parses unstructured placement notices and tables, with seamless Groq LLaMA 3 fallback and regex safety nets for 99%+ extraction reliability.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="p-2 rounded-lg bg-muted/40 border border-border/50 text-center">
                  <p className="font-semibold text-foreground">Package</p>
                  <span className="text-[10px] text-muted-foreground">CTC Breakdown</span>
                </div>
                <div className="p-2 rounded-lg bg-muted/40 border border-border/50 text-center">
                  <p className="font-semibold text-foreground">Dates</p>
                  <span className="text-[10px] text-muted-foreground">Deadlines &amp; Tests</span>
                </div>
                <div className="p-2 rounded-lg bg-muted/40 border border-border/50 text-center">
                  <p className="font-semibold text-foreground">Criteria</p>
                  <span className="text-[10px] text-muted-foreground">CGPA &amp; Branches</span>
                </div>
                <div className="p-2 rounded-lg bg-muted/40 border border-border/50 text-center">
                  <p className="font-semibold text-foreground">Forms</p>
                  <span className="text-[10px] text-muted-foreground">Registration Links</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl p-6 border border-border bg-card space-y-3 md:col-span-2">
              <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-foreground">Predictive Profile Fit Scoring</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Calculates weighted match scores: Skills (40%), CGPA (20%), Branch (15%), Experience (15%), and Location (10%), highlighting missing skills prior to interviews.
              </p>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl p-6 border border-border bg-card space-y-3">
              <div className="h-9 w-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-foreground flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-foreground">Calendar &amp; Autofill</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Creates idempotent reminders in Google Calendar for deadlines and interview rounds. Puppeteer pre-populates application forms.
              </p>
            </div>
          </div>
        </section>

        {/* WORKFLOW STEPS */}
        <section className="border-t border-border bg-muted/10 py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Workflow
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mt-1 mb-2 font-heading">
                Four Steps from Notice to Application
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
                <span className="text-xs font-mono font-bold text-muted-foreground">01</span>
                <h4 className="text-sm font-bold text-foreground">Sign In</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Authenticate with Google OAuth. Your tokens are securely stored and refreshed.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
                <span className="text-xs font-mono font-bold text-muted-foreground">02</span>
                <h4 className="text-sm font-bold text-foreground">Auto-Ingest</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Inbound emails from your placement cell are intercepted in real-time.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
                <span className="text-xs font-mono font-bold text-muted-foreground">03</span>
                <h4 className="text-sm font-bold text-foreground">AI Structure</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Extracts role, package, and dates, then evaluates eligibility against your profile.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
                <span className="text-xs font-mono font-bold text-muted-foreground">04</span>
                <h4 className="text-sm font-bold text-foreground">Sync &amp; Apply</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Receive calendar reminders, autofill forms, and manage your placement pipeline.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="rounded-3xl border border-border bg-zinc-950 text-white dark:bg-zinc-900 p-8 sm:p-12 text-center shadow-sm">
            <div className="max-w-xl mx-auto space-y-4">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight font-heading">
                Ready to organize your placement drives?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Connect your college Gmail and never miss an application deadline again.
              </p>
              <div className="pt-2">
                <Link href="/auth/signin">
                  <Button 
                    size="lg" 
                    className="h-11 px-7 text-xs font-semibold bg-white text-zinc-950 hover:bg-zinc-100 rounded-xl transition-all"
                  >
                    Connect with Google
                    <ArrowRight className="h-3.5 w-3.5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border py-6 bg-card">
        <div className="container mx-auto px-4 max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">PlaceMate AI</span>
            <span>• Placement Management Platform</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
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
