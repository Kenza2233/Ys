import { Inngest } from "inngest";
import { prisma } from "./db";
import { getYouTubeClient, getVideoDetails } from "./youtube.server";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "youtube-bulk-saver" });

export const processImportJob: any = inngest.createFunction(
  { id: "process-import-job", event: "import/job.created" } as any,
  async ({ event, step }: any) => {
    const { jobId, videoIds, playlistId, userId, strategy = "skip" } = event.data;

    await step.run("update-job-status", async () => {
      await prisma.importJob.update({
        where: { id: jobId },
        data: { status: "processing", totalItems: videoIds.length },
      });
    });

    const youtube = await getYouTubeClient(userId);

    // Process in batches
    for (let i = 0; i < videoIds.length; i += 50) {
      const batchIds = videoIds.slice(i, i + 50);

      const result = await step.run(`process-batch-${i}`, async () => {
        const details = await getVideoDetails(youtube, batchIds);

        const lastVideo = await prisma.video.findFirst({
            where: { playlistId },
            orderBy: { position: "desc" },
        });
        let currentPosition = lastVideo ? lastVideo.position + 1 : 0;

        let successInBatch = 0;
        let errorsInBatch = [];

        for (const item of details) {
            try {
                const existing = await prisma.video.findFirst({
                    where: { playlistId, youtubeVideoId: item.id! }
                });

                if (existing && strategy === "skip") {
                    continue;
                }

                await prisma.video.upsert({
                    where: { youtubeVideoId: item.id! },
                    update: {
                        position: strategy === "merge" ? currentPosition++ : existing?.position,
                        playlistId: playlistId,
                    },
                    create: {
                        playlistId,
                        youtubeVideoId: item.id!,
                        title: item.snippet!.title!,
                        description: item.snippet!.description,
                        thumbnail: item.snippet!.thumbnails?.default?.url,
                        duration: item.contentDetails!.duration,
                        channelTitle: item.snippet!.channelTitle,
                        channelId: item.snippet!.channelId,
                        viewCount: parseInt(item.statistics!.viewCount || "0"),
                        position: currentPosition++,
                    },
                });
                successInBatch++;
            } catch (err: any) {
                errorsInBatch.push({ url: `https://youtube.com/watch?v=${item.id}`, errorMessage: err.message });
            }
        }

        // Update job progress
        await prisma.importJob.update({
            where: { id: jobId },
            data: {
                successCount: { increment: successInBatch },
                failCount: { increment: batchIds.length - successInBatch },
                errors: {
                    create: errorsInBatch.map((e: any) => ({
                        url: e.url,
                        errorMessage: e.errorMessage,
                    }))
                }
            }
        });

        return { success: successInBatch };
      });
    }

    await step.run("finalize-job", async () => {
        await prisma.importJob.update({
            where: { id: jobId },
            data: { status: "completed" },
        });
    });

    return { jobId, status: "completed" };
  }
);
