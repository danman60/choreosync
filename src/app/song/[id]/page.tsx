import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { SongClient } from "./song-client";
import type { Song } from "@/lib/types";

export default async function SongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: song } = await supabase
    .from("cs_songs")
    .select("*")
    .eq("id", id)
    .single();

  if (!song) notFound();

  // Get signed URLs for audio files
  const { data: originalUrl } = await supabase.storage
    .from("choreosync")
    .createSignedUrl(song.storage_path, 3600);

  let cutUrl: { signedUrl: string } | null = null;
  if (song.cut_storage_path) {
    const { data } = await supabase.storage
      .from("choreosync")
      .createSignedUrl(song.cut_storage_path, 3600);
    cutUrl = data;
  }

  return (
    <SongClient
      song={song as Song}
      audioUrl={originalUrl?.signedUrl || null}
      cutAudioUrl={cutUrl?.signedUrl || null}
    />
  );
}
