import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    // Verify that the live session room exists
    const session = await prisma.recruitmentLiveSession.findUnique({
      where: { token },
    });

    if (!session) {
      return NextResponse.json({ message: "Live session not found." }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        { message: "Search query (email or mobile) is required." },
        { status: 400 }
      );
    }

    const normalizedQuery = query.toLowerCase().trim();

    // Look up globally in past participant records by email or mobile, returning the most recent first
    const match = await prisma.recruitmentLiveSessionParticipant.findFirst({
      where: {
        OR: [
          { email: normalizedQuery },
          { phone: normalizedQuery }
        ]
      },
      orderBy: {
        joinedAt: "desc"
      }
    });

    if (!match) {
      return NextResponse.json({
        success: false,
        message: "No profile found with this email or mobile number."
      });
    }

    return NextResponse.json({
      success: true,
      candidate: {
        name: match.name,
        email: match.email,
        phone: match.phone,
        qualification: match.qualification,
        experience: match.experience
      }
    });
  } catch (error: any) {
    console.error("Error in recruitment live lookup:", error);
    return NextResponse.json(
      { message: "Internal server error: " + error.message },
      { status: 500 }
    );
  }
}
