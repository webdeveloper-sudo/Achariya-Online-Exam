import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

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

    // Initialize the new Google Gen AI client
    const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY || "" });

    // 1. Try standard dedicated image-capable Gemini models
    const imageModels = [
      "gemini-3.1-flash-image",
      "gemini-3-pro-image",
      "gemini-2.5-flash-image",
    ];

    const imagePrompt = `
Create a clear, educational diagram or illustration relevant to this exam question:

"${questionText}"

${context ? `Context: ${context}` : ""}

Requirements:
- The image should be a clean, professional educational diagram
- Use simple geometric shapes, labels, and arrows where appropriate  
- The diagram should directly relate to the question topic
- White or light background
- Suitable for a teacher evaluation exam paper
- No text that contradicts the question
`.trim();

    for (const modelName of imageModels) {
      try {
        console.log(`[Director DiagramGen] Trying model: ${modelName}`);
        
        const response = await ai.models.generateContent({
          model: modelName,
          contents: imagePrompt,
          config: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        });

        const candidates = response.candidates || [];
        for (const candidate of candidates) {
          const parts = candidate.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.mimeType?.startsWith("image/")) {
              const { mimeType, data } = part.inlineData;
              const base64DataUrl = `data:${mimeType};base64,${data}`;
              console.log(`[Director DiagramGen] Successfully generated image with model: ${modelName}`);
              return NextResponse.json({ success: true, base64: base64DataUrl });
            }
          }
        }
      } catch (err: any) {
        console.warn(`[Director DiagramGen] Model ${modelName} failed:`, err.message || err);
      }
    }

    // 2. Fallback: If image generation models are not supported/have zero quota on the free tier,
    // generate a clean educational SVG using the available text model and convert it to a data URL.
    console.log("[Director DiagramGen] Image models failed. Attempting SVG fallback...");
    const svgBase64 = await generateSVGWithGemini(ai, questionText, context);
    if (svgBase64) {
      return NextResponse.json({ success: true, base64: svgBase64 });
    }

    // All fallbacks failed — return gracefully without an image
    return NextResponse.json({
      success: false,
      message: "Image generation unavailable. Question saved without an image.",
    });
  } catch (error: any) {
    console.error("[Director DiagramGen] Unexpected error:", error);
    return NextResponse.json({ success: false, message: "Internal server error: " + error.message }, { status: 500 });
  }
}

async function generateSVGWithGemini(ai: GoogleGenAI, questionText: string, context?: string): Promise<string | null> {
  const prompt = `
Create a clean, professional, and educational SVG diagram representing the visual context for this exam question:
"${questionText}"

${context ? `Additional Context/Guidelines: ${context}` : ""}

Requirements:
1. Return ONLY valid SVG code starting with "<svg" and ending with "</svg>".
2. No markdown code blocks (no \`\`\`xml or \`\`\`svg), no HTML wrappers, no conversational text. Just the raw SVG.
3. The SVG must:
   - Use a light/white background.
   - Use simple geometric shapes, clean borders, arrows, and labels.
   - Use standard clean web fonts (like Arial, sans-serif) for all text.
   - Be fully self-contained (no external resource links).
   - Be responsive using viewBox (e.g., viewBox="0 0 400 300").
   - Look modern, colored, and visually appealing for a teacher assessment paper.
`.trim();

  const textModels = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];

  for (const modelName of textModels) {
    try {
      console.log(`[Director DiagramGen SVG Fallback] Trying model: ${modelName}`);
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });

      let svgText = response.text || "";
      svgText = svgText.replace(/```xml/g, "").replace(/```svg/g, "").replace(/```/g, "").trim();

      const startIndex = svgText.indexOf("<svg");
      const endIndex = svgText.lastIndexOf("</svg>");
      if (startIndex !== -1 && endIndex !== -1) {
        svgText = svgText.substring(startIndex, endIndex + 6);
        const base64DataUrl = "data:image/svg+xml;base64," + Buffer.from(svgText).toString("base64");
        console.log(`[Director DiagramGen SVG Fallback] Successfully generated SVG using ${modelName}`);
        return base64DataUrl;
      }
    } catch (err: any) {
      console.warn(`[Director DiagramGen SVG Fallback] Model ${modelName} failed:`, err.message || err);
    }
  }
  return null;
}
