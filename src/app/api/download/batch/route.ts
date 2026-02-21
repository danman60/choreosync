import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * POST /api/download/batch
 * Returns signed download URLs for multiple songs' cuts.
 * Body: { songIds: string[] }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { songIds } = await request.json();
  if (!songIds || !Array.isArray(songIds) || songIds.length === 0) {
    return NextResponse.json({ error: "songIds required" }, { status: 400 });
  }

  const { data: songs } = await supabase
    .from("cs_songs")
    .select("id, cut_storage_path, original_filename")
    .eq("user_id", user.id)
    .in("id", songIds)
    .not("cut_storage_path", "is", null);

  if (!songs || songs.length === 0) {
    return NextResponse.json({ error: "No cuts available" }, { status: 404 });
  }

  const downloads = await Promise.all(
    songs.map(async (song) => {
      const { data } = await supabase.storage
        .from("choreosync")
        .createSignedUrl(song.cut_storage_path!, 3600);
      return {
        songId: song.id,
        url: data?.signedUrl || null,
        filename: `cut-${song.original_filename}`,
      };
    })
  );

  return NextResponse.json({ downloads: downloads.filter((d) => d.url) });
}
