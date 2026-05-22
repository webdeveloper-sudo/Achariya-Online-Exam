import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321";

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

    const assessment = await prisma.recruitmentAssessment.findUnique({
      where: { id },
    });

    if (!assessment) {
      return NextResponse.json({ message: "Assessment not found." }, { status: 404 });
    }

    if (assessment.createdById !== decoded.id) {
      return NextResponse.json({ message: "Access Denied: You cannot delete assessments created by other users." }, { status: 403 });
    }

    await prisma.recruitmentAssessment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Recruitment assessment template deleted successfully.",
    });
  } catch (error: any) {
    console.error("Error deleting recruitment assessment:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
