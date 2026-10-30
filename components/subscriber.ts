import { Client, Events, GuildMember } from "discord.js";
import { config } from "../config.js";

async function syncMember(member: GuildMember) {
  const isSubscribed = member.roles.cache.has(config.twitchSubRoleId);
  const hasRole = member.roles.cache.has(config.subscriberRoleId);
  
  if (isSubscribed === hasRole) return;

  try {
    if (isSubscribed) {
      await member.roles.add(config.subscriberRoleId);
    } else {
      await member.roles.remove(config.subscriberRoleId);
    }

    console.log(`${isSubscribed ? "Added" : "Removed"} subscriber role: ${member.user.tag}`);
  } catch (error) {
    console.error(`Could not update subscriber role for ${member.user.tag}:`, error);
  }
}

export async function startSubscriberRoleSync(client: Client<true>) {
  client.on(Events.GuildMemberUpdate, (oldMember, member) => {
    if (member.guild.id === config.guildId) syncMember(member);
  });

  const guild = await client.guilds.fetch(config.guildId);
  const members = await guild.members.fetch();
  for (const member of members.values()) {
    await syncMember(member);
  }
}
