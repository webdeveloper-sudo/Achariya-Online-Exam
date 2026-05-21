import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

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
    const { title, duration, subject, lesson, isPublic, questions } = body;

    // Validation
    if (!title || !subject || !lesson || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { message: "Missing required fields: title, subject, lesson, and questions array." },
        { status: 400 }
      );
    }

    // Lookup creating teacher
    const teacher = await prisma.teacher.findUnique({
      where: { id: decoded.id }
    });

    if (!teacher) {
      return NextResponse.json({ message: "Teacher account not found." }, { status: 404 });
    }

    // Create assessment in DB
    const assessment = await prisma.assessment.create({
      data: {
        title: title.trim(),
        duration: duration ? parseInt(duration.toString(), 10) : 30,
        subject: subject.trim(),
        lesson: lesson.trim(),
        isPublic: !!isPublic,
        questions: questions,
        createdById: teacher.id,
        createdByEmail: teacher.email,
        createdByTeacherName: teacher.userName
      }
    });

    return NextResponse.json({
      success: true,
      message: "Assessment saved successfully!",
      assessment
    });
  } catch (error: any) {
    console.error("Error saving assessment:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
