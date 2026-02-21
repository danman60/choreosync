"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipBack } from "lucide-react";
import { formatDuration } from "@/lib/types";
import type { SongSection } from "@/lib/types";

const SECTION_COLORS: Record<string, string> = {
  intro: "rgba(96, 165, 250, 0.35)",
  verse: "rgba(52, 211, 153, 0.35)",
  chorus: "rgba(139, 92, 246, 0.45)",
  bridge: "rgba(251, 191, 36, 0.35)",
  outro: "rgba(156, 163, 175, 0.35)",
  instrumental: "rgba(236, 72, 153, 0.35)",
};

interface Props {
  audioUrl: string;
  sections?: SongSection[];
  selectedSections?: Set<string>;
  onTimeUpdate?: (time: number) => void;
}

export function WaveformPlayer({
  audioUrl,
  sections,
  selectedSections,
  onTimeUpdate,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<import("wavesurfer.js").default | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let ws: import("wavesurfer.js").default;

    async function init() {
      const WaveSurfer = (await import("wavesurfer.js")).default;

      ws = WaveSurfer.create({
        container: containerRef.current!,
        waveColor: "#c4b5fd",
        progressColor: "#7c3aed",
        cursorColor: "#4c1d95",
        cursorWidth: 2,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 100,
        normalize: true,
        url: audioUrl,
      });

      ws.on("ready", () => {
        setDuration(ws.getDuration());
        setReady(true);
      });

      ws.on("timeupdate", (time: number) => {
        setCurrentTime(time);
        onTimeUpdate?.(time);
      });

      ws.on("play", () => setPlaying(true));
      ws.on("pause", () => setPlaying(false));
      ws.on("finish", () => setPlaying(false));

      wavesurferRef.current = ws;
    }

    init();

    return () => {
      ws?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  const togglePlay = useCallback(() => {
    wavesurferRef.current?.playPause();
  }, []);

  const restart = useCallback(() => {
    wavesurferRef.current?.seekTo(0);
    wavesurferRef.current?.pause();
    setPlaying(false);
  }, []);

  return (
    <div className="space-y-2">
      {/* Section overlay bar */}
      {sections && sections.length > 0 && duration > 0 && (
        <div className="relative h-6 rounded overflow-hidden bg-gray-100">
          {sections.map((sec, i) => {
            const left = (sec.start / duration) * 100;
            const width = ((sec.end - sec.start) / duration) * 100;
            const isSelected = !selectedSections || selectedSections.has(`${sec.label}${i + 1}`) || selectedSections.size === 0;
            const bg = SECTION_COLORS[sec.label] || "rgba(156,163,175,0.35)";
            return (
              <div
                key={i}
                className={`absolute top-0 h-full flex items-center justify-center text-[10px] font-medium border-r border-white/50 ${
                  isSelected ? "opacity-100" : "opacity-30"
                }`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  backgroundColor: bg,
                }}
                title={`${sec.label} (${formatDuration(sec.start * 1000)} - ${formatDuration(sec.end * 1000)})`}
              >
                {width > 6 && sec.label}
              </div>
            );
          })}
          {/* Playhead indicator */}
          {duration > 0 && (
            <div
              className="absolute top-0 h-full w-0.5 bg-violet-800 z-10 pointer-events-none"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            />
          )}
        </div>
      )}

      {/* Waveform */}
      <div ref={containerRef} className="w-full" />

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={restart} disabled={!ready}>
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={togglePlay} disabled={!ready}>
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <span className="text-sm text-gray-500 tabular-nums">
          {formatDuration(currentTime * 1000)} / {formatDuration(duration * 1000)}
        </span>
      </div>
    </div>
  );
}
