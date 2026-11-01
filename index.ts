import type { Env } from "./config";
import { startLiveAnnouncements } from "./components/announcement";

export default {
  async scheduled(controller, env) {
    await startLiveAnnouncements(env);
  }
} satisfies ExportedHandler<Env>;