import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const userId = session.user.id;

  // Verify job belongs to this user
  const job = await prisma.importJob.findFirst({
    where: { id, userId },
    include: { errors: true },
  });

  if (!job) {
    return new Response("Job not found", { status: 404 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      // Send initial state immediately
      sendEvent(job);

      if (job.status === "completed" || job.status === "failed") {
        controller.close();
        return;
      }

      const interval = setInterval(async () => {
        const updatedJob = await prisma.importJob.findUnique({
          where: { id },
          include: { errors: true },
        });

        if (!updatedJob) {
          clearInterval(interval);
          controller.close();
          return;
        }

        sendEvent(updatedJob);

        if (updatedJob.status === "completed" || updatedJob.status === "failed") {
          clearInterval(interval);
          controller.close();
        }
      }, 2000);

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
