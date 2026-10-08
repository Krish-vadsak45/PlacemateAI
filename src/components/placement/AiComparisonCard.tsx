"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2, XCircle, Award, ArrowRight, RefreshCw, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';

interface AIComparisonProps {
  placementIds: string[];
}

interface AIAnalysisResult {
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

export default function AiComparisonCard({ placementIds }: AIComparisonProps) {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

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
        body: JSON.stringify({ placementIds }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'AI comparison failed');

      setAnalysis(data.analysis);
      toast.success('AI comparison generated!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to generate AI comparison');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-primary/20 bg-card my-8 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              AI Decision Support & Pros/Cons Engine
            </h3>
            <p className="text-xs text-muted-foreground">
              Automated comparison of trade-offs, salary-to-role ratio, and personalized recommendation
            </p>
          </div>
        </div>

        <Button
          onClick={generateAIComparison}
          disabled={loading}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all shrink-0"
        >
          {loading ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
              Analyzing Placements...
            </>
          ) : analysis ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Re-analyze with AI
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 mr-2" />
              Generate AI Analysis
            </>
          )}
        </Button>
      </div>

      {!analysis && !loading && (
        <div className="py-8 text-center space-y-3">
          <Lightbulb className="h-10 w-10 text-muted-foreground mx-auto animate-pulse" />
          <p className="text-sm font-medium text-foreground">
            Click &quot;Generate AI Analysis&quot; to get instant AI-generated Pros & Cons and custom decision recommendations.
          </p>
        </div>
      )}

      {loading && (
        <div className="py-12 text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-xs text-muted-foreground font-medium">
            Comparing salary specs, eligibility, and skill matches across placements...
          </p>
        </div>
      )}

      {analysis && !loading && (
        <div className="mt-6 space-y-6">
          {/* Recommendation Banner */}
          {analysis.recommendation && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-indigo-500 shrink-0" />
                <h4 className="text-sm font-bold text-foreground">
                  AI Recommended Choice:{' '}
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {analysis.recommendation.recommendedCompany}
                  </span>
                </h4>
              </div>
              <p className="text-xs text-foreground/90 leading-relaxed mb-3">
                {analysis.recommendation.verdict}
              </p>

              {analysis.recommendation.nextSteps && analysis.recommendation.nextSteps.length > 0 && (
                <div className="pt-2 border-t border-indigo-500/20 flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-semibold text-foreground">Suggested Next Action:</span>
                  {analysis.recommendation.nextSteps.map((step, idx) => (
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
            {analysis.comparisons.map((comp) => (
              <div
                key={comp.id}
                className="p-4 rounded-xl border border-border bg-muted/30 flex flex-col justify-between"
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

                  <p className="text-xs text-muted-foreground italic mb-4">
                    &quot;{comp.keyHighlight}&quot;
                  </p>

                  {/* Pros */}
                  <div className="space-y-1.5 mb-3">
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                      Key Pros
                    </span>
                    {comp.pros.map((pro, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </div>
                    ))}
                  </div>

                  {/* Cons */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                      Trade-offs / Cons
                    </span>
                    {comp.cons.map((con, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs text-foreground">
                        <XCircle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
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
