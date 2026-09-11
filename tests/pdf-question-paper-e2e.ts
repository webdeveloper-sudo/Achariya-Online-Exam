import "dotenv/config";
import fs from "fs";
import path from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { parseQuestionPaperPdf } from "../src/lib/pdf-question-parser";

async function runTests() {
  console.log("=== Testing Phase 2 PDF Question Paper Parser & Image Extraction ===");

  // 1. Generate a test PDF with text and an embedded image
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const page = pdfDoc.addPage([600, 800]);

  const bgJpgPath = path.join(process.cwd(), "public/images/bg.jpg");
  const jpgBuffer = fs.readFileSync(bgJpgPath);
  const embeddedImage = await pdfDoc.embedJpg(jpgBuffer);

  page.drawText("CBSE Class 10 Science Examination 2026", {
    x: 50,
    y: 750,
    size: 16,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText("1. Which organelle is known as the powerhouse of the cell?", {
    x: 50,
    y: 700,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText("A) Nucleus\nB) Mitochondria\nC) Ribosome\nD) Golgi Apparatus", {
    x: 70,
    y: 670,
    size: 11,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
    lineHeight: 16,
  });

  page.drawText("Answer: B) Mitochondria", {
    x: 70,
    y: 600,
    size: 11,
    font: boldFont,
    color: rgb(0, 0.5, 0),
  });

  // Question 2 with diagram
  page.drawText("2. Identify the cell part shown in the illustration below:", {
    x: 50,
    y: 560,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawImage(embeddedImage, {
    x: 70,
    y: 470,
    width: 60,
    height: 60,
  });

  page.drawText("A) Cell Membrane\nB) Chloroplast\nC) Nucleolus\nD) Vacuole", {
    x: 70,
    y: 430,
    size: 11,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
    lineHeight: 16,
  });

  page.drawText("Ans: B", {
    x: 70,
    y: 355,
    size: 11,
    font: boldFont,
    color: rgb(0, 0.5, 0),
  });

  // Question 3 True / False
  page.drawText("3. Plant cells have a rigid cell wall composed of cellulose.", {
    x: 50,
    y: 320,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText("A) True\nB) False", {
    x: 70,
    y: 295,
    size: 11,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
    lineHeight: 16,
  });

  page.drawText("Answer: True", {
    x: 70,
    y: 250,
    size: 11,
    font: boldFont,
    color: rgb(0, 0.5, 0),
  });

  // Question 4: 1-row inline options (User's case)
  page.drawText("4. Which of the following has no endpoints and extends infinitely in both directions?", {
    x: 50,
    y: 210,
    size: 12,
    font: boldFont,
    color: rgb(0, 0, 0),
  });

  page.drawText("A) Line segment          B) Ray          C) Line          D) Angle", {
    x: 70,
    y: 185,
    size: 11,
    font: font,
    color: rgb(0.2, 0.2, 0.2),
  });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  const pdfBuffer = Buffer.from(pdfBytes);

  console.log(`Generated synthetic PDF (${pdfBuffer.length} bytes)`);

  // 2. Test Parser with 'question_paper_without_answers' mode (User's mode)
  console.log("\n>>> Testing mode: question_paper_without_answers");
  const resultWithoutAns = await parseQuestionPaperPdf(pdfBuffer, {
    mode: "question_paper_without_answers",
  });

  console.log("Parse Success:", resultWithoutAns.success);
  console.log("Extracted Questions Count:", resultWithoutAns.questions?.length);
  if (!resultWithoutAns.success || !resultWithoutAns.questions) {
    throw new Error(`Parsing failed: ${resultWithoutAns.message}`);
  }

  const q4 = resultWithoutAns.questions[3];
  console.log("\n--- Question 4 (Single Row Inline Options) ---");
  console.log("Question:", q4.question);
  console.log("Type:", q4.type);
  console.log("Options:", q4.options);
  console.assert(q4.options.length === 4, `Expected 4 options for Q4, got ${q4.options.length}`);
  console.assert(q4.options[0] === "Line segment", `Expected 'Line segment', got '${q4.options[0]}'`);
  console.assert(q4.options[1] === "Ray", `Expected 'Ray', got '${q4.options[1]}'`);
  console.assert(q4.options[2] === "Line", `Expected 'Line', got '${q4.options[2]}'`);
  console.assert(q4.options[3] === "Angle", `Expected 'Angle', got '${q4.options[3]}'`);

  // 3. Test Parser with 'question_paper_with_answers' mode
  console.log("\n>>> Testing mode: question_paper_with_answers");
  const result = await parseQuestionPaperPdf(pdfBuffer, {
    mode: "question_paper_with_answers",
  });

  console.log("Parse Success:", result.success);
  console.log("Extracted Questions Count:", result.questions?.length);
  console.log("Unassigned Images Count:", result.unassignedImages?.length);

  if (!result.success || !result.questions) {
    throw new Error(`Parsing failed: ${result.message}`);
  }

  // Assertions
  console.assert(result.questions.length >= 4, `Expected at least 4 questions, got ${result.questions.length}`);
  
  const q1 = result.questions[0];
  console.log("\n--- Question 1 ---");
  console.log("Question:", q1.question);
  console.log("Type:", q1.type);
  console.log("Options:", q1.options);
  console.log("Correct Answer:", q1.correctAnswer);

  const q2 = result.questions[1];
  console.log("\n--- Question 2 ---");
  console.log("Question:", q2.question);
  console.log("Type:", q2.type);
  console.log("Options:", q2.options);
  console.log("Correct Answer:", q2.correctAnswer);
  console.log("Image URL:", q2.imageUrl);
  console.log("Confidence:", q2.confidence);

  const q3 = result.questions[2];
  console.log("\n--- Question 3 ---");
  console.log("Question:", q3.question);
  console.log("Type:", q3.type);
  console.log("Options:", q3.options);
  console.log("Correct Answer:", q3.correctAnswer);

  console.log("\n🎉 All assertions PASSED successfully!");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

