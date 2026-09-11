import { NextResponse } from "next/server";
import { getTempImage } from "@/lib/temp-image-store";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const id = params?.id;

    if (!id || !id.startsWith("temp-img-")) {
      return NextResponse.json({ message: "Invalid image identifier." }, { status: 400 });
    }

    const image = await getTempImage(id);

    if (!image || !image.buffer) {
      return NextResponse.json(
        { message: "Temporary image not found or expired." },
        { status: 404 }
      );
    }

    return new NextResponse(new Uint8Array(image.buffer), {
      status: 200,
      headers: {
        "Content-Type": image.mimeType || "image/png",
        "Content-Length": image.buffer.length.toString(),
        "Cache-Control": "public, max-age=3600, immutable",
      },
    });
  } catch (error: any) {
    console.error("[TempImage API] Stream error:", error);
    return NextResponse.json(
      { message: "Failed to load image: " + error.message },
      { status: 500 }
    );
  }
}
