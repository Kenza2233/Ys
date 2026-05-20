"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Play, Download, Trash2, GripVertical } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

export default function PlaylistDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [playlist, setPlaylist] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  useEffect(() => {
    fetchPlaylist();
  }, [id]);

  const fetchPlaylist = async () => {
    try {
      const response = await fetch(`/api/playlists/${id}`);
      const data = await response.json();
      setPlaylist(data);
      if (data.videos?.length > 0 && !activeVideoId) {
        setActiveVideoId(data.videos[0].youtubeVideoId);
      }
    } catch (error) {
      toast.error("Failed to load playlist");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteVideo = async (videoId: string) => {
    try {
      const response = await fetch(`/api/playlists/${id}/videos/${videoId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Video removed from playlist");
        fetchPlaylist(); // Refresh the list
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to remove video");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleExport = () => {
    window.open(`/api/playlists/${id}/export`, "_blank");
  };

  if (isLoading) return <div className="p-12 text-center">Loading...</div>;
  if (!playlist) return <div className="p-12 text-center">Playlist not found</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="aspect-video bg-black rounded-xl overflow-hidden ring-1 ring-white/10">
          {activeVideoId ? (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=0&mute=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Select a video to play
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{playlist.title}</h1>
            <p className="text-muted-foreground">{playlist.videos?.length || 0} videos</p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" /> Export XLSX
          </Button>
        </div>

        <div className="border rounded-xl bg-card overflow-hidden border-none">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="w-12"></TableHead>
                <TableHead>Video</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playlist.videos?.map((v: any) => (
                <TableRow
                  key={v.id}
                  className={`border-border cursor-pointer hover:bg-accent transition-colors ${activeVideoId === v.youtubeVideoId ? 'bg-accent' : ''}`}
                  onClick={() => setActiveVideoId(v.youtubeVideoId)}
                >
                  <TableCell className="text-muted-foreground">
                    <GripVertical className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-3">
                      <img src={v.thumbnail} alt="" className="w-24 aspect-video object-cover rounded" />
                      <div className="flex flex-col justify-center min-w-0">
                        <span className="font-medium text-sm line-clamp-1">{v.title}</span>
                        <span className="text-xs text-muted-foreground">{v.channelTitle}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{v.duration}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); deleteVideo(v.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="bg-card border-none">
          <CardContent className="p-6 space-y-4">
            <h3 className="font-bold">Playlist Info</h3>
            <p className="text-sm text-muted-foreground">{playlist.description || "No description provided."}</p>
            <div className="pt-4 border-t border-border space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Created</span>
                    <span>{new Date(playlist.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Privacy</span>
                    <span>{playlist.isPublic ? "Public" : "Private"}</span>
                </div>
            </div>
            <Link href="/import" className="w-full">
              <Button variant="outline" className="w-full">
                  <Play className="h-4 w-4 mr-2" /> Add More Videos
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Sidebar Mini List */}
        <div className="space-y-2">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase">Queue</h4>
            <div className="space-y-2 max-h-[500px] overflow-auto pr-2">
                {playlist.videos?.map((v: any, i: number) => (
                    <div
                        key={v.id}
                        className={`p-2 rounded flex gap-3 cursor-pointer transition-colors ${activeVideoId === v.youtubeVideoId ? 'bg-accent/80 ring-1 ring-primary/50' : 'bg-card hover:bg-accent'}`}
                        onClick={() => setActiveVideoId(v.youtubeVideoId)}
                    >
                        <span className="text-xs text-muted-foreground self-center w-4">{i + 1}</span>
                        <img src={v.thumbnail} alt="" className="w-20 aspect-video object-cover rounded" />
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <span className="text-xs font-medium line-clamp-1">{v.title}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
