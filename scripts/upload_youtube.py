"""Upload a downloaded Twitch VOD to YouTube. Run by .github/workflows/vod-upload.yml."""
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

CHANNEL_NAME = "55pectrum"
PRIVACY_STATUS = "public"
GAMING_CATEGORY_ID = "20"
# Games played for less than this are left out, e.g. the previous stream's game before it was changed
MIN_GAME_SECONDS = 10 * 60
MAX_TITLE_LENGTH = 100


def read_vod_info(path):
    info_path = next(Path(path).parent.glob("*.info.json"), None)
    if not info_path:
        return {}
    return json.loads(info_path.read_text(encoding="utf-8"))


def get_games(info, fallback_game):
    """Return [(start_seconds, game)] for each game played, from the VOD's chapters."""
    chapters = info.get("chapters") or []
    duration = info.get("duration") or 0

    segments = []
    for i, chapter in enumerate(chapters):
        start = chapter.get("start_time") or 0
        end = chapters[i + 1].get("start_time") if i + 1 < len(chapters) else chapter.get("end_time") or duration
        segments.append((start, end - start, chapter.get("title")))

    segments = [segment for segment in segments if segment[2]]
    long_segments = [segment for segment in segments if segment[1] >= MIN_GAME_SECONDS]
    if not long_segments and segments:
        long_segments = [max(segments, key=lambda segment: segment[1])]

    # Short segments are absorbed by the next game, and the first game starts at 0:00
    games = []
    for start, _, game in long_segments:
        if games and games[-1][1] == game:
            continue
        games.append((0 if not games else start, game))

    if not games and fallback_game:
        games = [(0, fallback_game)]
    return games


def format_date(created_at):
    date = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    return f"{date.day} {date:%b %Y}"


def format_timestamp(seconds):
    hours, remainder = divmod(int(seconds), 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{hours}:{minutes:02}:{seconds:02}" if hours else f"{minutes}:{seconds:02}"


def build_title(games, stream_title, created_at):
    """Single game: "Game | Stream title | Channel VOD (3 Nov 2026)"
    Multiple games: "Game + Game | Channel VOD (3 Nov 2026)", since the stream title changes between games"""
    suffix = f"{CHANNEL_NAME} VOD"
    if created_at:
        suffix += f" ({format_date(created_at)})"

    # Games returned to later in the stream are only listed once
    names = list(dict.fromkeys(game for _, game in games))
    room = MAX_TITLE_LENGTH - len(suffix) - len(" | ")

    if len(names) <= 1:
        parts = names + ([stream_title.strip()] if stream_title else [])
        title = " | ".join(parts)
        # Drop the stream title if it doesn't fit
        if len(title) > room and names:
            title = names[0]
    else:
        # Leave out the last games if they don't fit, e.g. "A + B + 2 more"
        title = " + ".join(names)
        for count in range(len(names) - 1, 0, -1):
            if len(title) <= room:
                break
            title = " + ".join(names[:count]) + f" + {len(names) - count} more"

    if not title:
        return suffix
    if len(title) > room:
        title = title[:room - 1].rstrip() + "…"
    return f"{title} | {suffix}"


def build_description(games):
    lines = []
    if games:
        lines.append("Games played:")
        lines += [f"{format_timestamp(start)} {game}" for start, game in games]
        lines.append("")
    # Link the channel rather than the VOD, since Twitch deletes past broadcasts
    lines.append(f"Originally streamed live on Twitch: https://www.twitch.tv/{CHANNEL_NAME}")
    lines.append(f"TikTok: https://www.tiktok.com/@{CHANNEL_NAME}")
    return "\n".join(lines)


def clean(text):
    # YouTube titles and descriptions can't contain angle brackets
    return text.replace("<", "").replace(">", "")


def main():
    path = sys.argv[1]
    info = read_vod_info(path)

    games = get_games(info, os.environ.get("VOD_GAME"))
    stream_title = os.environ.get("VOD_TITLE") or info.get("title")
    created_at = os.environ.get("VOD_CREATED_AT")
    if not created_at and info.get("timestamp"):
        created_at = datetime.fromtimestamp(info["timestamp"], timezone.utc).isoformat()

    title = os.environ.get("YOUTUBE_TITLE") or build_title(games, stream_title, created_at)
    description = build_description(games)
    print(f"Title: {title}\n{description}", flush=True)

    credentials = Credentials(
        None,
        refresh_token=os.environ["YT_REFRESH_TOKEN"],
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ["YT_CLIENT_ID"],
        client_secret=os.environ["YT_CLIENT_SECRET"],
        scopes=["https://www.googleapis.com/auth/youtube.upload"],
    )
    youtube = build("youtube", "v3", credentials=credentials)

    body = {
        "snippet": {
            "title": clean(title)[:MAX_TITLE_LENGTH],
            "description": clean(description),
            "categoryId": GAMING_CATEGORY_ID,
        },
        "status": {
            "privacyStatus": PRIVACY_STATUS,
            "selfDeclaredMadeForKids": False,
        },
    }
    media = MediaFileUpload(path, mimetype="video/mp4", chunksize=64 * 1024 * 1024, resumable=True)
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    while response is None:
        status, response = request.next_chunk(num_retries=5)
        if status:
            print(f"Uploaded {status.progress():.0%}", flush=True)

    print(f"Uploaded https://youtu.be/{response['id']}")


if __name__ == "__main__":
    main()
