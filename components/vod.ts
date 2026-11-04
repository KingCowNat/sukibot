import type { Env } from "../config";
import { getStreamVod, type TwitchStream } from "./twitch";

const VOD_STREAM_KEY = "vodStream";
// Wait after the stream goes offline in case it reconnects, and so Twitch finishes the VOD
const UPLOAD_DELAY_MS = 5 * 60 * 1000;

interface VodStream {
  streamId: string;
  userId: string;
  endedAt?: number;
}

// Start the GitHub Actions workflow that downloads the VOD and uploads it to YouTube
async function uploadVod(env: Env, tracked: VodStream) {
  const vod = await getStreamVod(env, tracked.userId, tracked.streamId);
  if (!vod) {
    console.error(`No VOD found for stream ${tracked.streamId}`);
    return;
  }

  const response = await fetch(`https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "sukibot"
    },
    body: JSON.stringify({
      event_type: "twitch-vod",
      client_payload: {
        vod_id: vod.id,
        title: vod.title,
        created_at: vod.created_at
      }
    })
  });

  if (!response.ok) {
    throw new Error(`GitHub dispatch failed: ${response.status} ${await response.text()}`);
  }

  console.log(`Dispatched YouTube upload for VOD ${vod.id}`);
}

export async function trackVods(env: Env, stream: TwitchStream | null) {
  const tracked = await env.STATE.get<VodStream>(VOD_STREAM_KEY, {
    type: "json",
    cacheTtl: 30
  });

  if (stream) {
    if (tracked?.streamId === stream.id && !tracked.endedAt) return;

    // A different stream started before the last one was uploaded
    if (tracked && tracked.streamId !== stream.id) {
      await uploadVod(env, tracked);
    }

    // Also clears endedAt if the same stream came back after a disconnect
    await env.STATE.put(VOD_STREAM_KEY, JSON.stringify({
      streamId: stream.id,
      userId: stream.user_id
    } satisfies VodStream));
    return;
  }

  if (!tracked) return;

  if (!tracked.endedAt) {
    await env.STATE.put(VOD_STREAM_KEY, JSON.stringify({ ...tracked, endedAt: Date.now() }));
    return;
  }

  if (Date.now() - tracked.endedAt < UPLOAD_DELAY_MS) return;

  await uploadVod(env, tracked);
  await env.STATE.delete(VOD_STREAM_KEY);
}
