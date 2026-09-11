import crypto from "crypto";
import { PDFDocument, PDFName, PDFRawStream } from "pdf-lib";
import { saveTempImage } from "./temp-image-store";

// @ts-ignore — pdf-parse v1.1.1 (CJS)
const pdfParse = require("pdf-parse");

export interface ExtractedQuestion {
  id: string;
  type: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  imageUrl?: string;
  images: string[];
  sharedImageId?: string;
  requiresReview?: boolean;
  confidence?: number;
  meta?: {
    qNum?: number;
    pageNumber?: number;
    rawText?: string;
  };
}

export interface UnassignedImage {
  id: string;
  url: string;
  pageNumber: number;
  width?: number;
  height?: number;
}

export interface ParseResult {
  success: boolean;
  mode: "question_paper_with_answers" | "question_paper_without_answers";
  questions: ExtractedQuestion[];
  unassignedImages: UnassignedImage[];
  stats: {
    totalQuestions: number;
    imagesExtracted: number;
    imagesAssociated: number;
    unassignedImages: number;
  };
  message?: string;
}

interface PageTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PageLine {
  text: string;
  y: number;
  pageNumber: number;
}

interface ExtractedImageMetadata {
  id: string;
  url: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  hash: string;
}

/**
 * Main Question Paper PDF parsing engine.
 * Deterministically extracts questions, options, answers, and images without AI.
 */
