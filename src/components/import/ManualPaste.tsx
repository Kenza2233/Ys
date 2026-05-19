"use client";

import { useState, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { extractVideoId } from "@/lib/youtube";
import { Badge } from "@/components/ui/badge";

interface ManualPasteProps {
  playlistId: string;
  onComplete?: () => void;
}

export function ManualPaste({ playlistId, onComplete }: ManualPasteProps) {
  const [urlsText, setUrlsText] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const urls = useMemo(() => {
    return urlsText.split("\n").map(line => line.trim()).filter(line => line.length > 0);
  }, [urlsText]);

  const validatedUrls = useMemo(() => {
    return urls.map(url => ({
      url,
      isValid: !!extractVideoId(url)
    }));
  }, [urls]);

  const validCount = validatedUrls.filter(v => v.isValid).length;

  const handleImport = async () => {
    if (validCount === 0) {
      toast.error("No valid URLs found");
      return;
    }

    setIsImporting(true);
    setProgress(10);

    try {
      const response = await fetch(`/api/playlists/${playlistId}/videos/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: validatedUrls.filter(v => v.isValid).map(v => v.url) }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully imported ${data.successCount} videos`);
        setUrlsText("");
        if (onComplete) onComplete();
      } else {
        toast.error(data.error || "Failed to import videos");
      }
    } catch (error) {
      toast.error("An error occurred during import");
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="space-y-2">
        <label className="text-sm font-medium">Paste YouTube URLs (one per line)</label>
        <Textarea
          placeholder="https://www.youtube.com/watch?v=..."
          className="min-h-[200px]"
          value={urlsText}
          onChange={(e) => setUrlsText(e.target.value)}
          disabled={isImporting}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Badge variant="outline">{urls.length} URLs detected</Badge>
          <Badge variant={validCount > 0 ? "default" : "destructive"}>
            {validCount} valid
          </Badge>
        </div>
        <Button onClick={handleImport} disabled={isImporting || validCount === 0}>
          {isImporting ? "Importing..." : "Add to Playlist"}
        </Button>
      </div>

      {isImporting && (
        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-xs text-center text-muted-foreground">Processing videos...</p>
        </div>
      )}

      {urls.length > 0 && (
        <div className="max-h-[200px] overflow-auto text-xs space-y-1 p-2 bg-muted rounded">
          {validatedUrls.map((v, i) => (
            <div key={i} className="flex justify-between">
              <span className="truncate max-w-[80%]">{v.url}</span>
              <span className={v.isValid ? "text-green-500" : "text-red-500"}>
                {v.isValid ? "Valid" : "Invalid"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
