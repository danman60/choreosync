"""
ChoreoSync Modal Backend
========================
Two main functions:
  1. analyze_song — runs All-In-One to detect sections, beats, BPM
  2. generate_cut — extracts sections, crossfades, normalizes, renders final audio
"""

import modal
import os
import json

# ---------------------------------------------------------------------------
# Modal App + Image
# ---------------------------------------------------------------------------

app = modal.App("choreosync")

analysis_image = (
    modal.Image.debian_slim(python_version="3.11")
    .apt_install("ffmpeg", "rubberband-cli")
    .pip_install(
        "allin1",
        "librosa",
        "numpy",
        "soundfile",
        "pydub",
        "pyrubberband",
        "supabase",
        "httpx",
    )
)

# ---------------------------------------------------------------------------
# Shared: Supabase helpers
# ---------------------------------------------------------------------------


def get_supabase_client():
    from supabase import create_client

    url = os.environ["SUPABASE_URL"]
    key = os.environ["SUPABASE_SERVICE_KEY"]
    return create_client(url, key)


def download_from_storage(supabase, storage_path: str, local_path: str):
    """Download a file from Supabase Storage to a local path."""
    data = supabase.storage.from_("choreosync").download(storage_path)
    with open(local_path, "wb") as f:
        f.write(data)


def upload_to_storage(supabase, local_path: str, storage_path: str):
    """Upload a local file to Supabase Storage."""
    with open(local_path, "rb") as f:
        supabase.storage.from_("choreosync").upload(
            storage_path, f, {"content-type": "audio/mpeg"}
        )


def notify_webhook(song_id: str, event: str, payload: dict):
    """POST to the Next.js webhook endpoint."""
    import httpx

    webhook_url = os.environ.get("WEBHOOK_URL", "")
    if not webhook_url:
        return
    secret = os.environ.get("WEBHOOK_SECRET", "")
    httpx.post(
        webhook_url,
        json={"song_id": song_id, "event": event, "payload": payload},
        headers={"x-webhook-secret": secret},
        timeout=10,
    )


# ---------------------------------------------------------------------------
# Function 1: Analyze Song
# ---------------------------------------------------------------------------


@app.function(
    image=analysis_image,
    gpu="T4",
    timeout=300,
    secrets=[modal.Secret.from_name("choreosync-secrets")],
)
def analyze_song(song_id: str, storage_path: str):
    """
    Download song from Supabase, run All-In-One analysis,
    store results back in the database.
    """
    import allin1
    import librosa
    import numpy as np

    supabase = get_supabase_client()

    # Update status to analyzing
    supabase.table("cs_songs").update({"analysis_status": "analyzing"}).eq(
        "id", song_id
    ).execute()

    try:
        # Download the audio file
        local_path = f"/tmp/{song_id}.audio"
        download_from_storage(supabase, storage_path, local_path)

        # Run All-In-One analysis
        result = allin1.analyze(local_path)

        # Extract sections
        sections = []
        for seg in result.segments:
            sections.append(
                {
                    "label": seg.label,
                    "start": round(float(seg.start), 3),
                    "end": round(float(seg.end), 3),
                }
            )

        # Get beats and downbeats
        beats = [round(float(b), 3) for b in result.beats]
        downbeats = [round(float(b), 3) for b in result.downbeats]
        bpm = round(float(result.bpm), 1)

        # Get duration using librosa
        y, sr = librosa.load(local_path, sr=None, mono=True)
        duration_ms = int(len(y) / sr * 1000)

        analysis = {
            "sections": sections,
            "beats": beats,
            "downbeats": downbeats,
            "bpm": bpm,
        }

        # Update database
        supabase.table("cs_songs").update(
            {
                "analysis": json.dumps(analysis),
                "analysis_status": "ready",
                "bpm": bpm,
                "original_duration_ms": duration_ms,
            }
        ).eq("id", song_id).execute()

        notify_webhook(song_id, "analysis_complete", {"status": "ready"})
        return {"status": "ready", "analysis": analysis}

    except Exception as e:
        supabase.table("cs_songs").update(
            {"analysis_status": "failed"}
        ).eq("id", song_id).execute()
        notify_webhook(song_id, "analysis_complete", {"status": "failed", "error": str(e)})
        raise


