import type { Env } from "./config";
import { startLiveAnnouncements } from "./components/announcement";
import { syncSubscriberRoles } from "./components/subscriber";

const ROLE_SYNC_CRON = "*/15 * * * *";

export default {
  async scheduled(controller, env) {
    if (controller.cron === ROLE_SYNC_CRON) {
      await syncSubscriberRoles(env);
    } else {
      await startLiveAnnouncements(env);
    }
  }
} satisfies ExportedHandler<Env>;