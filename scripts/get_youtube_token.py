"""One-time helper: sign in to the YouTube channel and print a refresh token for the YT_REFRESH_TOKEN secret.

pip install google-auth-oauthlib
YT_CLIENT_ID=... YT_CLIENT_SECRET=... python scripts/get_youtube_token.py
"""
import os

from google_auth_oauthlib.flow import InstalledAppFlow

flow = InstalledAppFlow.from_client_config(
    {
        "installed": {
            "client_id": os.environ["YT_CLIENT_ID"],
            "client_secret": os.environ["YT_CLIENT_SECRET"],
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    },
    scopes=["https://www.googleapis.com/auth/youtube.upload"],
)
credentials = flow.run_local_server(port=0, access_type="offline", prompt="consent")
print(credentials.refresh_token)
