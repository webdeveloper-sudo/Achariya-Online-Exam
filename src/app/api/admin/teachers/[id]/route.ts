import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";

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

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();

    const existing = await prisma.teacher.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ message: "Teacher not found" }, { status: 404 });
    }

    // Validate uniqueness of Teacher ID, email, and mobile number against other existing teachers
    const checks: any[] = [];
    const userId = body.userId?.trim();
    const email = body.email?.trim();
    const mobileNo = body.mobileNo?.trim();

    if (userId && userId !== "") {
      checks.push({ userId });
    }
    if (email && email !== "") {
      checks.push({ email });
    }
    if (mobileNo && mobileNo !== "") {
      checks.push({ mobileNo });
    }

    if (checks.length > 0) {
      const conflict = await prisma.teacher.findFirst({
        where: {
          id: { not: id }, // Exclude the teacher currently being updated
          OR: checks,
        },
      });

      if (conflict) {
        let field = "Employee ID";
        if (userId && conflict.userId === userId) field = "Employee ID";
        else if (mobileNo && conflict.mobileNo === mobileNo) field = "Mobile Number";
        else if (email && conflict.email === email) field = "Email Address";

        return NextResponse.json(
          { message: `Teacher with this ${field} already exists` },
          { status: 409 }
        );
      }
    }

    const updateData: any = {
      userId: userId || undefined,
      userName: body.userName,
      joiningDate: body.joiningDate ? new Date(body.joiningDate) : undefined,
      branch: body.branch,
      designation: body.designation,
      subjects: body.subjects,
      qualifications: body.qualifications,
      gradesInCharge: body.gradesInCharge,
      experience: body.experience,
      mobileNo: mobileNo,
      email: email,
      status: body.status,
    };

    // If password is provided (Admin Password Reset)
    if (body.password && body.password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(body.password, salt);
    }

    // Clean undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const updatedTeacher = await prisma.teacher.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: "Teacher updated successfully",
      teacher: updatedTeacher,
    });
  } catch (error: any) {
    console.error("Error in PUT teacher:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const existing = await prisma.teacher.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ message: "Teacher not found" }, { status: 404 });
    }

    await prisma.teacher.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Teacher deleted successfully",
    });
  } catch (error: any) {
    console.error("Error in DELETE teacher:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
