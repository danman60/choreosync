import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-6xl font-bold text-gray-200 mb-2">404</h1>
      <p className="text-lg text-gray-600 mb-6">Page not found</p>
      <Link href="/dashboard">
        <Button>Back to Dashboard</Button>
      </Link>
    </div>
  );
}
