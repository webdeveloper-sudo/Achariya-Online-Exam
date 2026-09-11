import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { identifier } = body;

    if (!identifier) {
      return NextResponse.json(
        { message: "Email or Employee ID is required" },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase().trim() },
          { userId: identifier.trim() },
        ],
      },
    });

    if (!teacher) {
      return NextResponse.json(
        {
          message: "Profile not found. Please contact Admin to register your account.",
          code: "TEACHER_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Teacher profile found",
      teacher: {
        userId: teacher.userId,
        userName: teacher.userName,
        email: teacher.email,
        activated: teacher.activated,
      },
    });
  } catch (error: any) {
    console.error("Error in verify teacher endpoint:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
