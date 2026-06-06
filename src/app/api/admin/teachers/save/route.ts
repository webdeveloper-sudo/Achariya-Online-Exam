import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

async function checkAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded || (decoded.role !== "Admin" && decoded.role !== "Director")) {
    return null;
  }
  return decoded;
}

export async function POST(request: Request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { teachers } = body;

    if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
      return NextResponse.json({ message: "No teacher data provided" }, { status: 400 });
    }

    let saved = 0;
    let skipped = 0;
    const errors = [];

    for (const t of teachers) {
      try {
        if (!t.userId || !t.userName || !t.joiningDate || !t.branch || !t.designation) {
          skipped++;
          errors.push({
            userId: t.userId || "Unknown",
            error: "Missing mandatory fields",
          });
          continue;
        }

        const checks = [];
        checks.push({ userId: t.userId });
        if (t.mobileNo && t.mobileNo.trim() !== "") {
          checks.push({ mobileNo: t.mobileNo.trim() });
        }
        if (t.email && t.email.trim() !== "") {
          checks.push({ email: t.email.trim() });
        }

        const existing = await prisma.teacher.findFirst({
          where: {
            OR: checks,
          },
        });

        if (existing) {
          skipped++;
          let field = "Employee ID";
          if (existing.userId === t.userId) field = "Employee ID";
          else if (t.mobileNo && existing.mobileNo === t.mobileNo.trim()) field = "Mobile Number";
          else if (t.email && existing.email === t.email.trim()) field = "Email Address";
          
          errors.push({
            userId: t.userId,
            error: `Teacher with this ${field} already exists`,
          });
          continue;
        }

        const teacherData = {
          userName: t.userName,
          joiningDate: new Date(t.joiningDate),
          branch: t.branch,
          designation: t.designation,
          subjects: t.subjects || [],
          qualifications: t.qualifications || "",
          gradesInCharge: t.gradesInCharge || [],
          experience: t.experience || "",
          mobileNo: t.mobileNo || "",
          email: t.email || "",
        };

        await prisma.teacher.create({
          data: {
            userId: t.userId,
            ...teacherData,
          },
        });
        saved++;
      } catch (err: any) {
        skipped++;
        errors.push({ userId: t.userId || "Unknown", error: err.message });
      }
    }

    return NextResponse.json({
      message: "Teachers bulk save completed",
      saved,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Error in POST bulk save teachers:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
