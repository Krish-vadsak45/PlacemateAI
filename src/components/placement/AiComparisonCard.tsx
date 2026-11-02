"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2, XCircle, Award, ArrowRight, RefreshCw, Lightbulb, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface AIComparisonProps {
  placementIds: string[];
  placements?: any[];
  userProfile?: {
    skills?: string[];
    cgpa?: number;
    branch?: string;
  };
}

export interface AIAnalysisResult {
  comparisons: Array<{
    id: string;
    companyName: string;
    pros: string[];
    cons: string[];
    keyHighlight: string;
    fitRating: number;
  }>;
  recommendation: {
    recommendedId: string;
    recommendedCompany: string;
    verdict: string;
    nextSteps: string[];
  };
}

export default function AiComparisonCard({
  placementIds,
  placements = [],
  userProfile = {},
}: AIComparisonProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchedIdsRef = useRef<string>('');

  // Generate instant real-data baseline analysis so the card is NEVER empty
  const defaultBaseline = useMemo<AIAnalysisResult | null>(() => {
    if (!placements || placements.length < 2) return null;

    const userSkills = (userProfile.skills || []).map((s: string) => s.toLowerCase());
    const userCgpa = userProfile.cgpa;

    const comparisons = placements.map((p) => {
      const pros: string[] = [];
      const cons: string[] = [];

      // Package evaluation
      if (p.package) {
        pros.push(`Attractive compensation package: ${p.package}`);
      }

      // Skills evaluation
      const reqSkills = p.jobRequirements?.requiredSkills || [];
      const matched = reqSkills.filter((s: string) => userSkills.includes(s.toLowerCase()));
      const missing = reqSkills.filter((s: string) => !userSkills.includes(s.toLowerCase()));

      if (matched.length > 0) {
        pros.push(`Matches ${matched.length} key skill${matched.length > 1 ? 's' : ''} (${matched.slice(0, 3).join(', ')})`);
      }
      if (missing.length > 0) {
        cons.push(`Skill gaps in: ${missing.slice(0, 3).join(', ')}`);
      }

      // CGPA evaluation
      const reqCgpa = p.eligibility?.minimumCGPA;
      if (reqCgpa) {
        if (userCgpa !== undefined && userCgpa >= reqCgpa) {
          pros.push(`Full academic eligibility (Cutoff: ${reqCgpa} CGPA)`);
        } else if (userCgpa !== undefined) {
          cons.push(`Strict CGPA criteria (${reqCgpa} vs current ${userCgpa})`);
        }
      } else {
        pros.push('Open academic criteria with no minimum CGPA cutoff');
      }

      // Location evaluation
      if (p.location) {
        pros.push(`Office location: ${p.location}`);
      } else {
        cons.push('Work location / base office not yet finalized');
      }

      if (cons.length === 0) {
        cons.push('High competition expected during initial screening rounds');
      }

      return {
        id: p._id,
        companyName: p.companyName,
        pros: pros.slice(0, 3),
        cons: cons.slice(0, 2),
        keyHighlight: `${p.companyName} is hiring for ${p.jobRole} offering ${p.package || 'industry standard package'}.`,
        fitRating: p.matchScore || 78,
      };
    });

    // Best recommendation based on match score and package
    const sorted = [...placements].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    const top = sorted[0];

    return {
      comparisons,
      recommendation: {
        recommendedId: top._id,
        recommendedCompany: top.companyName,
        verdict: `${top.companyName} emerges as the strongest strategic recommendation with a ${top.matchScore || 85}% profile match score, strong role alignment for ${top.jobRole}, and ${top.package || 'competitive compensation'}.`,
        nextSteps: [
          `Prioritize technical preparation for ${top.companyName}'s core domain.`,
          'Review matched and missing requirements in your profile.',
        ],
      },
    };
  }, [placements, userProfile]);

  // Current active analysis: custom LLM analysis if available, otherwise instant real-data baseline
  const activeAnalysis = analysis || defaultBaseline;

  const generateAIComparison = async () => {
    if (!placementIds || placementIds.length < 2) {
      toast.error('Select at least 2 placements for AI analysis');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/placements/compare/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placementIds, userProfile }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI comparison failed');

      if (data.analysis) {
        setAnalysis(data.analysis);
        toast.success('AI Decision analysis updated!');
      }
    } catch (err: any) {
      console.warn('AI comparison request:', err);
      // If LLM has quota/network error, the instant data-driven baseline remains gracefully active
      if (!analysis && defaultBaseline) {
        toast.info('Using data-driven placement decision matrix.');
      } else {
        toast.error(err.message || 'Failed to update AI analysis');
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch deeper AI insights when placements are first loaded or changed
  useEffect(() => {
    const idsKey = placementIds.slice().sort().join(',');
    if (idsKey && idsKey.length > 5 && idsKey !== fetchedIdsRef.current && placementIds.length >= 2) {
      fetchedIdsRef.current = idsKey;
      generateAIComparison();
    }
  }, [placementIds]);

  return (
    <div className="glass-3d-card p-6 rounded-2xl my-8 print:border-zinc-300 print:shadow-none print:rounded-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                AI Decision Support & Pros/Cons Engine
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 flex items-center gap-1">
                <Zap className="h-2.5 w-2.5 fill-indigo-500" /> Live AI Engine
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Automated comparison of trade-offs, salary-to-role ratio, and personalized recommendation
            </p>
          </div>
        </div>

        <Button
          onClick={generateAIComparison}
          disabled={loading}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all shrink-0 cursor-pointer print:hidden"
        >
          {loading ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
              Analyzing Placements...
            </>
          ) : (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Re-analyze with AI
            </>
          )}
        </Button>
      </div>

      {loading && !activeAnalysis && (
        <div className="py-12 text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-xs text-muted-foreground font-medium">
            Comparing compensation, eligibility cutoffs, and skills alignment across drives...
          </p>
        </div>
      )}

      {activeAnalysis && (
        <div className="mt-6 space-y-6">
          {/* Recommendation Banner */}
          {activeAnalysis.recommendation && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-indigo-500 shrink-0" />
                <h4 className="text-sm font-bold text-foreground">
                  AI Recommended Choice:{' '}
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {activeAnalysis.recommendation.recommendedCompany}
                  </span>
                </h4>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed mb-3">
                {activeAnalysis.recommendation.verdict}
              </p>

              {activeAnalysis.recommendation.nextSteps && activeAnalysis.recommendation.nextSteps.length > 0 && (
                <div className="pt-2 border-t border-indigo-500/20 flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-semibold text-foreground">Suggested Next Actions:</span>
                  {activeAnalysis.recommendation.nextSteps.map((step, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20 text-[11px]"
                    >
                      {step}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pros & Cons Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeAnalysis.comparisons.map((comp) => (
              <div
                key={comp.id}
                className="p-4 rounded-xl border border-border bg-card/60 flex flex-col justify-between shadow-2xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <h5 className="font-bold text-sm text-foreground truncate">
                      {comp.companyName}
                    </h5>
                    {comp.fitRating !== undefined && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {comp.fitRating}% Fit
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-muted-foreground italic mb-3">
                    &ldquo;{comp.keyHighlight}&rdquo;
                  </p>

                  {/* Pros */}
                  <div className="space-y-1.5 mb-3">
                    <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Key Advantages
                    </div>
                    {comp.pros.map((pro, idx) => (
                      <div key={idx} className="text-xs text-foreground/90 flex items-start gap-1.5">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{pro}</span>
                      </div>
                    ))}
                  </div>

                  {/* Cons */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> Trade-offs & Watchouts
                    </div>
                    {comp.cons.map((con, idx) => (
                      <div key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <span className="text-rose-500 font-bold">•</span>
                        <span>{con}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
