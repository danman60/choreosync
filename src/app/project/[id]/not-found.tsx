import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ProjectNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-4xl font-bold text-gray-200 mb-2">Project not found</h1>
      <p className="text-gray-500 mb-6">This project may have been deleted.</p>
      <Link href="/dashboard">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  );
}
