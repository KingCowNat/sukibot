import type { Env } from "./config";
import { startLiveAnnouncements } from "./components/announcement";
import { getStream } from "./components/twitch";
import { trackVods } from "./components/vod";

export default {
  async scheduled(controller, env) {
    const stream = await getStream(env);
    if (stream) {
      await startLiveAnnouncements(env, stream);
    }
    await trackVods(env, stream);
  }
} satisfies ExportedHandler<Env>;
