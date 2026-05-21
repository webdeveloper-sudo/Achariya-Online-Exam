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

    // Verify role is Admin
    if (decoded.role !== "Admin") {
      return NextResponse.json({ message: "Access Denied: Admin authorization required." }, { status: 403 });
    }

    // Fetch all assessments along with creating teacher's profile details
    const assessments = await prisma.assessment.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: {
          select: {
            userName: true,
            email: true,
            branch: true,
            designation: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      assessments
    });
  } catch (error: any) {
    console.error("Error retrieving admin assessments list:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
