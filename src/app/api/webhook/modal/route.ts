import { NextResponse } from "next/server";

/**
 * POST /api/webhook/modal
 * Receives callbacks from Modal when analysis/generation completes.
 * No auth required (uses shared secret).
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-webhook-secret");
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { song_id, event, payload } = body;

  if (!song_id || !event) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // The Modal functions already update the DB directly via service key.
  // This webhook is for triggering any additional side effects:
  // - Sending notifications
  // - Invalidating caches
  // - Future: billing/usage tracking

  console.log(`[webhook] ${event} for song ${song_id}:`, payload);

  return NextResponse.json({ received: true });
}