# ---------------------------------------------------------------------------
# Function 2: Generate Cut
# ---------------------------------------------------------------------------


@app.function(
    image=analysis_image,
    cpu=2,
    memory=4096,
    timeout=300,
    secrets=[modal.Secret.from_name("choreosync-secrets")],
)
def generate_cut(song_id: str):
    """
    Read song analysis + section tags from DB, generate the competition cut.
    Steps:
      1. Score & select sections to hit target duration
      2. Extract sections with beat-aligned boundaries
      3. Apply equal-power crossfades
      4. Tempo-adjust if needed (±5%)
      5. Normalize to -14 LUFS
      6. Fade in/out
      7. Upload result
    """
    from pydub import AudioSegment
    import pyrubberband as pyrb
    import librosa
    import numpy as np
    import soundfile as sf
    import subprocess

    supabase = get_supabase_client()

    # Update status
    supabase.table("cs_songs").update({"cut_status": "generating"}).eq(
        "id", song_id
    ).execute()

    try:
        # Fetch song data
        song = (
            supabase.table("cs_songs")
            .select("*")
            .eq("id", song_id)
            .single()
            .execute()
            .data
        )

        analysis = json.loads(song["analysis"]) if isinstance(song["analysis"], str) else song["analysis"]
        sections = analysis["sections"]
        downbeats = analysis["downbeats"]
        bpm = analysis["bpm"]
        target_ms = song["target_duration_ms"]
        section_tags = song.get("section_tags") or {}

        if isinstance(section_tags, str):
            section_tags = json.loads(section_tags)

        if not target_ms:
            raise ValueError("No target duration set")

        # Download audio
        local_path = f"/tmp/{song_id}.audio"
        download_from_storage(supabase, song["storage_path"], local_path)

        # Load with pydub for manipulation
        audio = AudioSegment.from_file(local_path)

        # Also load with librosa for energy analysis
        y, sr = librosa.load(local_path, sr=22050, mono=True)

        # -----------------------------------------------------------------
        # Step 1: Score and select sections
        # -----------------------------------------------------------------
        selected = select_sections(sections, section_tags, target_ms, y, sr, bpm)

        # -----------------------------------------------------------------
        # Step 2-3: Extract and crossfade
        # -----------------------------------------------------------------
        crossfade_ms = int((60000 / bpm) * 2)  # 2 beats worth of crossfade
        crossfade_ms = max(300, min(crossfade_ms, 2000))  # clamp 300ms-2s

        result = None
        sections_used = []

        for i, sec in enumerate(selected):
            # Snap to nearest downbeat
            start_ms = snap_to_downbeat(sec["start"] * 1000, downbeats)
            end_ms = snap_to_downbeat(sec["end"] * 1000, downbeats)

            segment = audio[start_ms:end_ms]
            sections_used.append(sec["label"])

            if result is None:
                result = segment
            else:
                # Equal-power crossfade
                result = result.append(segment, crossfade=crossfade_ms)

        if result is None:
            raise ValueError("No sections selected")

        # -----------------------------------------------------------------
        # Step 4: Tempo adjustment (±5% max)
        # -----------------------------------------------------------------
        current_ms = len(result)
        ratio = target_ms / current_ms

        tempo_adjustment_pct = 0.0
        if 0.95 <= ratio <= 1.05 and abs(ratio - 1.0) > 0.005:
            # Stretch/compress using pyrubberband
            tempo_adjustment_pct = round((ratio - 1.0) * 100, 1)

            # Export to wav for pyrubberband
            temp_wav = f"/tmp/{song_id}_pre_stretch.wav"
            result.export(temp_wav, format="wav")

            y_stretch, sr_stretch = librosa.load(temp_wav, sr=None, mono=False)
            if y_stretch.ndim == 1:
                y_stretch = y_stretch[np.newaxis, :]

            channels = []
            for ch in y_stretch:
                stretched = pyrb.time_stretch(ch, sr_stretch, 1.0 / ratio)
                channels.append(stretched)

            y_out = np.array(channels)
            if y_out.ndim == 2 and y_out.shape[0] <= 2:
                y_out = y_out.T  # channels last for soundfile

            temp_stretched = f"/tmp/{song_id}_stretched.wav"
            sf.write(temp_stretched, y_out, sr_stretch)
            result = AudioSegment.from_wav(temp_stretched)
        elif ratio < 0.95 or ratio > 1.05:
            # Too far off — trim or pad with fade
            if current_ms > target_ms:
                # Trim with fade out
                result = result[:target_ms]
                result = result.fade_out(1500)
            # If too short, we just accept it (user should adjust tags)

        # -----------------------------------------------------------------
        # Step 5: Volume normalization (-14 LUFS via ffmpeg loudnorm)
        # -----------------------------------------------------------------
        temp_pre_norm = f"/tmp/{song_id}_pre_norm.wav"
        temp_normalized = f"/tmp/{song_id}_normalized.wav"
        result.export(temp_pre_norm, format="wav")

        subprocess.run(
            [
                "ffmpeg", "-y", "-i", temp_pre_norm,
                "-af", "loudnorm=I=-14:TP=-1:LRA=11",
                temp_normalized,
            ],
            capture_output=True,
            check=True,
        )
        result = AudioSegment.from_wav(temp_normalized)

        # -----------------------------------------------------------------
        # Step 6: Fade in/out
        # -----------------------------------------------------------------
        result = result.fade_in(500).fade_out(1500)

        # -----------------------------------------------------------------
        # Step 7: Export and upload
        # -----------------------------------------------------------------
        final_mp3 = f"/tmp/{song_id}_final.mp3"
        result.export(final_mp3, format="mp3", bitrate="320k")

        cut_storage_path = f"{song['user_id']}/{song['project_id']}/cuts/{song_id}.mp3"
        upload_to_storage(supabase, final_mp3, cut_storage_path)

        cut_metadata = {
            "sections_used": sections_used,
            "crossfade_ms": crossfade_ms,
            "tempo_adjustment_pct": tempo_adjustment_pct,
            "final_duration_ms": len(result),
        }

        supabase.table("cs_songs").update(
            {
                "cut_storage_path": cut_storage_path,
                "cut_duration_ms": len(result),
                "cut_status": "ready",
                "cut_metadata": json.dumps(cut_metadata),
            }
        ).eq("id", song_id).execute()

        notify_webhook(song_id, "cut_complete", {"status": "ready"})
        return {"status": "ready", "metadata": cut_metadata}

    except Exception as e:
        supabase.table("cs_songs").update({"cut_status": "failed"}).eq(
            "id", song_id
        ).execute()
        notify_webhook(song_id, "cut_complete", {"status": "failed", "error": str(e)})
        raise


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

