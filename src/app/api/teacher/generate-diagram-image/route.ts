import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

export async function POST(request: Request) {
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      return NextResponse.json({ success: false, message: "Google AI API key not configured." }, { status: 500 });
    }

    const body = await request.json();
    const { questionText, context } = body;

    if (!questionText) {
      return NextResponse.json({ success: false, message: "questionText is required." }, { status: 400 });
    }

    const prompt = `
Create a clean, professional, and educational SVG diagram representing the visual context for this exam question:
"${questionText}"

${context ? `Additional Context/Guidelines: ${context}` : ""}

Requirements:
1. Return ONLY valid SVG code starting with "<svg" and ending with "</svg>".
2. No markdown code blocks (no \`\`\`xml or \`\`\`svg), no HTML wrappers, no conversational text. Just raw SVG.
3. The SVG must:
   - Use a light/white background with a subtle border.
   - Use simple geometric shapes, clean borders, arrows, and clear labels.
   - Use standard clean web fonts (like Arial, Helvetica, sans-serif) for all text.
   - Be fully self-contained (no external resource links).
   - Be responsive using viewBox (e.g., viewBox="0 0 500 320").
   - Look modern, colored, high-contrast, and visually appealing for a school assessment paper.
`.trim();

    const modelsToTry = [
      "gemini-1.5-flash",
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",
      "gemini-flash-latest",
    ];

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
          },
        });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let svgText = response.text() || "";
        svgText = svgText.replace(/```xml/g, "").replace(/```svg/g, "").replace(/```/g, "").trim();

        const startIndex = svgText.indexOf("<svg");
        const endIndex = svgText.lastIndexOf("</svg>");
        if (startIndex !== -1 && endIndex !== -1) {
          svgText = svgText.substring(startIndex, endIndex + 6);
          const base64DataUrl = "data:image/svg+xml;base64," + Buffer.from(svgText).toString("base64");
          return NextResponse.json({ success: true, base64: base64DataUrl });
        }
      } catch (err: any) {
        console.warn(`[Teacher DiagramGen] Model ${modelName} failed:`, err.message || err);
      }
    }

    return NextResponse.json({
      success: false,
      message: "Diagram generation failed across available models.",
    });
  } catch (error: any) {
    console.error("[Teacher DiagramGen] Unexpected error:", error);
    return NextResponse.json({ success: false, message: "Internal server error: " + error.message }, { status: 500 });
  }
}
