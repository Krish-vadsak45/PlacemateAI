"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  ClipboardPaste,
  Building2,
  Briefcase,
  DollarSign,
  MapPin,
  GraduationCap,
  Calendar,
  ExternalLink,
  Check,
  ArrowLeft,
  RefreshCw,
  Zap,
  Tag,
  Plus,
  X,
  MessageSquare,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { SmartPasteParsedResult } from "@/lib/smart-paste-parser";

interface SmartPasteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlacementCreated?: (placement: any) => void;
}

const SAMPLE_WHATSAPP = `🚨 *URGENT PLACEMENT ALERT - 2026 BATCH* 🚨
Dear Students,
Tata Consultancy Services (TCS) is hiring through TCS Digital & Prime National Drive!

🔹 Role: Systems Engineer / Digital Specialist
🔹 Package: ₹7.2 LPA (Digital) to ₹9.0 LPA (Prime)
🔹 Location: Bangalore / Hyderabad / Pune / Pan-India
🔹 Eligibility: B.Tech CSE, IT, ECE with Min 7.0 CGPA / 70% in 10th, 12th & Graduation. No active backlogs.
🔹 Registration Deadline: 18th November 2026, 11:59 PM sharp!
🔹 Online Test Date: 25th November 2026
🔹 Key Skills: Python, Java, Data Structures, SQL, Cloud Fundamentals

Apply on the TCS NextStep Portal immediately:
https://nextstep.tcs.com/campus/drive/apply?id=tcs2026

Thanks & Regards,
Placement Cell Coordinator`;

const SAMPLE_LINKEDIN = `We are hiring! 🚀
Company: Microsoft
Role: Software Development Engineer - 1 (SDE-1)
Location: Hyderabad / Bangalore, India
Compensation: ₹18 - 24 LPA Base + Stocks & Performance Bonus

Job Description:
Looking for passionate engineers with solid understanding of Computer Science fundamentals, Object-Oriented Design, and algorithmic problem solving.

Requirements:
- Strong proficiency in C++, Java, or C#
- Good grasp of Data Structures, Algorithms, and Distributed Systems
- B.Tech/M.Tech in CS/IT or related branch (Min 7.5 CGPA preferred)
- Applications close on 30th November 2026.

Apply here: https://careers.microsoft.com/us/en/job/sde1-2026-campus`;

const SAMPLE_UNSTOP = `National Level Hiring Challenge on Unstop
Company: Zomato
Position: Product Engineering Intern & Associate SDE
Stipend / CTC: ₹45,000/month during internship, converting to ₹14 LPA full-time
Eligibility: Open to all engineering branches (CSE, IT, ECE, EE, Mech). Minimum 6.5 CGPA required.
Location: Gurgaon (Hybrid)
Rounds: Coding Round on 15th Nov, followed by Technical Interviews.
Registration Ends: 10th November 2026, 6:00 PM IST

Link: https://unstop.com/competitions/zomato-hackathon-2026`;

