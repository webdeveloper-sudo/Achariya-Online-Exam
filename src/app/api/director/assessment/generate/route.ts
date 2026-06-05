import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";

// @ts-ignore — pdf-parse v1.1.1 has no TS types
const pdfParse = require("pdf-parse");

// Initialise Gemini
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
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json(
        { success: false, message: "Google AI API Key is not configured on the server." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("file") as File[];
    const validFiles = files.filter(f => f && typeof f.name === "string" && f.size > 0);

    const numQuestionsVal = formData.get("numQuestions");
    const questionTypesVal = formData.get("questionTypes");
    
    // Optional contextual parameters
    const contextText = (formData.get("contextText")?.toString() || "").trim();
    const difficulty = (formData.get("difficulty")?.toString() || "").trim();
    const topic = (formData.get("topic")?.toString() || "").trim();
    
    // Director-specific parameters
    const position = (formData.get("position")?.toString() || "").trim(); // e.g. "Physics Teacher" or "Primary Teacher"
    const department = (formData.get("department")?.toString() || "").trim();
    const teachingType = (formData.get("teachingType")?.toString() || "").trim(); // teaching or non teaching
    let generationMode = (formData.get("generationMode")?.toString() || "").trim();

    if (!generationMode) {
      if (validFiles.length > 0 && contextText) {
        generationMode = "pdf_context";
      } else if (validFiles.length > 0) {
        generationMode = "pdf_only";
      } else if (contextText) {
        generationMode = "text_only";
      } else {
        generationMode = "text_only";
      }
    }

    if ((generationMode === "pdf_only" || generationMode === "pdf_context") && validFiles.length === 0) {
      return NextResponse.json(
        { success: false, message: "No documents uploaded. Please upload at least one document." },
        { status: 400 }
      );
    }

    const numQuestions = numQuestionsVal ? parseInt(numQuestionsVal.toString(), 10) : 10;
    const questionTypes = questionTypesVal
      ? questionTypesVal.toString()
      : "multiple_choice,true_false,short_answer";

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
                message: `Failed to parse PDF document "${file.name}".` 
              },
              { status: 400 }
            );
          }

          const pageRange = extractPageRange(contextText);

          if (pageRange) {
            if (pageRange.start < 1 || pageRange.end > pageCount || pageRange.start > pageRange.end) {
              return NextResponse.json(
                { 
                  success: false, 
                  message: `Requested page range (${pageRange.start} to ${pageRange.end}) is invalid for file "${file.name}".` 
                },
                { status: 400 }
              );
            }
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
          fileText = dataBuffer.toString("utf-8");
        }

        combinedText += `\n\n=== DOCUMENT SOURCE: ${file.name} ===\n${fileText}`;
      }

      extractedText = combinedText.trim();

      if (!extractedText) {
        return NextResponse.json(
          { success: false, message: "Could not extract text from the document." },
          { status: 400 }
        );
      }

      if (extractedText.length > 15000 && contextText) {
        const pageRegex = /pages?\s+\d+(\s*(?:to|-)\s*\d+)?/gi;
        const cleanContextText = contextText.replace(pageRegex, "");
        const keywords = cleanContextText.toLowerCase()
          .replace(/[^\w\s]/g, "")
          .split(/\s+/)
          .filter(w => w.length > 3);

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

    // Call Gemini with Fallbacks
    let prompt = `
You are the Director of Academics and HR lead for the ACHARIYA Educational Group. Your goal is to design an assessment to evaluate teacher performance, subject competency, pedagogical understanding, and classroom management.

TARGET CONFIGURATION:
- Subject/Target Role: ${position || "Teacher"}
- Department/Field: ${department || "General Academics"}
- Job Classification: ${teachingType || "Teaching"}
- Core Topic/Skillset Focus: ${topic || "Pedagogical Aptitude & Subject Competency"}
- Difficulty Level: ${difficulty || "Mixed"}

Pedagogical Context:
Make sure questions are directly relevant to evaluating the competency of a teacher teaching "${position}" in the "${department}" department.
${teachingType === "teaching" ? "Focus on pedagogical knowledge, teaching methodologies, classroom management, subject proficiency, and lesson planning." : "Focus on administrative efficiency, professional ethics, school operations, and role competency."}

INSTRUCTIONS:
1. Generate exactly ${numQuestions} assessment questions.
2. Use a balanced mix of: ${questionTypes}.
3. Provide a correct answer and a brief educational explanation for each question.

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

    if (generationMode === "pdf_only" || generationMode === "pdf_context") {
      prompt += `
SOURCE DOCUMENT CONTENT:
====================
${extractedText.substring(0, 100000)}
====================
`;
    }

    if (contextText) {
      prompt += `
ADDITIONAL CONTEXT & GUIDANCE:
${contextText}
`;
    }

    let textResponse = "";
    let lastError: any = null;

    const modelsToTry = [
      "gemini-1.5-flash",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-1.5-pro",
      "gemini-flash-latest"
    ];

    for (const modelName of modelsToTry) {
      try {
        console.log(`[Director AI Gen] Trying model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        if (text && text.trim().length > 0) {
          textResponse = text;
          break;
        }
      } catch (err: any) {
        console.warn(`[Director AI Gen] Model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    if (!textResponse) {
      throw lastError || new Error("All fallback Gemini models failed.");
    }

    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

    let parsedResponse: any;
    try {
      parsedResponse = JSON.parse(textResponse);
    } catch (parseErr) {
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
    console.error("Error generating director questions:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
