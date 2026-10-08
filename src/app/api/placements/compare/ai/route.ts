import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Placement from '@/models/Placement';
import User from '@/models/User';
import { auth } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import mongoose from 'mongoose';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { placementIds } = await req.json();

    if (!Array.isArray(placementIds) || placementIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 placements are required for AI comparison' },
        { status: 400 }
      );
    }

    const validIds = placementIds
      .slice(0, 4)
      .filter((id) => mongoose.Types.ObjectId.isValid(id));

    const placements = await Placement.find({
      _id: { $in: validIds },
      userId: user._id,
    }).lean();

    if (placements.length < 2) {
      return NextResponse.json(
        { error: 'Could not find enough valid placements to compare' },
        { status: 404 }
      );
    }

    // Build concise context for AI prompt
    const userProfileSummary = {
      skills: user.profile?.skills || [],
      cgpa: user.profile?.cgpa || 'N/A',
      branch: user.profile?.branch || 'N/A',
      targetRole: user.profile?.targetRole || 'Software Engineer',
    };

    const placementDataList = placements.map((p) => ({
      id: p._id.toString(),
      companyName: p.companyName,
      jobRole: p.jobRole,
      package: p.package || 'Not specified',
      location: p.location || 'Not specified',
      eligibility: p.eligibility,
      jobRequirements: p.jobRequirements,
      matchScore: p.matchScore || 0,
      status: p.status,
    }));

    const prompt = `You are an expert career and placement counselor for engineering students.
Compare the following placements for a student with this profile:
${JSON.stringify(userProfileSummary, null, 2)}

PLACEMENTS TO COMPARE:
${JSON.stringify(placementDataList, null, 2)}

Provide a strict valid JSON object response (without markdown formatting or code fences) with the following structure:
{
  "comparisons": [
    {
      "id": "<placement_id>",
      "companyName": "<company_name>",
      "pros": ["Point 1", "Point 2", "Point 3"],
      "cons": ["Point 1", "Point 2"],
      "keyHighlight": "<Single compelling sentence summary>",
      "fitRating": <number 1-100>
    }
  ],
  "recommendation": {
    "recommendedId": "<id of best placement>",
    "recommendedCompany": "<company name>",
    "verdict": "<2-3 sentence strategic advice explaining why this is the best fit>",
    "nextSteps": ["Action item 1", "Action item 2"]
  }
}`;

    let aiResultText = '';
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    // Try Groq first
    if (groqKey) {
      try {
        const groq = new Groq({ apiKey: groqKey });
        const groqModel = process.env.GROQ_MODEL || 'llama3-70b-8192';
        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: 'You respond only in raw valid JSON without markdown wrapping.' },
            { role: 'user', content: prompt },
          ],
          model: groqModel,
          temperature: 0.3,
          response_format: { type: 'json_object' },
        });
        aiResultText = completion.choices[0]?.message?.content || '';
      } catch (err) {
        console.error('Groq compare AI failed, falling back to Gemini:', err);
      }
    }

    // Fallback to Gemini if Groq failed or not available
    if (!aiResultText && geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' },
        });
        const result = await model.generateContent(prompt);
        aiResultText = result.response.text();
      } catch (err) {
        console.error('Gemini compare AI failed:', err);
      }
    }

    if (!aiResultText) {
      // Rule-based fallback if no LLM API key or network failure
      const sortedByScore = [...placementDataList].sort(
        (a, b) => (b.matchScore || 0) - (a.matchScore || 0)
      );
      const topPlacement = sortedByScore[0];

      return NextResponse.json({
        analysis: {
          comparisons: placementDataList.map((p) => ({
            id: p.id,
            companyName: p.companyName,
            pros: [
              `Competitive package: ${p.package}`,
              `Role alignment: ${p.jobRole}`,
              `Match score: ${p.matchScore}%`,
            ],
            cons: [
              p.location === 'Not specified' ? 'Location details missing' : `Location: ${p.location}`,
            ],
            keyHighlight: `${p.companyName} offers ${p.package} for ${p.jobRole}.`,
            fitRating: p.matchScore || 75,
          })),
          recommendation: {
            recommendedId: topPlacement.id,
            recommendedCompany: topPlacement.companyName,
            verdict: `${topPlacement.companyName} is recommended based on overall match score (${topPlacement.matchScore}%) and package details (${topPlacement.package}).`,
            nextSteps: [
              'Review specific job requirements and skill gaps.',
              'Prepare targeted resume focusing on required skills.',
            ],
          },
        },
        fallback: true,
      });
    }

    // Parse JSON safely
    try {
      const cleanedJson = aiResultText.replace(/```json\n?|\n?```/g, '').trim();
      const parsedAnalysis = JSON.parse(cleanedJson);
      return NextResponse.json({ analysis: parsedAnalysis });
    } catch (parseError) {
      console.error('Failed to parse AI JSON response:', parseError, aiResultText);
      return NextResponse.json(
        { error: 'Failed to process AI comparison output' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in AI placement comparison:', error);
    return NextResponse.json(
      { error: 'Internal server error while generating AI comparison' },
      { status: 500 }
    );
  }
}
