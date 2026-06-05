import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing token." }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    } catch {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const assessment = await prisma.directorAssessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return NextResponse.json({ message: "Assessment not found." }, { status: 404 });
    }

    // Must be created by this Director (or if Admin)
    const isAdmin = decoded.role === "Admin";
    const isOwner = assessment.createdById === decoded.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: "Access Denied: You do not have permission to view this assessment." }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      assessment,
    });
  } catch (error: any) {
    console.error("Error retrieving director assessment:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing token." }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    } catch {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const assessment = await prisma.directorAssessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return NextResponse.json({ message: "Assessment not found." }, { status: 404 });
    }

    const isAdmin = decoded.role === "Admin";
    const isOwner = assessment.createdById === decoded.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: "Access Denied: You cannot modify assessments created by other users." }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      teaching,
      department,
      duration,
      date,
      day,
      position,
      recruitmentFor,
      questions,
    } = body;

    const updated = await prisma.directorAssessment.update({
      where: { id },
      data: {
        title: title !== undefined ? title : assessment.title,
        teaching: teaching !== undefined ? teaching : assessment.teaching,
        department: department !== undefined ? department : assessment.department,
        duration: duration !== undefined ? parseInt(duration, 10) : assessment.duration,
        date: date !== undefined ? date : assessment.date,
        day: day !== undefined ? day : assessment.day,
        position: position !== undefined ? position : assessment.position,
        recruitmentFor: recruitmentFor !== undefined ? recruitmentFor : assessment.recruitmentFor,
        questions: questions !== undefined ? (typeof questions === "string" ? JSON.parse(questions) : questions) : assessment.questions,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Director assessment template updated successfully.",
      assessment: updated,
    });
  } catch (error: any) {
    console.error("Error updating director assessment:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing token." }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(authHeader.split(" ")[1], JWT_SECRET);
    } catch {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const assessment = await prisma.directorAssessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return NextResponse.json({ message: "Assessment not found." }, { status: 404 });
    }

    const isAdmin = decoded.role === "Admin";
    const isOwner = assessment.createdById === decoded.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ message: "Access Denied: You cannot delete assessments created by other users." }, { status: 403 });
    }

    await prisma.directorAssessment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Director assessment template deleted successfully.",
    });
  } catch (error: any) {
    console.error("Error deleting director assessment:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
