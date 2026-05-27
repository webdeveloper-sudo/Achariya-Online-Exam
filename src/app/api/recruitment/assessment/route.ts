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

    // Retrieve assessments (all if Admin, otherwise by recruiter)
    let myAssessments;
    let publicAssessments: any[] = [];

    if (decoded.role === "Admin") {
      myAssessments = await prisma.recruitmentAssessment.findMany({
        orderBy: { createdAt: "desc" }
      });
    } else {
      myAssessments = await prisma.recruitmentAssessment.findMany({
        where: { createdById: decoded.id },
        orderBy: { createdAt: "desc" }
      });

      // Retrieve public assessments created by other recruiters
      publicAssessments = await prisma.recruitmentAssessment.findMany({
        where: {
          createdById: { not: decoded.id },
          isPublic: true
        },
        orderBy: { createdAt: "desc" }
      });
    }

    return NextResponse.json({
      success: true,
      myAssessments,
      publicAssessments
    });
  } catch (error: any) {
    console.error("Error retrieving recruitment assessments:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
