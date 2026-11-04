"""Upload a downloaded Twitch VOD to YouTube. Run by .github/workflows/vod-upload.yml."""
import os
import sys
from datetime import datetime

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

PRIVACY_STATUS = "public"
GAMING_CATEGORY_ID = "20"


def build_title(title, created_at):
    # YouTube titles can't contain angle brackets and are capped at 100 characters
    title = (title or "Twitch VOD").replace("<", "").replace(">", "").strip()
    if created_at:
        date = datetime.fromisoformat(created_at.replace("Z", "+00:00")).strftime("%Y-%m-%d")
        suffix = f" ({date})"
        return title[:100 - len(suffix)].rstrip() + suffix
    return title[:100]


def main():
    path = sys.argv[1]
    vod_id = os.environ["VOD_ID"]

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
            "title": build_title(os.environ.get("VOD_TITLE"), os.environ.get("VOD_CREATED_AT")),
            "description": f"Originally streamed on Twitch: https://www.twitch.tv/videos/{vod_id}",
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
