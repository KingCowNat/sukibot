import { config } from "../config.js";

export interface TwitchStream {
  id: string;
  user_login: string;
  user_name: string;
  title: string;
  game_name: string;
  thumbnail_url: string;
}

interface OAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// Get Twitch OAuth2 token needed for API access
async function getAccessToken() {
  const url = "https://id.twitch.tv/oauth2/token";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `client_id=${config.twitchClientId}&client_secret=${config.twitchClientSecret}&grant_type=client_credentials` 
    });

    if (!response.ok) {
      throw new Error(`Twitch Auth failed: ${response.status} ${await response.text()}`);
    }

    const result = (await response.json()) as OAuthResponse;
    return result.access_token;
  } catch (error) {
    console.error(error);
  }
}

export async function getStream() {
  const url = `https://api.twitch.tv/helix/streams?user_login=${config.twitchLogin}`;
  const accessToken = await getAccessToken();

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
       "Authorization": "Bearer " + accessToken,
        "Client-Id": config.twitchClientId
      }
    });
    if (!response.ok) {
      throw new Error(`Twitch streams request failed: ${response.status} ${await response.text()}`);
    }

    const { data } = (await response.json()) as { data: TwitchStream[] };
    return data[0] ?? null;
  } catch (error) {
    console.error(error);
  }
}