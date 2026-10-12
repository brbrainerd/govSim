import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function requireGhcrRepo(env: NodeJS.ProcessEnv = process.env): string {
  const repo = env.DEPLOY_GHCR_REPO;
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    throw new Error("DEPLOY_GHCR_REPO must be '<owner>/<repo>', lowercase, no scheme.");
  }
  return repo.toLowerCase();
}

export function requireHealthUrl(env: NodeJS.ProcessEnv = process.env): string {
  const url = env.DEPLOY_HEALTH_URL;
  if (!url) throw new Error("DEPLOY_HEALTH_URL must be the app's health endpoint URL.");
  return url;
}

export function requireAllowlist(env: NodeJS.ProcessEnv = process.env): string[] {
  const raw = env.DEPLOY_ENV_ALLOWLIST;
  if (!raw) throw new Error('DEPLOY_ENV_ALLOWLIST must be a comma-separated list of env var names.');
  const keys = raw.split(',').map((k) => k.trim()).filter(Boolean);
  return keys.includes('GHCR_IMAGE_WEB') ? keys : [...keys, 'GHCR_IMAGE_WEB'];
}

export function assertGhcrImageRef(value: unknown, repo: string = requireGhcrRepo()): string {
  if (typeof value !== 'string') throw new Error('GHCR_IMAGE_WEB must be a string.');
  const escaped = repo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = value.match(new RegExp(`^ghcr\\.io/${escaped}:([0-9a-f]{40})$`, 'i'));
  if (!match) throw new Error(`GHCR_IMAGE_WEB must match ghcr.io/${repo}:<40-hex-sha>, got ${value}`);
  return `ghcr.io/${repo}:${match[1]!.toLowerCase()}`;
}

/**
 * Only https, loopback, or the tailnet. There is no insecure-http escape hatch:
 * the CI job joins the tailnet before calling Coolify, so plaintext over the
 * public internet — which would expose the bearer token and, via GET /envs,
 * sensitive envs — is never needed and therefore never permitted.
 */
export function assertCoolifyApiBaseUrl(value: unknown, _env: NodeJS.ProcessEnv = process.env): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('COOLIFY_BASE_URL is required.');
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid COOLIFY_BASE_URL: ${value}`);
  }
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('COOLIFY_BASE_URL must be an origin without a path or credentials.');
  }
  const trimmed = value.replace(/\/+$/, '');
  if (url.protocol === 'https:') return trimmed;
  if (url.protocol !== 'http:') throw new Error('COOLIFY_BASE_URL must use http or https.');
  const host = url.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.ts.net')) {
    return trimmed;
  }
  throw new Error(`Refusing plaintext HTTP to ${host}. Use https, or reach Coolify over the tailnet (*.ts.net).`);
}

function parseEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {};
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && m[1] && m[2] !== undefined) out[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return out;
}

export function loadEnv(env: NodeJS.ProcessEnv = process.env, root = process.cwd()): NodeJS.ProcessEnv {
  const merged: NodeJS.ProcessEnv = { ...env };
  for (const p of [join(root, '.env'), join(root, '.env.local')]) {
    for (const [k, v] of Object.entries(parseEnvFile(p))) {
      if (env[k] === undefined) merged[k] = v;
    }
  }
  return merged;
}
