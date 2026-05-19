import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { extractVideoId } from "@/lib/youtube";
import * as XLSX from "xlsx";
import { inngest } from "@/lib/inngest";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: playlistId } = await params;
  const userId = (session.user as any).id;
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const mappingStr = formData.get("mapping") as string;

  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const mapping = JSON.parse(mappingStr);
  const urlColumn = mapping.url;

  if (!urlColumn) {
    return NextResponse.json({ error: "URL column mapping is required" }, { status: 400 });
  }

  const playlist = await prisma.playlist.findUnique({
    where: { id: playlistId },
  });

  if (!playlist || playlist.userId !== userId) {
    return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];

    const rows = jsonData.map(row => ({
      url: row[urlColumn],
      customTitle: mapping.title ? row[mapping.title] : undefined,
      customDescription: mapping.description ? row[mapping.description] : undefined,
      customTags: mapping.tags ? String(row[mapping.tags] || "").split(",").map((s: string) => s.trim()).filter(Boolean) : [],
      customCategory: mapping.category ? row[mapping.category] : undefined,
    })).filter(row => row.url);

    const videoIds = rows.map(r => extractVideoId(r.url)).filter((id): id is string => id !== null);

    const importJob = await prisma.importJob.create({
        data: {
            userId,
            playlistId,
            method: "xlsx_upload",
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
            // Custom data mapping could be passed here too if needed, but simplified for now
        },
    });

    return NextResponse.json({ success: true, jobId: importJob.id });

  } catch (error: any) {
    console.error("XLSX import error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
