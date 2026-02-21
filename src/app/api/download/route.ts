import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/download?songId=xxx&type=cut|original
 * Returns a signed download URL for the song file.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const songId = searchParams.get("songId");
  const type = searchParams.get("type") || "cut";

  if (!songId) {
    return NextResponse.json({ error: "songId required" }, { status: 400 });
  }

  const { data: song } = await supabase
    .from("cs_songs")
    .select("storage_path, cut_storage_path, original_filename, user_id")
    .eq("id", songId)
    .eq("user_id", user.id)
    .single();

  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  const storagePath =
    type === "cut" ? song.cut_storage_path : song.storage_path;

  if (!storagePath) {
    return NextResponse.json(
      { error: `No ${type} file available` },
      { status: 404 }
    );
  }

  const { data: signedUrl, error } = await supabase.storage
    .from("choreosync")
    .createSignedUrl(storagePath, 3600); // 1 hour

  if (error || !signedUrl) {
    return NextResponse.json(
      { error: "Failed to create download URL" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    url: signedUrl.signedUrl,
    filename:
      type === "cut"
        ? `cut-${song.original_filename}`
        : song.original_filename,
  });
}
