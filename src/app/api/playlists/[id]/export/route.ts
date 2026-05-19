import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const playlist = await prisma.playlist.findUnique({
    where: { id },
    include: {
      videos: {
        orderBy: { position: "asc" },
      },
    },
  });

  if (!playlist || playlist.userId !== (session.user as any).id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = playlist.videos.map(v => ({
    url: `https://www.youtube.com/watch?v=${v.youtubeVideoId}`,
    title: v.title,
    description: v.description,
    duration: v.duration,
    channel: v.channelTitle,
    customTitle: v.customTitle,
    customCategory: v.customCategory,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Playlist");

  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${playlist.title.replace(/\s+/g, '_')}_export.xlsx"`,
    },
  });
}
