"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Upload, FileSpreadsheet, Download } from "lucide-react";

// For Select component, we need to add it via shadcn if not present
// I'll use standard select for now to avoid dependency issues if shadcn add select fails

interface XlsxUploadProps {
  playlistId: string;
  onComplete?: () => void;
}

export function XlsxUpload({ playlistId, onComplete }: XlsxUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({
    url: "",
    title: "",
    description: "",
    tags: "",
    order: "",
    category: "",
  });
  const [isImporting, setIsImporting] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (json.length > 0) {
        const head = json[0].map(h => String(h));
        setHeaders(head);
        const preview = XLSX.utils.sheet_to_json(worksheet).slice(0, 5);
        setPreviewData(preview);

        // Auto-detect URL column
        const urlIdx = head.findIndex(h => h.toLowerCase().includes("url") || h.toLowerCase().includes("link"));
        if (urlIdx !== -1) {
          setMapping(prev => ({ ...prev, url: head[urlIdx] }));
        }
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  const handleImport = async () => {
    if (!file || !mapping.url) {
      toast.error("Please select a file and map the URL column");
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mapping", JSON.stringify(mapping));

    try {
      const response = await fetch(`/api/playlists/${playlistId}/videos/xlsx`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Successfully imported ${data.successCount} videos`);
        setFile(null);
        setPreviewData([]);
        if (onComplete) onComplete();
      } else {
        toast.error(data.error || "Failed to import");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", title: "Never Gonna Give You Up", description: "Classic", tags: "music,pop", order: 1, category: "Music" }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "youtube_import_template.xlsx");
  };

  return (
    <div className="space-y-6">
      {!file ? (
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">Drag & drop XLSX file here, or click to select</p>
            <p className="text-sm text-muted-foreground">Supported formats: .xlsx, .xls, .csv (Max 10MB)</p>
          </div>
          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="mr-2 h-4 w-4" /> Download Template
          </Button>
        </div>
      ) : (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-6 w-6 text-green-600" />
              <span className="font-medium">{file.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setFile(null)}>Change File</Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {Object.keys(mapping).map((key) => (
              <div key={key} className="space-y-1">
                <label className="text-xs font-semibold uppercase text-muted-foreground">{key} {key === 'url' && '*'}</label>
                <select
                  className="w-full bg-background border rounded px-2 py-1 text-sm"
                  value={mapping[key]}
                  onChange={(e) => setMapping(prev => ({ ...prev, [key]: e.target.value }))}
                >
                  <option value="">-- Skip --</option>
                  {headers.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Preview (First 5 rows)</h4>
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.slice(0, 4).map(h => <TableHead key={h}>{h}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, i) => (
                    <TableRow key={i}>
                      {headers.slice(0, 4).map(h => <TableCell key={h} className="truncate max-w-[150px]">{row[h]}</TableCell>)}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Button onClick={handleImport} disabled={isImporting || !mapping.url} className="w-full">
            {isImporting ? "Processing..." : `Import from ${file.name}`}
          </Button>
        </Card>
      )}
    </div>
  );
}
