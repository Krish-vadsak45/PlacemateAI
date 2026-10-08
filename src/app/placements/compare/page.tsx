"use client";

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useComparison } from '@/context/ComparisonContext';
import PlacementComparisonCharts from '@/components/placement/PlacementComparisonCharts';
import AiComparisonCard from '@/components/placement/AiComparisonCard';
import SavedComparisonsModal from '@/components/placement/SavedComparisonsModal';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Scale,
  Share2,
  Printer,
  Bookmark,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Sparkles,
  MapPin,
  Clock,
  Briefcase,
  GraduationCap,
  FileText,
  Building2,
  Plus,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface PlacementDetail {
  _id: string;
  companyName: string;
  jobRole: string;
  package?: string;
  location?: string;
  eligibility?: {
    minimumCGPA?: number;
    allowedBranches?: string[];
  };
  applicationDeadline?: string;
  assessmentDate?: string;
  interviewDate?: string;
  status: string;
  applicationLink?: string;
  matchScore?: number;
  matchBreakdown?: {
    skillsMatch: number;
    cgpaMatch: number;
    branchMatch: number;
    experienceMatch: number;
    locationMatch: number;
    overallScore: number;
  };
  jobRequirements?: {
    requiredSkills?: string[];
    preferredSkills?: string[];
    responsibilities?: string[];
  };
  tags?: string[];
}

interface UserProfile {
  skills?: string[];
  cgpa?: number;
  branch?: string;
}

function ComparisonPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addItem, removeItem, clearAll } = useComparison();

  const [placements, setPlacements] = useState<PlacementDetail[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [loading, setLoading] = useState(true);
  const [savedModalOpen, setSavedModalOpen] = useState(false);

  const idsParam = searchParams.get('ids') || '';

  const activeIds = useMemo(() => {
    return idsParam
      .split(',')
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
  }, [idsParam]);

  useEffect(() => {
    if (activeIds.length > 0) {
      fetchComparisonData(activeIds);
    } else {
      setPlacements([]);
      setLoading(false);
    }
  }, [activeIds]);

  const fetchComparisonData = async (ids: string[]) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/placements/compare?ids=${ids.join(',')}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load comparison');

      setPlacements(data.placements || []);
      setUserProfile(data.userProfile || {});

      // Sync with local comparison state context
      (data.placements || []).forEach((p: PlacementDetail) => {
        addItem({
          id: p._id,
          companyName: p.companyName,
          jobRole: p.jobRole,
          package: p.package,
        });
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to fetch comparison');
    } finally {
      setLoading(false);
    }
  };

  const handleShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Shareable link copied to clipboard!');
  };

  const handlePrint = () => {
    window.print();
  };

  const removePlacementFromView = (id: string) => {
    const updatedIds = activeIds.filter((i) => i !== id);
    removeItem(id);
    if (updatedIds.length > 0) {
      router.push(`/placements/compare?ids=${updatedIds.join(',')}`);
    } else {
      router.push('/placements');
    }
  };

  // Find best numerical package & best match score for diff highlighting
  const bestMatchScore = useMemo(() => {
    if (placements.length === 0) return 0;
    return Math.max(...placements.map((p) => p.matchScore || 0));
  }, [placements]);

  const parseCtcNumeric = (packageStr?: string): number => {
    if (!packageStr) return 0;
    const cleanStr = packageStr.toLowerCase().replace(/,/g, '');
    const numberMatch = cleanStr.match(/(\d+(\.\d+)?)/);
    if (numberMatch) {
      return parseFloat(numberMatch[1]);
    }
    return 0;
  };

  const highestCtc = useMemo(() => {
    if (placements.length === 0) return 0;
    return Math.max(...placements.map((p) => parseCtcNumeric(p.package)));
  }, [placements]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl print:p-0 print:max-w-none">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:hidden">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Scale className="h-4 w-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Placement Comparison Matrix</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSavedModalOpen(true)}
              className="rounded-xl border-border text-xs font-semibold"
            >
              <Bookmark className="h-3.5 w-3.5 mr-1.5 text-primary" />
              Saved Sets
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShareLink}
              className="rounded-xl border-border text-xs font-semibold"
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5" />
              Share Link
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="rounded-xl border-border text-xs font-semibold"
            >
              <Printer className="h-3.5 w-3.5 mr-1.5" />
              Print / Export
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {!loading && placements.length < 2 && (
          <div className="glass-panel p-12 text-center rounded-2xl border border-border max-w-xl mx-auto my-12 space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 text-muted-foreground flex items-center justify-center mx-auto">
              <Scale className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold">Select Placements to Compare</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You need at least 2 placements selected to run side-by-side spec comparison, visual charts, and AI decision analysis.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link href="/placements">
                <Button className="bg-primary text-primary-foreground text-xs rounded-xl font-semibold px-5">
                  Browse Placements List
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => setSavedModalOpen(true)}
                className="text-xs rounded-xl"
              >
                Load Saved Sets
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-20 text-center space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-xs text-muted-foreground font-medium">
              Loading placement details for comparison...
            </p>
          </div>
        )}

        {/* Comparison Table / Matrix View */}
        {!loading && placements.length >= 2 && (
          <div className="space-y-8">
            {/* Spec Matrix Table */}
            <div className="glass-panel rounded-2xl border border-border overflow-hidden bg-card shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="p-4 w-56 text-xs font-bold uppercase tracking-wider text-muted-foreground sticky left-0 bg-card/95 backdrop-blur z-10 border-r border-border">
                        Features & Details
                      </th>
                      {placements.map((p) => {
                        const isBestCtc = parseCtcNumeric(p.package) === highestCtc && highestCtc > 0;
                        const isBestMatch = (p.matchScore || 0) === bestMatchScore && bestMatchScore > 0;

                        return (
                          <th key={p._id} className="p-4 text-left align-top border-r border-border min-w-[220px]">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 border border-primary/20">
                                  {p.companyName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h3 className="font-bold text-sm text-foreground">{p.companyName}</h3>
                                  <p className="text-xs text-muted-foreground">{p.jobRole}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => removePlacementFromView(p._id)}
                                className="text-muted-foreground hover:text-rose-500 p-1 rounded-lg transition-colors print:hidden"
                                title="Remove placement"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5 pt-3 flex-wrap">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border bg-muted text-foreground">
                                {p.status.replace(/_/g, ' ')}
                              </span>

                              {isBestMatch && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                  <Sparkles className="h-2.5 w-2.5" /> Best Match ({p.matchScore}%)
                                </span>
                              )}

                              {isBestCtc && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  Top CTC
                                </span>
                              )}
                            </div>

                            {p.applicationLink && (
                              <a
                                href={p.applicationLink}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline mt-2 print:hidden"
                              >
                                Apply Link <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-border text-xs">
                    {/* SECTION: BASIC INFO */}
                    <tr className="bg-muted/20 font-bold">
                      <td colSpan={placements.length + 1} className="p-2.5 text-muted-foreground text-[11px] uppercase tracking-wider">
                        Compensation & Location
                      </td>
                    </tr>

                    <tr>
                      <td className="p-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Package / CTC</span>
                        </div>
                      </td>
                      {placements.map((p) => {
                        const isHighest = parseCtcNumeric(p.package) === highestCtc && highestCtc > 0;
                        return (
                          <td
                            key={p._id}
                            className={`p-4 border-r border-border font-bold text-sm ${
                              isHighest ? 'bg-amber-500/5 text-amber-600 dark:text-amber-400' : 'text-foreground'
                            }`}
                          >
                            {p.package || 'Not specified'}
                          </td>
                        );
                      })}
                    </tr>

                    <tr>
                      <td className="p-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Location</span>
                        </div>
                      </td>
                      {placements.map((p) => (
                        <td key={p._id} className="p-4 border-r border-border text-foreground">
                          {p.location || 'Not specified'}
                        </td>
                      ))}
                    </tr>

                    {/* SECTION: ELIGIBILITY & MATCH */}
                    <tr className="bg-muted/20 font-bold">
                      <td colSpan={placements.length + 1} className="p-2.5 text-muted-foreground text-[11px] uppercase tracking-wider">
                        Eligibility & Match Fit
                      </td>
                    </tr>

                    <tr>
                      <td className="p-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Minimum CGPA</span>
                        </div>
                      </td>
                      {placements.map((p) => {
                        const userCgpa = userProfile.cgpa;
                        const reqCgpa = p.eligibility?.minimumCGPA;
                        const isEligible = !reqCgpa || (userCgpa !== undefined && userCgpa >= reqCgpa);

                        return (
                          <td key={p._id} className="p-4 border-r border-border">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">
                                {reqCgpa !== undefined ? `${reqCgpa} CGPA` : 'No Cutoff'}
                              </span>
                              {reqCgpa !== undefined && (
                                isEligible ? (
                                  <span className="text-[10px] text-emerald-600 font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10">Eligible</span>
                                ) : (
                                  <span className="text-[10px] text-rose-600 font-semibold px-1.5 py-0.5 rounded bg-rose-500/10">Below Cutoff</span>
                                )
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    <tr>
                      <td className="p-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Allowed Branches</span>
                        </div>
                      </td>
                      {placements.map((p) => (
                        <td key={p._id} className="p-4 border-r border-border">
                          {p.eligibility?.allowedBranches && p.eligibility.allowedBranches.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {p.eligibility.allowedBranches.map((b, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded bg-muted text-[11px] text-foreground">
                                  {b}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">All Branches Eligible</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="p-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>AI Match Score</span>
                        </div>
                      </td>
                      {placements.map((p) => {
                        const score = p.matchScore || 0;
                        return (
                          <td key={p._id} className="p-4 border-r border-border">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-muted rounded-full h-2 overflow-hidden flex-1">
                                <div
                                  className={`h-full rounded-full ${
                                    score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-primary'
                                  }`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                              <span className="font-bold text-xs text-foreground shrink-0">{score}%</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* SECTION: SKILLS */}
                    <tr className="bg-muted/20 font-bold">
                      <td colSpan={placements.length + 1} className="p-2.5 text-muted-foreground text-[11px] uppercase tracking-wider">
                        Required & Preferred Skills
                      </td>
                    </tr>

                    <tr>
                      <td className="p-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">
                        <span>Required Skills</span>
                      </td>
                      {placements.map((p) => {
                        const skills = p.jobRequirements?.requiredSkills || [];
                        const userSkillsLower = (userProfile.skills || []).map((s) => s.toLowerCase());

                        return (
                          <td key={p._id} className="p-4 border-r border-border">
                            {skills.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {skills.map((skill, idx) => {
                                  const isMatched = userSkillsLower.includes(skill.toLowerCase());
                                  return (
                                    <span
                                      key={idx}
                                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                                        isMatched
                                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                                          : 'bg-muted text-muted-foreground border-border'
                                      }`}
                                    >
                                      {isMatched ? '✓ ' : ''}{skill}
                                    </span>
                                  );
                                })}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">Not specified</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* SECTION: DATES & PROCESS */}
                    <tr className="bg-muted/20 font-bold">
                      <td colSpan={placements.length + 1} className="p-2.5 text-muted-foreground text-[11px] uppercase tracking-wider">
                        Timeline & Dates
                      </td>
                    </tr>

                    <tr>
                      <td className="p-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Application Deadline</span>
                        </div>
                      </td>
                      {placements.map((p) => (
                        <td key={p._id} className="p-4 border-r border-border text-foreground">
                          {p.applicationDeadline
                            ? new Date(p.applicationDeadline).toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'No Deadline Specified'}
                        </td>
                      ))}
                    </tr>

                    <tr>
                      <td className="p-4 font-semibold text-foreground sticky left-0 bg-card border-r border-border">
                        <span>Assessment / Interview Date</span>
                      </td>
                      {placements.map((p) => (
                        <td key={p._id} className="p-4 border-r border-border text-foreground">
                          {p.interviewDate
                            ? new Date(p.interviewDate).toLocaleDateString()
                            : p.assessmentDate
                            ? new Date(p.assessmentDate).toLocaleDateString()
                            : 'To be announced'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual Comparison Charts */}
            <PlacementComparisonCharts placements={placements} />

            {/* AI Decision Analysis */}
            <AiComparisonCard placementIds={activeIds} />
          </div>
        )}

        {/* Saved Modal */}
        <SavedComparisonsModal
          currentPlacementIds={activeIds}
          onLoadComparison={(ids) => router.push(`/placements/compare?ids=${ids.join(',')}`)}
          isOpen={savedModalOpen}
          onClose={() => setSavedModalOpen(false)}
        />
      </main>
    </div>
  );
}

export default function PlacementComparisonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <ComparisonPageContent />
    </Suspense>
  );
}
