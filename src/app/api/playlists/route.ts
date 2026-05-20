import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const playlists = await prisma.playlist.findMany({
    where: { userId },
    include: {
      _count: {
        select: { videos: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(playlists);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const body = await req.json();
  const { title, description } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const playlist = await prisma.playlist.create({
    data: {
      userId,
      title,
      description,
    },
  });

  return NextResponse.json(playlist);
}
