import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getYouTubeClient } from "@/lib/youtube.server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const maxResults = searchParams.get("maxResults") || "20";
  const type = searchParams.get("type") || "video";
  const order = searchParams.get("order") || "relevance";

  if (!q) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    const youtube = await getYouTubeClient((session.user as any).id);
    const response = await youtube.search.list({
      part: ["snippet"],
      q,
      maxResults: parseInt(maxResults as string),
      type: [type as string],
      order: order as string,
    } as any);

    return NextResponse.json(response.data);
  } catch (error: any) {
    console.error("YouTube search error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