export async function parseQuestionPaperPdf(
  pdfBuffer: Buffer,
  options: {
    mode: "question_paper_with_answers" | "question_paper_without_answers";
    contextText?: string;
  },
): Promise<ParseResult> {
  const { mode } = options;

  // 1. Extract embedded raster images from PDF objects via pdf-lib
  const extractedImages: ExtractedImageMetadata[] = [];
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer, {
      ignoreEncryption: true,
    });
    const pages = pdfDoc.getPages();
    const seenHashes = new Map<string, { id: string; url: string }>();

    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      const page = pages[pIdx];
      const pageNumber = pIdx + 1;
      const { width: pageWidth, height: pageHeight } = page.getSize();

      const resources = page.node.Resources();
      if (!resources) continue;

      const xObject = resources.get(PDFName.of("XObject"));
      if (!xObject) continue;

      const xObjectDict = pdfDoc.context.lookup(xObject);
      if (!xObjectDict || typeof (xObjectDict as any).entries !== "function")
        continue;

      const entries = (xObjectDict as any).entries();
      let imgOnPageIdx = 0;

      for (const [nameKey, objRef] of entries) {
        try {
          const stream = pdfDoc.context.lookup(objRef);
          if (!(stream instanceof PDFRawStream)) continue;

          const dict = stream.dict;
          const subtype = dict.get(PDFName.of("Subtype"));
          if (subtype !== PDFName.of("Image")) continue;

          const filter = dict.get(PDFName.of("Filter"));
          const imgWidth = dict.get(PDFName.of("Width"))?.toString() || "0";
          const imgHeight = dict.get(PDFName.of("Height"))?.toString() || "0";
          const wNum = parseInt(imgWidth, 10) || 100;
          const hNum = parseInt(imgHeight, 10) || 100;

          // Ignore tiny decorative lines / icons (< 24x24 px or extreme aspect ratios)
          if (wNum < 24 && hNum < 24) continue;
          if (wNum / hNum > 25 || hNum / wNum > 25) continue;

          const rawBytes = stream.contents;
          if (!rawBytes || rawBytes.length === 0) continue;

          let mimeType = "image/png";
          let buffer: Buffer;

          if (
            filter === PDFName.of("DCTDecode") ||
            (filter as any)?.name === "DCTDecode"
          ) {
            mimeType = "image/jpeg";
            buffer = Buffer.from(rawBytes);
          } else {
            // PNG or raw stream fallback
            mimeType = "image/png";
            buffer = Buffer.from(rawBytes);
          }

          const hash = crypto.createHash("sha256").update(buffer).digest("hex");
          let tempId: string;
          let tempUrl: string;

          if (seenHashes.has(hash)) {
            tempId = seenHashes.get(hash)!.id;
            tempUrl = seenHashes.get(hash)!.url;
          } else {
            tempId = await saveTempImage(buffer, mimeType);
            tempUrl = `/api/temp-images/${tempId}`;
            seenHashes.set(hash, { id: tempId, url: tempUrl });
          }

          // Compute estimated vertical position on page based on order
          imgOnPageIdx++;
          const approxY = (pageHeight / (entries.length + 1)) * imgOnPageIdx;

          extractedImages.push({
            id: tempId,
            url: tempUrl,
            pageNumber,
            x: pageWidth / 2,
            y: approxY,
            width: wNum,
            height: hNum,
            hash,
          });
        } catch (imgErr) {
          console.warn("[PDF Parser] Image extraction warning:", imgErr);
        }
      }
    }
  } catch (pdfLibErr) {
    console.warn("[PDF Parser] pdf-lib extraction warning:", pdfLibErr);
  }

  // 2. Extract page-by-page text layout with coordinates using pdf-parse
  const pageLines: PageLine[] = [];
  let fullRawText = "";
  let totalPages = 0;

  try {
    const pagerender = async (pageData: any) => {
      totalPages++;
      const pageNumber = totalPages;
      const textContent = await pageData.getTextContent({
        normalizeWhitespace: false,
      });
      const items: PageTextItem[] = [];

      for (const item of textContent.items) {
        if (!item || !item.str) continue;
        const tx = item.transform ? item.transform[4] : 0;
        const ty = item.transform ? item.transform[5] : 0;
        items.push({
          str: item.str,
          x: tx,
          y: ty,
          width: item.width || 0,
          height: item.height || 0,
        });
      }

      // Sort items top-to-bottom (Y descending), left-to-right (X ascending)
      items.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 3) {
          return b.y - a.y; // Higher Y first (top of page)
        }
        return a.x - b.x; // Left to right
      });

      // Group items into lines
      let currentLine = "";
      let lastY = -9999;

      for (const item of items) {
        if (lastY === -9999 || Math.abs(item.y - lastY) <= 4) {
          currentLine += (currentLine ? " " : "") + item.str;
        } else {
          if (currentLine.trim()) {
            pageLines.push({ text: currentLine.trim(), y: lastY, pageNumber });
          }
          currentLine = item.str;
        }
        lastY = item.y;
      }
      if (currentLine.trim()) {
        pageLines.push({ text: currentLine.trim(), y: lastY, pageNumber });
      }

      return items.map((it) => it.str).join(" ");
    };

    try {
      const parsed = await pdfParse(pdfBuffer, { pagerender });
      fullRawText = parsed.text || "";
    } catch (renderErr) {
      // Fallback: parse without custom pagerender if stream warnings occurred
      const parsed = await pdfParse(pdfBuffer);
      fullRawText = parsed.text || "";
      if (pageLines.length === 0 && fullRawText) {
        const lines = fullRawText.split("\n");
        lines.forEach((line: string, idx: number) => {
          if (line.trim()) {
            pageLines.push({
              text: line.trim(),
              y: 1000 - idx * 15,
              pageNumber: 1,
            });
          }
        });
      }
    }
  } catch (err: any) {
    return {
      success: false,
      mode,
      questions: [],
      unassignedImages: [],
      stats: {
        totalQuestions: 0,
        imagesExtracted: 0,
        imagesAssociated: 0,
        unassignedImages: 0,
      },
      message: "Failed to parse PDF document: " + err.message,
    };
  }

  // Scanned PDF check: If fewer than 40 characters across all pages
  if (fullRawText.trim().length < 40) {
    return {
      success: false,
      mode,
      questions: [],
      unassignedImages: extractedImages.map((img) => ({
        id: img.id,
        url: img.url,
        pageNumber: img.pageNumber,
        width: img.width,
        height: img.height,
      })),
      stats: {
        totalQuestions: 0,
        imagesExtracted: extractedImages.length,
        imagesAssociated: 0,
        unassignedImages: extractedImages.length,
      },
      message:
        "Scanned / image-only PDF detected. Direct question reconstruction requires a digital text-based PDF. Please upload a digital PDF or switch to Syllabus AI generation mode.",
    };
  }

  // 3. Question Segmentation & Parsing
  const rawDocumentText = pageLines.map((l) => l.text).join("\n");

  // Isolate End-of-Document Answer Key if present
  let answerKeyMap = new Map<number, string>();
  let contentText = rawDocumentText;

  if (mode === "question_paper_with_answers") {
    const answerKeyMatch = rawDocumentText.match(
      /(?:\n|^)(?:Answer\s*Key|Solutions?|Answers?|Answer\s*Sheet)\s*[\:\-]?\s*\n([\s\S]+)$/i,
    );
    if (answerKeyMatch) {
      const keySection = answerKeyMatch[1];
      contentText = rawDocumentText.substring(0, answerKeyMatch.index);

      // Parse entries like "1. A", "2 - (C)", "3) True", "4: Mitochondria"
      const keyRegex =
        /(?:Q\.?\s*)?(\d{1,3})\s*[\.\:\-\)\s]\s*(?:\(?([A-Da-d1-4])\)?|[A-Za-z0-9\s\.\-]+)/g;
      let km;
      while ((km = keyRegex.exec(keySection)) !== null) {
        const qNum = parseInt(km[1], 10);
        const ans = km[2]
          ? km[2].toUpperCase()
          : km[0].split(/[\.\:\-\)]/)[1]?.trim();
        if (qNum && ans) {
          answerKeyMap.set(qNum, ans);
        }
      }
    }
  }

  // Match question boundaries
  // Matches "1.", "Q1.", "Question 1:", "1)", "(1)", "[1]"
  const questionHeaderRegex =
    /(?:^|\n)\s*(?:Question\s*|Q\.?\s*|Ques\s*|Qn\s*)?(\d{1,3})\s*[\.\:\-\)\/]\s*/gi;

  const matches: { index: number; qNum: number; headerLength: number }[] = [];
  let m;
  while ((m = questionHeaderRegex.exec(contentText)) !== null) {
    const qNum = parseInt(m[1], 10);
    // Ignore small list numbers inside options
    if (qNum > 0 && qNum <= 200) {
      matches.push({
        index: m.index,
        qNum,
        headerLength: m[0].length,
      });
    }
  }

  const rawQuestionBlocks: {
    qNum: number;
    rawText: string;
    pageNumber: number;
  }[] = [];

  if (matches.length > 0) {
    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const nextIndex =
        i + 1 < matches.length ? matches[i + 1].index : contentText.length;
      const blockText = contentText
        .substring(current.index + current.headerLength, nextIndex)
        .trim();

      // Find approximate page number for this question
      const approxCharPos = current.index;
      let runningChars = 0;
      let pNum = 1;
      for (const pl of pageLines) {
        runningChars += pl.text.length + 1;
        if (runningChars >= approxCharPos) {
          pNum = pl.pageNumber;
          break;
        }
      }

      rawQuestionBlocks.push({
        qNum: current.qNum,
        rawText: blockText,
        pageNumber: pNum,
      });
    }
  } else {
    // Fallback: Split by double newlines if standard numbering was not found
    const paragraphs = contentText
      .split(/\n\n+/)
      .filter((p) => p.trim().length > 15);
    paragraphs.forEach((p, idx) => {
      rawQuestionBlocks.push({
        qNum: idx + 1,
        rawText: p.trim(),
        pageNumber: 1,
      });
    });
  }

  // 4. Parse Options, Inline Answers, and Structure for Each Question Block
  const parsedQuestions: ExtractedQuestion[] = [];
  const assignedImageIds = new Set<string>();

  for (let idx = 0; idx < rawQuestionBlocks.length; idx++) {
    const block = rawQuestionBlocks[idx];
    let text = block.rawText;
    let extractedOptions: string[] = [];
    let inlineAnswer = "";
    let explanation = "";

    // A. Extract inline answer if present
    if (mode === "question_paper_with_answers") {
      const inlineAnsMatch = text.match(
        /(?:\n|^|\s{2,})(?:Ans(?:wer)?|Correct\s*Answer|Key)\s*[\:\-]?\s*([^\n\r]+)/i,
      );
      if (inlineAnsMatch) {
        const fullAnsLine = inlineAnsMatch[1].trim();
        const letterMatch = fullAnsLine.match(
          /^\(?([A-Da-d1-4])\)?(?:\s*[\:\-\.]?\s*(.*))?$/,
        );
        if (letterMatch && letterMatch[2]) {
          inlineAnswer = letterMatch[2].trim();
        } else if (letterMatch && letterMatch[1]) {
          inlineAnswer = letterMatch[1].toUpperCase();
        } else {
          inlineAnswer = fullAnsLine;
        }
        text = text.replace(inlineAnsMatch[0], "").trim();
      }

      const expMatch = text.match(
        /(?:\n|^|\s{2,})(?:Explanation|Solution|Rationale)\s*[\:\-]?\s*([^\n\r]+)/i,
      );
      if (expMatch) {
        explanation = expMatch[1].trim();
        text = text.replace(expMatch[0], "").trim();
      }
    }

    // B. Extract Multiple Choice Options & Stem (handles 1-row, 2-row, 4-row, single/multi-column layouts)
    const { stem: extractedStem, options: parsedOpts } =
      extractOptionsAndStem(text);
    extractedOptions = parsedOpts;
    let stem = extractedStem;

    // C. Reconcile Correct Answer
    let finalAnswer = "";
    if (mode === "question_paper_with_answers") {
      if (inlineAnswer) {
        // If inline answer is a single letter (e.g. "B" or "2"), map to option text
        if (extractedOptions.length > 0 && /^[A-D]$/i.test(inlineAnswer)) {
          const letterIdx = inlineAnswer.toUpperCase().charCodeAt(0) - 65;
          finalAnswer = extractedOptions[letterIdx] || inlineAnswer;
        } else if (
          extractedOptions.length > 0 &&
          /^[1-4]$/.test(inlineAnswer)
        ) {
          const numIdx = parseInt(inlineAnswer, 10) - 1;
          finalAnswer = extractedOptions[numIdx] || inlineAnswer;
        } else {
          finalAnswer = inlineAnswer;
        }
      } else if (answerKeyMap.has(block.qNum)) {
        const keyAns = answerKeyMap.get(block.qNum)!;
        if (extractedOptions.length > 0 && /^[A-D]$/i.test(keyAns)) {
          const letterIdx = keyAns.toUpperCase().charCodeAt(0) - 65;
          finalAnswer = extractedOptions[letterIdx] || keyAns;
        } else {
          finalAnswer = keyAns;
        }
      }
    }

    // D. Classify Question Type (Non-blocking)
    let qType = "multiple_choice";
    const lowerStem = stem.toLowerCase();

    if (extractedOptions.length >= 2) {
      if (
        extractedOptions.length === 2 &&
        ((extractedOptions[0].toLowerCase().includes("true") &&
          extractedOptions[1].toLowerCase().includes("false")) ||
          (extractedOptions[0].toLowerCase().includes("yes") &&
            extractedOptions[1].toLowerCase().includes("no")))
      ) {
        qType = "true_false";
      } else {
        qType = "multiple_choice";
      }
    } else if (
      lowerStem.includes("fill in the blank") ||
      lowerStem.includes("___") ||
      lowerStem.includes("......")
    ) {
      qType = "fill_in_the_blanks";
    } else if (
      lowerStem.includes("match the following") ||
      lowerStem.includes("column a") ||
      lowerStem.includes("column b")
    ) {
      qType = "match_the_following";
    } else if (lowerStem.includes("odd one out")) {
      qType = "odd_one_out";
    } else if (
      lowerStem.includes("explain in detail") ||
      lowerStem.includes("essay") ||
      stem.length > 250
    ) {
      qType = "long_answer";
    } else {
      qType = "short_answer";
    }

    parsedQuestions.push({
      id: `q-${idx + 1}`,
      type: qType,
      question: stem || block.rawText,
      options: extractedOptions,
      correctAnswer: finalAnswer,
      explanation: explanation || undefined,
      imageUrl: undefined,
      images: [],
      meta: {
        qNum: block.qNum,
        pageNumber: block.pageNumber,
        rawText: block.rawText,
      },
    });
  }

  // 5. Confidence-Based Image Association Algorithm
  // Check for shared diagram instructions (e.g. "Questions 10 to 12")
  const sharedGroupRegex =
    /(?:Questions?|Q\.?)\s*(\d{1,3})\s*(?:to|-|through)\s*(\d{1,3})/i;

  for (const q of parsedQuestions) {
    const raw = q.meta?.rawText || q.question;
    const sharedMatch = raw.match(sharedGroupRegex);
    if (sharedMatch) {
      const startQ = parseInt(sharedMatch[1], 10);
      const endQ = parseInt(sharedMatch[2], 10);
      if (startQ && endQ && endQ >= startQ && endQ - startQ <= 10) {
        const groupId = `shared-group-${startQ}-${endQ}`;
        // Find image on this question's page
        const candidateImg = extractedImages.find(
          (img) =>
            img.pageNumber === q.meta?.pageNumber &&
            !assignedImageIds.has(img.id),
        );
        if (candidateImg) {
          assignedImageIds.add(candidateImg.id);
          for (let i = startQ; i <= endQ; i++) {
            const targetQ = parsedQuestions.find(
              (pq) => pq.meta?.qNum === i || pq.id === `q-${i}` || pq.id === String(i)
            );
            if (targetQ) {
              targetQ.sharedImageId = groupId;
              targetQ.imageUrl = candidateImg.url;
              if (!targetQ.images.includes(candidateImg.url)) {
                targetQ.images.push(candidateImg.url);
              }
              if (targetQ.type === "multiple_choice")
                targetQ.type = "diagram_mcq";
              if (targetQ.type === "short_answer")
                targetQ.type = "diagram_short_answer";
            }
          }
        }
      }
    }
  }

  // Associate remaining unshared images based on spatial page proximity & confidence
  const unassignedImages: UnassignedImage[] = [];

  for (const img of extractedImages) {
    if (assignedImageIds.has(img.id)) continue;

    // Find questions on the same page
    const pageQuestions = parsedQuestions.filter(
      (q) => q.meta?.pageNumber === img.pageNumber,
    );

    if (pageQuestions.length === 1) {
      // High confidence: Single question on page
      const q = pageQuestions[0];
      q.imageUrl = q.imageUrl || img.url;
      q.images.push(img.url);
      q.confidence = 0.95;
      q.requiresReview = false;
      if (q.type === "multiple_choice") q.type = "diagram_mcq";
      if (q.type === "short_answer") q.type = "diagram_short_answer";
      assignedImageIds.add(img.id);
    } else if (pageQuestions.length > 1) {
      // Multi-question page: Check textual references first
      let matchedQ = pageQuestions.find((q) =>
        /(?:diagram|figure|image|given below|illustration|picture|graph|chart)/i.test(
          q.question,
        ),
      );

      if (matchedQ) {
        matchedQ.imageUrl = matchedQ.imageUrl || img.url;
        matchedQ.images.push(img.url);
        matchedQ.confidence = 0.85;
        matchedQ.requiresReview = false;
        if (matchedQ.type === "multiple_choice") matchedQ.type = "diagram_mcq";
        if (matchedQ.type === "short_answer")
          matchedQ.type = "diagram_short_answer";
        assignedImageIds.add(img.id);
      } else {
        // Medium confidence: Assign to first available question on page with requiresReview flag
        const candidateQ = pageQuestions[0];
        candidateQ.imageUrl = candidateQ.imageUrl || img.url;
        candidateQ.images.push(img.url);
        candidateQ.confidence = 0.55;
        candidateQ.requiresReview = true;
        assignedImageIds.add(img.id);
      }
    } else {
      // Low confidence / No matching question on page -> Unassigned Pool
      unassignedImages.push({
        id: img.id,
        url: img.url,
        pageNumber: img.pageNumber,
        width: img.width,
        height: img.height,
      });
    }
  }

  // Clean metadata internal fields before returning
  const cleanQuestions = parsedQuestions.map(({ meta, ...rest }) => rest);

  return {
    success: true,
    mode,
    questions: cleanQuestions,
    unassignedImages,
    stats: {
      totalQuestions: cleanQuestions.length,
      imagesExtracted: extractedImages.length,
      imagesAssociated: assignedImageIds.size,
      unassignedImages: unassignedImages.length,
    },
    message: `Successfully reconstructed ${cleanQuestions.length} questions from question paper.`,
  };
}

