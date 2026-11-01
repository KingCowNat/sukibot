import type { Env } from "../config";
import { discordRequest } from "./discord";
import { getStream, type TwitchStream } from "./twitch";

const LAST_STREAM_KEY = "lastStreamId";

function buildLiveMessage(stream: TwitchStream) {
  const url = `https://twitch.tv/${stream.user_login}`;
  const thumbnail = stream.thumbnail_url.replace("{width}", "1280").replace("{height}", "720");

  const embed = {
    color: 0x9146ff,
    title: stream.title || `${stream.user_name} is streaming`,
    url,
    image: {
      url: `${thumbnail}?stream=${stream.id}` // Stream ID forces the thumbnail to be from the current stream
    },
    ...(stream.game_name && {
      fields: [{
        name: "Playing",
        value: stream.game_name
      }]
    })
  };

  return {
    content: `@everyone **${stream.user_name}** is live! ${url}`,
    embeds: [embed]
  };
}

export async function startLiveAnnouncements(env: Env) {
  const stream = await getStream(env);
  if (!stream) return;

  const lastStreamId = await env.STATE.get(LAST_STREAM_KEY, {
    cacheTtl: 30
  });
  if (stream.id === lastStreamId) return;

  await discordRequest(env, `/channels/${env.LIVE_CHANNEL_ID}/messages`, {
    method: "POST",
    body: JSON.stringify(buildLiveMessage(stream))
  });

  await env.STATE.put(LAST_STREAM_KEY, stream.id);
  console.log(`Announced stream ${stream.id}`);
}