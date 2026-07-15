import { NextRequest, NextResponse } from "next/server";
import { getCurrentTeacher } from "@/lib/auth/getCurrentTeacher";
import { checkRateLimit } from "@/lib/rateLimit";

const MAX_BASE64_BYTES = 5 * 1024 * 1024; // 5 MB

type ExtractedStudent = { studentNo: string; fullName: string; gender: string };

const ALLOWED_MEDIA_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

function parseStudents(text: string): ExtractedStudent[] {
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    throw new Error("Failed to parse AI response: invalid JSON format");
  }
}

async function extractWithClaude(
  base64Data: string,
  mediaType: string,
  apiKey: string,
): Promise<ExtractedStudent[]> {
  const isPdf = mediaType === "application/pdf";
  const contentBlock = isPdf
    ? {
        type: "document",
        source: {
          type: "base64",
          media_type: "application/pdf",
          data: base64Data,
        },
      }
    : {
        type: "image",
        source: { type: "base64", media_type: mediaType, data: base64Data },
      };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [contentBlock, { type: "text", text: PROMPT }],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error("Claude API error");
  const data = await res.json();
  const text = data.content?.map((c: any) => c.text || "").join("") || "";
  return parseStudents(text);
}

async function extractWithOpenAI(
  base64Data: string,
  mediaType: string,
  apiKey: string,
): Promise<ExtractedStudent[]> {
  if (mediaType === "application/pdf") {
    throw new Error(
      "PDF extraction is not supported with the current AI provider. Please use an image instead.",
    );
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 4096,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mediaType};base64,${base64Data}`, detail: "high" },
            },
            { type: "text", text: PROMPT },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error("OpenAI API error");
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  return parseStudents(text);
}

async function extractWithGemini(
  base64Data: string,
  mediaType: string,
  apiKey: string,
): Promise<ExtractedStudent[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mediaType, data: base64Data } },
              { text: PROMPT },
            ],
          },
        ],
        generationConfig: { temperature: 0 },
      }),
    },
  );
  if (!res.ok) throw new Error("Gemini API error");
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return parseStudents(text);
}

const PROMPT = `
You are an OCR transcription assistant.

Your job is to transcribe student records exactly as they appear in the image.

IMPORTANT:
- Do NOT guess.
- Do NOT infer.
- Do NOT autocomplete.
- Do NOT fix spelling.
- Do NOT change formatting.
- Do NOT reorder names.
- Do NOT invent missing letters or digits.

For every student row extract:

1. studentNo
   - Copy exactly as shown.
   - Every digit must match the image.
   - If any digit cannot be read confidently, return "".

2. fullName
   - Copy exactly as written.
   - Preserve punctuation, spaces, capitalization, and spelling.
   - Do not rearrange first name/last name.
   - If any part of the name is unreadable, return "".

3. gender
   - Read the value from the "Sex" column.
   - If the Sex column contains "M", return "Male".
   - If the Sex column contains "F", return "Female".
   - If the Sex value is unreadable or missing, return "".
   - Do NOT infer gender from the student's name.

Before producing the final answer:
1. Read the table once.
2. Read the table a second time.
3. Verify that every studentNo exactly matches the image.
4. Verify that every fullName exactly matches the image.
5. Verify that the gender value is copied from the Sex column.
6. If verification fails for any field, return "" for that field instead of guessing.

Return ONLY a valid JSON array.

Example:
[
  {
    "studentNo": "",
    "fullName": "Lastname, FirstName",
    "gender": ""
  }
]
`;

export async function POST(request: NextRequest) {
  const teacher = await getCurrentTeacher();
  if (!teacher) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { allowed } = checkRateLimit(`extract:${ip}`, 10, 60 * 60 * 1000); // 10 per hour per IP
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  const provider = (process.env.AI_PROVIDER || "claude").toLowerCase();

  const keyMap: Record<string, string | undefined> = {
    claude: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
  };

  const apiKey = keyMap[provider];
  if (!apiKey) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const body = await request.json();
  const { base64Data, mediaType } = body;

  if (!base64Data || !mediaType) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 },
    );
  }

  if (!ALLOWED_MEDIA_TYPES.includes(mediaType)) {
    return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
  }

  if (base64Data.length > MAX_BASE64_BYTES) {
    return NextResponse.json(
      { error: "Image too large. Maximum size is 5MB." },
      { status: 413 },
    );
  }

  try {
    let students: ExtractedStudent[];

    if (provider === "openai") {
      students = await extractWithOpenAI(base64Data, mediaType, apiKey);
    } else if (provider === "gemini") {
      students = await extractWithGemini(base64Data, mediaType, apiKey);
    } else {
      students = await extractWithClaude(base64Data, mediaType, apiKey);
    }

    return NextResponse.json({ students });
  } catch (err: any) {
    const message = err?.message || "Extraction failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
