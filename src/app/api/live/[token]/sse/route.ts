import { addSubscriber, removeSubscriber } from "@/lib/sse-store";
import { prisma } from "@/lib/db";

// Force dynamic so Next.js doesn't cache this route
export const dynamic = "force-dynamic";

/**
 * GET /api/live/[token]/sse
 * Public — both teacher and students connect here.
 * Query params: ?participantId=xxx (student) | ?role=host (teacher)
 *
 * Streams SSE events: student:joined, session:start, student:submitted, session:end
 * The client keeps the connection alive; we send pings every 25s to prevent proxy timeouts.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // Validate session exists
  const session = await prisma.liveSession.findUnique({ where: { token } });
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
      "X-Accel-Buffering": "no", // Disable nginx buffering
    },
  });
}
