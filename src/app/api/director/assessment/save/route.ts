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
    const { 
      title, duration, teaching, department, date, day, 
      generatedBy, position, recruitmentFor, questions 
    } = body;

    // Validation
    if (!title || !position || !recruitmentFor || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { message: "Missing required fields: title, position, recruitmentFor, and questions array." },
        { status: 400 }
      );
    }

    // Lookup creating director
    const director = await prisma.director.findUnique({
      where: { id: decoded.id }
    });

    if (!director) {
      return NextResponse.json({ message: "Director account not found." }, { status: 404 });
    }

    // Create director assessment in DB
    const assessment = await prisma.directorAssessment.create({
      data: {
        title: title.trim(),
        duration: duration ? parseInt(duration.toString(), 10) : 30,
        teaching: teaching || "Non-Teaching",
        department: department || "General",
        date: date || new Date().toLocaleDateString("en-IN"),
        day: day || new Date().toLocaleDateString("en-IN", { weekday: 'long' }),
        generatedBy: generatedBy || director.name,
        position: position.trim(),
        recruitmentFor: recruitmentFor.trim(),
        isPublic: false, // Director assessments are not pooled/shared
        questions: questions,
        createdById: director.id
      }
    });

    return NextResponse.json({
      success: true,
      message: "Director assessment saved successfully!",
      assessment
    });
  } catch (error: any) {
    console.error("Error saving director assessment:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
