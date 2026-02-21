"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Music, FolderOpen, LogOut } from "lucide-react";
import Link from "next/link";
import type { Project } from "@/lib/types";

interface Props {
  projects: Project[];
  songCounts: Record<string, number>;
  userEmail: string;
}

export function DashboardClient({ projects, songCounts, userEmail }: Props) {
  const [newProjectName, setNewProjectName] = useState("");
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function createProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setCreating(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("cs_projects").insert({
      user_id: user.id,
      name: newProjectName.trim(),
    });

    if (!error) {
      setNewProjectName("");
      setDialogOpen(false);
      router.refresh();
    }
    setCreating(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
          <Link href="/dashboard">
            <span className="text-xl font-bold text-gray-900">
              Choreo<span className="text-violet-600">Sync</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{userEmail}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Project</DialogTitle>
              </DialogHeader>
              <form onSubmit={createProject} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="Spring Recital 2026"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    autoFocus
                  />
                </div>
                <Button type="submit" disabled={creating || !newProjectName.trim()}>
                  {creating ? "Creating..." : "Create"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FolderOpen className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No projects yet</h3>
              <p className="text-sm text-gray-500 mb-4">
                Create a project to start uploading and editing your competition music.
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create your first project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <Card className="hover:border-violet-300 hover:shadow-md transition-all cursor-pointer h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{project.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Music className="h-3.5 w-3.5" />
                      {songCounts[project.id] || 0} song
                      {(songCounts[project.id] || 0) !== 1 ? "s" : ""}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
