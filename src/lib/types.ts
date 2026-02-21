export type RoutineType =
  | "solo"
  | "duo"
  | "small_group"
  | "large_group"
  | "production"
  | "custom";

export type AnalysisStatus = "pending" | "analyzing" | "ready" | "failed";
export type CutStatus = "pending" | "generating" | "ready" | "failed";
export type SectionTag = "KEEP" | "SKIP" | "MUST" | "OPEN" | "FINALE";

export const ROUTINE_DURATIONS: Record<Exclude<RoutineType, "custom">, number> = {
  solo: 150000, // 2:30
  duo: 150000, // 2:30
  small_group: 165000, // 2:45
  large_group: 180000, // 3:00
  production: 240000, // 4:00
};

export const ROUTINE_LABELS: Record<RoutineType, string> = {
  solo: "Solo (2:30)",
  duo: "Duo/Trio (2:30)",
  small_group: "Small Group (2:45)",
  large_group: "Large Group (3:00)",
  production: "Production (4:00)",
  custom: "Custom Duration",
};

export interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  plan: "free" | "studio" | "pro";
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Song {
  id: string;
  project_id: string;
  user_id: string;
  original_filename: string;
  storage_path: string;
  original_duration_ms: number | null;
  bpm: number | null;
  analysis: SongAnalysis | null;
  analysis_status: AnalysisStatus;
  routine_type: RoutineType | null;
  target_duration_ms: number | null;
  section_tags: Record<string, SectionTag>;
  cut_storage_path: string | null;
  cut_duration_ms: number | null;
  cut_status: CutStatus;
  cut_metadata: CutMetadata | null;
  created_at: string;
  updated_at: string;
}

export interface SongSection {
  label: string; // "intro", "verse", "chorus", "bridge", "outro"
  start: number; // seconds
  end: number; // seconds
}

export interface SongAnalysis {
  sections: SongSection[];
  beats: number[]; // beat timestamps in seconds
  downbeats: number[]; // downbeat timestamps
  bpm: number;
}

export interface CutMetadata {
  sections_used: string[];
  crossfade_points: number[];
  tempo_adjustment_pct: number;
  final_duration_ms: number;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
