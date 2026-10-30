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
];

const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

export const config = {
  discordToken: process.env.DISCORD_TOKEN,
  guildId: process.env.GUILD_ID,
  liveChannelId: process.env.LIVE_CHANNEL_ID,
  twitchClientId: process.env.TWITCH_CLIENT_ID,
  twitchClientSecret: process.env.TWITCH_CLIENT_SECRET,
  twitchLogin: process.env.TWITCH_LOGIN,
  twitchSubRoleId: process.env.TWITCH_SUB_ROLE_ID,
  subscriberRoleId: process.env.SUBSCRIBER_ROLE_ID,
};
