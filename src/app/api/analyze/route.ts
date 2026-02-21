import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/analyze
 * Triggers Modal analysis for a song.
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

  // Verify song belongs to user
  const { data: song } = await supabase
    .from("cs_songs")
    .select("id, storage_path, analysis_status")
    .eq("id", songId)
    .eq("user_id", user.id)
    .single();

  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  if (song.analysis_status === "analyzing") {
    return NextResponse.json({ error: "Already analyzing" }, { status: 409 });
  }

  // Call Modal function
  const modalUrl = process.env.MODAL_ANALYZE_URL;
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
      body: JSON.stringify({
        song_id: songId,
        storage_path: song.storage_path,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Modal returned ${resp.status}: ${text}`);
    }

    return NextResponse.json({ status: "analyzing" });
  } catch (err) {
    // Update status to failed if Modal call fails
    await supabase
      .from("cs_songs")
      .update({ analysis_status: "failed" })
      .eq("id", songId);

    return NextResponse.json(
      { error: "Failed to start analysis", details: String(err) },
      { status: 500 }
    );
  }
}
