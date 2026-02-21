import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";
import type { Project } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: projects } = await supabase
    .from("cs_projects")
    .select("*")
    .order("created_at", { ascending: false });

  // Get song counts per project
  const { data: songCounts } = await supabase
    .from("cs_songs")
    .select("project_id")
    .eq("user_id", user.id);

  const countMap: Record<string, number> = {};
  songCounts?.forEach((s) => {
    countMap[s.project_id] = (countMap[s.project_id] || 0) + 1;
  });

  return (
    <DashboardClient
      projects={(projects as Project[]) || []}
      songCounts={countMap}
      userEmail={user.email || ""}
    />
  );
}
