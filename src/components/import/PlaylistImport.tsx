"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ListVideo, Loader2, Check } from "lucide-react";

interface PlaylistImportProps {
  playlistId: string;
  onComplete?: () => void;
}

export function PlaylistImport({ playlistId, onComplete }: PlaylistImportProps) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<"full" | "range">("full");
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(50);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/youtube/playlists");
      const data = await response.json();
      if (data.items) {
        setPlaylists(data.items);
      } else {
        toast.error(data.error || "Failed to fetch playlists");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedPlaylistId) return;

    setIsImporting(true);
    try {
      const response = await fetch(`/api/playlists/${playlistId}/videos/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          youtubePlaylistId: selectedPlaylistId,
          importMode,
          rangeStart: importMode === "range" ? rangeStart : undefined,
          rangeEnd: importMode === "range" ? rangeEnd : undefined,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Successfully imported ${data.count} videos`);
        if (onComplete) onComplete();
      } else {
        toast.error(data.error || "Import failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {playlists.map((pl) => (
          <Card
            key={pl.id}
            className={`p-3 cursor-pointer transition-all flex gap-3 ${
              selectedPlaylistId === pl.id ? "ring-2 ring-primary" : "hover:bg-accent"
            }`}
            onClick={() => setSelectedPlaylistId(pl.id)}
          >
            <img
              src={pl.snippet.thumbnails.default.url}
              alt={pl.snippet.title}
              className="w-20 h-20 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{pl.snippet.title}</h4>
              <p className="text-xs text-muted-foreground">{pl.contentDetails.itemCount} videos</p>
            </div>
            {selectedPlaylistId === pl.id && <Check className="h-4 w-4 text-primary self-center" />}
          </Card>
        ))}
      </div>

      {selectedPlaylistId && (
        <Card className="p-4 space-y-4">
          <div className="flex gap-4">
            <Button
              variant={importMode === "full" ? "default" : "outline"}
              size="sm"
              onClick={() => setImportMode("full")}
            >
              Full Import
            </Button>
            <Button
              variant={importMode === "range" ? "default" : "outline"}
              size="sm"
              onClick={() => setImportMode("range")}
            >
              Range Import
            </Button>
          </div>

          {importMode === "range" && (
            <div className="flex items-center gap-2">
              <span className="text-sm">From</span>
              <Input
                type="number"
                className="w-20"
                value={rangeStart}
                onChange={(e) => setRangeStart(parseInt(e.target.value))}
              />
              <span className="text-sm">To</span>
              <Input
                type="number"
                className="w-20"
                value={rangeEnd}
                onChange={(e) => setRangeEnd(parseInt(e.target.value))}
              />
            </div>
          )}

          <Button className="w-full" onClick={handleImport} disabled={isImporting}>
            {isImporting ? "Importing..." : "Start Import"}
          </Button>
        </Card>
      )}
    </div>
  );
}
