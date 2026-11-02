import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

export interface SmartPasteParsedResult {
  companyName: string;
  jobRole: string;
  package?: string;
  location?: string;
  eligibility: {
    minimumCGPA?: number;
    allowedBranches: string[];
    batch?: string;
    backlogs?: string;
  };
  applicationDeadline?: string;
  assessmentDate?: string;
  interviewDate?: string;
  applicationLink?: string;
  jobRequirements: {
    requiredSkills: string[];
    preferredSkills: string[];
    responsibilities: string[];
    experienceLevel?: string;
    educationRequirements?: string;
  };
  selectionProcess?: string[];
  aiSummary?: string;
  tags: string[];
  confidence: number;
  provider: "groq" | "gemini" | "heuristic";
  sourceType: "whatsapp" | "linkedin" | "unstop" | "raw_text";
}

export async function parseSmartPasteText(
  rawText: string,
  sourceHint?: string
): Promise<SmartPasteParsedResult> {
  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;

  const prompt = `You are a high-precision campus recruitment AI parser.
Extract ALL possible structured placement and job drive details from the following raw text (which may be a WhatsApp message with emojis, LinkedIn post, Unstop circular, or informal college notice).

RAW PLACEMENT TEXT:
"""
${rawText}
"""

Strictly output ONLY a raw JSON object (without markdown code fences, comments, or extra text) following this exact JSON structure:
{
  "companyName": "<Company name, e.g. Tata Consultancy Services, Microsoft, Infosys, Google>",
  "jobRole": "<Role/Designation, e.g. Software Development Engineer, Systems Engineer, Data Analyst>",
  "package": "<Clean CTC package, e.g. 8.5 LPA, ₹7 - 9 LPA, 45,000/month, or null if unknown>",
  "location": "<Work location, e.g. Bangalore, Hyderabad, Pan-India, Remote, Hybrid, or null if unknown>",
  "eligibility": {
    "minimumCGPA": <number on 10.0 scale, e.g. 7.0 (convert 70% or 7.0 CGPA to 7.0), or null if no cutoff>,
    "allowedBranches": ["<Array of branches, e.g. 'CSE', 'IT', 'ECE', 'All Branches'>"],
    "batch": "<Eligible graduation batch, e.g. '2026 Batch', '2025/2026', or null if unstated>",
    "backlogs": "<Backlog criteria, e.g. 'No active backlogs', 'Max 1 live backlog', or null>"
  },
  "applicationDeadline": "<ISO 8601 Date String or YYYY-MM-DD or null if not mentioned>",
  "assessmentDate": "<ISO 8601 Date String or YYYY-MM-DD or null if not mentioned>",
  "interviewDate": "<ISO 8601 Date String or YYYY-MM-DD or null if not mentioned>",
  "applicationLink": "<Exact Registration or Apply URL found in text, or null if not mentioned>",
  "jobRequirements": {
    "requiredSkills": ["<Array of technical and programming skills mentioned, e.g. 'Python', 'React', 'SQL'>"],
    "preferredSkills": ["<Array of nice-to-have skills>"],
    "responsibilities": ["<Array of key duties or bullet points>"],
    "experienceLevel": "<e.g. 'Fresher (2026)', 'Intern to Full-Time', '0-1 Years', or 'Entry-Level'>",
    "educationRequirements": "<e.g. 'B.Tech / B.E. / M.Tech / MCA' or null>"
  },
  "selectionProcess": ["<Array of interview/test rounds mentioned, e.g. 'Online Coding Test (60 mins)', 'Technical Interview', 'HR Round'>"],
  "aiSummary": "<A concise 2-sentence summary of this opportunity, highlighting the company, role, package, and main requirements>",
  "tags": ["<Array of relevant tags, e.g. 'Full-Time', 'On-Campus', 'Product', 'Tier-1', 'WhatsApp Import'>"],
  "sourceType": "${sourceHint || 'whatsapp'}",
  "confidence": 95
}`;

  // 1. Try Groq (LLaMA-3 70B) first
  if (groqApiKey) {
    try {
      const groq = new Groq({ apiKey: groqApiKey });
      const model = process.env.GROQ_MODEL || "llama3-70b-8192";
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: "You respond only with raw valid JSON without markdown wrapping." },
          { role: "user", content: prompt },
        ],
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const responseText = completion.choices[0]?.message?.content || "";
      const parsed = cleanAndParseJson(responseText);
      if (parsed && parsed.companyName && parsed.companyName !== "Unknown") {
        return {
          ...parsed,
          provider: "groq",
          confidence: parsed.confidence || 95,
          sourceType: (parsed.sourceType as any) || sourceHint || "whatsapp",
        };
      }
    } catch (err) {
      console.warn("Groq smart paste failed, falling back to Gemini:", err);
    }
  }

  // 2. Try Gemini (1.5 Flash) fallback
  if (geminiApiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: "application/json" },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = cleanAndParseJson(text);
      if (parsed && parsed.companyName && parsed.companyName !== "Unknown") {
        return {
          ...parsed,
          provider: "gemini",
          confidence: parsed.confidence || 90,
          sourceType: (parsed.sourceType as any) || sourceHint || "whatsapp",
        };
      }
    } catch (err) {
      console.warn("Gemini smart paste failed, falling back to heuristic:", err);
    }
  }

  // 3. Heuristic / Regex Fallback if no AI keys or both fail
  return parseWithHeuristics(rawText, sourceHint);
}

