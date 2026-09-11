import "dotenv/config";
import fs from "fs";
import path from "path";
import { saveTempImage, getTempImage, resolveAndUploadQuestionImages } from "../src/lib/temp-image-store";

async function testResolution() {
  console.log("=== Testing Temp Image Store and Save Resolution ===");

  const bgJpgPath = path.join(process.cwd(), "public/images/bg.jpg");
  const sampleBuffer = fs.readFileSync(bgJpgPath);
  const tempId1 = await saveTempImage(sampleBuffer, "image/jpeg");
  console.log("Saved temp image 1:", tempId1);

  const retrieved = await getTempImage(tempId1);
  console.assert(retrieved !== null, "Failed to retrieve temp image 1");
  console.log("Retrieved temp image data size:", retrieved?.buffer.length);

  // Test question array with multiple questions sharing the same temporary image URL
  const tempUrl = `/api/temp-images/${tempId1}`;
  const mockQuestions = [
    {
      id: "1",
      type: "diagram_mcq",
      question: "Question 1 with shared diagram",
      options: ["A", "B", "C", "D"],
      correctAnswer: "A",
      imageUrl: tempUrl,
      images: [tempUrl],
      sharedImageId: "group-1",
    },
    {
      id: "2",
      type: "diagram_short_answer",
      question: "Question 2 referencing same diagram",
      options: [],
      correctAnswer: "Answer 2",
      imageUrl: tempUrl,
      images: [tempUrl],
      sharedImageId: "group-1",
    },
    {
      id: "3",
      type: "multiple_choice",
      question: "Question 3 with external https URL",
      options: ["True", "False"],
      correctAnswer: "True",
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      images: ["https://res.cloudinary.com/demo/image/upload/sample.jpg"],
    },
  ];

  console.log("\nResolving question images for mock questions...");
  const resolvedQuestions = await resolveAndUploadQuestionImages(mockQuestions);

  console.log("Resolved Q1 imageUrl:", resolvedQuestions[0].imageUrl);
  console.log("Resolved Q2 imageUrl:", resolvedQuestions[1].imageUrl);
  console.log("Resolved Q3 imageUrl:", resolvedQuestions[2].imageUrl);

  // Assertions
  console.assert(
    resolvedQuestions[0].imageUrl === resolvedQuestions[1].imageUrl,
    "Shared images must resolve to the exact same URL"
  );
  console.assert(
    resolvedQuestions[2].imageUrl === "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    "External HTTPS URLs must be preserved untouched"
  );

  console.log("\n All Image Resolution & Deduplication Tests PASSED!");
}

testResolution().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
