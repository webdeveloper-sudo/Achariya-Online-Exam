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

    // Check if the candidate is already registered in the CURRENT session to support re-joining
    const currentExisting = await prisma.recruitmentLiveSessionParticipant.findFirst({
      where: {
        sessionId: session.id,
        OR: [
          { email: email.toLowerCase().trim() },
          { phone: phone.trim() },
        ],
      },
    });

    if (currentExisting) {
      return NextResponse.json({
        success: true,
        message: "Welcome back! Re-joining live session.",
        participantId: currentExisting.id,
      });
    }

    // Check if a candidate with the same email or phone already exists GLOBALLY
    // (across any session) to prevent duplicate registrations with mismatching details
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
      // If they exist globally, but the submitted details don't match, return 409 conflict
      const nameMatch = globalExisting.name.toLowerCase().trim() === name.toLowerCase().trim();
      const emailMatch = globalExisting.email.toLowerCase().trim() === email.toLowerCase().trim();
      const phoneMatch = globalExisting.phone.trim() === phone.trim();

      if (!nameMatch || !emailMatch || !phoneMatch) {
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