export default function SmartPasteModal({
  open,
  onOpenChange,
  onPlacementCreated,
}: SmartPasteModalProps) {
  const [step, setStep] = useState<"input" | "review">("input");
  const [rawText, setRawText] = useState("");
  const [sourceType, setSourceType] = useState<"whatsapp" | "linkedin" | "unstop" | "raw_text">("whatsapp");
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State for Review Step
  const [formData, setFormData] = useState<Partial<SmartPasteParsedResult>>({});
  const [newSkill, setNewSkill] = useState("");
  const [newBranch, setNewBranch] = useState("");

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setRawText(text);
        toast.success("Text pasted from clipboard!");
      }
    } catch {
      toast.error("Clipboard access denied. Please paste manually.");
    }
  };

  const handleParse = async () => {
    if (!rawText.trim() || rawText.trim().length < 15) {
      toast.warning("Please paste placement message or job description text.");
      return;
    }

    setIsParsing(true);
    try {
      const res = await fetch("/api/placements/smart-paste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "parse", text: rawText, source: sourceType }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse text");

      if (data.parsed) {
        setFormData(data.parsed);
        setStep("review");
        toast.success("Details extracted successfully with AI!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to extract placement details");
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    if (!formData.companyName || !formData.jobRole) {
      toast.error("Company Name and Job Role are required.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/placements/smart-paste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          placementData: {
            ...formData,
            rawText,
            sourceType,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save placement");

      toast.success(`${formData.companyName} added to placement dashboard!`);
      if (onPlacementCreated) {
        onPlacementCreated(data.placement);
      }
      handleClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save placement");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after transition
    setTimeout(() => {
      setStep("input");
      setRawText("");
      setFormData({});
    }, 200);
  };

  const addSkill = () => {
    if (!newSkill.trim()) return;
    const current = formData.jobRequirements?.requiredSkills || [];
    if (!current.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        jobRequirements: {
          ...formData.jobRequirements,
          requiredSkills: [...current, newSkill.trim()],
          preferredSkills: formData.jobRequirements?.preferredSkills || [],
          responsibilities: formData.jobRequirements?.responsibilities || [],
        },
      });
    }
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    const current = formData.jobRequirements?.requiredSkills || [];
    setFormData({
      ...formData,
      jobRequirements: {
        ...formData.jobRequirements,
        requiredSkills: current.filter((s) => s !== skill),
        preferredSkills: formData.jobRequirements?.preferredSkills || [],
        responsibilities: formData.jobRequirements?.responsibilities || [],
      },
    });
  };

  const addBranch = () => {
    if (!newBranch.trim()) return;
    const current = formData.eligibility?.allowedBranches || [];
    if (!current.includes(newBranch.trim())) {
      setFormData({
        ...formData,
        eligibility: {
          ...formData.eligibility,
          allowedBranches: [...current, newBranch.trim()],
        },
      });
    }
    setNewBranch("");
  };

  const removeBranch = (branch: string) => {
    const current = formData.eligibility?.allowedBranches || [];
    setFormData({
      ...formData,
      eligibility: {
        ...formData.eligibility,
        allowedBranches: current.filter((b) => b !== branch),
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl sm:max-w-3xl bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
        {/* MODAL HEADER */}
        <DialogHeader className="p-5 border-b border-border/60 bg-muted/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold font-heading text-foreground flex items-center gap-2">
                  <span>AI Smart Paste & Quick Importer</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <Zap className="h-2.5 w-2.5 fill-emerald-500" /> Multi-Source
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Paste raw WhatsApp notices, LinkedIn postings, or Unstop circulars to extract structured drive info.
                </DialogDescription>
              </div>
            </div>

            {step === "review" && (
              <span className="px-2.5 py-1 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs border border-indigo-500/20">
                {formData.confidence || 95}% AI Confidence
              </span>
            )}
          </div>
        </DialogHeader>

        {/* STEP 1: RAW TEXT INPUT */}
        {step === "input" && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Quick Template Chips */}
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-muted-foreground font-semibold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <MessageSquare className="h-3 w-3" /> Quick Samples:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setRawText(SAMPLE_WHATSAPP);
                    setSourceType("whatsapp");
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-muted/80 hover:bg-muted text-foreground transition-colors cursor-pointer border border-border"
                >
                  WhatsApp Forward
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRawText(SAMPLE_LINKEDIN);
                    setSourceType("linkedin");
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-muted/80 hover:bg-muted text-foreground transition-colors cursor-pointer border border-border"
                >
                  LinkedIn Post
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRawText(SAMPLE_UNSTOP);
                    setSourceType("unstop");
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs bg-muted/80 hover:bg-muted text-foreground transition-colors cursor-pointer border border-border"
                >
                  Unstop Circular
                </button>
                {rawText && (
                  <button
                    type="button"
                    onClick={() => setRawText("")}
                    className="text-xs text-rose-500 hover:underline px-1 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Big Textarea */}
            <div className="relative">
              <Textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste the raw WhatsApp message, email snippet, LinkedIn job description, or circular text here..."
                rows={9}
                className="w-full text-xs font-mono leading-relaxed p-4 rounded-2xl bg-card border-border shadow-inner resize-none focus-visible:ring-primary"
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePasteFromClipboard}
                  className="h-7 text-[11px] rounded-lg gap-1 border-border shadow-xs hover:bg-muted cursor-pointer"
                >
                  <ClipboardPaste className="h-3 w-3" />
                  <span>Paste from Clipboard</span>
                </Button>
                <span className="text-[10px] text-muted-foreground bg-card/80 px-1.5 py-0.5 rounded border border-border">
                  {rawText.length} chars
                </span>
              </div>
            </div>

            {/* Footer with Parse Action */}
            <div className="pt-2 flex items-center justify-between">
              <div className="text-[11px] text-muted-foreground">
                Supports WhatsApp markdown (*bold*, _italic_), emojis, deadlines, and registration URLs.
              </div>
              <Button
                type="button"
                onClick={handleParse}
                disabled={isParsing || rawText.trim().length < 15}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-xs px-5 h-9 rounded-xl shadow-md transition-all gap-1.5 cursor-pointer"
              >
                {isParsing ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Extract with AI</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: REVIEW & VERIFICATION */}
        {step === "review" && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <button
                type="button"
                onClick={() => setStep("input")}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Edit Raw Text</span>
              </button>
              <span className="text-[11px] text-muted-foreground">
                Review and tweak any fields before saving
              </span>
            </div>

            {/* Two-column editable form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                  <span>Company Name *</span>
                </label>
                <Input
                  value={formData.companyName || ""}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Google, Microsoft, TCS"
                  className="h-9 text-xs rounded-xl bg-card border-border"
                />
              </div>

              {/* Job Role */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5 text-primary" />
                  <span>Job Role / Designation *</span>
                </label>
                <Input
                  value={formData.jobRole || ""}
                  onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                  placeholder="e.g. Software Development Engineer"
                  className="h-9 text-xs rounded-xl bg-card border-border"
                />
              </div>

              {/* Package / CTC */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Package / CTC</span>
                </label>
                <Input
                  value={formData.package || ""}
                  onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                  placeholder="e.g. ₹9.0 LPA, 35,000/mo"
                  className="h-9 text-xs rounded-xl bg-card border-border"
                />
              </div>

              {/* Location */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-500" />
                  <span>Job Location</span>
                </label>
                <Input
                  value={formData.location || ""}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Bangalore / Hybrid / Pan-India"
                  className="h-9 text-xs rounded-xl bg-card border-border"
                />
              </div>

              {/* Minimum CGPA */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-purple-500" />
                  <span>Minimum CGPA Cutoff (0-10)</span>
                </label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formData.eligibility?.minimumCGPA ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      eligibility: {
                        ...formData.eligibility,
                        minimumCGPA: e.target.value ? parseFloat(e.target.value) : undefined,
                        allowedBranches: formData.eligibility?.allowedBranches || [],
                      },
                    })
                  }
                  placeholder="e.g. 7.0 (leave blank if no cutoff)"
                  className="h-9 text-xs rounded-xl bg-card border-border"
                />
              </div>

              {/* Application Deadline */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-rose-500" />
                  <span>Application Deadline</span>
                </label>
                <Input
                  type="datetime-local"
                  value={
                    formData.applicationDeadline
                      ? new Date(formData.applicationDeadline).toISOString().slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      applicationDeadline: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                    })
                  }
                  className="h-9 text-xs rounded-xl bg-card border-border"
                />
              </div>

              {/* Assessment / Test Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  <span>Assessment / Test Date</span>
                </label>
                <Input
                  type="datetime-local"
                  value={
                    formData.assessmentDate
                      ? new Date(formData.assessmentDate).toISOString().slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      assessmentDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                    })
                  }
                  className="h-9 text-xs rounded-xl bg-card border-border"
                />
              </div>

              {/* Target Batch */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Target Batch</span>
                </label>
                <Input
                  value={formData.eligibility?.batch || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      eligibility: {
                        ...formData.eligibility,
                        batch: e.target.value,
                        allowedBranches: formData.eligibility?.allowedBranches || [],
                      },
                    })
                  }
                  placeholder="e.g. 2026 Batch"
                  className="h-9 text-xs rounded-xl bg-card border-border"
                />
              </div>

              {/* Backlog Policy */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Backlogs Allowed</span>
                </label>
                <Input
                  value={formData.eligibility?.backlogs || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      eligibility: {
                        ...formData.eligibility,
                        backlogs: e.target.value,
                        allowedBranches: formData.eligibility?.allowedBranches || [],
                      },
                    })
                  }
                  placeholder="e.g. No active backlogs"
                  className="h-9 text-xs rounded-xl bg-card border-border"
                />
              </div>
            </div>

            {/* AI Summary */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                <span>AI Drive Summary & Highlights</span>
              </label>
              <Textarea
                rows={2}
                value={formData.aiSummary || ""}
                onChange={(e) => setFormData({ ...formData, aiSummary: e.target.value })}
                placeholder="AI-generated concise summary of this placement drive..."
                className="text-xs rounded-xl bg-card border-border leading-relaxed"
              />
            </div>

            {/* Application Link */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5 text-primary" />
                <span>Application / Registration Link</span>
              </label>
              <Input
                value={formData.applicationLink || ""}
                onChange={(e) => setFormData({ ...formData, applicationLink: e.target.value })}
                placeholder="https://company.com/apply or Google Form link"
                className="h-9 text-xs rounded-xl bg-card border-border"
              />
            </div>

            {/* Allowed Branches Tag Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Allowed Branches</label>
              <div className="flex items-center gap-2 flex-wrap">
                {(formData.eligibility?.allowedBranches || []).map((branch) => (
                  <span
                    key={branch}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-muted text-[11px] font-medium text-foreground border border-border"
                  >
                    <span>{branch}</span>
                    <button
                      type="button"
                      onClick={() => removeBranch(branch)}
                      className="text-muted-foreground hover:text-rose-500 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <div className="inline-flex items-center gap-1">
                  <Input
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBranch())}
                    placeholder="Add branch (e.g. CSE)"
                    className="h-7 w-32 text-[11px] rounded-lg bg-card border-border"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addBranch}
                    className="h-7 px-2 text-xs rounded-lg cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Required Skills Tag Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Required Skills & Tech Stack</label>
              <div className="flex items-center gap-2 flex-wrap">
                {(formData.jobRequirements?.requiredSkills || []).map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary text-[11px] font-medium border border-primary/20"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-primary/70 hover:text-rose-500 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <div className="inline-flex items-center gap-1">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    placeholder="Add skill (e.g. Python)"
                    className="h-7 w-36 text-[11px] rounded-lg bg-card border-border"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={addSkill}
                    className="h-7 px-2 text-xs rounded-lg cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Selection Rounds (if detected) */}
            {formData.selectionProcess && formData.selectionProcess.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Tag className="h-3 w-3 text-primary" />
                  <span>Selection Rounds Detected</span>
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {formData.selectionProcess.map((round, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium border border-emerald-500/20"
                    >
                      Round {idx + 1}: {round}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep("input")}
                className="text-xs rounded-xl cursor-pointer"
              >
                Back to Text
              </Button>

              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving || !formData.companyName || !formData.jobRole}
                className="bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-bold text-xs px-5 h-9 rounded-xl shadow-md gap-1.5 cursor-pointer hover:opacity-90"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Saving Drive...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Confirm & Add to Dashboard</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

