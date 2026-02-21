"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Upload,
  Music,
  Clock,
  Disc3,
  Download,
  Trash2,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { DropZone } from "@/components/drop-zone";
import type { Project, Song, RoutineType } from "@/lib/types";
import { ROUTINE_LABELS, ROUTINE_DURATIONS, formatDuration } from "@/lib/types";

interface Props {
  project: Project;
  songs: Song[];
  userId: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_EXTENSIONS = /\.(mp3|wav)$/i;

function statusBadge(status: string) {
  switch (status) {
    case "ready":
      return <Badge variant="default" className="bg-green-600">Ready</Badge>;
    case "analyzing":
    case "generating":
      return <Badge variant="secondary">Processing...</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
}

export function ProjectClient({ project, songs, userId }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      setError(null);

      const fileArray = Array.from(files);

      for (const file of fileArray) {
        if (!ALLOWED_EXTENSIONS.test(file.name)) {
          setError(`${file.name}: Only MP3 and WAV files are supported.`);
          setUploading(false);
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`${file.name}: File too large (max 50MB).`);
          setUploading(false);
          return;
        }
      }

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        setUploadProgress(`Uploading ${i + 1} of ${fileArray.length}: ${file.name}`);

        const storagePath = `${userId}/${project.id}/${crypto.randomUUID()}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("choreosync")
          .upload(storagePath, file);

        if (uploadError) {
          setError(`Failed to upload ${file.name}: ${uploadError.message}`);
          continue;
        }

        const { error: insertError } = await supabase.from("cs_songs").insert({
          project_id: project.id,
          user_id: userId,
          original_filename: file.name,
          storage_path: storagePath,
        });

        if (insertError) {
          setError(`Failed to save ${file.name}: ${insertError.message}`);
        }
      }

      setUploading(false);
      setUploadProgress(null);
      router.refresh();
    },
    [supabase, userId, project.id, router]
  );

  async function updateRoutineType(songId: string, routineType: RoutineType) {
    const targetMs =
      routineType === "custom" ? null : ROUTINE_DURATIONS[routineType];

    await supabase
      .from("cs_songs")
      .update({ routine_type: routineType, target_duration_ms: targetMs })
      .eq("id", songId);

    router.refresh();
  }

  async function deleteSong(songId: string, storagePath: string) {
    await supabase.storage.from("choreosync").remove([storagePath]);
    await supabase.from("cs_songs").delete().eq("id", songId);
    router.refresh();
  }

  async function analyzeAll() {
    const pending = songs.filter(
      (s) => s.analysis_status === "pending" || s.analysis_status === "failed"
    );
    for (const song of pending) {
      await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: song.id }),
      });
    }
    router.refresh();
  }

  async function downloadAllCuts() {
    const cutsReady = songs.filter((s) => s.cut_status === "ready");
    if (cutsReady.length === 0) return;

    const resp = await fetch("/api/download/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ songIds: cutsReady.map((s) => s.id) }),
    });
    const data = await resp.json();
    if (!resp.ok) {
      setError(data.error);
      return;
    }

    // Download each file
    for (const dl of data.downloads) {
      const a = document.createElement("a");
      a.href = dl.url;
      a.download = dl.filename;
      a.click();
      await new Promise((r) => setTimeout(r, 500)); // stagger downloads
    }
  }

  const pendingAnalysis = songs.filter(
    (s) => s.analysis_status === "pending" || s.analysis_status === "failed"
  );
  const cutsReady = songs.filter((s) => s.cut_status === "ready");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl flex items-center gap-3 px-4 py-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="text-xl font-bold text-gray-900">
            Choreo<span className="text-violet-600">Sync</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-500">
              {songs.length} song{songs.length !== 1 ? "s" : ""}
              {cutsReady.length > 0 &&
                ` / ${cutsReady.length} cut${cutsReady.length !== 1 ? "s" : ""} ready`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingAnalysis.length > 0 && (
              <Button variant="outline" size="sm" onClick={analyzeAll}>
                <Wand2 className="mr-2 h-4 w-4" />
                Analyze All ({pendingAnalysis.length})
              </Button>
            )}
            {cutsReady.length > 0 && (
              <Button variant="outline" size="sm" onClick={downloadAllCuts}>
                <Download className="mr-2 h-4 w-4" />
                Download All
              </Button>
            )}
            <label>
              <input
                type="file"
                accept=".mp3,.wav,audio/mpeg,audio/wav"
                multiple
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
                disabled={uploading}
              />
              <Button asChild size="sm" disabled={uploading}>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload"}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {uploadProgress && (
          <div className="mb-4 rounded-lg bg-violet-50 border border-violet-200 px-4 py-2 text-sm text-violet-700">
            {uploadProgress}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {songs.length === 0 ? (
          <DropZone onDrop={(files) => handleUpload(files)} disabled={uploading}>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Music className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                No songs yet
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Drag & drop MP3 or WAV files here, or use the Upload button.
              </p>
            </div>
          </DropZone>
        ) : (
          <div className="space-y-3">
            {songs.map((song) => (
              <Card key={song.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="flex items-center gap-4 py-4">
                  <Link href={`/song/${song.id}`} className="shrink-0">
                    <Disc3 className="h-8 w-8 text-violet-500 hover:text-violet-700 transition-colors" />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/song/${song.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-violet-600 truncate block"
                    >
                      {song.original_filename}
                    </Link>
                    <div className="flex items-center gap-3 mt-1">
                      {song.original_duration_ms && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {formatDuration(song.original_duration_ms)}
                        </span>
                      )}
                      {song.bpm && (
                        <span className="text-xs text-gray-500">
                          {Math.round(song.bpm)} BPM
                        </span>
                      )}
                      {statusBadge(song.analysis_status)}
                      {song.cut_status === "ready" && (
                        <Badge className="bg-violet-600">Cut Ready</Badge>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:block">
                    <Select
                      value={song.routine_type || ""}
                      onValueChange={(v) =>
                        updateRoutineType(song.id, v as RoutineType)
                      }
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue placeholder="Routine type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROUTINE_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-1">
                    {song.cut_status === "ready" && (
                      <Link href={`/song/${song.id}`}>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSong(song.id, song.storage_path)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Drop zone at bottom for adding more */}
            <DropZone onDrop={(files) => handleUpload(files)} disabled={uploading} />
          </div>
        )}
      </main>
    </div>
  );
}
