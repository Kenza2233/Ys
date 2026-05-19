"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Search, Play, Plus, Check } from "lucide-react";
import Image from "next/image";

interface YoutubeSearchProps {
  playlistId: string;
  onComplete?: () => void;
}

export function YoutubeSearch({ playlistId, onComplete }: YoutubeSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.items) {
        setResults(data.items);
      } else {
        toast.error(data.error || "Search failed");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelect = (videoId: string) => {
    setSelectedIds(prev =>
      prev.includes(videoId) ? prev.filter(id => id !== videoId) : [...prev, videoId]
    );
  };

  const selectAll = () => {
    setSelectedIds(results.map(item => item.id.videoId).filter(Boolean));
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/playlists/${playlistId}/videos/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoIds: selectedIds }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Added ${data.count} videos to playlist`);
        setSelectedIds([]);
        if (onComplete) onComplete();
      } else {
        toast.error(data.error || "Failed to save");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Search YouTube..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isSearching}
        />
        <Button type="submit" disabled={isSearching}>
          <Search className="h-4 w-4 mr-2" /> {isSearching ? "Searching..." : "Search"}
        </Button>
      </form>

      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>Deselect All</Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving || selectedIds.length === 0}>
                {isSaving ? "Saving..." : "Save Selected"}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((item) => {
              const videoId = item.id.videoId;
              if (!videoId) return null;
              const isSelected = selectedIds.includes(videoId);

              return (
                <Card
                  key={videoId}
                  className={`overflow-hidden cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  onClick={() => toggleSelect(videoId)}
                >
                  <div className="relative aspect-video">
                    <img
                      src={item.snippet.thumbnails.medium.url}
                      alt={item.snippet.title}
                      className="object-cover w-full h-full"
                    />
                    <div className="absolute top-2 right-2">
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(videoId)} />
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <h4 className="font-medium text-sm line-clamp-2" title={item.snippet.title}>
                      {item.snippet.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">{item.snippet.channelTitle}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
