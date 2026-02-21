"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SongSection, SectionTag } from "@/lib/types";
import { formatDuration } from "@/lib/types";

const TAGS: { value: SectionTag; label: string; color: string; desc: string }[] = [
  { value: "KEEP", label: "KEEP", color: "bg-emerald-100 text-emerald-800 border-emerald-300", desc: "Include" },
  { value: "SKIP", label: "SKIP", color: "bg-red-100 text-red-800 border-red-300", desc: "Exclude" },
  { value: "MUST", label: "MUST", color: "bg-violet-100 text-violet-800 border-violet-300", desc: "Always include" },
  { value: "OPEN", label: "OPEN", color: "bg-blue-100 text-blue-800 border-blue-300", desc: "Use as opening" },
  { value: "FINALE", label: "FINALE", color: "bg-amber-100 text-amber-800 border-amber-300", desc: "Use as finale" },
];

const SECTION_BG: Record<string, string> = {
  intro: "bg-blue-50 border-blue-200",
  verse: "bg-emerald-50 border-emerald-200",
  chorus: "bg-violet-50 border-violet-200",
  bridge: "bg-amber-50 border-amber-200",
  outro: "bg-gray-50 border-gray-200",
  instrumental: "bg-pink-50 border-pink-200",
};

interface Props {
  sections: SongSection[];
  sectionTags: Record<string, SectionTag>;
  targetDurationMs: number | null;
  onTagChange: (sectionName: string, tag: SectionTag | null) => void;
}

export function SectionTagger({
  sections,
  sectionTags,
  targetDurationMs,
  onTagChange,
}: Props) {
  const [expandedHelp, setExpandedHelp] = useState(false);

  // Name sections (chorus1, chorus2, verse1, etc.)
  const namedSections = useMemo(() => {
    const counts: Record<string, number> = {};
    return sections.map((sec) => {
      counts[sec.label] = (counts[sec.label] || 0) + 1;
      return { ...sec, name: `${sec.label}${counts[sec.label]}` };
    });
  }, [sections]);

  // Calculate selected duration (simulate the algorithm)
  const selectedDuration = useMemo(() => {
    let total = 0;
    for (const sec of namedSections) {
      const tag = sectionTags[sec.name];
      if (tag === "SKIP") continue;
      // If there are explicit KEEP/MUST tags, only count tagged sections
      const hasExplicitTags = Object.values(sectionTags).some(
        (t) => t === "KEEP" || t === "MUST" || t === "OPEN" || t === "FINALE"
      );
      if (hasExplicitTags && !tag) continue;
      total += sec.end - sec.start;
    }
    return total;
  }, [namedSections, sectionTags]);

  const targetSec = targetDurationMs ? targetDurationMs / 1000 : null;
  const durationDiff = targetSec ? selectedDuration - targetSec : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Section Tags</CardTitle>
          <button
            className="text-xs text-violet-600 hover:underline"
            onClick={() => setExpandedHelp(!expandedHelp)}
          >
            {expandedHelp ? "Hide help" : "How tags work"}
          </button>
        </div>
        {expandedHelp && (
          <div className="text-xs text-gray-500 space-y-1 mt-2 p-3 bg-gray-50 rounded-lg">
            <p>Tag sections to control which parts make it into your cut:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li><strong>No tags</strong> — AI auto-selects the best sections</li>
              <li><strong>MUST</strong> — Always include this section</li>
              <li><strong>KEEP</strong> — Prefer including this section</li>
              <li><strong>SKIP</strong> — Never include this section</li>
              <li><strong>OPEN</strong> — Use as the opening of your cut</li>
              <li><strong>FINALE</strong> — Use as the big ending</li>
            </ul>
          </div>
        )}
        {targetSec && (
          <div className="flex items-center gap-2 text-sm mt-2">
            <span className="text-gray-500">
              Selected: {formatDuration(selectedDuration * 1000)}
            </span>
            <span className="text-gray-400">/</span>
            <span className="text-gray-500">
              Target: {formatDuration(targetDurationMs!)}
            </span>
            {durationDiff !== null && (
              <Badge
                variant="outline"
                className={
                  Math.abs(durationDiff) <= 5
                    ? "border-green-300 text-green-700"
                    : durationDiff > 0
                    ? "border-amber-300 text-amber-700"
                    : "border-red-300 text-red-700"
                }
              >
                {durationDiff > 0 ? "+" : ""}
                {formatDuration(Math.abs(durationDiff) * 1000)}
                {durationDiff > 0 ? " over" : " under"}
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {namedSections.map((sec) => {
          const currentTag = sectionTags[sec.name] || null;
          const bgClass = SECTION_BG[sec.label] || "bg-gray-50 border-gray-200";
          const duration = sec.end - sec.start;

          return (
            <div
              key={sec.name}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${bgClass}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {sec.label}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDuration(sec.start * 1000)} — {formatDuration(sec.end * 1000)}
                  </span>
                  <span className="text-xs text-gray-400">
                    ({formatDuration(duration * 1000)})
                  </span>
                </div>
              </div>

              <div className="flex gap-1">
                {TAGS.map((tag) => (
                  <button
                    key={tag.value}
                    onClick={() =>
                      onTagChange(
                        sec.name,
                        currentTag === tag.value ? null : tag.value
                      )
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                      currentTag === tag.value
                        ? tag.color
                        : "bg-white text-gray-400 border-gray-200 hover:border-gray-300"
                    }`}
                    title={tag.desc}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {Object.keys(sectionTags).length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-gray-400"
            onClick={() => {
              for (const name of Object.keys(sectionTags)) {
                onTagChange(name, null);
              }
            }}
          >
            Clear all tags
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
