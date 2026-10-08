"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { Placement } from "@/types/placement"
import {
  Building2,
  ExternalLink,
  Sparkles,
  RotateCw,
  Globe,
  MapPin,
  Newspaper,
  HelpCircle,
  Copy,
  Check,
  Briefcase,
  ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface NewsItem {
  title: string
  link: string
  source: string
  pubDate: string
}

interface InterviewIntel {
  elevatorPitch: string
  keyProducts: string[]
  engineeringCulture: string
  interviewQuestionsToAsk: string[]
}

interface CompanyResearchData {
  companyKey: string
  displayName: string
  domain?: string
  logoUrl?: string
  industry?: string
  description?: string
  headquarters?: string
  websiteUrl?: string
  wikipediaUrl?: string
  recentNews?: NewsItem[]
  interviewIntel?: InterviewIntel
  lastUpdated?: string
}

interface CompanyResearchCardProps {
  placement: Placement
}

export function CompanyResearchCard({ placement }: CompanyResearchCardProps) {
  const [data, setData] = useState<CompanyResearchData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copiedPitch, setCopiedPitch] = useState(false)
  const [imgError, setImgError] = useState(false)

  const fetchResearch = async (refresh = false) => {
    try {
      if (refresh) setIsRefreshing(true)
      else setIsLoading(true)

      const res = await fetch(
        `/api/placements/${placement._id}/company-research${refresh ? "?refresh=true" : ""}`
      )

      if (res.ok) {
        const json = await res.json()
        setData(json.research)
        setImgError(false)
        if (refresh) {
          toast.success(`Updated company research for ${placement.companyName}`)
        }
      } else {
        toast.error("Failed to load company research")
      }
    } catch (err) {
      console.error("Error loading company research:", err)
      toast.error("Failed to load company research")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchResearch(false)
  }, [placement._id, placement.companyName])

  const copyToClipboard = (text: string, type: "pitch" | number) => {
    navigator.clipboard.writeText(text)
    if (type === "pitch") {
      setCopiedPitch(true)
      setTimeout(() => setCopiedPitch(false), 2000)
    } else {
      setCopiedIndex(type)
      setTimeout(() => setCopiedIndex(null), 2000)
    }
    toast.success("Copied to clipboard!")
  }

  return (
    <div className="glass-panel rounded-2xl p-6 border border-border shadow-sm space-y-6 bg-card/60 backdrop-blur-sm">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3.5">
          {/* Logo or Initials */}
          <div className="h-12 w-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
            {data?.logoUrl && !imgError ? (
              <Image
                src={data.logoUrl}
                alt={placement.companyName}
                width={32}
                height={32}
                className="h-8 w-8 object-contain"
                onError={() => setImgError(true)}
                unoptimized={data.logoUrl.startsWith('data:') || data.logoUrl.endsWith('.svg')}
              />
            ) : (
              <span className="font-bold text-lg text-foreground">
                {placement.companyName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-base text-foreground tracking-tight">
                {data?.displayName || placement.companyName}
              </h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                Company Intel
              </span>
            </div>

            <p className="text-xs text-muted-foreground line-clamp-1">
              {data?.industry || "Technology & Business"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {data?.websiteUrl && (
            <a
              href={data.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted/60 hover:bg-muted border border-border transition-colors"
            >
              <Globe className="h-3 w-3" />
              Website
            </a>
          )}

          {data?.wikipediaUrl && (
            <a
              href={data.wikipediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-muted/60 hover:bg-muted border border-border transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Wikipedia
            </a>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => fetchResearch(true)}
            disabled={isLoading || isRefreshing}
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            title="Refresh company intelligence"
          >
            <RotateCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
            />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
          <RotateCw className="h-6 w-6 animate-spin text-primary" />
          <span className="text-xs">Aggregating company intelligence for {placement.companyName}...</span>
        </div>
      ) : !data ? (
        <div className="text-center py-8 text-xs text-muted-foreground">
          No research data available. Click refresh to aggregate data.
        </div>
      ) : (
        <div className="space-y-5 text-xs sm:text-sm">
          {/* ELEVATOR PITCH / INTERVIEW ANSWER */}
          {data.interviewIntel?.elevatorPitch && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  30-Second Interview Pitch ("Tell me what you know about us")
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(data.interviewIntel!.elevatorPitch, "pitch")
                  }
                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  {copiedPitch ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy Answer
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed italic">
                "{data.interviewIntel.elevatorPitch}"
              </p>
            </div>
          )}

          {/* OVERVIEW & HEADQUARTERS */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              About the Company
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {data.description}
            </p>
            {data.headquarters && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                <span>Headquarters: <strong className="text-foreground font-medium">{data.headquarters}</strong></span>
              </div>
            )}
          </div>

          {/* KEY PRODUCTS */}
          {data.interviewIntel?.keyProducts && data.interviewIntel.keyProducts.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                Key Offerings & Platforms
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {data.interviewIntel.keyProducts.map((prod, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center text-xs px-2.5 py-1 rounded-lg bg-muted text-foreground border border-border/80 font-medium"
                  >
                    {prod}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ENGINEERING CULTURE */}
          {data.interviewIntel?.engineeringCulture && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Work & Tech Culture
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {data.interviewIntel.engineeringCulture}
              </p>
            </div>
          )}

          {/* QUESTIONS TO ASK THE INTERVIEWER */}
          {data.interviewIntel?.interviewQuestionsToAsk &&
            data.interviewIntel.interviewQuestionsToAsk.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
                  Smart Questions to Ask Your Interviewer
                </h4>
                <div className="space-y-2">
                  {data.interviewIntel.interviewQuestionsToAsk.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-card border border-border flex items-start justify-between gap-3 text-xs group hover:border-primary/40 transition-colors"
                    >
                      <span className="text-foreground/90 leading-normal flex-1">
                        "{q}"
                      </span>
                      <button
                        onClick={() => copyToClipboard(q, idx)}
                        className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                        title="Copy question"
                      >
                        {copiedIndex === idx ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* LIVE RECENT NEWS */}
          {data.recentNews && data.recentNews.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Newspaper className="h-3.5 w-3.5 text-primary" />
                  Recent Hiring & Business News
                </h4>
                <span className="text-[10px] text-muted-foreground">Google News RSS</span>
              </div>

              <div className="space-y-2">
                {data.recentNews.map((news, idx) => (
                  <a
                    key={idx}
                    href={news.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/80 flex items-center justify-between gap-3 text-xs transition-colors group block"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {news.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span>{news.source}</span>
                        {news.pubDate && <span>• {news.pubDate}</span>}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CompanyResearchCard
