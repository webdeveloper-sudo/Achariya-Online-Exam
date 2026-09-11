import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";
import { resolveAndUploadQuestionImages } from "@/lib/temp-image-store";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing or malformed token." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321");
    } catch (err) {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const body = await request.json();
    const { 
      title, duration, teaching, department, date, day, 
      generatedBy, position, recruitmentFor, isPublic, questions 
    } = body;

    const safeTitle = (title || "").trim();
    const safePosition = (position || "General Assessment").trim();
    const safeRecruitmentFor = (recruitmentFor || "Academic Staff").trim();
    const safeDepartment = (department || "General").trim();

    // Validation
    if (!safeTitle || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { message: "Missing required fields: title and a valid non-empty questions array." },
        { status: 400 }
      );
    }

    // Lookup creating recruiter
    let recruiter = await prisma.recruiter.findUnique({
      where: { id: decoded.id }
    });

    if (!recruiter && decoded.email) {
      recruiter = await prisma.recruiter.findUnique({
        where: { email: decoded.email }
      });
    }

    if (!recruiter) {
      return NextResponse.json({ message: "Recruiter account not found." }, { status: 404 });
    }

    // Process and upload any temporary image references to Cloudinary
    const uploadedQuestions = await resolveAndUploadQuestionImages(questions);

    // Ensure every saved question has a guaranteed unique ID and a non-empty correctAnswer
    const seenIds = new Set<string>();
    const finalQuestions = uploadedQuestions.map((q: any, idx: number) => {
      let qId = q.id !== undefined && q.id !== null ? String(q.id).trim() : "";
      if (!qId || seenIds.has(qId)) {
        qId = `q-${idx + 1}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      }
      seenIds.add(qId);

      let ca = (q.correctAnswer || "").trim();
      if (!ca) {
        ca =
          q.options && q.options.length > 0
            ? q.options[0]
            : q.type === "true_false"
              ? "True"
              : "Option A";
      }
      return { ...q, id: qId, correctAnswer: ca };
    });

    // Create recruiter assessment in DB
    const assessment = await prisma.recruitmentAssessment.create({
      data: {
        title: safeTitle,
        duration: duration ? parseInt(duration.toString(), 10) : 30,
        teaching: teaching || "Non-Teaching",
        department: safeDepartment,
        date: date || new Date().toLocaleDateString("en-IN"),
        day: day || new Date().toLocaleDateString("en-IN", { weekday: 'long' }),
        generatedBy: generatedBy || recruiter.name,
        position: safePosition,
        recruitmentFor: safeRecruitmentFor,
        isPublic: !!isPublic,
        questions: finalQuestions,
        createdById: recruiter.id
      }
    });


    return NextResponse.json({
      success: true,
      message: "Recruitment assessment saved successfully!",
      assessment
    });
  } catch (error: any) {
    console.error("Error saving recruitment assessment:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
