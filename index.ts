import { Client, Events, GatewayIntentBits } from "discord.js";
import { config } from "./config.js";
import { startLiveAnnouncements } from "./components/announcement.js";
import { startSubscriberRoleSync } from "./components/subscriber.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  try {
    await Promise.all([startLiveAnnouncements(readyClient), startSubscriberRoleSync(readyClient)]);
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
});

client.login(config.discordToken);