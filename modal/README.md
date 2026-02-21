# ChoreoSync Modal Backend

## Setup

1. Install Modal CLI: `pip install modal`
2. Authenticate: `modal token new`
3. Create secrets in Modal dashboard (`choreosync-secrets`):
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_SERVICE_KEY` — service role key (NOT anon key)
   - `WEBHOOK_URL` — e.g. `https://choreosync.vercel.app/api/webhook/modal`
   - `WEBHOOK_SECRET` — shared secret for webhook auth

## Deploy

```bash
modal deploy app.py
```

## Test locally

```bash
# Analyze a song
modal run app.py --song-id <UUID> --action analyze

# Generate a cut
modal run app.py --song-id <UUID> --action generate
```

## Cost

- Analysis (T4 GPU): ~$0.10/song (~60-90s)
- Cut generation (CPU): ~$0.02/song (~30s)