SECTION_TYPE_SCORE = {
    "chorus": 10,
    "bridge": 6,
    "verse": 5,
    "instrumental": 4,
    "intro": 2,
    "outro": 2,
}

TAG_PRIORITY = {
    "MUST": 100,
    "OPEN": 90,
    "FINALE": 90,
    "KEEP": 50,
    "SKIP": -1000,
}


def compute_energy(y, sr, start_sec: float, end_sec: float) -> float:
    """RMS energy of a section."""
    import numpy as np

    start_sample = int(start_sec * sr)
    end_sample = int(end_sec * sr)
    segment = y[start_sample:end_sample]
    if len(segment) == 0:
        return 0.0
    return float(np.sqrt(np.mean(segment ** 2)))


def select_sections(
    sections: list,
    section_tags: dict,
    target_ms: int,
    y,
    sr: int,
    bpm: float,
) -> list:
    """
    Score each section and greedily select to hit target duration.
    Priority: user tags > chorus > high-energy > position.
    """
    target_sec = target_ms / 1000

    # Name sections for tagging (chorus1, chorus2, verse1, etc.)
    label_counts: dict = {}
    named_sections = []
    for sec in sections:
        label = sec["label"]
        label_counts[label] = label_counts.get(label, 0) + 1
        name = f"{label}{label_counts[label]}"
        named_sections.append({**sec, "name": name})

    # Score each section
    scored = []
    for i, sec in enumerate(named_sections):
        tag = section_tags.get(sec["name"], None)
        duration = sec["end"] - sec["start"]
        energy = compute_energy(y, sr, sec["start"], sec["end"])
        base_label = sec["label"]

        score = SECTION_TYPE_SCORE.get(base_label, 3)
        score += energy * 20  # energy bonus

        # Position bonuses
        if i == 0:
            score += 3  # opening gets a small bonus
        if base_label == "chorus":
            # First and last chorus get extra
            chorus_indices = [j for j, s in enumerate(named_sections) if s["label"] == "chorus"]
            if i == chorus_indices[0] or i == chorus_indices[-1]:
                score += 4

        # Tag overrides
        if tag:
            score += TAG_PRIORITY.get(tag, 0)

        scored.append({
            **sec,
            "score": score,
            "duration": duration,
            "tag": tag,
        })

    # Separate by tag type
    must_sections = [s for s in scored if s.get("tag") in ("MUST", "OPEN", "FINALE")]
    open_sections = [s for s in scored if s.get("tag") == "OPEN"]
    finale_sections = [s for s in scored if s.get("tag") == "FINALE"]
    skip_sections = {s["name"] for s in scored if s.get("tag") == "SKIP"}

    # Start with must-have sections
    selected_names = {s["name"] for s in must_sections}
    selected_duration = sum(s["duration"] for s in must_sections)

    # Sort remaining by score (descending), excluding skips and already selected
    candidates = sorted(
        [s for s in scored if s["name"] not in selected_names and s["name"] not in skip_sections],
        key=lambda s: s["score"],
        reverse=True,
    )

    # Greedily add sections until we're near the target
    for candidate in candidates:
        if selected_duration >= target_sec:
            break
        selected_names.add(candidate["name"])
        selected_duration += candidate["duration"]

    # Collect selected sections in original order
    result = [s for s in scored if s["name"] in selected_names]

    # Sort: OPEN first, then by original order, FINALE last
    def sort_key(s):
        if s.get("tag") == "OPEN":
            return (0, 0)
        if s.get("tag") == "FINALE":
            return (2, 0)
        # Original index
        idx = next(j for j, sec in enumerate(named_sections) if sec["name"] == s["name"])
        return (1, idx)

    result.sort(key=sort_key)
    return result


def snap_to_downbeat(ms: float, downbeats: list) -> int:
    """Snap a millisecond position to the nearest downbeat."""
    sec = ms / 1000
    if not downbeats:
        return int(ms)
    closest = min(downbeats, key=lambda db: abs(db - sec))
    return int(closest * 1000)


# ---------------------------------------------------------------------------
# Local entry point for testing
# ---------------------------------------------------------------------------

@app.local_entrypoint()
def main(song_id: str, action: str = "analyze"):
    if action == "analyze":
        # Need storage_path — fetch from DB
        supabase = get_supabase_client()
        song = supabase.table("cs_songs").select("storage_path").eq("id", song_id).single().execute().data
        result = analyze_song.remote(song_id, song["storage_path"])
        print(json.dumps(result, indent=2))
    elif action == "generate":
        result = generate_cut.remote(song_id)
        print(json.dumps(result, indent=2))
