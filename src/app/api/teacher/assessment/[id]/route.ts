import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

// GET single assessment details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing token." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321");
    } catch (err) {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id }
    });

    if (!assessment) {
      return NextResponse.json({ message: "Assessment not found." }, { status: 404 });
    }

    // Access control: if not public and not created by this teacher, block
    if (!assessment.isPublic && assessment.createdById !== decoded.id) {
      return NextResponse.json({ message: "Access Denied: This is a private assessment." }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      assessment
    });
  } catch (error: any) {
    console.error("Error retrieving assessment details:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

// PUT update single assessment (Edit Mode)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing token." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321");
    } catch (err) {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id }
    });

    if (!assessment) {
      return NextResponse.json({ message: "Assessment not found." }, { status: 404 });
    }

    // Edit permission check: only creator can modify
    if (assessment.createdById !== decoded.id) {
      return NextResponse.json({ message: "Access Denied: You cannot modify another teacher's assessment." }, { status: 403 });
    }

    const body = await request.json();
    const { title, duration, subject, lesson, isPublic, questions } = body;

    const updated = await prisma.assessment.update({
      where: { id },
      data: {
        title: title ? title.trim() : assessment.title,
        duration: duration !== undefined ? parseInt(duration.toString(), 10) : assessment.duration,
        subject: subject ? subject.trim() : assessment.subject,
        lesson: lesson ? lesson.trim() : assessment.lesson,
        isPublic: isPublic !== undefined ? !!isPublic : assessment.isPublic,
        questions: questions || assessment.questions
      }
    });

    return NextResponse.json({
      success: true,
      message: "Assessment updated successfully!",
      assessment: updated
    });
  } catch (error: any) {
    console.error("Error updating assessment:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

// DELETE single assessment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing token." }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321");
    } catch (err) {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const assessment = await prisma.assessment.findUnique({
      where: { id }
    });

    if (!assessment) {
      return NextResponse.json({ message: "Assessment not found." }, { status: 404 });
    }

    // Delete permission check: only creator can remove
    if (assessment.createdById !== decoded.id) {
      return NextResponse.json({ message: "Access Denied: You cannot delete another teacher's assessment." }, { status: 403 });
    }

    await prisma.assessment.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Assessment deleted successfully!"
    });
  } catch (error: any) {
    console.error("Error deleting assessment:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
