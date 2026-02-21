"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Pause } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import type { Song, SongSection } from "@/lib/types";
import { formatDuration, ROUTINE_LABELS } from "@/lib/types";

const SECTION_COLORS: Record<string, string> = {
  intro: "bg-blue-400",
  verse: "bg-emerald-400",
  chorus: "bg-violet-500",
  bridge: "bg-amber-400",
  outro: "bg-gray-400",
  instrumental: "bg-pink-400",
};

interface Props {
  song: Song;
  audioUrl: string | null;
}

export function SongClient({ song, audioUrl }: Props) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sections: SongSection[] = song.analysis?.sections || [];
  const totalDuration = sections.length > 0
    ? sections[sections.length - 1].end
    : (song.original_duration_ms || 0) / 1000;

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  }

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {song.original_filename}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            {song.routine_type && (
              <Badge variant="secondary">
                {ROUTINE_LABELS[song.routine_type]}
              </Badge>
            )}
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
          </div>
        </div>

        {/* Audio Player */}
        {audioUrl && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center gap-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={togglePlay}
                  className="shrink-0"
                >
                  {playing ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setPlaying(false)}
                  className="hidden"
                />
                <div className="flex-1 text-sm text-gray-500">
                  Original audio — full length
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section Map */}
        {song.analysis_status === "ready" && sections.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Song Structure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex rounded-lg overflow-hidden h-12 mb-3">
                {sections.map((section, i) => {
                  const width =
                    ((section.end - section.start) / totalDuration) * 100;
                  const colorClass =
                    SECTION_COLORS[section.label] || "bg-gray-300";
                  return (
                    <div
                      key={i}
                      className={`${colorClass} flex items-center justify-center text-white text-xs font-medium relative`}
                      style={{ width: `${width}%` }}
                      title={`${section.label} (${formatDuration(section.start * 1000)} - ${formatDuration(section.end * 1000)})`}
                    >
                      {width > 8 && section.label}
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(SECTION_COLORS).map(([label, color]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm ${color}`} />
                    <span className="text-xs text-gray-600 capitalize">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : song.analysis_status === "analyzing" ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Analyzing song structure...</p>
            </CardContent>
          </Card>
        ) : song.analysis_status === "pending" ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-gray-500">
                Analysis will start automatically once the processing pipeline is connected.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                (Phase 2 — Modal integration)
              </p>
            </CardContent>
          </Card>
        ) : null}

        {/* Section Tags — Phase 3 placeholder */}
        {song.analysis_status === "ready" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Section Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Tag sections as KEEP, SKIP, MUST, OPEN, or FINALE to control the cut.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                (Phase 3 — Section tagger UI)
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
