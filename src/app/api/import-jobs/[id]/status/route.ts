import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const interval = setInterval(async () => {
        const job = await prisma.importJob.findUnique({
          where: { id },
          include: { errors: true },
        });

        if (!job) {
          clearInterval(interval);
          controller.close();
          return;
        }

        sendEvent(job);

        if (job.status === "completed" || job.status === "failed") {
          clearInterval(interval);
          controller.close();
        }
      }, 1000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
