import { addSubscriber, removeSubscriber } from "@/lib/sse-store";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Validate session exists
  const session = await prisma.recruitmentLiveSession.findUnique({ where: { token } });
  if (!session) {
    return new Response("Session not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Register this subscriber
      addSubscriber(token, controller);

      // Send a connection-established event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`)
      );

      // Keep-alive ping every 25 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`)
          );
        } catch {
          clearInterval(pingInterval);
          removeSubscriber(token, controller);
        }
      }, 25000);

      // Cleanup when client disconnects
      request.signal.addEventListener("abort", () => {
        clearInterval(pingInterval);
        removeSubscriber(token, controller);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
    cancel() {
      // Stream was cancelled by client
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
