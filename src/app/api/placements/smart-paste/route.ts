import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Placement from "@/models/Placement";
import { parseSmartPasteText } from "@/lib/smart-paste-parser";
import { createJobMatcher } from "@/lib/job-matcher";
import { createNotification } from "@/lib/notification-service";
import mongoose from "mongoose";

async function getAuthUser() {
  const session = await auth();
  if (!session?.user) return null;

  await connectDB();

  const user = await User.findOne({
    $or: [
      ...(session.user.id && mongoose.Types.ObjectId.isValid(session.user.id)
        ? [{ _id: new mongoose.Types.ObjectId(session.user.id) }]
        : []),
      ...(session.user.email
        ? [{ email: session.user.email.toLowerCase().trim() }]
        : []),
    ],
  });

  return user;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, text, source, placementData } = body;

    // ACTION 1: PARSE RAW TEXT WITH AI
    if (action === "parse" || (!action && text)) {
      if (!text || typeof text !== "string" || text.trim().length < 10) {
        return NextResponse.json(
          { error: "Please paste meaningful placement text (at least 10 characters)." },
          { status: 400 }
        );
      }

      const parsed = await parseSmartPasteText(text, source);
      return NextResponse.json({
        success: true,
        parsed,
      });
    }

    // ACTION 2: CONFIRM & SAVE STRUCTURED PLACEMENT TO DATABASE
    if (action === "save" || (!action && placementData)) {
      const data = placementData || body;

      if (!data.companyName || !data.jobRole) {
        return NextResponse.json(
          { error: "Company name and job role are required." },
          { status: 400 }
        );
      }

      await connectDB();

      // Ensure confidence is normalized to 0.0 - 1.0 for Mongoose schema (max: 1)
      const rawConf = typeof data.confidence === "number" ? data.confidence : 0.95;
      const extractionConfidence = rawConf > 1 ? +(rawConf / 100).toFixed(2) : Math.min(1, Math.max(0, rawConf));

      // Build tags combining original tags and eligibility attributes
      const tags = Array.isArray(data.tags) ? [...data.tags] : ["Smart Paste"];
      if (data.eligibility?.batch && !tags.includes(data.eligibility.batch)) {
        tags.push(data.eligibility.batch);
      }
      if (data.eligibility?.backlogs && !tags.includes(data.eligibility.backlogs)) {
        tags.push(data.eligibility.backlogs);
      }

      // Prepare notes for selection process or additional circular details
      const initialNotes: any[] = [];
      if (data.selectionProcess && data.selectionProcess.length > 0) {
        initialNotes.push({
          id: crypto.randomUUID(),
          title: "Selection Process & Rounds",
          content: data.selectionProcess.map((round: string, idx: number) => `Round ${idx + 1}: ${round}`).join("\n"),
          templateType: "custom",
          tags: ["Interview Process"],
          createdAt: new Date(),
        });
      }
      if (data.eligibility?.backlogs || data.eligibility?.batch) {
        initialNotes.push({
          id: crypto.randomUUID(),
          title: "Eligibility & Batch Details",
          content: [
            data.eligibility?.batch ? `Target Batch: ${data.eligibility.batch}` : null,
            data.eligibility?.backlogs ? `Backlog Policy: ${data.eligibility.backlogs}` : null,
            data.eligibility?.minimumCGPA ? `Cutoff: ${data.eligibility.minimumCGPA} CGPA` : null,
          ].filter(Boolean).join("\n"),
          templateType: "custom",
          tags: ["Eligibility"],
          createdAt: new Date(),
        });
      }

      const newPlacement = await Placement.create({
        userId: user._id,
        companyName: data.companyName.trim(),
        jobRole: data.jobRole.trim(),
        package: data.package?.trim() || undefined,
        location: data.location?.trim() || undefined,
        eligibility: {
          minimumCGPA: data.eligibility?.minimumCGPA ? Number(data.eligibility.minimumCGPA) : undefined,
          allowedBranches: Array.isArray(data.eligibility?.allowedBranches)
            ? data.eligibility.allowedBranches
            : ["All Branches"],
        },
        applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : undefined,
        assessmentDate: data.assessmentDate ? new Date(data.assessmentDate) : undefined,
        interviewDate: data.interviewDate ? new Date(data.interviewDate) : undefined,
        applicationLink: data.applicationLink?.trim() || undefined,
        status: data.status || "NEW",
        extractedByAI: true,
        extractionProvider: data.provider || "smart-paste",
        extractionConfidence,
        tags,
        detectionReason: `Imported via Smart Paste (${data.sourceType || "WhatsApp / Job Description"})`,
        emailSubject: `[Smart Paste] ${data.companyName} - ${data.jobRole}`,
        emailBody: data.rawText || text || "",
        aiSummary: data.aiSummary || undefined,
        notes: initialNotes,
        jobRequirements: {
          requiredSkills: data.jobRequirements?.requiredSkills || [],
          preferredSkills: data.jobRequirements?.preferredSkills || [],
          responsibilities: data.jobRequirements?.responsibilities || [],
          experienceLevel: data.jobRequirements?.experienceLevel || undefined,
          educationRequirements: data.jobRequirements?.educationRequirements || undefined,
        },
      });

      // Calculate candidate match score against user profile
      let matchScore = 75;
      try {
        const jobMatcher = createJobMatcher();
        const matchResult = await jobMatcher.calculateMatchScore(user._id, newPlacement);
        matchScore = matchResult.score;

        await Placement.findByIdAndUpdate(newPlacement._id, {
          $set: {
            matchScore: matchResult.score,
            matchBreakdown: matchResult.breakdown,
          },
        });
      } catch (err) {
        console.warn("Match calculation failed on smart paste:", err);
      }

      // Generate in-app notification
      createNotification({
        userId: user._id,
        title: `Drive Added: ${newPlacement.companyName}`,
        message: `Successfully imported ${newPlacement.companyName} for ${newPlacement.jobRole} (${newPlacement.package || "package undisclosed"}) via Smart Paste. Match score: ${matchScore}%.`,
        type: "NEW_DRIVE",
        link: `/placements/${newPlacement._id}`,
        placementId: newPlacement._id,
      }).catch((err) => console.warn("Smart paste notification error:", err));

      return NextResponse.json({
        success: true,
        placement: newPlacement,
        matchScore,
        message: "Placement drive successfully saved!",
      });
    }

    return NextResponse.json({ error: "Invalid action specified" }, { status: 400 });
  } catch (error: any) {
    console.error("Error in smart-paste endpoint:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process smart paste" },
      { status: 500 }
    );
  }
}

