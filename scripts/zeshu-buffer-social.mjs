/**
 * Zeshu Buffer AutoPublisher.
 *
 * This worker runs ONLY for explicitly approved JSON files in social-queue/.
 * Never logs credentials. Records a per-channel "submitting" receipt and pushes
 * that receipt BEFORE attempting the external write. If a response is ambiguous
 * (timeout, crash, rejection), it never retries automatically.
 *
 * Usage:
 *   node scripts/zeshu-buffer-social.mjs --validate social-queue/demo.json
 *   node scripts/zeshu-buffer-social.mjs social-queue
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, join, basename } from 'node:path';
import { execFileSync } from 'node:child_process';

const API = 'https://api.buffer.com';
const BRANCH = 'automation/buffer-social-publisher-20261027';
const PLATFORMS = ['instagram', 'facebook', 'youtube'];
const EXPECTED = { instagram: 'zeshu.in', facebook: 'zeshu', youtube: 'zeshu' };
const DRY_RUN = process.argv[2] === '--validate';
const folder = resolve(DRY_RUN ? (process.argv[3] || '') : (process.argv[2] || 'social-queue'));

const assert = (condition, message) => { if (!condition) throw new Error(message); };
const str = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';

function loadManifest(path) {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  const id = str(raw.id, 90);
  assert(/^[A-Za-z0-9_-]{6,90}$/.test(id), `Invalid job id: ${basename(path)}`);
  const url = str(raw.video_url, 2048);
  assert(/^https:\/\/[a-z0-9.-]+(?::443)?\/[^\s"'<>]+\.mp4(?:\?[^\s"'<>]*)?$/i.test(url), `Invalid public MP4 URL for ${id}`);
  const host = new URL(url).hostname.toLowerCase();
  assert(!/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host), 'Public media host required');
  const caption = str(raw.caption, 1900);
  const youtubeTitle = str(raw.youtube_title, 100);
  assert(caption.length > 0 && youtubeTitle.length > 0, 'Caption and YouTube title required');
  const platforms = raw.platforms ?? PLATFORMS;
  assert(Array.isArray(platforms) && platforms.length && platforms.every(x => PLATFORMS.includes(x)) && new Set(platforms).size === platforms.length, 'Invalid platform list');
  const mode = raw.mode || 'addToQueue';
  assert(['addToQueue', 'shareNow'].includes(mode), 'Unsupported publishing mode');
  return { id, url, caption, youtubeTitle, platforms, mode };
}

async function graphql(query, variables = {}) {
  const key = process.env.BUFFER_API_KEY;
  assert(key, 'Missing GitHub Actions secret BUFFER_API_KEY');
  const response = await fetch(API, {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!response.ok) throw new Error(`Buffer HTTP ${response.status}`);
  const result = await response.json();
  if (result.errors?.length) throw new Error(`Buffer GraphQL: ${result.errors.map(e => e.message).join('; ').slice(0, 350)}`);
  return result.data;
}

async function resolveChannelIds() {
  const { account } = await graphql('query { account { organizations { id name } } }');
  assert(account.organizations.length === 1, 'Exactly one Buffer organization expected; refusing to guess');
  const query = 'query($organizationId:OrganizationId!){channels(input:{organizationId:$organizationId}){id name displayName service}}';
  const { channels } = await graphql(query, { organizationId: account.organizations[0].id });
  assert(Array.isArray(channels), 'Buffer channels could not be retrieved');
  return Object.fromEntries(PLATFORMS.map(p => {
    const found = channels.filter(c =>
      String(c.service).toLowerCase() === p &&
      [c.name, c.displayName].some(x => String(x || '').trim().replace(/^@/, '').toLowerCase() === EXPECTED[p]));
    assert(found.length === 1, `Expected exactly one Zeshu ${p} account in Buffer; found ${found.length}`);
    return [p, found[0].id];
  }));
}

function persistReceipt(job, platform, record) {
  mkdirSync('social-receipts', { recursive: true });
  const path = resolve('social-receipts', `${job.id}-${platform}.json`);
  writeFileSync(path, JSON.stringify({ id: job.id, platform, ...record }, null, 2) + '\n');
  if (process.env.GITHUB_ACTIONS !== 'true') return;
  execFileSync('git', ['add', path], { stdio: 'pipe' });
  execFileSync('git', ['-c', 'user.name=github-actions[bot]', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com', 'commit', '-m', `social: receipt ${job.id}/${platform} ${record.status}`], { stdio: 'pipe' });
  execFileSync('git', ['push', 'origin', `HEAD:${BRANCH}`], { stdio: 'pipe' });
}

function networkMeta(platform, job) {
  if (platform === 'instagram') return { instagram: { type: 'reel', shouldShareToFeed: true, isAiGenerated: true } };
  if (platform === 'facebook') return { facebook: { type: 'reel' } };
  return { youtube: { title: job.youtubeTitle, categoryId: '23', privacy: 'public', madeForKids: false, isAiGenerated: true } };
}

async function submit(job, platform, channelId) {
  const receipt = resolve('social-receipts', `${job.id}-${platform}.json`);
  if (existsSync(receipt)) {
    console.log(`SKIP ${job.id}/${platform}: receipt already exists. No duplicate submission.`);
    return;
  }
  // Must be durably saved before external side effect.
  persistReceipt(job, platform, { status: 'submitting', at: new Date().toISOString(), note: 'Check Buffer before any retry.' });
  try {
    const input = {
      text: job.caption,
      channelId,
      schedulingType: 'automatic',
      mode: job.mode,
      aiAssisted: true,
      assets: [{ video: { url: job.url } }],
      metadata: networkMeta(platform, job),
    };
    const query = 'mutation($input:CreatePostInput!){createPost(input:$input){... on PostActionSuccess{post{id status dueAt externalLink}} ... on MutationError{message}}}';
    const data = await graphql(query, { input });
    if (!data?.createPost?.post?.id) throw new Error(String(data?.createPost?.message || 'Buffer did not return a post ID'));
    persistReceipt(job, platform, {
      status: 'buffer_accepted',
      buffer_post_id: data.createPost.post.id,
      buffer_status: data.createPost.post.status,
      due_at: data.createPost.post.dueAt,
      external_link: data.createPost.post.externalLink,
      at: new Date().toISOString(),
      note: 'Buffer accepted the submission. Verify public platform publication separately.',
    });
    console.log(`ACCEPTED ${job.id}/${platform}: Buffer post ${data.createPost.post.id}`);
  } catch (err) {
    // Do not retry even when failure looks transient. Could have reached Buffer.
    const message = str(err instanceof Error ? err.message : String(err), 350);
    persistReceipt(job, platform, { status: 'needs_manual_review', at: new Date().toISOString(), error: message });
    console.error(`NEEDS REVIEW ${job.id}/${platform}: ${message}`);
    process.exitCode = 1;
  }
}

async function main() {
  const files = folder.endsWith('.json') ? [folder] : readdirSync(folder).filter(p => p.endsWith('.json')).sort().map(p => join(folder, p));
  assert(files.length > 0, 'No approved JSON manifests found; nothing to publish');
  const jobs = files.map(loadManifest);
  assert(new Set(jobs.map(j => j.id)).size === jobs.length, 'Duplicate job IDs');
  if (DRY_RUN) {
    console.log(JSON.stringify(jobs.map(j => ({ id: j.id, platforms: j.platforms, mode: j.mode, youtubeTitle: j.youtubeTitle })), null, 2));
    return;
  }
  const channels = await resolveChannelIds();
  for (const job of jobs) for (const platform of job.platforms) await submit(job, platform, channels[platform]);
}

main().catch(e => { console.error(e instanceof Error ? e.message : String(e)); process.exitCode = 1; });
