import type { Env } from "../config";

const API_URL = "https://discord.com/api/v10";

export async function discordRequest(env: Env, path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_URL + path}`, {
    ...init,
    headers: {
      "Authorization": `Bot ${env.DISCORD_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "DiscordBot (sukibot, 1.0.0)"
    }
  });

  if (!response.ok) {
    throw new Error(`Discord request failed: ${init.method ?? "GET"} ${path} ${response.status} ${await response.text()}`);
  }

  return response;
}