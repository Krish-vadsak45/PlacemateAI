"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Scale,
  Share2,
  Printer,
  Sparkles,
  MapPin,
  Clock,
  Briefcase,
  GraduationCap,
  Building2,
  DollarSign,
  CheckCircle2,
  ExternalLink,
  Check,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileCode,
  ArrowRight,
  Eye,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import PlacementComparisonCharts from '@/components/placement/PlacementComparisonCharts';
import AiComparisonCard from '@/components/placement/AiComparisonCard';

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

interface SharedData {
  shareId: string;
  title: string;
  creatorName: string;
  placements: PlacementDetail[];
  userProfile?: {
    skills?: string[];
    cgpa?: number;
    branch?: string;
  };
  views: number;
  createdAt: string;
}

export default function PublicSharedComparisonPage() {
  const params = useParams();
  const shareId = params?.shareId as string;

  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!shareId) return;

    const fetchSharedComparison = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/placements/compare/share/${shareId}`);
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || 'Shared comparison not found or expired');
        }
        setData(result.sharedComparison);
      } catch (err: any) {
        console.error('Failed to load shared comparison:', err);
        setError(err.message || 'Failed to load shared comparison');
      } finally {
        setLoading(false);
      }
    };

    fetchSharedComparison();
  }, [shareId]);

  const placements = useMemo(() => data?.placements || [], [data]);
  const userProfile = useMemo(() => data?.userProfile || {}, [data]);

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

  const bestMatchScore = useMemo(() => {
    if (placements.length === 0) return 0;
    return Math.max(...placements.map((p) => p.matchScore || 0));
  }, [placements]);

  const handleCopyLink = async () => {
    const url = window.location.href;
    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        success = true;
      }
    } catch (e) {
      console.warn('Clipboard write failed, trying fallback', e);
    }

    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        textArea.remove();
      } catch (err) {
        console.error(err);
      }
    }

    if (success) {
      setCopiedLink(true);
      toast.success('Public comparison link copied!');
      setTimeout(() => setCopiedLink(false), 2500);
    } else {
      window.prompt('Copy public link:', url);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (placements.length === 0) return;
    try {
      const exportRows = placements.map((p) => ({
        'Company Name': p.companyName,
        'Job Role': p.jobRole,
        'Package / CTC': p.package || 'Not specified',
        'Location': p.location || 'Not specified',
        'Status': p.status ? p.status.replace(/_/g, ' ') : 'N/A',
        'Minimum CGPA Cutoff': p.eligibility?.minimumCGPA ?? 'No cutoff',
        'Allowed Branches': p.eligibility?.allowedBranches?.length
          ? p.eligibility.allowedBranches.join(', ')
          : 'All Branches',
        'AI Match Score': p.matchScore ? `${p.matchScore}%` : 'N/A',
        'Required Skills': p.jobRequirements?.requiredSkills?.length
          ? p.jobRequirements.requiredSkills.join(', ')
          : 'None listed',
        'Preferred Skills': p.jobRequirements?.preferredSkills?.length
          ? p.jobRequirements.preferredSkills.join(', ')
          : 'None listed',
        'Application Deadline': p.applicationDeadline
          ? new Date(p.applicationDeadline).toLocaleDateString()
          : 'No deadline',
        'Assessment / Interview Date': p.interviewDate
          ? new Date(p.interviewDate).toLocaleDateString()
          : p.assessmentDate
          ? new Date(p.assessmentDate).toLocaleDateString()
          : 'To be announced',
        'Application Link': p.applicationLink || 'None provided',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Placement Comparison');
      XLSX.writeFile(workbook, `placemate-comparison-${shareId}.xlsx`);
      toast.success('Excel spreadsheet downloaded!');
    } catch (err) {
      toast.error('Failed to export Excel file');
    }
  };

  const handleExportCSV = () => {
    if (placements.length === 0) return;
    try {
      const headers = [
        'Company Name',
        'Job Role',
        'Package / CTC',
        'Location',
        'Status',
        'Minimum CGPA',
        'Allowed Branches',
        'AI Match Score',
        'Required Skills',
        'Preferred Skills',
        'Application Deadline',
        'Assessment / Interview Date',
        'Application Link',
      ];

      const escapeCsv = (val: any) => {
        const str = String(val ?? '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const rows = placements.map((p) => [
        escapeCsv(p.companyName),
        escapeCsv(p.jobRole),
        escapeCsv(p.package || 'Not specified'),
        escapeCsv(p.location || 'Not specified'),
        escapeCsv(p.status ? p.status.replace(/_/g, ' ') : 'N/A'),
        escapeCsv(p.eligibility?.minimumCGPA ?? 'No cutoff'),
        escapeCsv(p.eligibility?.allowedBranches?.join('; ') || 'All Branches'),
        escapeCsv(p.matchScore ? `${p.matchScore}%` : 'N/A'),
        escapeCsv(p.jobRequirements?.requiredSkills?.join('; ') || 'None listed'),
        escapeCsv(p.jobRequirements?.preferredSkills?.join('; ') || 'None listed'),
        escapeCsv(p.applicationDeadline ? new Date(p.applicationDeadline).toLocaleDateString() : 'No deadline'),
        escapeCsv(
          p.interviewDate
            ? new Date(p.interviewDate).toLocaleDateString()
            : p.assessmentDate
            ? new Date(p.assessmentDate).toLocaleDateString()
            : 'To be announced'
        ),
        escapeCsv(p.applicationLink || 'None provided'),
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `placemate-comparison-${shareId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('CSV file downloaded!');
    } catch (err) {
      toast.error('Failed to export CSV file');
    }
  };

  const handleExportJSON = () => {
    if (placements.length === 0) return;
    try {
      const jsonContent = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `placemate-comparison-${shareId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('JSON dataset downloaded!');
    } catch (err) {
      toast.error('Failed to export JSON');
    }
  };

  const comparisonKpis = useMemo(() => {
    if (placements.length === 0) return null;

    let topCtc = 0;
    let topCtcCompany = '';
    let topCtcRaw = 'N/A';
    placements.forEach((p) => {
      const num = parseCtcNumeric(p.package);
      if (num > topCtc) {
        topCtc = num;
        topCtcCompany = p.companyName;
        topCtcRaw = p.package || `${num} LPA`;
      }
    });

    let topMatch = 0;
    let topMatchCompany = '';
    placements.forEach((p) => {
      if ((p.matchScore || 0) > topMatch) {
        topMatch = p.matchScore || 0;
        topMatchCompany = p.companyName;
      }
    });

    const now = Date.now();
    let earliestDeadline: Date | null = null;
    let earliestCompany = '';
    placements.forEach((p) => {
      if (p.applicationDeadline) {
        const d = new Date(p.applicationDeadline);
        if (d.getTime() > now) {
          if (!earliestDeadline || d.getTime() < earliestDeadline.getTime()) {
            earliestDeadline = d;
            earliestCompany = p.companyName;
          }
        }
      }
    });

    const userCgpa = userProfile.cgpa;
    const userBranch = userProfile.branch?.toLowerCase();
    let eligibleCount = 0;
    placements.forEach((p) => {
      const reqCgpa = p.eligibility?.minimumCGPA;
      const branches = (p.eligibility?.allowedBranches || []).map((b) => b.toLowerCase());
      const cgpaOk = !reqCgpa || (userCgpa !== undefined && userCgpa >= reqCgpa);
      const branchOk = branches.length === 0 || (userBranch && branches.some((b) => b.includes(userBranch) || userBranch.includes(b)));
      if (cgpaOk && branchOk) eligibleCount++;
    });

    return {
      topCtc: topCtcRaw !== 'N/A' ? topCtcRaw : topCtc > 0 ? `₹${topCtc} LPA` : 'Not specified',
      topCtcCompany,
      topMatch: topMatch > 0 ? `${topMatch}%` : 'N/A',
      topMatchCompany,
      earliestDeadline: earliestDeadline ? (earliestDeadline as Date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'All active',
      earliestCompany,
      eligibleCount,
      totalCount: placements.length,
    };
  }, [placements, userProfile]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      {/* 3D Mesh Glow Orbs */}
      <div className="mesh-orb top-[-100px] left-1/3 w-[600px] h-[450px] bg-gradient-to-tr from-sky-500/15 via-blue-600/10 to-transparent print:hidden" />
      <div className="mesh-orb top-[40%] right-[-100px] w-[500px] h-[500px] bg-gradient-to-br from-purple-500/15 via-pink-500/10 to-transparent print:hidden" />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl print:p-0 print:max-w-none">
        {/* Printable Document Header */}
        {placements.length > 0 && (
          <div className="hidden print:block mb-6 border-b border-zinc-300 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-black tracking-tight font-heading">PlaceMate</span>
                  <span className="text-xs text-zinc-500 font-semibold">• Campus Placement Co-Pilot</span>
                </div>
                <h2 className="text-lg font-bold text-black mt-1">Placement Comparison Matrix Report</h2>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Comparing: {placements.map((p) => p.companyName).join(' vs ')} • Shared by {data?.creatorName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Public Shared Banner (visible on web, hidden on print) */}
        <div className="glass-3d-panel rounded-2xl p-4 sm:p-5 mb-8 border border-primary/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                  Public Shared Comparison
                </span>
                {data?.views !== undefined && (
                  <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" /> {data.views} {data.views === 1 ? 'view' : 'views'}
                  </span>
                )}
              </div>
              <h1 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                {data?.title || 'Placement Comparison'}
              </h1>
              <p className="text-xs text-muted-foreground">
                Shared by <span className="font-semibold text-foreground">{data?.creatorName || 'Student'}</span> • Viewable by anyone without logging in
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className={`rounded-xl border-border text-xs font-semibold transition-all ${
                copiedLink ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : ''
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 mr-1.5" />
                  Copy Link
                </>
              )}
            </Button>

            {/* Print / Export Dropdown Menu */}
            <div className="relative" ref={exportDropdownRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportDropdownOpen((prev) => !prev)}
                className="rounded-xl border-border text-xs font-semibold gap-1.5"
              >
                <Printer className="h-3.5 w-3.5 text-primary" />
                <span>Export</span>
                <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${exportDropdownOpen ? 'rotate-180' : ''}`} />
              </Button>

              {exportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Export & Print Options
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setExportDropdownOpen(false);
                      handlePrint();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-muted/80 transition-colors group cursor-pointer"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Printer className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">Print / Save as PDF</div>
                      <div className="text-[10px] text-muted-foreground">Printable matrix sheet</div>
                    </div>
                  </button>

                  <div className="h-px bg-border/60 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setExportDropdownOpen(false);
                      handleExportExcel();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-muted/80 transition-colors group cursor-pointer"
                  >
                    <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileSpreadsheet className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">Export to Excel (.xlsx)</div>
                      <div className="text-[10px] text-muted-foreground">Formatted spreadsheet</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExportDropdownOpen(false);
                      handleExportCSV();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-muted/80 transition-colors group cursor-pointer"
                  >
                    <div className="h-8 w-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Download className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">Export to CSV (.csv)</div>
                      <div className="text-[10px] text-muted-foreground">Comma-separated values</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExportDropdownOpen(false);
                      handleExportJSON();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-muted/80 transition-colors group cursor-pointer"
                  >
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <FileCode className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">Export JSON (.json)</div>
                      <div className="text-[10px] text-muted-foreground">Raw structured dataset</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <Link href="/dashboard">
              <Button size="sm" className="rounded-xl text-xs font-bold gap-1 bg-primary text-primary-foreground">
                <span>Try PlaceMate</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="py-24 text-center space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-xs text-muted-foreground font-medium">
              Loading public shared comparison matrix...
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="glass-3d-card p-12 text-center rounded-2xl max-w-xl mx-auto my-12 space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center mx-auto shadow-md">
              <Scale className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold font-heading">Comparison Not Available</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {error}
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link href="/dashboard">
                <Button className="text-xs rounded-xl font-bold px-6">
                  Browse Placemate Opportunities
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Comparison Matrix Table */}
        {!loading && !error && placements.length > 0 && (
          <div className="space-y-8">
            {/* Real Comparison KPI Highlights */}
            {comparisonKpis && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
                <div className="glass-panel p-4 rounded-2xl border border-border shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Top Compensation</span>
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-xl font-extrabold text-foreground truncate">{comparisonKpis.topCtc}</div>
                  <p className="text-[11px] text-muted-foreground truncate">{comparisonKpis.topCtcCompany || 'Across drives'}</p>
                </div>

                <div className="glass-panel p-4 rounded-2xl border border-border shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Top Match Score</span>
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="text-xl font-extrabold text-foreground">{comparisonKpis.topMatch}</div>
                  <p className="text-[11px] text-muted-foreground truncate">{comparisonKpis.topMatchCompany || 'Best alignment'}</p>
                </div>

                <div className="glass-panel p-4 rounded-2xl border border-border shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Next Deadline</span>
                    <Clock className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="text-xl font-extrabold text-foreground truncate">{comparisonKpis.earliestDeadline}</div>
                  <p className="text-[11px] text-muted-foreground truncate">{comparisonKpis.earliestCompany || 'All active'}</p>
                </div>

                <div className="glass-panel p-4 rounded-2xl border border-border shadow-2xs space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Full Eligibility</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="text-xl font-extrabold text-foreground">
                    {comparisonKpis.eligibleCount} of {comparisonKpis.totalCount}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Meets CGPA & branch criteria</p>
                </div>
              </div>
            )}
            <div className="glass-3d-card rounded-2xl border border-border/80 overflow-hidden shadow-2xl print:border-zinc-300 print:shadow-none print:rounded-none">
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left border-collapse min-w-[700px] print:min-w-0 print:w-full">
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
                            </div>

                            <div className="flex items-center gap-1.5 pt-3 flex-wrap">
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border bg-muted text-foreground">
                                {p.status ? p.status.replace(/_/g, ' ') : 'ACTIVE'}
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
                        const reqCgpa = p.eligibility?.minimumCGPA;
                        return (
                          <td key={p._id} className="p-4 border-r border-border text-foreground">
                            {reqCgpa !== undefined ? `${reqCgpa} CGPA` : 'No Cutoff'}
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
                              <span className="font-bold text-foreground text-sm">{score}%</span>
                              <div className="w-24 bg-muted rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-primary'
                                  }`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
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
                        return (
                          <td key={p._id} className="p-4 border-r border-border">
                            {skills.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {skills.map((s, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded text-[11px] font-medium border border-border bg-card text-foreground"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">Not specified</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* SECTION: TIMELINE */}
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
            <PlacementComparisonCharts placements={placements} userProfile={userProfile} />

            {/* AI Decision Analysis */}
            <AiComparisonCard
              placementIds={placements.map((p) => p._id)}
              placements={placements}
              userProfile={userProfile}
            />
          </div>
        )}
      </main>
    </div>
  );
}

