# Privacy Policy

_Last updated: November 4, 2026_

sukibot is a personal bot for the 55pectrum Twitch channel. It announces when the channel goes live on Discord and copies the channel's past broadcasts (VODs) to the channel owner's YouTube account. This policy explains what data it uses and why.

## Who uses it

sukibot is only used by its owner. It doesn't offer sign-in to anyone else, and it doesn't collect information about Discord members, Twitch viewers or YouTube viewers.

## Data it uses

- **Twitch:** public information about the 55pectrum channel from the Twitch API: whether the channel is live, the stream title and game, and its past broadcasts. It downloads those past broadcasts so they can be uploaded to YouTube.
- **Discord:** it posts live announcements in the owner's Discord server. It doesn't read or store messages or member information.
- **YouTube (YouTube API Services):** with the owner's permission, it uses the `youtube.upload` scope to upload videos to the owner's YouTube channel. It doesn't read, change or delete any other data on the YouTube account.

## How data is stored

- The OAuth credentials that let the bot upload to YouTube are kept as encrypted GitHub Actions secrets. Only the upload workflow can access them.
- A downloaded VOD exists only on a temporary GitHub Actions runner while it's being uploaded, and is deleted when the job ends.
- The bot keeps a small amount of state in Cloudflare KV: the ID of the current or most recent stream. This is how it knows which VOD to upload.
- No data is sold or shared with third parties beyond the services listed above.

## Third-party services

sukibot uses YouTube API Services. By using it, you agree to be bound by the [YouTube Terms of Service](https://www.youtube.com/t/terms). How Google handles data is described in the [Google Privacy Policy](https://policies.google.com/privacy).

sukibot also relies on [Twitch](https://www.twitch.tv/p/legal/privacy-notice/), [Discord](https://discord.com/privacy), [GitHub](https://docs.github.com/site-policy/privacy-policies/github-general-privacy-statement) and [Cloudflare](https://www.cloudflare.com/privacypolicy/), each under its own privacy policy.

## Revoking access

You can remove sukibot's access to your YouTube account at any time in your [Google Account security settings](https://myaccount.google.com/permissions). You can also delete the stored credentials by removing the `YT_*` secrets from the GitHub repository.

## Contact

For questions about this policy, open an issue at [github.com/KingCowNat/sukibot](https://github.com/KingCowNat/sukibot/issues).
