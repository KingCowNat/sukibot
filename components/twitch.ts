import type { Env } from "../config";

export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  title: string;
  game_name: string;
  thumbnail_url: string;
}

export interface TwitchVideo {
  id: string;
  stream_id: string | null;
  title: string;
  created_at: string;
}

interface OAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// Get Twitch OAuth2 token needed for API access
async function getAccessToken(env: Env) {
  const url = "https://id.twitch.tv/oauth2/token";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `client_id=${env.TWITCH_CLIENT_ID}&client_secret=${env.TWITCH_CLIENT_SECRET}&grant_type=client_credentials` 
    });

    if (!response.ok) {
      throw new Error(`Twitch Auth failed: ${response.status} ${await response.text()}`);
    }

    const result = (await response.json()) as OAuthResponse;
    return result.access_token;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function getStream(env: Env) {
  const url = `https://api.twitch.tv/helix/streams?user_login=${env.TWITCH_LOGIN}`;
  const accessToken = await getAccessToken(env);

  if (!accessToken) return null;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
       "Authorization": "Bearer " + accessToken,
        "Client-Id": env.TWITCH_CLIENT_ID
      }
    });
    if (!response.ok) {
      throw new Error(`Twitch streams request failed: ${response.status} ${await response.text()}`);
    }

    const { data } = (await response.json()) as { data: TwitchStream[] };
    return data[0] ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
}

// Find the archived VOD (past broadcast) created by a stream
export async function getStreamVod(env: Env, userId: string, streamId: string) {
  const url = `https://api.twitch.tv/helix/videos?user_id=${userId}&type=archive&first=5`;
  const accessToken = await getAccessToken(env);

  if (!accessToken) return null;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + accessToken,
        "Client-Id": env.TWITCH_CLIENT_ID
      }
    });
    if (!response.ok) {
      throw new Error(`Twitch videos request failed: ${response.status} ${await response.text()}`);
    }

    const { data } = (await response.json()) as { data: TwitchVideo[] };
    return data.find((video) => video.stream_id === streamId) ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
}