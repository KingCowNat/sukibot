import { readFile, writeFile } from "node:fs/promises";
import { EmbedBuilder } from "discord.js";
import { config } from "../config.js";
import { getStream } from "./twitch.js";

const POLL_INTERVAL_MS = 60_000;
const STATE_FILE = new URL("../state.json", import.meta.url);

async function loadLastStreamId() {
  try {
    return JSON.parse(await readFile(STATE_FILE, "utf8")).lastStreamId;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function buildLiveMessage(stream) {
  const url = `https://twitch.tv/${stream.user_login}`;
  const thumbnail = stream.thumbnail_url.replace("{width}", "1280").replace("{height}", "720");

  const embed = new EmbedBuilder()
    .setColor(0x9146ff)
    .setTitle(stream.title || `${stream.user_name} is streaming`)
    .setURL(url)
    .setImage(`${thumbnail}?stream=${stream.id}`); // Stream ID forces the thumbnail to be from the current stream

  if (stream.game_name) {
    embed.addFields({
      name: "Playing",
      value: stream.game_name
    });
  }

  return {
    content: `**${stream.user_name}** is live! ${url}`,
    embeds: [embed]
  };
}

export async function startLiveAnnouncements(client) {
  const channel = await client.channels.fetch(config.liveChannelId);
  let lastStreamId = await loadLastStreamId();

  const check = async () => {
    try {
      const stream = await getStream();
      if (!stream || stream.id === lastStreamId) return;

      await channel.send(buildLiveMessage(stream));
      lastStreamId = stream.id;
      await writeFile(STATE_FILE, JSON.stringify({ lastStreamId }));
      console.log(`Announced stream ${stream.id}`);
    } catch (error) {
      console.error("Live check failed:", error);
    }
  };

  await check();
  setInterval(check, POLL_INTERVAL_MS);
}