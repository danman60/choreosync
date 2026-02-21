"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Wand2,
  Scissors,
  Download,
  RefreshCw,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { WaveformPlayer } from "@/components/waveform-player";
import { SectionTagger } from "@/components/section-tagger";
import type { Song, RoutineType, SectionTag } from "@/lib/types";
import { ROUTINE_LABELS, ROUTINE_DURATIONS, formatDuration } from "@/lib/types";

interface Props {
  song: Song;
  audioUrl: string | null;
  cutAudioUrl: string | null;
}

export function SongClient({ song: initialSong, audioUrl, cutAudioUrl }: Props) {
  const [song, setSong] = useState(initialSong);
  const [sectionTags, setSectionTags] = useState<Record<string, SectionTag>>(
    initialSong.section_tags || {}
  );
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pollTimer, setPollTimer] = useState<NodeJS.Timeout | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const sections = song.analysis?.sections || [];

  // Poll for status changes
  const startPolling = useCallback(
    (field: "analysis_status" | "cut_status", targetStatus: string) => {
      if (pollTimer) clearInterval(pollTimer);

      const timer = setInterval(async () => {
        const { data } = await supabase
          .from("cs_songs")
          .select("*")
          .eq("id", song.id)
          .single();

        if (data) {
          setSong(data as Song);
          if (
            data[field] === targetStatus ||
            data[field] === "failed"
          ) {
            clearInterval(timer);
            setPollTimer(null);
            if (data[field] === targetStatus) {
              router.refresh();
            }
          }
        }
      }, 3000);

      setPollTimer(timer);
      return () => clearInterval(timer);
    },
    [supabase, song.id, pollTimer, router]
  );

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    try {
      const resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: song.id }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);

      setSong((s) => ({ ...s, analysis_status: "analyzing" }));
      startPolling("analysis_status", "ready");
    } catch (err) {
      setError(String(err));
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      // Save section tags first
      await supabase
        .from("cs_songs")
        .update({ section_tags: sectionTags })
        .eq("id", song.id);

      const resp = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ songId: song.id }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);

      setSong((s) => ({ ...s, cut_status: "generating" }));
      startPolling("cut_status", "ready");
    } catch (err) {
      setError(String(err));
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const resp = await fetch(`/api/download?songId=${song.id}&type=cut`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);

      // Trigger browser download
      const a = document.createElement("a");
      a.href = data.url;
      a.download = data.filename;
      a.click();
    } catch (err) {
      setError(String(err));
    } finally {
      setDownloading(false);
    }
  }

  async function updateRoutineType(routineType: RoutineType) {
    const targetMs =
      routineType === "custom" ? song.target_duration_ms : ROUTINE_DURATIONS[routineType];

    await supabase
      .from("cs_songs")
      .update({ routine_type: routineType, target_duration_ms: targetMs })
      .eq("id", song.id);

    setSong((s) => ({
      ...s,
      routine_type: routineType,
      target_duration_ms: targetMs,
    }));
  }

  function handleTagChange(sectionName: string, tag: SectionTag | null) {
    setSectionTags((prev) => {
      const next = { ...prev };
      if (tag === null) {
        delete next[sectionName];
      } else {
        next[sectionName] = tag;
      }
      return next;
    });

    // Persist to DB (debounced in a real app, fine for now)
    const updated = { ...sectionTags };
    if (tag === null) {
      delete updated[sectionName];
    } else {
      updated[sectionName] = tag;
    }
    supabase
      .from("cs_songs")
      .update({ section_tags: updated })
      .eq("id", song.id)
      .then(() => {});
  }

  const isAnalyzed = song.analysis_status === "ready";
  const isAnalyzing = song.analysis_status === "analyzing" || analyzing;
  const hasRoutineType = !!song.routine_type && !!song.target_duration_ms;
  const isCutReady = song.cut_status === "ready";
  const isGenerating = song.cut_status === "generating" || generating;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl flex items-center gap-3 px-4 py-3">
          <Link href={`/project/${song.project_id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <span className="text-xl font-bold text-gray-900">
            Choreo<span className="text-violet-600">Sync</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Song header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {song.original_filename}
            </h1>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {song.bpm && (
                <span className="text-sm text-gray-500">
                  {Math.round(song.bpm)} BPM
                </span>
              )}
              {song.original_duration_ms && (
                <span className="text-sm text-gray-500">
                  {formatDuration(song.original_duration_ms)}
                </span>
              )}
              <Badge
                variant={
                  isAnalyzed
                    ? "default"
                    : song.analysis_status === "failed"
                    ? "destructive"
                    : "secondary"
                }
                className={isAnalyzed ? "bg-green-600" : ""}
              >
                {song.analysis_status === "ready"
                  ? "Analyzed"
                  : song.analysis_status === "analyzing"
                  ? "Analyzing..."
                  : song.analysis_status === "failed"
                  ? "Analysis Failed"
                  : "Not Analyzed"}
              </Badge>
            </div>
          </div>

          <Select
            value={song.routine_type || ""}
            onValueChange={(v) => updateRoutineType(v as RoutineType)}
          >
            <SelectTrigger className="w-48">
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

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Waveform + Original Audio */}
        {audioUrl && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Original Audio</CardTitle>
            </CardHeader>
            <CardContent>
              <WaveformPlayer
                audioUrl={audioUrl}
                sections={isAnalyzed ? sections : undefined}
                selectedSections={
                  Object.keys(sectionTags).length > 0
                    ? new Set(
                        Object.entries(sectionTags)
                          .filter(([, t]) => t !== "SKIP")
                          .map(([name]) => name)
                      )
                    : undefined
                }
              />
            </CardContent>
          </Card>
        )}

        {/* Analyze button */}
        {!isAnalyzed && !isAnalyzing && (
          <Button onClick={handleAnalyze} disabled={analyzing} size="lg">
            <Wand2 className="mr-2 h-4 w-4" />
            Analyze Song Structure
          </Button>
        )}

        {isAnalyzing && (
          <Card>
            <CardContent className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600">
                Analyzing song structure — detecting sections, beats, and BPM...
              </p>
              <p className="text-xs text-gray-400 mt-1">
                This typically takes 60-90 seconds.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Section Tagger (Phase 3) */}
        {isAnalyzed && sections.length > 0 && (
          <SectionTagger
            sections={sections}
            sectionTags={sectionTags}
            targetDurationMs={song.target_duration_ms}
            onTagChange={handleTagChange}
          />
        )}

        {/* Generate Cut button */}
        {isAnalyzed && hasRoutineType && (
          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              size="lg"
            >
              {isGenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isCutReady ? (
                <RefreshCw className="mr-2 h-4 w-4" />
              ) : (
                <Scissors className="mr-2 h-4 w-4" />
              )}
              {isCutReady ? "Regenerate Cut" : isGenerating ? "Generating..." : "Generate Cut"}
            </Button>

            {isCutReady && (
              <Button
                variant="outline"
                size="lg"
                onClick={handleDownload}
                disabled={downloading}
              >
                <Download className="mr-2 h-4 w-4" />
                {downloading ? "Preparing..." : "Download Cut"}
              </Button>
            )}
          </div>
        )}

        {isGenerating && (
          <Card>
            <CardContent className="py-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600">
                Generating your competition cut — extracting sections, crossfading, normalizing...
              </p>
              <p className="text-xs text-gray-400 mt-1">
                This typically takes 30-60 seconds.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Cut Preview */}
        {isCutReady && cutAudioUrl && (
          <Card className="border-violet-200 bg-violet-50/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Competition Cut
                </CardTitle>
                <div className="flex items-center gap-2">
                  {song.cut_duration_ms && (
                    <Badge variant="outline" className="border-violet-300 text-violet-700">
                      {formatDuration(song.cut_duration_ms)}
                    </Badge>
                  )}
                  {song.cut_metadata?.tempo_adjustment_pct !== undefined &&
                    song.cut_metadata.tempo_adjustment_pct !== 0 && (
                      <Badge variant="outline" className="border-gray-300 text-gray-600">
                        Tempo {song.cut_metadata.tempo_adjustment_pct > 0 ? "+" : ""}
                        {song.cut_metadata.tempo_adjustment_pct}%
                      </Badge>
                    )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <WaveformPlayer audioUrl={cutAudioUrl} />
              {song.cut_metadata?.sections_used && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="text-xs text-gray-500">Sections used:</span>
                  {song.cut_metadata.sections_used.map((s, i) => (
                    <Badge key={i} variant="secondary" className="text-xs capitalize">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Prompt if missing routine type */}
        {isAnalyzed && !hasRoutineType && (
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-sm text-gray-600">
                Select a routine type above to set the target duration, then generate your cut.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
