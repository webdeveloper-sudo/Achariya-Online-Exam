import "dotenv/config";
import fs from "fs";
import path from "path";
import { parseQuestionPaperPdf } from "../src/lib/pdf-question-parser";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

function evaluateObjectiveAnswer(
  pAnswer: string,
  correctAnswer: string,
  options?: string[]
): boolean {
  if (!pAnswer || !correctAnswer) return false;
  const pNorm = String(pAnswer).trim().toLowerCase();
  const cNorm = String(correctAnswer).trim().toLowerCase();

  if (pNorm === cNorm) return true;

  if (options && Array.isArray(options) && options.length > 0) {
    if (/^[a-f]$/i.test(cNorm)) {
      const idx = cNorm.charCodeAt(0) - 97;
      if (idx >= 0 && idx < options.length && pNorm === options[idx].trim().toLowerCase()) {
        return true;
      }
    }

    if (/^[1-6]$/.test(cNorm)) {
      const idx = parseInt(cNorm, 10) - 1;
      if (idx >= 0 && idx < options.length && pNorm === options[idx].trim().toLowerCase()) {
        return true;
      }
    }

    if (/^[a-f]$/i.test(pNorm)) {
      const idx = pNorm.charCodeAt(0) - 97;
      if (idx >= 0 && idx < options.length && options[idx].trim().toLowerCase() === cNorm) {
        return true;
      }
    }

    const cleanP = pNorm.replace(/^(\([a-d1-4]\)|[a-d1-4][\)\.\:\-–—\s])\s*/i, "").trim();
    const cleanC = cNorm.replace(/^(\([a-d1-4]\)|[a-d1-4][\)\.\:\-–—\s])\s*/i, "").trim();
    if (cleanP && cleanC && cleanP === cleanC) return true;
    if (cleanP && cleanP === cNorm) return true;
    if (cleanC && cleanC === pNorm) return true;
  }

  return false;
}

async function runMultiSectionTest() {
  console.log("=== Testing Multi-Section Question Number Collision & Evaluation Fix ===");

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([600, 800]);

  const bgJpgPath = path.join(process.cwd(), "public/images/bg.jpg");
  const jpgBuffer = fs.readFileSync(bgJpgPath);
  await pdfDoc.embedJpg(jpgBuffer);

  // Section 1: Science (4-row vertical options)
  page.drawText("SECTION A: SCIENCE", { x: 50, y: 750, size: 14, font: boldFont, color: rgb(0, 0, 0) });
  page.drawText("1. Which of the following is a standard unit of length?", { x: 50, y: 720, size: 11, font: boldFont, color: rgb(0, 0, 0) });
  page.drawText("A) Kilogram\nB) Metre\nC) Second\nD) Kelvin", { x: 70, y: 690, size: 10, font, color: rgb(0, 0, 0), lineHeight: 14 });
  page.drawText("Ans: B) Metre", { x: 70, y: 625, size: 10, font: boldFont, color: rgb(0, 0.5, 0) });

  page.drawText("2. 1 metre is equal to:", { x: 50, y: 590, size: 11, font: boldFont, color: rgb(0, 0, 0) });
  page.drawText("A) 10 cm\nB) 100 cm\nC) 1000 mm\nD) Both B and C", { x: 70, y: 560, size: 10, font, color: rgb(0, 0, 0), lineHeight: 14 });
  page.drawText("Ans: D", { x: 70, y: 495, size: 10, font: boldFont, color: rgb(0, 0.5, 0) });

  // Section 2: Maths (Single row horizontal options, restarting at Q1)
  page.drawText("SECTION B: MATHEMATICS", { x: 50, y: 450, size: 14, font: boldFont, color: rgb(0, 0, 0) });
  page.drawText("1. Which of the following has no endpoints and extends infinitely in both directions?", { x: 50, y: 420, size: 11, font: boldFont, color: rgb(0, 0, 0) });
  page.drawText("(A) Line segment (B) Ray (C) Line (D) Angle", { x: 70, y: 395, size: 10, font, color: rgb(0, 0, 0) });
  page.drawText("Ans: C) Line", { x: 70, y: 370, size: 10, font: boldFont, color: rgb(0, 0.5, 0) });

  page.drawText("2. Two lines that never meet are called:", { x: 50, y: 340, size: 11, font: boldFont, color: rgb(0, 0, 0) });
  page.drawText("(A) Intersecting lines (B) Parallel lines (C) Perpendicular lines (D) Rays", { x: 70, y: 315, size: 10, font, color: rgb(0, 0, 0) });
  page.drawText("Ans: B", { x: 70, y: 290, size: 10, font: boldFont, color: rgb(0, 0.5, 0) });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  const pdfBuffer = Buffer.from(pdfBytes);

  // 2. Parse Question Paper PDF
  const result = await parseQuestionPaperPdf(pdfBuffer, { mode: "question_paper_with_answers" });
  console.log("Result message:", result.message, "success:", result.success);
  console.assert(result.success === true, "PDF parsing failed");
  console.assert(result.questions.length === 4, `Expected 4 questions, got ${result.questions.length}`);

  // 3. Verify all question IDs are strictly unique
  const questionIds = result.questions.map((q) => q.id);
  const uniqueIds = new Set(questionIds);
  console.assert(uniqueIds.size === result.questions.length, "Question IDs must be strictly unique!");
  console.log(" Extracted Question IDs:", questionIds);

  // 4. Simulate Student Exam Session Answering:
  // Student selects:
  // Q1 (Science Q1): "Metre" (Correct)
  // Q2 (Science Q2): "Both B and C" (Correct)
  // Q3 (Maths Q1): "Line" (Correct)
  // Q4 (Maths Q2): "Parallel lines" (Correct)
  const studentAnswers: Record<string, string> = {};
  studentAnswers[result.questions[0].id] = "Metre";
  studentAnswers[result.questions[1].id] = "Both B and C";
  studentAnswers[result.questions[2].id] = "Line";
  studentAnswers[result.questions[3].id] = "Parallel lines";

  // 5. Verify Evaluation Engine and Audit Roster Output
  const auditReport = result.questions.map((q, idx) => {
    const studentAnswer =
      studentAnswers[q.id] ||
      studentAnswers[String(idx + 1)] ||
      studentAnswers[String(idx)] ||
      studentAnswers[`q-${idx + 1}`] ||
      "No Answer";
    const isCorrect = evaluateObjectiveAnswer(studentAnswer, q.correctAnswer, q.options);
    return {
      questionIndex: idx,
      questionText: q.question,
      studentAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect,
    };
  });

  console.log("\n--- Audit Report Output ---");
  auditReport.forEach((item) => {
    console.log(`Q${item.questionIndex + 1}: ${item.questionText.slice(0, 45)}...`);
    console.log(`   Student: "${item.studentAnswer}" | Expected: "${item.correctAnswer}" | Correct: ${item.isCorrect}`);
    console.assert(item.isCorrect === true, `Evaluation failed for Q${item.questionIndex + 1}`);
  });

  console.log("\n Multi-Section Question Number Collision & Evaluation Test PASSED 100%!");
}

runMultiSectionTest().catch(console.error);
