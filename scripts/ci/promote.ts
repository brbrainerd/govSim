import { pathToFileURL } from 'node:url';
import { assertCoolifyApiBaseUrl, assertGhcrImageRef, loadEnv as defaultLoadEnv, requireGhcrRepo } from './config.ts';
import {
  forceDeploy as defaultForceDeploy,
  pinImage as defaultPinImage,
  pollDeployment as defaultPollDeployment,
} from './coolify.ts';

export interface PromoteOpts {
  argv?: string[];
  env?: NodeJS.ProcessEnv;
  loadEnv?: typeof defaultLoadEnv;
  pinImage?: typeof defaultPinImage;
  forceDeploy?: typeof defaultForceDeploy;
  pollDeployment?: typeof defaultPollDeployment;
}

export async function promote({
  argv = process.argv.slice(2),
  env: envIn = process.env,
  loadEnv = defaultLoadEnv,
  pinImage = defaultPinImage,
  forceDeploy = defaultForceDeploy,
  pollDeployment = defaultPollDeployment,
}: PromoteOpts = {}) {
  const env = loadEnv(envIn);
  const repo = requireGhcrRepo(env);
  const imageRef = assertGhcrImageRef(env.GHCR_IMAGE_WEB, repo);
  const token = env.COOLIFY_TOKEN;
  const appUuid = env.COOLIFY_APP_UUID;
  if (!token || !appUuid) throw new Error('COOLIFY_TOKEN and COOLIFY_APP_UUID are required.');
  const baseUrl = assertCoolifyApiBaseUrl(env.COOLIFY_BASE_URL, env);

  const method = await pinImage({ baseUrl, token, appUuid, imageRef, repo });
  console.log(`promote: pinned GHCR_IMAGE_WEB via ${method} → ${imageRef}`);

  const deploymentUuid = await forceDeploy({ baseUrl, token, appUuid });
  if (deploymentUuid && !argv.includes('--no-poll')) {
    await pollDeployment({ baseUrl, token, deploymentUuid });
  }
  return { imageRef, deploymentUuid };
}

const invokedDirectly = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]!).href;
if (invokedDirectly) {
  promote().catch((e) => {
    console.error(e?.message || String(e));
    process.exit(1);
  });
}
