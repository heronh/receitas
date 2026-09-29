#!/usr/bin/env python3
"""Coleta a playlist pública de receitas do YouTube sem baixar os vídeos.

Gera:
- data/playlist.json: índice normalizado de vídeos e metadados disponíveis
- data/youtube/<video_id>.*.vtt: legendas manuais/automáticas quando disponíveis

Requer: yt-dlp no PATH.
"""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

PLAYLIST_URL = "https://www.youtube.com/playlist?list=PLQMMYgYzynIQ"
OUT_DIR = Path("data")
SUB_DIR = OUT_DIR / "youtube"
PLAYLIST_JSON = OUT_DIR / "playlist.json"


def run(args: list[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, text=True, capture_output=True, check=check)


def yt_json(url: str, flat: bool = False) -> dict:
    cmd = ["yt-dlp", "--skip-download", "--no-warnings", "--dump-single-json"]
    if flat:
        cmd.append("--flat-playlist")
    cmd.append(url)
    proc = run(cmd)
    return json.loads(proc.stdout)


def clean_value(value):
    if value in (None, "", [], {}):
        return None
    return value


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    SUB_DIR.mkdir(parents=True, exist_ok=True)

    playlist = yt_json(PLAYLIST_URL, flat=True)
    entries = playlist.get("entries") or []
    videos: list[dict] = []

    for position, entry in enumerate(entries, start=1):
        video_id = entry.get("id")
        if not video_id:
            continue

        url = f"https://www.youtube.com/watch?v={video_id}"
        print(f"[{position}/{len(entries)}] {video_id} - {entry.get('title', '')}", flush=True)

        details = {}
        error = None
        try:
            details = yt_json(url)
        except Exception as exc:
            error = str(exc)

        item = {
            "position": position,
            "id": video_id,
            "title": clean_value(details.get("title") or entry.get("title")),
            "url": url,
            "description": clean_value(details.get("description")),
            "channel": clean_value(details.get("channel") or entry.get("channel")),
            "channel_id": clean_value(details.get("channel_id") or entry.get("channel_id")),
            "duration": clean_value(details.get("duration") or entry.get("duration")),
            "upload_date": clean_value(details.get("upload_date")),
            "thumbnail": clean_value(details.get("thumbnail") or entry.get("thumbnail")),
            "availability": clean_value(details.get("availability") or entry.get("availability")),
        }
        if error:
            item["metadata_error"] = error

        videos.append({k: v for k, v in item.items() if v is not None})

        # Tenta obter legendas manuais/automáticas, sem falhar a coleta se não houver.
        sub_cmd = [
            "yt-dlp",
            "--skip-download",
            "--no-warnings",
            "--write-subs",
            "--write-auto-subs",
            "--sub-langs",
            "pt.*,en.*",
            "--sub-format",
            "vtt",
            "-o",
            str(SUB_DIR / "%(id)s.%(language)s.%(ext)s"),
            url,
        ]
        run(sub_cmd, check=False)

    payload = {
        "playlist": {
            "id": playlist.get("id") or "PLQMMYgYzynIQ",
            "title": playlist.get("title") or "Receitas",
            "url": PLAYLIST_URL,
            "channel": clean_value(playlist.get("channel")),
            "video_count": len(videos),
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "videos": videos,
    }

    PLAYLIST_JSON.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Gerado {PLAYLIST_JSON} com {len(videos)} vídeos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
