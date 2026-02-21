import { Button } from "@/components/ui/button";
import { Music, Zap, Clock, Download, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b">
        <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
          <span className="text-xl font-bold text-gray-900">
            Choreo<span className="text-violet-600">Sync</span>
          </span>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Upload your songs.
            <br />
            <span className="text-violet-600">Get back competition-ready cuts.</span>
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            AI-powered music editing for dance competitions. No more paying $50-150 per song
            for human editors. Upload, tag, download — in minutes, not days.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="text-base px-8">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <p className="mt-3 text-sm text-gray-400">
            3 free cuts per month. No credit card required.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mb-4">
                <Music className="h-7 w-7 text-violet-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Upload</h3>
              <p className="text-sm text-gray-600">
                Drag and drop your MP3s. Tag each with the routine type
                (Solo, Duo, Group, Production) for automatic duration targeting.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mb-4">
                <Zap className="h-7 w-7 text-violet-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. AI Analyzes</h3>
              <p className="text-sm text-gray-600">
                Our AI identifies every section — verse, chorus, bridge, intro, outro.
                It picks the best sections and plans beat-perfect transitions.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mb-4">
                <Download className="h-7 w-7 text-violet-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Download</h3>
              <p className="text-sm text-gray-600">
                Preview in your browser. Download MP3 + WAV. Not perfect?
                Adjust section tags and regenerate in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Built for competition
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: Clock,
                title: "Preset durations",
                desc: "Solo 2:30, Duo 2:30, Small Group 2:45, Large Group 3:00, Production 4:00 — or custom.",
              },
              {
                icon: Zap,
                title: "Beat-aligned transitions",
                desc: "Every cut snaps to the nearest downbeat. No awkward jumps or off-beat splices.",
              },
              {
                title: "Volume normalized",
                icon: Music,
                desc: "LUFS-standard loudness. Your tracks won't blow out the speakers or fade into nothing.",
              },
              {
                title: "Batch processing",
                icon: Download,
                desc: "Upload a whole season of music at once. Download all cuts as a ZIP.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex gap-4 p-5 rounded-xl border bg-white"
              >
                <Icon className="h-6 w-6 text-violet-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-gray-50 px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple pricing</h2>
          <p className="text-gray-600 mb-8">
            Start free. Upgrade when you need more.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="rounded-xl border bg-white p-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-1">Free</h3>
              <p className="text-3xl font-bold text-gray-900">$0</p>
              <p className="text-sm text-gray-500 mb-4">3 cuts per month</p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>AI section analysis</li>
                <li>Beat-aligned cuts</li>
                <li>MP3 download</li>
              </ul>
            </div>
            <div className="rounded-xl border-2 border-violet-500 bg-white p-6 text-left relative">
              <div className="absolute -top-3 left-6 bg-violet-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                Coming Soon
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Studio</h3>
              <p className="text-3xl font-bold text-gray-900">$25<span className="text-sm font-normal text-gray-500">/mo</span></p>
              <p className="text-sm text-gray-500 mb-4">Unlimited cuts</p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>Everything in Free</li>
                <li>WAV + MP3 downloads</li>
                <li>Batch processing</li>
                <li>Priority rendering</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Stop overpaying for music edits
          </h2>
          <p className="text-gray-600 mb-6">
            Join studios saving hundreds on competition music editing.
          </p>
          <Link href="/login">
            <Button size="lg" className="text-base px-8">
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 px-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <span className="text-sm text-gray-500">
            ChoreoSync {new Date().getFullYear()}
          </span>
          <span className="text-sm text-gray-400">
            Built for the dance competition community
          </span>
        </div>
      </footer>
    </div>
  );
}
