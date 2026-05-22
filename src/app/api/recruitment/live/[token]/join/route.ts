import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { name, email, phone, experience, qualification } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { message: "Full Name, Email, and Phone Number are required." },
        { status: 400 }
      );
    }

    // Verify session
    const session = await prisma.recruitmentLiveSession.findUnique({
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

    // Check if a candidate with the same email or phone already exists GLOBALLY
    // (across any session) to prevent duplicate registrations
    const globalExisting = await prisma.recruitmentLiveSessionParticipant.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase().trim() },
          { phone: phone.trim() },
        ],
      },
      orderBy: { joinedAt: "desc" },
    });

    if (globalExisting) {
      // Return 409 with existing profile so the frontend can prompt the lookup flow
      return NextResponse.json(
        {
          success: false,
          duplicate: true,
          message: "A candidate profile with this email or mobile number already exists. Please use the 'Find Existing Profile' option to retrieve your account.",
          existingProfile: {
            name: globalExisting.name,
            email: globalExisting.email,
            phone: globalExisting.phone,
            qualification: globalExisting.qualification,
            experience: globalExisting.experience,
          },
        },
        { status: 409 }
      );
    }

    // No duplicate — create a fresh participant entry
    const participant = await prisma.recruitmentLiveSessionParticipant.create({
      data: {
        sessionId: session.id,
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        experience: experience ? experience.trim() : "None",
        qualification: qualification ? qualification.trim() : "None",
        tabSwitches: 0,
        terminated: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Successfully joined live session queue.",
      participantId: participant.id,
    });
  } catch (error: any) {
    console.error("Error in recruitment live join:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
