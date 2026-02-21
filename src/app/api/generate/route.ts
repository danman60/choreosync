import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/generate
 * Triggers Modal cut generation for a song.
 * Body: { songId: string }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { songId } = await request.json();
  if (!songId) {
    return NextResponse.json({ error: "songId required" }, { status: 400 });
  }

  // Verify song belongs to user and is analyzed
  const { data: song } = await supabase
    .from("cs_songs")
    .select("id, analysis_status, target_duration_ms, cut_status")
    .eq("id", songId)
    .eq("user_id", user.id)
    .single();

  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  if (song.analysis_status !== "ready") {
    return NextResponse.json(
      { error: "Song must be analyzed first" },
      { status: 400 }
    );
  }

  if (!song.target_duration_ms) {
    return NextResponse.json(
      { error: "Set a routine type / target duration first" },
      { status: 400 }
    );
  }

  if (song.cut_status === "generating") {
    return NextResponse.json({ error: "Already generating" }, { status: 409 });
  }

  // Call Modal function
  const modalUrl = process.env.MODAL_GENERATE_URL;
  if (!modalUrl) {
    return NextResponse.json(
      { error: "Modal not configured" },
      { status: 503 }
    );
  }

  try {
    const resp = await fetch(modalUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ song_id: songId }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Modal returned ${resp.status}: ${text}`);
    }

    return NextResponse.json({ status: "generating" });
  } catch (err) {
    await supabase
      .from("cs_songs")
      .update({ cut_status: "failed" })
      .eq("id", songId);

    return NextResponse.json(
      { error: "Failed to start generation", details: String(err) },
      { status: 500 }
    );
  }
}