function cleanAndParseJson(text: string): any {
  try {
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function parseWithHeuristics(rawText: string, sourceHint?: string): SmartPasteParsedResult {
  // Extract URLs
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const urls = rawText.match(urlRegex) || [];
  const applicationLink = urls.find((u) => !u.includes("whatsapp.com") && !u.includes("telegram.me")) || urls[0];

  // Extract Package (e.g. 7.5 LPA, ₹12 LPA, 6-8 LPA, 14.5 LPA)
  const pkgMatch =
    rawText.match(/(?:ctc|package|salary|stipend)\s*(?:is|:|-)?\s*([₹$]?\s*\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?\s*(?:lpa|lakhs?|inr|per annum|\/month|\/mo))/i) ||
    rawText.match(/([₹$]?\s*\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?\s*(?:lpa|lakhs?))/i);
  let packageStr = pkgMatch ? (pkgMatch[1] || pkgMatch[0]) : undefined;
  if (packageStr) {
    packageStr = packageStr.replace(/^[:\-\s]+/, "").trim();
  }

  // Extract CGPA
  const cgpaMatch =
    rawText.match(/(?:cutoff|cgpa|pointer|percentage|criteria|min(?:imum)?)[^\d\n\r]*(\d+(?:\.\d+)?)\s*(?:cgpa|%|\+|pointer|throughout)?/i) ||
    rawText.match(/(\d+(?:\.\d+)?)\s*(?:cgpa|pointer)/i);
  let minimumCGPA: number | undefined = undefined;
  if (cgpaMatch) {
    const val = parseFloat(cgpaMatch[1]);
    if (val <= 10 && val >= 3.0) {
      minimumCGPA = val;
    } else if (val > 10 && val <= 100) {
      minimumCGPA = +(val / 10).toFixed(1);
    }
  }

  // Extract Role
  let jobRole = "Software Engineer";
  const roleMatch = rawText.match(/(?:role|position|profile|title|designation)\s*(?:is|:|-)?\s*([^\n\r,;]{3,50})/i);
  if (roleMatch) {
    jobRole = roleMatch[1].replace(/[*_#]/g, "").trim();
  }

  // Extract Location
  let location = "Pan-India";
  const locMatch = rawText.match(/(?:location|work location|job location|place)\s*(?:is|:|-)?\s*([^\n\r,;]{2,50})/i);
  if (locMatch) {
    location = locMatch[1].replace(/[*_#]/g, "").trim();
  }

  // Extract Deadline
  let applicationDeadline: string | undefined = undefined;
  const deadMatch = rawText.match(/(?:last date|deadline|apply by|register before|registration ends)\s*(?:is|:|-)?\s*([^\n\r]{4,40})/i);
  if (deadMatch) {
    const dStr = deadMatch[1].replace(/[*_#]/g, "").trim();
    const parsedDate = new Date(dStr);
    if (!isNaN(parsedDate.getTime())) {
      applicationDeadline = parsedDate.toISOString();
    } else {
      applicationDeadline = dStr;
    }
  }

  // Extract Skills
  let requiredSkills = ["Problem Solving", "Data Structures", "Java/Python/C++"];
  const skillsMatch = rawText.match(/(?:required skills|skills|tech stack|technologies|requirements?)\s*(?:required|needed|:|-)?\s*([^\n\r]+)/i);
  if (skillsMatch) {
    const parsed = skillsMatch[1]
      .replace(/[*_#]/g, "")
      .split(/[,/|•·]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 1 && !s.toLowerCase().startsWith("required"));
    if (parsed.length > 0) {
      requiredSkills = parsed;
    }
  }

  // Extract Branches
  const branchesMatch = rawText.match(/(?:branches|branch|eligible|eligibility)\s*(?:is|:|-)?\s*([^\n\r]+)/i);
  let allowedBranches = ["CSE", "IT", "ECE"];
  if (branchesMatch) {
    const foundBranches: string[] = [];
    const lower = branchesMatch[1].toUpperCase();
    ["CSE", "IT", "ECE", "EEE", "MECH", "CIVIL", "AIDS", "AIML", "CSBS"].forEach((b) => {
      if (lower.includes(b)) foundBranches.push(b);
    });
    if (foundBranches.length > 0) allowedBranches = foundBranches;
  }

  // Extract Company Name
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);
  let companyName = "Campus Placement Opportunity";
  const compDirect = rawText.match(/(?:company|organisation|organization|firm|client)\s*(?:is|:|-)?\s*([^\n\r,;]{2,40})/i);
  if (compDirect) {
    companyName = compDirect[1].replace(/[*_#]/g, "").trim();
  } else {
    for (const line of lines) {
      const cleanLine = line.replace(/[*_#🚨🚀📢🔥⚡]/g, "").trim();
      const dashMatch = cleanLine.match(/[-–—]\s*([A-Za-z0-9&.\s]{3,35})$/) || cleanLine.match(/HIRING(?:\s+\d{4})?\s*[-–—:]?\s*([A-Za-z0-9&.\s]{3,35})/i);
      if (dashMatch && dashMatch[1]) {
        companyName = dashMatch[1].trim();
        break;
      }
      const compMatch = line.match(/(?:hiring|recruitment|drive|visiting)\s*(?:for|by|:)?\s*([A-Za-z0-9&.\s]{3,30})/i);
      if (compMatch && compMatch[1]) {
        const candidate = compMatch[1].replace(/[*_#🚨]/g, "").trim();
        if (!candidate.match(/^20\d\d/)) {
          companyName = candidate;
          break;
        }
      }
    }
  }

  // Extract Batch
  const batchMatch =
    rawText.match(/(?:batch|passout|graduating|class of)\s*(?:is|:|-)?\s*(\d{4}(?:\s*[-–/]\s*\d{2,4})?)/i) ||
    rawText.match(/(\d{4})\s*(?:batch|passout|graduates?)/i);
  const batch = batchMatch ? `${batchMatch[1]} Batch` : undefined;

  // Extract Backlog policy
  const backlogMatch = rawText.match(/(?:no\s+active\s+backlogs?|no\s+backlogs?|no\s+standing\s+backlogs?|0\s+backlogs?|\d+\s+backlogs?\s+allowed)/i);
  const backlogs = backlogMatch ? backlogMatch[0].trim() : undefined;

  // Extract Online Assessment / Test Date
  let assessmentDate: string | undefined = undefined;
  const testMatch = rawText.match(/(?:test date|exam date|assessment date|online test|coding round|test scheduled)\s*(?:is|:|-)?\s*([^\n\r]{4,35})/i);
  if (testMatch) {
    const tStr = testMatch[1].replace(/[*_#]/g, "").trim();
    const pDate = new Date(tStr);
    if (!isNaN(pDate.getTime())) assessmentDate = pDate.toISOString();
    else assessmentDate = tStr;
  }

  // Extract Interview Date
  let interviewDate: string | undefined = undefined;
  const intMatch = rawText.match(/(?:interview date|interviews?)\s*(?:is|:|-)?\s*([^\n\r]{4,35})/i);
  if (intMatch) {
    const iStr = intMatch[1].replace(/[*_#]/g, "").trim();
    const pDate = new Date(iStr);
    if (!isNaN(pDate.getTime())) interviewDate = pDate.toISOString();
    else interviewDate = iStr;
  }

  // Extract Selection Process / Rounds
  const selectionProcess: string[] = [];
  const roundMatches = rawText.match(/(?:round\s*\d+|coding\s*round|technical\s*interview|hr\s*interview|aptitude\s*test|group\s*discussion)[^\n\r,.]*/gi);
  if (roundMatches && roundMatches.length > 0) {
    selectionProcess.push(...Array.from(new Set(roundMatches.map((r) => r.replace(/[*_#]/g, "").trim()).filter(Boolean))));
  }

  // Build AI Summary
  const summaryParts = [`${companyName} is recruiting for ${jobRole}`];
  if (packageStr) summaryParts.push(`with a package of ${packageStr}`);
  if (location && location !== "Pan-India") summaryParts.push(`based in ${location}`);
  let aiSummary = summaryParts.join(" ") + ".";
  if (minimumCGPA) aiSummary += ` Minimum cutoff is ${minimumCGPA} CGPA.`;
  if (batch) aiSummary += ` Target batch: ${batch}.`;
  if (applicationDeadline) {
    try {
      aiSummary += ` Applications close ${new Date(applicationDeadline).toLocaleDateString()}.`;
    } catch {
      aiSummary += ` Apply before ${applicationDeadline}.`;
    }
  }

  return {
    companyName,
    jobRole,
    package: packageStr,
    location,
    eligibility: {
      minimumCGPA,
      allowedBranches,
      batch,
      backlogs,
    },
    applicationDeadline,
    assessmentDate,
    interviewDate,
    applicationLink,
    jobRequirements: {
      requiredSkills,
      preferredSkills: ["SQL", "Git"],
      responsibilities: ["Software Engineering and Application Development"],
      experienceLevel: batch ? `Fresher (${batch})` : "Fresher / Entry Level",
      educationRequirements: "B.Tech / B.E. / MCA",
    },
    selectionProcess: selectionProcess.length > 0 ? selectionProcess : undefined,
    aiSummary,
    tags: [batch || "Campus Drive", "Smart Paste", ...(packageStr ? ["CTC Specified"] : [])],
    confidence: 82,
    provider: "heuristic",
    sourceType: (sourceHint as any) || "whatsapp",
  };
}