/**
 * Strips trailing subject headers, chapter titles, instructions, or trailing answers from the last option.
 */
function cleanTrailingTrailer(text: string): string {
  if (!text) return "";
  const trailerPatterns = [
    /(?:\r?\n)+\s*(?:MATHS?|MATHEMATICS|SCIENCE|PHYSICS|CHEMISTRY|BIOLOGY|ENGLISH|SOCIAL\s*STUDIES|HINDI|TAMIL|SECTION\s*[-–—]?[A-Z0-9]|PART\s*[-–—]?[A-Z0-9]|CHAPTER\s*[\:\d]|Chapter\s*[\:\d]|DIRECTIONS?[\:\s]|INSTRUCTIONS?[\:\s]|TIME\s*[\:\d]|MARKS\s*[\:\d]|MAX(?:IMUM)?\s*MARKS)[\s\S]*$/i,
    /(?:\r?\n){2,}\s*[A-Z][A-Z0-9\s\:\-–—]{3,}(?:\r?\n|$)/,
    /(?:\r?\n|^|\s{2,})(?:Ans(?:wer)?|Correct\s*Answer|Key|Explanation|Solution|Rationale)[\:\-]?[\s\S]*$/i,
  ];

  let cleaned = text;
  for (const pat of trailerPatterns) {
    cleaned = cleaned.replace(pat, "").trim();
  }
  return cleaned;
}

