import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inngest } from "@/lib/inngest";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: playlistId } = await params;
  const userId = session.user.id;
  const body = await req.json();
  const { videoIds } = body;

  if (!videoIds || !Array.isArray(videoIds)) {
    return NextResponse.json({ error: "Video IDs are required" }, { status: 400 });
  }

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
  });

  if (!playlist || playlist.userId !== userId) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  const importJob = await prisma.importJob.create({
    data: {
        userId,
        playlistId,
        method: "search_select",
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
