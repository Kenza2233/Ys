import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getYouTubeClient } from "@/lib/youtube.server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const youtube = await getYouTubeClient((session.user as any).id);
    const response = await youtube.playlists.list({
      part: ["snippet", "contentDetails"],
      mine: true,
      maxResults: 50,
    });

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("YouTube playlists error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
