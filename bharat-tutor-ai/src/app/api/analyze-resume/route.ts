import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import type { AnalyzeResumeResponse } from "@/types/analyze-resume";

export const runtime = "nodejs";

/** Max upload size to keep the MVP snappy on free tiers. */
const MAX_BYTES = 4 * 1024 * 1024;

function mockAnalysis(): AnalyzeResumeResponse {
  return {
    readinessPercent: 87,
    roleTitle: "Junior AI Engineer",
    location: "Hyderabad",
    steps: [
      "Strengthen Python + NumPy with a 2-week micro-project.",
      "Complete a hands-on LLM prompting course and log prompts in a portfolio.",
      "Ship one end-to-end ML mini-project on GitHub with a README story.",
      "Practice system design for ML services using free YouTube walkthroughs.",
    ],
    roadmapSlug: "ai-engineer",
    demo: true,
  };
}

async function extractText(file: File, buffer: Buffer): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".docx")) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value;
  }
  if (name.endsWith(".pdf")) {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text ?? "";
    } finally {
      await parser.destroy();
    }
  }
  throw new Error("Unsupported file type. Use PDF or DOCX.");
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 4MB)" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    let resumeText: string;
    try {
      resumeText = await extractText(file, buf);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not read file";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const trimmed = resumeText.replace(/\s+/g, " ").trim().slice(0, 12000);
    if (trimmed.length < 40) {
      return NextResponse.json(
        { error: "Could not extract enough text. Try another PDF/DOCX export." },
        { status: 400 },
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(mockAnalysis());
    }

    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are BharatTutor AI, a supportive career coach for students in India.
Return ONLY valid JSON with keys:
readinessPercent (integer 60-95),
roleTitle (string, realistic junior title e.g. "Junior AI Engineer"),
location (Indian city if inferable else "India"),
steps (array of exactly 4 short actionable learning strings),
roadmapSlug (roadmap.sh path segment only, e.g. "ai-engineer" or "computer-science").`,
        },
        {
          role: "user",
          content: `Resume text:\n${trimmed}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "Empty model response" }, { status: 502 });
    }

    const parsed = JSON.parse(raw) as Partial<AnalyzeResumeResponse>;
    const readinessPercent = Math.min(
      95,
      Math.max(60, Number(parsed.readinessPercent) || 75),
    );
    const roleTitle =
      typeof parsed.roleTitle === "string" && parsed.roleTitle.length
        ? parsed.roleTitle
        : "Junior AI Engineer";
    const location =
      typeof parsed.location === "string" && parsed.location.length
        ? parsed.location
        : "Hyderabad";
    const steps = Array.isArray(parsed.steps)
      ? parsed.steps.filter((s) => typeof s === "string").slice(0, 4)
      : [];
    while (steps.length < 4) {
      steps.push("Add a focused portfolio project aligned to your target role.");
    }
    const roadmapSlug =
      typeof parsed.roadmapSlug === "string" && /^[a-z0-9-]+$/i.test(parsed.roadmapSlug)
        ? parsed.roadmapSlug.toLowerCase()
        : "ai-engineer";

    const body: AnalyzeResumeResponse = {
      readinessPercent,
      roleTitle,
      location,
      steps,
      roadmapSlug,
    };
    return NextResponse.json(body);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
