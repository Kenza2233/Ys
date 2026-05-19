"use client";

import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManualPaste } from "@/components/import/ManualPaste";
import { XlsxUpload } from "@/components/import/XlsxUpload";
import { YoutubeSearch } from "@/components/import/YoutubeSearch";
import { PlaylistImport } from "@/components/import/PlaylistImport";
import { useState, useEffect, Suspense } from "react";
import { Label } from "@/components/ui/label";

function ImportContent() {
  const searchParams = useSearchParams();
  const defaultMethod = searchParams.get("method") || "manual";
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");
  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/playlists")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPlaylists(data);
          if (data.length > 0) setSelectedPlaylistId(data[0].id);
        }
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold font-heading">Bulk Import Videos</h1>
        <p className="text-muted-foreground">Select a method and a destination playlist to start adding videos.</p>
      </div>

      <div className="space-y-4 bg-[#1e1e1e] p-6 rounded-xl border-none">
        <div className="max-w-md space-y-2">
            <Label>Select Destination Playlist</Label>
            <select
                className="w-full bg-background border rounded-md px-3 py-2 text-sm"
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
            >
                {playlists.map(pl => (
                    <option key={pl.id} value={pl.id}>{pl.title}</option>
                ))}
            </select>
        </div>

        <Tabs defaultValue={defaultMethod} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-[#0f0f0f]">
            <TabsTrigger value="manual">Manual Paste</TabsTrigger>
            <TabsTrigger value="xlsx">XLSX Upload</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="playlist">YT Playlist</TabsTrigger>
            </TabsList>
            <div className="mt-6">
                <TabsContent value="manual">
                    <ManualPaste playlistId={selectedPlaylistId} onComplete={() => {}} />
                </TabsContent>
                <TabsContent value="xlsx">
                    <XlsxUpload playlistId={selectedPlaylistId} onComplete={() => {}} />
                </TabsContent>
                <TabsContent value="search">
                    <YoutubeSearch playlistId={selectedPlaylistId} onComplete={() => {}} />
                </TabsContent>
                <TabsContent value="playlist">
                    <PlaylistImport playlistId={selectedPlaylistId} onComplete={() => {}} />
                </TabsContent>
            </div>
        </Tabs>
      </div>
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ImportContent />
    </Suspense>
  );
}
