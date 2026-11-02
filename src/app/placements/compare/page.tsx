"use client";

import React, { useEffect, useState, useMemo, useRef, Suspense } from 'react';
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
  DollarSign,
  Plus,
  Trash2,
  RotateCcw,
  Check,
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import * as XLSX from 'xlsx';
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
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
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

  const handleShareLink = async () => {
    if (activeIds.length === 0 || placements.length === 0) {
      toast.warning('No placements selected to share.');
      return;
    }

    setIsSharing(true);
    let shareUrl = `${window.location.origin}/placements/compare?ids=${activeIds.join(',')}`;

    try {
      // Create public share snapshot like ChatGPT public share chats
      const res = await fetch('/api/placements/compare/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placementIds: activeIds,
          placements,
          userProfile,
          title: placements.map((p) => p.companyName).join(' vs '),
        }),
      });

      if (res.ok) {
        const shareData = await res.json();
        if (shareData.shareId) {
          // Always prioritize current browser origin so the link matches ngrok/domain exactly
          shareUrl = `${window.location.origin}/placements/compare/share/${shareData.shareId}`;
        } else if (shareData.shareUrl) {
          shareUrl = shareData.shareUrl;
        }
      }
    } catch (apiErr) {
      console.warn('Dedicated share creation failed, falling back to direct URL', apiErr);
    } finally {
      setIsSharing(false);
    }

    // On mobile devices, check if native Web Share is supported
    if (typeof navigator !== 'undefined' && navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: 'Placement Comparison | PlaceMate',
          text: `Compare ${placements.map((p) => p.companyName).join(' vs ')} on PlaceMate`,
          url: shareUrl,
        });
        toast.success('Public comparison link shared!');
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
        success = true;
      }
    } catch (err) {
      console.warn('Clipboard writeText failed, trying fallback', err);
    }

    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        success = document.execCommand('copy');
        textArea.remove();
      } catch (fallbackErr) {
        console.error('Fallback copy failed', fallbackErr);
      }
    }

    if (success) {
      setCopiedLink(true);
      toast.success('Public share link copied to clipboard!', {
        description: 'Anyone with this link can view this comparison in any browser without logging in.',
      });
      setTimeout(() => setCopiedLink(false), 2500);
    } else {
      window.prompt('Copy this public share link:', shareUrl);
    }
  };

  const handlePrint = () => {
    if (placements.length === 0) {
      toast.warning('Select placements to print.');
      return;
    }
    window.print();
  };

  const handleExportExcel = () => {
    if (placements.length === 0) {
      toast.warning('Select placements to export.');
      return;
    }

    try {
      const data = placements.map((p) => ({
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

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Placement Comparison');
      XLSX.writeFile(workbook, `placemate-comparison-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel comparison spreadsheet downloaded!');
    } catch (err: any) {
      console.error('Failed to export Excel file:', err);
      toast.error('Failed to export Excel file');
    }
  };

  const handleExportCSV = () => {
    if (placements.length === 0) {
      toast.warning('Select placements to export.');
      return;
    }

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
      a.download = `placemate-comparison-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('CSV comparison sheet downloaded!');
    } catch (err: any) {
      console.error('Failed to export CSV:', err);
      toast.error('Failed to export CSV file');
    }
  };

  const handleExportJSON = () => {
    if (placements.length === 0) {
      toast.warning('Select placements to export.');
      return;
    }

    try {
      const jsonContent = JSON.stringify(placements, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `placemate-comparison-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('JSON dataset downloaded!');
    } catch (err: any) {
      console.error('Failed to export JSON:', err);
      toast.error('Failed to export JSON file');
    }
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
        {/* Printable Document Header (shown only when printing / saving PDF) */}
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
                  Comparing: {placements.map((p) => p.companyName).join(' vs ')} • Generated {new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:hidden">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="glass-3d-pill rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="h-6 w-px bg-border/60 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-md">
                <Scale className="h-4.5 w-4.5" />
              </div>
              <h1 className="text-xl font-extrabold tracking-tight font-heading">Placement Comparison Matrix</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSavedModalOpen(true)}
              className="glass-3d-pill rounded-xl text-xs font-semibold"
            >
              <Bookmark className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
              Saved Sets
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShareLink}
              disabled={placements.length === 0 || isSharing}
              className={`rounded-xl border-border text-xs font-semibold transition-all ${
                copiedLink ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : ''
              }`}
            >
              {isSharing ? (
                <>
                  <div className="h-3 w-3 mr-1.5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Creating Link...
                </>
              ) : copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 mr-1.5" />
                  Share Link
                </>
              )}
            </Button>

            {/* Print / Export Dropdown Menu */}
            <div className="relative" ref={exportDropdownRef}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportDropdownOpen((prev) => !prev)}
                disabled={placements.length === 0}
                className="rounded-xl border-border text-xs font-semibold gap-1.5"
              >
                <Printer className="h-3.5 w-3.5 text-primary" />
                <span>Print / Export</span>
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
          </div>
        </div>

        {/* Empty State */}
        {!loading && placements.length < 2 && (
          <div className="glass-3d-card p-12 text-center rounded-2xl max-w-xl mx-auto my-12 space-y-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mx-auto shadow-md">
              <Scale className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold font-heading">Select Placements to Compare</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              You need at least 2 placements selected to run side-by-side spec comparison, visual charts, and AI decision analysis.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Link href="/dashboard">
                <Button className="bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 text-xs rounded-xl font-bold px-6 shadow-md">
                  Browse Placement Drives
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

            {/* Spec Matrix Table */}
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
            <PlacementComparisonCharts placements={placements} userProfile={userProfile} />

            {/* AI Decision Analysis */}
            <AiComparisonCard
              placementIds={activeIds}
              placements={placements}
              userProfile={userProfile}
            />
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
