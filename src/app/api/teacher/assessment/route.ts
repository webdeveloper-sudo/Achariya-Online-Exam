import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
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

    // Retrieve assessments created by this teacher
    const myAssessments = await prisma.assessment.findMany({
      where: { createdById: decoded.id },
      orderBy: { createdAt: "desc" }
    });

    // Retrieve public assessments created by other teachers
    const publicAssessments = await prisma.assessment.findMany({
      where: {
        createdById: { not: decoded.id },
        isPublic: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({
      success: true,
      myAssessments,
      publicAssessments
    });
  } catch (error: any) {
    console.error("Error retrieving assessments:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
