import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";

// @ts-ignore — pdf-parse v1.1.1 (CJS) has no TS types
const pdfParse = require("pdf-parse");

// Initialise Gemini exactly as mi-way-lms does
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

// Helper to extract page range from contextual instructions
function extractPageRange(text: string): { start: number; end: number } | null {
  if (!text) return null;
  const match = text.match(/pages?\s+(\d+)\s*(?:to|-)\s*(\d+)/i);
  if (match) {
    return { start: parseInt(match[1], 10), end: parseInt(match[2], 10) };
  }
  const singleMatch = text.match(/pages?\s+(\d+)/i);
  if (singleMatch) {
    const page = parseInt(singleMatch[1], 10);
    return { start: page, end: page };
  }
  return null;
}

export async function POST(request: Request) {
  try {
    // ── 0. Guard: API key ──────────────────────────────────────────────────
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { success: false, message: "Google AI API Key is not configured on the server." },
        { status: 500 }
      );
    }

    // ── 1. Read multipart form ─────────────────────────────────────────────
    const formData = await request.formData();
    
    // Support multiple uploaded files under key "file" for flexibility
    const files = formData.getAll("file") as File[];
    const validFiles = files.filter(f => f && typeof f.name === "string" && f.size > 0);

    const numQuestionsVal = formData.get("numQuestions");
    const questionTypesVal = formData.get("questionTypes");
    
    // Optional contextual parameters
    const contextText = (formData.get("contextText")?.toString() || "").trim();
    const difficulty = (formData.get("difficulty")?.toString() || "").trim();
    const topic = (formData.get("topic")?.toString() || "").trim();
    const syllabus = (formData.get("syllabus")?.toString() || "").trim();
    const grade = (formData.get("grade")?.toString() || "").trim();
    const assessmentStyle = (formData.get("assessmentStyle")?.toString() || "").trim();
    let generationMode = (formData.get("generationMode")?.toString() || "").trim();

    // Dynamically infer generation mode if not explicitly provided
    if (!generationMode) {
      if (validFiles.length > 0 && contextText) {
        generationMode = "pdf_context";
      } else if (validFiles.length > 0) {
        generationMode = "pdf_only";
      } else if (contextText) {
        generationMode = "text_only";
      } else {
        return NextResponse.json(
          { success: false, message: "Invalid request. Please upload a document, enter instructions, or choose a mode." },
          { status: 400 }
        );
      }
    }

    // Validation
    if ((generationMode === "pdf_only" || generationMode === "pdf_context") && validFiles.length === 0) {
      return NextResponse.json(
        { success: false, message: "No documents uploaded. Please upload at least one document." },
        { status: 400 }
      );
    }

    if (generationMode === "text_only" && !contextText) {
      return NextResponse.json(
        { success: false, message: "Contextual instructions are required for Text Only generation mode." },
        { status: 400 }
      );
    }

    const numQuestions = numQuestionsVal ? parseInt(numQuestionsVal.toString(), 10) : 10;
    const questionTypes = questionTypesVal
      ? questionTypesVal.toString()
      : "multiple_choice,true_false,short_answer";

    // Helper to parse PDF with custom rendering to insert page markers
    const getPdfTextWithPageMarkers = async (dataBuffer: Buffer) => {
      let pageCount = 0;
      const pagerender = async (pageData: any) => {
        pageCount++;
        return pageData.getTextContent()
          .then((textContent: any) => {
            let lastY, text = "";
            for (let item of textContent.items) {
              if (lastY == item.transform[5] || !lastY) {
                text += item.str;
              } else {
                text += "\n" + item.str;
              }
              lastY = item.transform[5];
            }
            return `\n--- PAGE ${pageCount} ---\n${text}`;
          });
      };

      const parsed = await pdfParse(dataBuffer, { pagerender });
      return { text: parsed.text || "", pageCount };
    };

    // ── 2. Extract and Process Source Text ──────────────────────────────────
    let extractedText = "";

    if (generationMode === "pdf_only" || generationMode === "pdf_context") {
      let combinedText = "";

      for (const file of validFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const dataBuffer = Buffer.from(arrayBuffer);
        let fileText = "";
        const fileExt = file.name.split(".").pop()?.toLowerCase();

        if (fileExt === "pdf") {
          let text = "";
          let pageCount = 0;
          try {
            const parsedPdf = await getPdfTextWithPageMarkers(dataBuffer);
            text = parsedPdf.text;
            pageCount = parsedPdf.pageCount;
          } catch (pdfErr) {
            return NextResponse.json(
              { 
                success: false, 
                message: `Failed to parse PDF document "${file.name}". It might be corrupted, empty, or password-protected.` 
              },
              { status: 400 }
            );
          }

          const pageRange = extractPageRange(contextText);

          if (pageRange) {
            // Validate page range bounds
            if (pageRange.start < 1 || pageRange.end > pageCount || pageRange.start > pageRange.end) {
              return NextResponse.json(
                { 
                  success: false, 
                  message: `Requested page range (${pageRange.start} to ${pageRange.end}) is invalid for file "${file.name}". The file has only ${pageCount} pages.` 
                },
                { status: 400 }
              );
            }
            // Filter specific pages using markers
            const pageSplit = text.split(/--- PAGE \d+ ---/);
            const selectedPages: string[] = [];
            for (let p = pageRange.start; p <= pageRange.end; p++) {
              if (pageSplit[p]) {
                selectedPages.push(`--- PAGE ${p} ---\n` + pageSplit[p].trim());
              }
            }
            fileText = selectedPages.join("\n\n");
          } else {
            fileText = text;
          }
        } else if (fileExt === "docx") {
          const result = await mammoth.extractRawText({ buffer: dataBuffer });
          fileText = result.value;
        } else {
          // Plain text fallback
          fileText = dataBuffer.toString("utf-8");
        }

        combinedText += `\n\n=== DOCUMENT SOURCE: ${file.name} ===\n${fileText}`;
      }

      extractedText = combinedText.trim();

      if (!extractedText || extractedText.trim().length === 0) {
        return NextResponse.json(
          { success: false, message: "Could not extract text from the document. It might be empty or unreadable." },
          { status: 400 }
        );
      }

      // Keyword Chunk Filtering for extremely large texts to fit within limits elegantly
      if (extractedText.length > 15000 && contextText) {
        const pageRegex = /pages?\s+\d+(\s*(?:to|-)\s*\d+)?/gi;
        const cleanContextText = contextText.replace(pageRegex, "");
        const keywords = cleanContextText.toLowerCase()
          .replace(/[^\w\s]/g, "")
          .split(/\s+/)
          .filter(w => w.length > 3 && !["only", "from", "focus", "generate", "questions", "ignore", "text", "about"].includes(w));

        if (keywords.length > 0) {
          const rawChunks = extractedText.split(/\n\n+/);
          const chunks: string[] = [];
          let currentChunk = "";
          for (let rc of rawChunks) {
            if ((currentChunk + "\n\n" + rc).length > 3500) {
              if (currentChunk) chunks.push(currentChunk);
              currentChunk = rc;
            } else {
              currentChunk = currentChunk ? currentChunk + "\n\n" + rc : rc;
            }
          }
          if (currentChunk) chunks.push(currentChunk);

          // Score chunks by keyword match frequency
          const scoredChunks = chunks.map(chunk => {
            const lower = chunk.toLowerCase();
            let score = 0;
            keywords.forEach(keyword => {
              if (lower.includes(keyword)) {
                score += 10;
              }
            });
            return { chunk, score };
          });

          const hasMatches = scoredChunks.some(sc => sc.score > 0);
          if (hasMatches) {
            scoredChunks.sort((a, b) => b.score - a.score);
            let limit = 45000;
            let combined = "";
            for (let sc of scoredChunks) {
              if (combined.length + sc.chunk.length < limit || sc.score > 0) {
                combined += "\n\n...[Content Gap]...\n\n" + sc.chunk;
                if (combined.length >= limit) break;
              }
            }
            extractedText = combined.trim();
          }
        }
      }
    }

    // ── 3. Call Gemini — exact same model alias as mi-way-lms ───────────────
    // (Model initialization moved to fallback generation block below)

    // ── 4. Prompt Engineering ───────────────────────────────────────────────
    let prompt = "";
    
    if (generationMode === "pdf_only") {
      prompt = `
You are an expert curriculum designer and educator. Based on the provided instructional material, generate a comprehensive question bank.

TASKS:
1. Extract key concepts, definitions, and facts from the text.
2. Generate exactly ${numQuestions} questions.
3. Use a balanced mix of: ${questionTypes}.
4. Ensure instructions are clear and questions are challenging but fair.
5. Provide a correct answer and a brief educational explanation for each.

STRICT JSON FORMAT REQUIRED:
Return ONLY a JSON object. No markdown, no conversational text.
{
  "questions": [
    {
      "id": "1",
      "type": "multiple_choice",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why it is correct..."
    }
  ]
}

DOCUMENT CONTENT:
====================
${extractedText.substring(0, 100000)}
====================
`;
    } else if (generationMode === "pdf_context") {
      prompt = `
You are an expert curriculum designer and educator. Based on the provided instructional material and custom guidance, generate a comprehensive question bank.

PRIMARY SOURCE DOCUMENT:
The PDF/document content is your primary source. Generate questions based on the concepts, definitions, and facts in this text.

TARGET CONFIGURATION & GUIDANCE:
- Grade/Level: ${grade || "Not specified"}
- Syllabus/Board: ${syllabus || "Not specified"}
- Difficulty Level: ${difficulty || "Mixed"}
- Assessment Style: ${assessmentStyle || "Standard"}
- Target Topic: ${topic || "Not specified"}

CUSTOM CONTEXTUAL INSTRUCTIONS:
${contextText}

TASKS:
1. Extract key concepts from the source document according to the custom contextual instructions.
2. Generate exactly ${numQuestions} questions.
3. Use a balanced mix of: ${questionTypes}.
4. Ensure instructions are clear and questions are challenging but fair.
5. Provide a correct answer and a brief educational explanation for each.

STRICT JSON FORMAT REQUIRED:
Return ONLY a JSON object. No markdown, no conversational text.
{
  "questions": [
    {
      "id": "1",
      "type": "multiple_choice",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why it is correct..."
    }
  ]
}

DOCUMENT CONTENT (FILTERED):
====================
${extractedText.substring(0, 100000)}
====================
`;
    } else {
      // text_only
      prompt = `
You are an expert curriculum designer and educator. Based on the provided syllabus guidelines and pedagogical requirements, generate a comprehensive question bank.

TARGET CONFIGURATION:
- Grade/Level: ${grade || "5th Grade"}
- Syllabus/Board: ${syllabus || "CBSE"}
- Difficulty Level: ${difficulty || "Mixed"}
- Assessment Style: ${assessmentStyle || "Standard"}
- Target Topic: ${topic || "General Topic"}

CONTEXTUAL INSTRUCTIONS / DESCRIPTION:
${contextText}

TASKS:
1. Generate exactly ${numQuestions} questions matching the target configuration and contextual instructions.
2. Use a balanced mix of: ${questionTypes}.
3. Ensure instructions are clear and questions are challenging but fair.
4. Provide a correct answer and a brief educational explanation for each.

STRICT JSON FORMAT REQUIRED:
Return ONLY a JSON object. No markdown, no conversational text.
{
  "questions": [
    {
      "id": "1",
      "type": "multiple_choice",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why it is correct..."
    }
  ]
}
`;
    }

    let textResponse = "";
    let lastError: any = null;

    // Ordered fallback models. Since gemini-flash-latest (or gemini-3.5-flash) might hit daily/minute limits,
    // we use a tiered list of high-availability models with separate independent quotas.
    const modelsToTry = [
      "gemini-1.5-flash",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-1.5-pro",
      "gemini-flash-latest"
    ];

    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting question generation with Gemini model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        if (text && text.trim().length > 0) {
          textResponse = text;
          console.log(`Successfully generated questions using model: ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.warn(`Gemini Model ${modelName} failed or hit quota limits:`, err.message || err);
        lastError = err;
      }
    }

    if (!textResponse) {
      throw lastError || new Error("All fallback Gemini models failed to generate content.");
    }

    // Clean up potential markdown formatting from the LLM response
    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

    // ── 5. Parse and return ────────────────────────────────────────────────
    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(textResponse);
    } catch (parseErr) {
      console.error("Error parsing LLM response as JSON:", textResponse);
      return NextResponse.json(
        { success: false, message: "Failed to parse AI response into strict JSON format." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Questions generated successfully",
      questions: parsedResponse.questions || [],
    });

  } catch (error: any) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error: " + error.message,
      },
      { status: 500 }
    );
  }
}

