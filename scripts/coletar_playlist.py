#!/usr/bin/env python3
"""Coleta uma playlist pública do YouTube sem baixar os vídeos.

Saídas:
- data/playlist.json: inventário normalizado da playlist
- data/coleta-relatorio.json: tentativas, versão do yt-dlp e erros
- data/youtube/<video_id>.*.vtt: legendas disponíveis (pt/en)

A coleta é conservadora: se não conseguir enumerar a playlist, NÃO cria um
playlist.json vazio que possa ser confundido com sucesso.
"""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

PLAYLIST_ID = "PLQMMYgYzynIQ"
PLAYLIST_URL = f"https://www.youtube.com/playlist?list={PLAYLIST_ID}"
OUT_DIR = Path("data")
SUB_DIR = OUT_DIR / "youtube"
PLAYLIST_JSON = OUT_DIR / "playlist.json"
REPORT_JSON = OUT_DIR / "coleta-relatorio.json"


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def run(args: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(args, text=True, capture_output=True)


def compact_error(proc: subprocess.CompletedProcess[str]) -> str:
    text = (proc.stderr or proc.stdout or "").strip()
    return text[-5000:]


def try_json(label: str, args: list[str], attempts: list[dict]) -> dict | None:
    proc = run(args)
    attempt = {
        "label": label,
        "command": args,
        "returncode": proc.returncode,
    }
    if proc.returncode == 0:
        try:
            payload = json.loads(proc.stdout)
            attempt["ok"] = True
            attempts.append(attempt)
            return payload
        except json.JSONDecodeError as exc:
            attempt["ok"] = False
            attempt["error"] = f"JSON inválido: {exc}"
    else:
        attempt["ok"] = False
        attempt["error"] = compact_error(proc)
    attempts.append(attempt)
    return None


def collect_playlist(attempts: list[dict]) -> dict | None:
    base = ["yt-dlp", "--skip-download", "--no-warnings", "--flat-playlist", "--dump-single-json"]

    strategies = [
        ("playlist-default", base + [PLAYLIST_URL]),
        (
            "playlist-sem-authcheck",
            base
            + ["--extractor-args", "youtubetab:skip=authcheck"]
            + [PLAYLIST_URL],
        ),
    ]

    for label, cmd in strategies:
        data = try_json(label, cmd, attempts)
        if data and (data.get("entries") or []):
            return data
    return None


def collect_video(url: str, attempts: list[dict], video_id: str) -> dict:
    base = ["yt-dlp", "--skip-download", "--no-warnings", "--dump-single-json"]
    strategies = [
        (
            "android",
            base
            + ["--extractor-args", "youtube:player_client=android"]
            + [url],
        ),
        (
            "web-embedded",
            base
            + ["--extractor-args", "youtube:player_client=default,web_embedded"]
            + [url],
        ),
        ("default", base + [url]),
    ]

    local_attempts: list[dict] = []
    for label, cmd in strategies:
        data = try_json(f"video-{video_id}-{label}", cmd, local_attempts)
        if data:
            attempts.extend(local_attempts)
            return data
    attempts.extend(local_attempts)
    return {}


def clean(value):
    return None if value in (None, "", [], {}) else value


def write_report(report: dict) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_JSON.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    SUB_DIR.mkdir(parents=True, exist_ok=True)

    version = run(["yt-dlp", "--version"])
    attempts: list[dict] = []
    report = {
        "started_at": now(),
        "playlist_id": PLAYLIST_ID,
        "playlist_url": PLAYLIST_URL,
        "yt_dlp_version": (version.stdout or "").strip() or None,
        "status": "running",
        "attempts": attempts,
    }
    write_report(report)

    playlist = collect_playlist(attempts)
    if not playlist:
        report["status"] = "failed"
        report["finished_at"] = now()
        report["error"] = "Não foi possível enumerar nenhum vídeo da playlist."
        write_report(report)
        print(report["error"], file=sys.stderr)
        return 2

    entries = playlist.get("entries") or []
    videos: list[dict] = []

    for position, entry in enumerate(entries, start=1):
        video_id = entry.get("id")
        if not video_id:
            continue

        url = f"https://www.youtube.com/watch?v={video_id}"
        print(f"[{position}/{len(entries)}] {video_id} - {entry.get('title', '')}", flush=True)
        details = collect_video(url, attempts, video_id)

        item = {
            "position": position,
            "id": video_id,
            "title": clean(details.get("title") or entry.get("title")),
            "url": url,
            "description": clean(details.get("description")),
            "channel": clean(details.get("channel") or entry.get("channel")),
            "channel_id": clean(details.get("channel_id") or entry.get("channel_id")),
            "duration": clean(details.get("duration") or entry.get("duration")),
            "upload_date": clean(details.get("upload_date")),
            "thumbnail": clean(details.get("thumbnail") or entry.get("thumbnail")),
            "availability": clean(details.get("availability") or entry.get("availability")),
        }
        videos.append({k: v for k, v in item.items() if v is not None})

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
            "--extractor-args",
            "youtube:player_client=android",
            "-o",
            str(SUB_DIR / "%(id)s.%(language)s.%(ext)s"),
            url,
        ]
        run(sub_cmd)

    payload = {
        "playlist": {
            "id": playlist.get("id") or PLAYLIST_ID,
            "title": playlist.get("title") or "Receitas",
            "url": PLAYLIST_URL,
            "channel": clean(playlist.get("channel")),
            "video_count": len(videos),
        },
        "generated_at": now(),
        "videos": videos,
    }

    PLAYLIST_JSON.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    report["status"] = "success"
    report["finished_at"] = now()
    report["video_count"] = len(videos)
    write_report(report)

    print(f"Gerado {PLAYLIST_JSON} com {len(videos)} vídeos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
