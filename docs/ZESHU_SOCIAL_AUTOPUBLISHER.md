# Zeshu Social AutoPublisher (Buffer Free)

Status: **installed on an isolated GitHub branch; NOT ACTIVE and NOT published**.

This code is intentionally NOT on `main`, is NOT in the Zeshu website, and does not touch Cloudflare, DNS, Supabase production, payments, or customer traffic.

## One-time account setup

1. Buffer must show the three **correct** connected channels:
   - Instagram: `zeshu.in`
   - Facebook Page: `Zeshu`
   - YouTube channel: `Zeshu` / `@zeshuin`
2. Go to https://publish.buffer.com/settings/api and create a **personal API key** with account/channels read and posts create/read permissions. Use a long enough expiry (Buffer currently allows up to one year). **Do not paste the key in ChatGPT, issues, screenshots, commits or workflows.**
3. Add the value as an Actions repository secret called `BUFFER_API_KEY` here: https://github.com/haseeb0127/zeshu-web/settings/secrets/actions
4. Connect all three to the same Buffer organization. If the account names don't match uniquely, the script refuses to publish rather than guessing.
5. Verify at https://publish.buffer.com/ that each channel is set for automatic publishing (not a mobile reminder). Buffer may still require platform-specific authorization/content restrictions.

## One-upload workflow

1. Put one approved 9:16 MP4 on a **durable, PUBLIC HTTPS media URL**. Buffer does NOT support direct binary uploads via its API. Public access must persist until after the scheduled publication. Do not use an expiring Google Drive/share link.
2. On branch `automation/buffer-social-publisher-20261027`, add `social-queue/YOUR-UNIQUE-ID.json` based on `docs/ZESHU_SOCIAL_EXAMPLE.json`.
3. Commit the manifest file on this *same branch*. A push to `social-queue/*.json` automatically runs `.github/workflows/zeshu-social-autopublish.yml`.
4. If `mode=addToQueue`, Buffer schedules each post at that channel's next available slot. Use `shareNow` only when the owner explicitly wants to publish immediately.
5. The worker writes `social-receipts/ID-platform.json` **before** attempting the Buffer API request. This prevents duplicate submissions if a runner restarts.
6. Inspect receipts and the Buffer dashboard. Receipt `buffer_accepted` means Buffer accepted a post, **not** that Instagram/Facebook/YouTube successfully published it. Verify platform URL/ID separately.

This setup allows one source file and one approved manifest to fan out to all three channels; **it does not automatically read ChatGPT uploads or videos on your phone**. A dedicated private Zeshu admin upload UI can be added later, after staging QA, to hide the manifest work and provide stable media hosting.

## Limits and safety

- Buffer Free currently: three channels, ten queued posts per channel, one personal API key and 3,000 API calls per 30 days. Subscription/plan eligibility should be checked in Buffer.
- Video media is accessed by public URL; do not host private customer information or credentials.
- The branch alone doesn't publish; missing `BUFFER_API_KEY` causes the job to fail safely before any API call.
- If an API call is ambiguous or fails, a receipt stays `needs_manual_review`; never delete/retry without first checking Buffer and the platform for an existing post.
- The workflow doesn't promote the Zeshu production website and doesn't alter the existing CI/CD deployment workflow.
- Instagram publishes Reels, Facebook posts as Reels, YouTube treats eligible short vertical videos as Shorts. Each platform may reject content.
- For AI cartoons, `aiAssisted` and per-service AI disclosure flags are included.
- Avoid copyrighted audio and use original family-comedy content; hashtags do not guarantee reach or virality.

## Testing locally without API credentials

```bash
node --check scripts/zeshu-buffer-social.mjs
node scripts/zeshu-buffer-social.mjs --validate docs/ZESHU_SOCIAL_EXAMPLE.json
```

Validation never publishes anything. Keep real production manifests out of the queue until you're ready.

Official docs:
- https://developers.buffer.com/guides/getting-started.html
- https://developers.buffer.com/examples/create-video-post.html
- https://developers.buffer.com/types/YoutubePostMetadataInput.html
- https://developers.buffer.com/guides/hosting-media.html
