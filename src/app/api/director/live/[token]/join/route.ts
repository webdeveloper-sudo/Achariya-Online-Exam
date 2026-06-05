import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcast } from "@/lib/sse-store";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { userId, name, branch, designation, email, phone, qualification } = body;

    if (!userId || !name || !branch || !designation || !email || !phone) {
      return NextResponse.json(
        { message: "Employee ID, Full Name, Branch Hub, Designation, Email, and Mobile are required." },
        { status: 400 }
      );
    }

    // Verify session
    const session = await prisma.directorLiveSession.findUnique({
      where: { token },
    });

    if (!session) {
      return NextResponse.json({ message: "Live session not found." }, { status: 404 });
    }

    if (session.status !== "WAITING") {
      return NextResponse.json(
        { message: "Entry locked. You can only join sessions that are in the WAITING status." },
        { status: 403 }
      );
    }

    // Ensure teacher exists in Teacher table, otherwise register dynamically with activated: false
    let teacher = await prisma.teacher.findFirst({
      where: {
        OR: [
          { userId: userId.trim() },
          { email: email.toLowerCase().trim() }
        ]
      }
    });

    if (!teacher) {
      // Register dynamically
      teacher = await prisma.teacher.create({
        data: {
          userId: userId.trim(),
          userName: name.trim(),
          branch: branch.trim(),
          designation: designation.trim(),
          email: email.toLowerCase().trim(),
          mobileNo: phone.trim(),
          qualifications: qualification ? qualification.trim() : "None",
          joiningDate: new Date(),
          status: "Active",
          activated: false,
        }
      });
      console.log(`Dynamically registered non-activated teacher: ${email}`);
    }

    // Check if they are already registered in the CURRENT session for re-joining
    const currentExisting = await prisma.directorLiveSessionParticipant.findFirst({
      where: {
        sessionId: session.id,
        userId: userId.trim()
      },
    });

    if (currentExisting) {
      return NextResponse.json({
        success: true,
        message: "Welcome back! Re-joining live session.",
        participantId: currentExisting.id,
      });
    }

    // Create a new participant entry for this session
    const participant = await prisma.directorLiveSessionParticipant.create({
      data: {
        sessionId: session.id,
        userId: userId.trim(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        qualification: qualification ? qualification.trim() : "None",
        branch: branch.trim(),
        designation: designation.trim(),
        tabSwitches: 0,
        terminated: false,
      },
    });

    // Broadcast join event
    broadcast(token, {
      type: "student:joined",
      participant: {
        id: participant.id,
        name: participant.name,
        grade: participant.designation,
        section: participant.branch,
        studentId: participant.userId,
        joinedAt: participant.joinedAt.toISOString(),
      }
    });

    return NextResponse.json({
      success: true,
      message: "Successfully joined live session queue.",
      participantId: participant.id,
    });
  } catch (error: any) {
    console.error("Error in director live join:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
