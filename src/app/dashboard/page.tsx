"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ListVideo, Clock, PlayCircle, Search, FileUp, ClipboardList, Trash2 } from "lucide-react";
import { YoutubeIcon as Youtube } from "@/components/icons/YoutubeIcon";
import Link from "next/link";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Dashboard() {
  const { data: session } = useSession();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const response = await fetch("/api/playlists");
      const data = await response.json();
      if (Array.isArray(data)) {
        setPlaylists(data);
      }
    } catch (error) {
      toast.error("Failed to load playlists");
    } finally {
      setIsLoading(false);
    }
  };

  const createPlaylist = async () => {
    if (!newTitle) return;
    setIsCreating(true);
    try {
      const response = await fetch("/api/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (response.ok) {
        toast.success("Playlist created");
        setNewTitle("");
        fetchPlaylists();
      }
    } catch (error) {
      toast.error("Failed to create playlist");
    } finally {
      setIsCreating(false);
    }
  };

  const deletePlaylist = async (plId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm("Adakah anda pasti ingin memadam playlist ini? Semua video di dalamnya akan dipadamkan.")) {
        try {
            const response = await fetch(`/api/playlists/${plId}`, {
                method: "DELETE",
            });
            if (response.ok) {
                toast.success("Playlist berjaya dipadam");
                fetchPlaylists();
            } else {
                toast.error("Gagal memadam playlist");
            }
        } catch (error) {
            toast.error("Ralat berlaku semasa memadam playlist");
        }
    }
  };

  const totalVideos = playlists.reduce((acc, pl) => acc + (pl._count?.videos || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-heading">Dashboard</h1>
        <Dialog>
          <DialogTrigger>
            <Button><Plus className="h-4 w-4 mr-2" /> New Playlist</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Playlist</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label>Playlist Title</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. My Favorites" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createPlaylist} disabled={isCreating || !newTitle}>
                {isCreating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Playlists</CardTitle>
            <ListVideo className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{playlists.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Videos</CardTitle>
            <PlayCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVideos}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Last updated {playlists[0]?.updatedAt ? new Date(playlists[0].updatedAt).toLocaleDateString() : 'N/A'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/import?method=manual" className="block">
            <Card className="hover:bg-accent transition-colors cursor-pointer border-dashed border-muted-foreground/50">
                <CardContent className="pt-6 flex flex-col items-center gap-2">
                    <ClipboardList className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">Manual Paste</span>
                </CardContent>
            </Card>
          </Link>
          <Link href="/import?method=xlsx" className="block">
            <Card className="hover:bg-accent transition-colors cursor-pointer border-dashed border-muted-foreground/50">
                <CardContent className="pt-6 flex flex-col items-center gap-2">
                    <FileUp className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">Upload XLSX</span>
                </CardContent>
            </Card>
          </Link>
          <Link href="/import?method=search" className="block">
            <Card className="hover:bg-accent transition-colors cursor-pointer border-dashed border-muted-foreground/50">
                <CardContent className="pt-6 flex flex-col items-center gap-2">
                    <Search className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">Video Search</span>
                </CardContent>
            </Card>
          </Link>
          <Link href="/import?method=playlist" className="block">
            <Card className="hover:bg-accent transition-colors cursor-pointer border-dashed border-muted-foreground/50">
                <CardContent className="pt-6 flex flex-col items-center gap-2">
                    <ListVideo className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">Import YT Playlist</span>
                </CardContent>
            </Card>
          </Link>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold">Your Playlists</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((pl) => (
            <Link key={pl.id} href={`/playlists/${pl.id}`}>
              <Card className="bg-card border-none hover:ring-1 hover:ring-primary/50 transition-all cursor-pointer group relative">
                <button
                  className="absolute top-3 right-3 z-10 p-1.5 rounded-md bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20"
                  onClick={(e) => deletePlaylist(pl.id, e)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="aspect-video bg-muted relative rounded-t-lg overflow-hidden">
                  {pl.thumbnail ? (
                    <img src={pl.thumbnail} alt="" className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Youtube className="h-12 w-12 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs">
                    {pl._count?.videos || 0} videos
                  </div>
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg group-hover:text-primary transition-colors">{pl.title}</CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-1">{pl.description || "No description"}</p>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
