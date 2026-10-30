import dotenv from 'dotenv';

dotenv.config({ path: '.env.local', quiet: true });

const required = [
  'DISCORD_TOKEN',
  'GUILD_ID',
  'LIVE_CHANNEL_ID',
  'TWITCH_CLIENT_ID',
  'TWITCH_CLIENT_SECRET',
  'TWITCH_LOGIN',
  'TWITCH_SUB_ROLE_ID',
  'SUBSCRIBER_ROLE_ID',
] as const;

const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const env = process.env as Record<(typeof required)[number], string>;

export const config = {
  discordToken: env.DISCORD_TOKEN,
  guildId: env.GUILD_ID,
  liveChannelId: env.LIVE_CHANNEL_ID,
  twitchClientId: env.TWITCH_CLIENT_ID,
  twitchClientSecret: env.TWITCH_CLIENT_SECRET,
  twitchLogin: env.TWITCH_LOGIN,
  twitchSubRoleId: env.TWITCH_SUB_ROLE_ID,
  subscriberRoleId: env.SUBSCRIBER_ROLE_ID,
};
