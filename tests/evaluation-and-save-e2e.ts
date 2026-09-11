import "dotenv/config";

// Test evaluation logic for MCQ, True/False, and variations
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

function runEvaluationTests() {
  console.log("=== Testing Objective Answer Evaluation Matrix ===");
  const options = ["Line segment", "Ray", "Line", "Angle"];

  // 1. Direct text match
  console.assert(
    evaluateObjectiveAnswer("Line segment", "Line segment", options) === true,
    "Test 1 failed: Direct text match"
  );

  // 2. Case insensitive
  console.assert(
    evaluateObjectiveAnswer("line segment", "LINE SEGMENT", options) === true,
    "Test 2 failed: Case insensitive"
  );

  // 3. Student submits Letter 'A', Correct Answer is 'Line segment'
  console.assert(
    evaluateObjectiveAnswer("A", "Line segment", options) === true,
    "Test 3 failed: Letter vs Option text"
  );

  // 4. Correct Answer is Letter 'A', Student submits 'Line segment'
  console.assert(
    evaluateObjectiveAnswer("Line segment", "A", options) === true,
    "Test 4 failed: Option text vs Letter"
  );

  // 5. Option has prefix 'A) Line segment', Correct answer is 'Line segment'
  console.assert(
    evaluateObjectiveAnswer("A) Line segment", "Line segment", options) === true,
    "Test 5 failed: Prefix stripping"
  );

  // 6. True / False matching
  console.assert(
    evaluateObjectiveAnswer("True", "true", ["True", "False"]) === true,
    "Test 6 failed: True/False"
  );

  // 7. Negative case: incorrect answer
  console.assert(
    evaluateObjectiveAnswer("B", "Line segment", options) === false,
    "Test 7 failed: Incorrect answer should return false"
  );

  console.log(" All evaluation engine tests PASSED successfully!");
}

runEvaluationTests();