interface CandidateMarker {
  startIndex: number;
  endIndex: number;
  label: string;
  seqType: "alpha" | "num" | "roman";
  seqIndex: number;
  style: string;
}

/**
 * Extracts multiple choice options and separates the question stem cleanly,
 * supporting 1-row (all in single line), 2-row (2x2 grid), and 4-row (vertical) layouts,
 * as well as all standard delimiter styles (A), A), A., [A], A:, A -.
 */
export function extractOptionsAndStem(rawText: string): {
  stem: string;
  options: string[];
} {
  let text = rawText.trim();
  if (!text) {
    return { stem: "", options: [] };
  }

  const ALPHA_SEQ = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const NUM_SEQ = ["1", "2", "3", "4", "5", "6"];
  const ROMAN_SEQ = ["I", "II", "III", "IV", "V", "VI"];

  const markerDefinitions = [
    {
      style: "paren_both",
      regex: /(?:^|[\s\n\r\t,;])\(([a-hA-H1-6]|i{1,3}|iv|v|vi)\)/gi,
      getStart: (match: RegExpExecArray) => match.index + match[0].indexOf("("),
    },
    {
      style: "bracket_both",
      regex: /(?:^|[\s\n\r\t,;])\[([a-hA-H1-6]|i{1,3}|iv|v|vi)\]/gi,
      getStart: (match: RegExpExecArray) => match.index + match[0].indexOf("["),
    },
    {
      style: "paren_after",
      regex: /(?:^|[\s\n\r\t,;])([a-hA-H1-6]|i{1,3}|iv|v|vi)\)/gi,
      getStart: (match: RegExpExecArray) => {
        const full = match[0];
        const label = match[1];
        const idx = full.indexOf(label);
        return match.index + (idx >= 0 ? idx : 0);
      },
    },
    {
      style: "dot_after",
      regex:
        /(?:^|[\s\n\r\t,;])([a-hA-H1-6]|i{1,3}|iv|v|vi)\.(?!\d|[a-zA-Z])/gi,
      getStart: (match: RegExpExecArray) => {
        const full = match[0];
        const label = match[1];
        const idx = full.indexOf(label);
        return match.index + (idx >= 0 ? idx : 0);
      },
    },
    {
      style: "colon_after",
      regex: /(?:^|[\s\n\r\t,;])([a-hA-H1-6]|i{1,3}|iv|v|vi)\:/gi,
      getStart: (match: RegExpExecArray) => {
        const full = match[0];
        const label = match[1];
        const idx = full.indexOf(label);
        return match.index + (idx >= 0 ? idx : 0);
      },
    },
    {
      style: "dash_after",
      regex: /(?:^|[\s\n\r\t,;])([a-hA-H1-6]|i{1,3}|iv|v|vi)\s*[-–—]\s+/gi,
      getStart: (match: RegExpExecArray) => {
        const full = match[0];
        const label = match[1];
        const idx = full.indexOf(label);
        return match.index + (idx >= 0 ? idx : 0);
      },
    },
  ];

  const candidateMarkers: CandidateMarker[] = [];

  for (const def of markerDefinitions) {
    let m: RegExpExecArray | null;
    const re = new RegExp(def.regex.source, def.regex.flags);
    while ((m = re.exec(text)) !== null) {
      const rawLabel = m[1].toUpperCase();
      let seqType: "alpha" | "num" | "roman" | null = null;
      let seqIndex = -1;

      if (ALPHA_SEQ.includes(rawLabel)) {
        seqType = "alpha";
        seqIndex = ALPHA_SEQ.indexOf(rawLabel);
      } else if (NUM_SEQ.includes(rawLabel)) {
        seqType = "num";
        seqIndex = NUM_SEQ.indexOf(rawLabel);
      } else if (ROMAN_SEQ.includes(rawLabel)) {
        seqType = "roman";
        seqIndex = ROMAN_SEQ.indexOf(rawLabel);
      }

      if (seqType && seqIndex >= 0) {
        const startIndex = def.getStart(m);
        const endIndex = m.index + m[0].length;
        candidateMarkers.push({
          startIndex,
          endIndex,
          label: rawLabel,
          seqType,
          seqIndex,
          style: def.style,
        });
      }
    }
  }

  candidateMarkers.sort((a, b) => a.startIndex - b.startIndex);

  interface Chain {
    markers: CandidateMarker[];
    score: number;
  }

  const validChains: Chain[] = [];
  const seqTypes: ("alpha" | "num" | "roman")[] = ["alpha", "num", "roman"];

  for (const st of seqTypes) {
    const typeMarkers = candidateMarkers.filter((m) => m.seqType === st);
    const startMarkers = typeMarkers.filter((m) => m.seqIndex === 0);

    for (const startM of startMarkers) {
      const styles = Array.from(new Set(typeMarkers.map((m) => m.style)));

      for (const targetStyle of [
        startM.style,
        ...styles.filter((s) => s !== startM.style),
      ]) {
        const currentChain: CandidateMarker[] = [startM];
        let expectedNextIndex = 1;
        let lastEndIndex = startM.endIndex;

        while (
          expectedNextIndex <
          (st === "alpha"
            ? ALPHA_SEQ.length
            : st === "num"
              ? NUM_SEQ.length
              : ROMAN_SEQ.length)
        ) {
          const nextCandidates = typeMarkers.filter(
            (m) =>
              m.seqIndex === expectedNextIndex &&
              m.startIndex >= lastEndIndex &&
              (m.style === targetStyle || m.style === startM.style),
          );

          if (nextCandidates.length === 0) {
            const fallbackCandidates = typeMarkers.filter(
              (m) =>
                m.seqIndex === expectedNextIndex &&
                m.startIndex >= lastEndIndex,
            );
            if (fallbackCandidates.length > 0) {
              const bestNext = fallbackCandidates[0];
              currentChain.push(bestNext);
              lastEndIndex = bestNext.endIndex;
              expectedNextIndex++;
            } else {
              break;
            }
          } else {
            const bestNext = nextCandidates[0];
            currentChain.push(bestNext);
            lastEndIndex = bestNext.endIndex;
            expectedNextIndex++;
          }
        }

        if (currentChain.length >= 2) {
          let score = currentChain.length * 100;
          if (st === "alpha") score += 50;
          const allSameStyle = currentChain.every(
            (m) => m.style === currentChain[0].style,
          );
          if (allSameStyle) score += 30;
          if (startM.startIndex > 5) score += 20;

          validChains.push({
            markers: currentChain,
            score,
          });
        }
      }
    }
  }

  if (validChains.length === 0) {
    return {
      stem: text,
      options: [],
    };
  }

  validChains.sort((a, b) => b.score - a.score);
  const bestChain = validChains[0].markers;

  let stem = text.substring(0, bestChain[0].startIndex).trim();
  const rawOptions: string[] = [];

  for (let i = 0; i < bestChain.length; i++) {
    const curr = bestChain[i];
    const nextStart =
      i + 1 < bestChain.length ? bestChain[i + 1].startIndex : text.length;
    let optContent = text.substring(curr.endIndex, nextStart).trim();

    if (i === bestChain.length - 1) {
      optContent = cleanTrailingTrailer(optContent);
    }

    optContent = optContent.replace(/^[–—\:\-\.\)]+\s*/, "").trim();
    rawOptions.push(optContent);
  }

  const cleanedOptions = rawOptions.filter((o) => o.length > 0);

  if (cleanedOptions.length < 2) {
    return {
      stem: text,
      options: [],
    };
  }

  return {
    stem: stem || text,
    options: cleanedOptions,
  };
}
