import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extractVideoId } from "@/lib/youtube";
import { inngest } from "@/lib/inngest";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: playlistId } = await params;
  const userId = (session.user as any).id;
  const body = await req.json();
  const { urls } = body;

  if (!urls || !Array.isArray(urls)) {
    return NextResponse.json({ error: "URLs are required" }, { status: 400 });
  }

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
  });

  if (!playlist || playlist.userId !== userId) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  const videoIds = urls.map(extractVideoId).filter((id): id is string => id !== null);

  const importJob = await prisma.importJob.create({
    data: {
        userId,
        playlistId,
        method: "manual_paste",
        status: "pending",
        totalItems: videoIds.length,
    }
  });

  await inngest.send({
    name: "import/job.created",
    data: {
      jobId: importJob.id,
      videoIds,
      playlistId,
      userId,
    },
  });

  return NextResponse.json({ success: true, jobId: importJob.id });
}
