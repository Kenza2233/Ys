import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getYouTubeClient } from "@/lib/youtube.server";
import { inngest } from "@/lib/inngest";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: playlistId } = await params;
  const userId = (session.user as any).id;
  const body = await req.json();
  const { youtubePlaylistId, importMode, selectedVideoIds, rangeStart, rangeEnd } = body;

  if (!youtubePlaylistId) {
    return NextResponse.json({ error: "YouTube Playlist ID is required" }, { status: 400 });
  }

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
  });

  if (!playlist || playlist.userId !== userId) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  try {
    const youtube = await getYouTubeClient(userId);

    // Fetch videos from the YouTube playlist (initially to get IDs for the job)
    let allVideoIds: string[] = [];
    let nextPageToken: string | undefined;

    do {
      const response: any = await youtube.playlistItems.list({
        part: ["contentDetails"],
        playlistId: youtubePlaylistId,
        maxResults: 50,
        pageToken: nextPageToken,
      });

      const ids = response.data.items?.map((item: any) => item.contentDetails.videoId) || [];
      allVideoIds = [...allVideoIds, ...ids];
      nextPageToken = response.data.nextPageToken;
    } while (nextPageToken && allVideoIds.length < 500);

    let targetVideoIds = allVideoIds;

    if (importMode === "partial" && selectedVideoIds) {
      targetVideoIds = allVideoIds.filter(id => selectedVideoIds.includes(id));
    } else if (importMode === "range") {
      const start = (rangeStart || 1) - 1;
      const end = rangeEnd || allVideoIds.length;
      targetVideoIds = allVideoIds.slice(start, end);
    }

    const importJob = await prisma.importJob.create({
        data: {
            userId,
            playlistId,
            method: "playlist_import",
            status: "pending",
            totalItems: targetVideoIds.length,
        }
    });

    await inngest.send({
        name: "import/job.created",
        data: {
            jobId: importJob.id,
            videoIds: targetVideoIds,
            playlistId,
            userId,
        },
    });

    return NextResponse.json({ success: true, jobId: importJob.id });
  } catch (error: any) {
    console.error("Playlist import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
