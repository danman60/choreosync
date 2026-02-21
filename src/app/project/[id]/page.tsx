import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ProjectClient } from "./project-client";
import type { Project, Song } from "@/lib/types";

export default async function ProjectPage({
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

  const { data: project } = await supabase
    .from("cs_projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const { data: songs } = await supabase
    .from("cs_songs")
    .select("*")
    .eq("project_id", id)
    .order("created_at", { ascending: false });

  return (
    <ProjectClient
      project={project as Project}
      songs={(songs as Song[]) || []}
      userId={user.id}
    />
  );
}
