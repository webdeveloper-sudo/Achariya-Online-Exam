import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

// Middleware helper to check if requester is Super Admin
async function checkAdmin(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "Admin") {
    return null;
  }
  return decoded;
}

export async function GET(request: Request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const teachers = await prisma.teacher.findMany({
      orderBy: { userName: "asc" },
    });

    return NextResponse.json({
      teachers,
      count: teachers.length,
    });
  } catch (error: any) {
    console.error("Error in GET teachers:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    // Bulk Onboarding flow
    if (body.teachers && Array.isArray(body.teachers)) {
      let saved = 0;
      let skipped = 0;
      const errors = [];

      for (const t of body.teachers) {
        try {
          if (!t.userId || !t.userName || !t.joiningDate || !t.branch || !t.designation) {
            skipped++;
            errors.push({ userId: t.userId || "Unknown", error: "Missing mandatory fields" });
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
        message: "Teachers onboarding completed",
        saved,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
      });
    }

    // Single Teacher Onboarding
    const {
      userId,
      userName,
      joiningDate,
      branch,
      designation,
      subjects,
      qualifications,
      gradesInCharge,
      experience,
      mobileNo,
      email,
    } = body;

    if (!userId || !userName || !joiningDate || !branch || !designation) {
      return NextResponse.json(
        { message: "All mandatory fields are required" },
        { status: 400 }
      );
    }

    const checks = [];
    checks.push({ userId });
    if (mobileNo && mobileNo.trim() !== "") {
      checks.push({ mobileNo: mobileNo.trim() });
    }
    if (email && email.trim() !== "") {
      checks.push({ email: email.trim() });
    }

    const existing = await prisma.teacher.findFirst({
      where: {
        OR: checks,
      },
    });

    if (existing) {
      let field = "Employee ID";
      if (existing.userId === userId) field = "Employee ID";
      else if (mobileNo && existing.mobileNo === mobileNo.trim()) field = "Mobile Number";
      else if (email && existing.email === email.trim()) field = "Email Address";
      
      return NextResponse.json(
        { message: `Teacher with this ${field} already exists` },
        { status: 409 }
      );
    }

    const newTeacher = await prisma.teacher.create({
      data: {
        userId,
        userName,
        joiningDate: new Date(joiningDate),
        branch,
        designation,
        subjects: subjects || [],
        qualifications: qualifications || "",
        gradesInCharge: gradesInCharge || [],
        experience: experience || "",
        mobileNo: mobileNo || "",
        email: email || "",
      },
    });

    return NextResponse.json(
      { message: "Teacher onboarded successfully", teacher: newTeacher },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST teachers:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
