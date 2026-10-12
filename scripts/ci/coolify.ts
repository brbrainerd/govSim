import { assertGhcrImageRef } from './config.ts';

const KEY = 'GHCR_IMAGE_WEB';
const ENVS = (baseUrl: string, appUuid: string) => `${baseUrl.replace(/\/+$/, '')}/api/v1/applications/${appUuid}/envs`;
const auth = (token: string) => ({ Authorization: `Bearer ${token}`, Accept: 'application/json' });

export interface CoolifyOpts {
  baseUrl: string;
  token: string;
  appUuid: string;
  fetchImpl?: typeof fetch;
}

export interface PinImageOpts extends CoolifyOpts {
  imageRef: string;
  repo: string;
}

interface EnvRow {
  key?: string;
  value?: unknown;
}

async function readEnvRows({ baseUrl, token, appUuid, fetchImpl = fetch }: CoolifyOpts): Promise<EnvRow[]> {
  const res = await fetchImpl(ENVS(baseUrl, appUuid), {
    method: 'GET',
    headers: auth(token),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`GET environment variables failed (${res.status}).`);
  const payload = (await res.json()) as any;
  const rows = Array.isArray(payload) ? payload : payload?.environment_variables ?? payload?.data;
  return Array.isArray(rows) ? rows : [];
}

export async function fetchPinnedImageRef(opts: CoolifyOpts): Promise<string | null> {
  const rows = await readEnvRows(opts);
  const row = rows.find((r) => r?.key === KEY);
  return typeof row?.value === 'string' ? row.value : null;
}

export async function pinImage({ baseUrl, token, appUuid, imageRef, repo, fetchImpl = fetch }: PinImageOpts): Promise<string> {
  // Validate before any network call: a wrong-repo image must never be written.
  const value = assertGhcrImageRef(imageRef, repo);
  const rows = await readEnvRows({ baseUrl, token, appUuid, fetchImpl });
  const method = rows.find((r) => r?.key === KEY) ? 'PATCH' : 'POST';
  const res = await fetchImpl(ENVS(baseUrl, appUuid), {
    method,
    headers: { ...auth(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: KEY, value, is_literal: true, is_runtime: true, is_buildtime: true }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`${method} ${KEY} failed (${res.status}).`);
  return method;
}

export async function forceDeploy({ baseUrl, token, appUuid, fetchImpl = fetch }: CoolifyOpts): Promise<string | null> {
  const res = await fetchImpl(
    `${baseUrl.replace(/\/+$/, '')}/api/v1/deploy?uuid=${appUuid}&force=true`,
    { method: 'POST', headers: auth(token), signal: AbortSignal.timeout(30_000) },
  );
  const text = await res.text();
  console.log(`deploy api status=${res.status}`);
  if (!res.ok) throw new Error(`POST deploy failed (${res.status}): ${text}`);
  try {
    const body = JSON.parse(text);
    const direct = body?.deployment_uuid;
    if (typeof direct === 'string' && direct) return direct;
    const first = Array.isArray(body?.deployments) ? body.deployments[0] : null;
    return typeof first?.deployment_uuid === 'string' ? first.deployment_uuid : null;
  } catch {
    return null;
  }
}

export type DeploymentStatusKind = 'success' | 'failure' | 'pending';

export function deploymentStatusKind(raw: unknown): DeploymentStatusKind {
  const s = String(raw ?? '').toLowerCase();
  if (s === 'finished') return 'success';
  if (s === 'failed' || s === 'cancelled-by-user') return 'failure';
  return 'pending';
}

export interface PollDeploymentOpts {
  baseUrl: string;
  token: string;
  deploymentUuid: string;
  fetchImpl?: typeof fetch;
  intervalMs?: number;
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

export async function pollDeployment({
  baseUrl,
  token,
  deploymentUuid,
  fetchImpl = fetch,
  intervalMs = 5_000,
  timeoutMs = 5 * 60 * 1000,
  sleep = (ms: number) => new Promise((r) => setTimeout(r, ms)),
  now = () => Date.now(),
}: PollDeploymentOpts): Promise<void> {
  const start = now();
  while (now() - start < timeoutMs) {
    const res = await fetchImpl(
      `${baseUrl.replace(/\/+$/, '')}/api/v1/deployments/${deploymentUuid}`,
      { method: 'GET', headers: auth(token), signal: AbortSignal.timeout(30_000) },
    );
    if ([401, 403, 404].includes(res.status)) throw new Error(`GET deployment → ${res.status}`);
    if (res.ok) {
      const status = String(((await res.json()) as any)?.status ?? 'unknown');
      console.log(`deployment=${status}`);
      const kind = deploymentStatusKind(status);
      if (kind === 'success') return;
      if (kind === 'failure') throw new Error(`Coolify deployment ended with status=${status}`);
    }
    await sleep(intervalMs);
  }
  throw new Error('Timed out waiting for Coolify deployment to finish.');
}

export interface WaitForSettledHealthOpts {
  healthUrl: string;
  required?: number;
  intervalMs?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

export async function waitForSettledHealth({
  healthUrl,
  required = 3,
  intervalMs = 5_000,
  timeoutMs = 3 * 60 * 1000,
  fetchImpl = fetch,
  sleep = (ms: number) => new Promise((r) => setTimeout(r, ms)),
  now = () => Date.now(),
}: WaitForSettledHealthOpts): Promise<{ ok: boolean; streak: number }> {
  const start = now();
  let streak = 0;
  let lastError = 'no response';
  while (now() - start < timeoutMs) {
    try {
      const res = await fetchImpl(healthUrl, { method: 'GET', signal: AbortSignal.timeout(15_000) });
      const text = await res.text();
      let body: any;
      try {
        body = JSON.parse(text);
      } catch {
        throw new Error(`body is not JSON: ${text.slice(0, 120)}`);
      }
      if (res.status === 200 && body?.ok === true) {
        streak += 1;
        console.log(`health ok streak ${streak}/${required}`);
        if (streak >= required) return { ok: true, streak };
      } else {
        throw new Error(`${res.status} ${text.slice(0, 120)}`);
      }
    } catch (error) {
      streak = 0;
      lastError = String((error as any)?.message || error);
      console.warn(`health settle reset: ${lastError}`);
    }
    if (now() - start + intervalMs >= timeoutMs) break;
    await sleep(intervalMs);
  }
  throw new Error(`Health did not settle (${required} consecutive 200s): last=${lastError}`);
}
