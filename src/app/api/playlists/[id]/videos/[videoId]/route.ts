import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; videoId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: playlistId, videoId } = await params;
  const userId = (session.user as any).id;

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
  });

  if (!playlist || playlist.userId !== userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const video = await prisma.video.findFirst({
    where: { id: videoId, playlistId },
  });

  if (!video) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  await prisma.video.delete({
    where: { id: videoId },
  });

  // Reorder remaining videos
  const remainingVideos = await prisma.video.findMany({
    where: { playlistId },
    orderBy: { position: "asc" },
  });

  for (let i = 0; i < remainingVideos.length; i++) {
    await prisma.video.update({
      where: { id: remainingVideos[i].id },
      data: { position: i },
    });
  }

  return NextResponse.json({ success: true });
}
