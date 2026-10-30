import type { Env } from "../config";
import { discordRequest } from "./discord";

const PAGE_SIZE = 1000;
const MAX_ROLE_CHANGES = 45; // Keeps each run under the Free plan limit of 50 subrequests

interface GuildMember {
  user: {
    id: string;
    username: string;
  };
  roles: string[];
}

export async function syncSubscriberRoles(env: Env) {
  let after = "0";
  let roleChanges = 0;

  while (true) {
    const response = await discordRequest(env, `/guilds/${env.GUILD_ID}/members?limit=${PAGE_SIZE}&after=${after}`);
    const members = (await response.json()) as GuildMember[];

    for (const member of members) {
      const isSubscribed = member.roles.includes(env.TWITCH_SUB_ROLE_ID);
      const hasRole = member.roles.includes(env.SUBSCRIBER_ROLE_ID);

      if (isSubscribed === hasRole) continue;

      if (roleChanges === MAX_ROLE_CHANGES) {
        console.log("Role change limit reached, continuing next run");
        return
      }

      roleChanges++;

      try {
        await discordRequest(env, `/guilds/${env.GUILD_ID}/members/${member.user.id}/roles/${env.SUBSCRIBER_ROLE_ID}`, {
          method: isSubscribed ? "PUT" : "DELETE"
        });

        console.log(`${isSubscribed ? "Added" : "Removed"} subscriber role: ${member.user.username}`);
      } catch (error) {
        console.error(`Could not update subscriber role for ${member.user.username}:`, error);
      }
    }
    
    const lastMember = members.at(-1);
    if (!lastMember || members.length < PAGE_SIZE) return;
    after = lastMember.user.id;
  }
}
