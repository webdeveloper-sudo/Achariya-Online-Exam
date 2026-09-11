import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { uploadBase64ToCloudinary, uploadBufferToCloudinary } from "@/lib/cloudinary";

export async function POST(request: Request) {
  try {
    // Auth check
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Access Denied: Missing token." }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    try {
      jwt.verify(token, process.env.JWT_SECRET || "achariya_secure_jwt_secret_key_987654321");
    } catch {
      return NextResponse.json({ message: "Access Denied: Invalid token." }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") || "";

    let imageUrl: string;

    if (contentType.includes("application/json")) {
      // base64 upload path
      const body = await request.json();
      const { base64 } = body;
      if (!base64 || typeof base64 !== "string") {
        return NextResponse.json({ message: "Missing base64 image data." }, { status: 400 });
      }
      const publicId = `recruitment_diagram_${Date.now()}`;
      imageUrl = await uploadBase64ToCloudinary(base64, "achariya-online-exam-portal", publicId);
    } else if (contentType.includes("multipart/form-data")) {
      // file upload path
      const formData = await request.formData();
      const file = formData.get("image") as File | null;
      if (!file || file.size === 0) {
        return NextResponse.json({ message: "No image file provided." }, { status: 400 });
      }
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const publicId = `recruitment_diagram_${Date.now()}`;
      imageUrl = await uploadBufferToCloudinary(buffer, "achariya-online-exam-portal", publicId);
    } else {
      return NextResponse.json({ message: "Unsupported content type." }, { status: 415 });
    }

    return NextResponse.json({ success: true, url: imageUrl });
  } catch (error: any) {
    console.error("[Recruitment Upload Image]", error);
    return NextResponse.json({ success: false, message: "Upload failed: " + error.message }, { status: 500 });
  }
}
