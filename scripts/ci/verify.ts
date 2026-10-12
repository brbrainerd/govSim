import { pathToFileURL } from 'node:url';
import {
  assertCoolifyApiBaseUrl,
  assertGhcrImageRef,
  loadEnv as defaultLoadEnv,
  requireGhcrRepo,
  requireHealthUrl,
} from './config.ts';
import {
  fetchPinnedImageRef as defaultFetchPinned,
  waitForSettledHealth as defaultSettle,
} from './coolify.ts';

export interface VerifyOpts {
  env?: NodeJS.ProcessEnv;
  loadEnv?: typeof defaultLoadEnv;
  fetchPinnedImageRef?: typeof defaultFetchPinned;
  waitForSettledHealth?: typeof defaultSettle;
}

export async function verify({
  env: envIn = process.env,
  loadEnv = defaultLoadEnv,
  fetchPinnedImageRef = defaultFetchPinned,
  waitForSettledHealth = defaultSettle,
}: VerifyOpts = {}) {
  const env = loadEnv(envIn);
  const repo = requireGhcrRepo(env);
  const imageRef = assertGhcrImageRef(env.GHCR_IMAGE_WEB, repo);
  const healthUrl = requireHealthUrl(env);
  const baseUrl = assertCoolifyApiBaseUrl(env.COOLIFY_BASE_URL, env);
  const token = env.COOLIFY_TOKEN;
  const appUuid = env.COOLIFY_APP_UUID;
  if (!token || !appUuid) throw new Error('COOLIFY_TOKEN and COOLIFY_APP_UUID are required.');

  const pinned = await fetchPinnedImageRef({ baseUrl, token, appUuid });
  if (pinned !== imageRef) {
    throw new Error(`Coolify GHCR_IMAGE_WEB=${pinned ?? '(missing)'} (expected ${imageRef})`);
  }
  console.log(`Coolify GHCR_IMAGE_WEB matches ${imageRef}`);
  console.log(`Settling health at ${healthUrl}...`);
  await waitForSettledHealth({ healthUrl });
  return { ok: true };
}

const invokedDirectly = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]!).href;
if (invokedDirectly) {
  verify()
    .then(() => console.log('verify ok'))
    .catch((e) => {
      console.error(e?.message || String(e));
      process.exit(1);
    });
}
