import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SongNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-4xl font-bold text-gray-200 mb-2">Song not found</h1>
      <p className="text-gray-500 mb-6">This song may have been deleted.</p>
      <Link href="/dashboard">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  );
}
