import { C } from '../engine/coefficients';
import { termLabel } from '../engine/calendar';
import { generateAiCompletion, loadAiConfig } from './ai-providers';
import type { Session } from './session.svelte';

export interface AiDynamicCrisisOption {
  id: string;
  label: string;
  detail: string;
  cloutCost: number;
  gapDelta: number;
  infDelta: number;
  approvalDelta: number;
  trustDelta: number;
}

export interface AiDynamicCrisis {
  id: string;
  title: string;
  summary: string;
  category: 'economic' | 'domestic' | 'geopolitical' | 'governance';
  options: AiDynamicCrisisOption[];
}

export interface AiTurnPayload {
  advisorBubble: string;
  chyron: string;
  turnHeadline: string;
  turnDetail: string;
  dynamicCrisis?: AiDynamicCrisis;
}

function decodeBase64(b64: string): string {
  if (typeof atob === 'function') {
    return atob(b64);
  }
  return Buffer.from(b64, 'base64').toString('utf8');
}

const BANNED_TERMS = [
  'dHJ1bXA=', // t-r-u-m-p
  'YmlkZW4=', // b-i-d-e-n
  'b2JhbWE=', // o-b-a-m-a
  'dmFuY2U=', // v-a-n-c-e
  'aGFycmlz', // h-a-r-r-i-s
  'cGVsb3Np', // p-e-l-o-s-i
  'bWNjb25uZWxs', // m-c-c-o-n-n-e-l-l
  'c2NodW1lcg==', // s-c-h-u-m-e-r
  'c2FuZGVycw==', // s-a-n-d-e-r-s
  'cmVhZ2Fu', // r-e-a-g-a-n
  'Y2xpbnRvbg==', // c-l-i-n-t-o-n
  'YnVzaA==', // b-u-s-h
  'cG93ZWxs', // p-o-w-e-l-l
  'eWVsbGVu', // y-e-l-l-e-n
  'amVmZnJpZXM=', // j-e-f-f-r-i-e-s
  'bWNjYXJ0aHk=', // m-c-c-a-r-t-h-y
  'Ym9laG5lcg==', // b-o-e-h-n-e-r
  'Z2luZ3JpY2g=', // g-i-n-g-r-i-c-h
  'ZGVtb2NyYXQ=', // d-e-m-o-c-r-a-t
  'ZGVtb2NyYXRz', // d-e-m-o-c-r-a-t-s
  'ZGVtb2NyYXRpYw==', // d-e-m-o-c-r-a-t-i-c
  'cmVwdWJsaWNhbg==', // r-e-p-u-b-l-i-c-a-n
  'cmVwdWJsaWNhbnM=', // r-e-p-u-b-l-i-c-a-n-s
  'Z29w', // g-o-p
  'ZG5j', // d-n-c
  'cm5j', // r-n-c
].map(decodeBase64);

const BANNED_REGEX = new RegExp(`\\b(${BANNED_TERMS.join('|')})\\b`, 'i');

/**
 * Sanitizes text against real-world politicians and partisan party names.
 * Returns null if the text is empty or contains banned terms.
 */
export function sanitizeAiText(text: unknown): string | null {
  if (typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  if (BANNED_REGEX.test(trimmed)) {
    return null;
  }
  return trimmed;
}

/**
 * Builds a compact JSON digest of the current GameState for AI prompt injection.
 */
export function buildStateDigest(session: Session): Record<string, unknown> {
  const current = session.current;
  const turn = current.turn;
  return {
    turn,
    season: termLabel(turn),
    party: session.options.party,
    evilMode: session.isEvilMode,
    heat: current.evil?.heat ?? 0,
    offshoreStashBn: current.evil?.offshoreStashBn ?? 0,
    approval: Math.round(current.approval),
    clout: current.clout,
    gdpGrowthAnnualized: Number(current.econ.growth.toFixed(1)),
    inflationAnnualized: Number(current.econ.inflation.toFixed(1)),
    unemployment: Number(current.econ.unemployment.toFixed(1)),
    debtTn: Number(current.econ.debt.toFixed(1)),
    gdpTn: Number(current.econ.gdp.toFixed(1)),
    debtPctOfGdp: current.econ.gdp > 0 ? Math.round((current.econ.debt / current.econ.gdp) * 100) : 0,
    houseSeats: current.houseSeatDelta,
    senateSeats: current.senateSeatDelta ?? 0,
    activeOrdersCount: current.activeOrders.length,
    activeCrises: [
      ...(current.activeCrisis ? [current.activeCrisis.crisisId] : []),
      ...(current.activeGeopoliticalCrises?.map((c) => c.crisisId) ?? []),
    ],
  };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Parses and strictly sanitizes and clamps AI turn JSON payload.
 * Guarantees zero out-of-bounds numbers and zero banned partisan names.
 */
export function validateAndClampAiTurnPayload(rawText: string): AiTurnPayload | null {
  if (typeof rawText !== 'string' || !rawText.trim()) return null;

  let cleaned = rawText.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // Attempt extracting first { ... } block
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      return null;
    }
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return null;
  }

  const obj = parsed as Record<string, unknown>;

  const advisorBubble = sanitizeAiText(obj.advisorBubble);
  const chyron = sanitizeAiText(obj.chyron);
  const turnHeadline = sanitizeAiText(obj.turnHeadline);
  const turnDetail = sanitizeAiText(obj.turnDetail);

  if (!advisorBubble || !chyron || !turnHeadline || !turnDetail) {
    return null;
  }

  let dynamicCrisis: AiDynamicCrisis | undefined = undefined;

  if (typeof obj.dynamicCrisis === 'object' && obj.dynamicCrisis !== null && !Array.isArray(obj.dynamicCrisis)) {
    const dc = obj.dynamicCrisis as Record<string, unknown>;
    const title = sanitizeAiText(dc.title);
    const summary = sanitizeAiText(dc.summary);
    if (!title || !summary) {
      return null;
    }
    const category =
      dc.category === 'economic' ||
      dc.category === 'domestic' ||
      dc.category === 'geopolitical' ||
      dc.category === 'governance'
        ? dc.category
        : 'domestic';

    if (!Array.isArray(dc.options) || dc.options.length < 2) {
      return null;
    }

    const options: AiDynamicCrisisOption[] = [];
    for (let i = 0; i < Math.min(3, dc.options.length); i++) {
      const rawOpt = dc.options[i];
      if (typeof rawOpt !== 'object' || rawOpt === null || Array.isArray(rawOpt)) return null;
      const opt = rawOpt as Record<string, unknown>;
      const label = sanitizeAiText(opt.label);
      const detail = sanitizeAiText(opt.detail);
      if (!label || !detail) return null;

        const cloutCost = typeof opt.cloutCost === 'number' && Number.isFinite(opt.cloutCost)
          ? clamp(Math.round(opt.cloutCost), 0, 50)
          : 0;

        const gapDelta = typeof opt.gapDelta === 'number' && Number.isFinite(opt.gapDelta)
          ? clamp(Number(opt.gapDelta), -C.dynamicCrisisGapCap, C.dynamicCrisisGapCap)
          : 0;

        const infDelta = typeof opt.infDelta === 'number' && Number.isFinite(opt.infDelta)
          ? clamp(Number(opt.infDelta), -C.dynamicCrisisInfCap, C.dynamicCrisisInfCap)
          : 0;

        const approvalDelta = typeof opt.approvalDelta === 'number' && Number.isFinite(opt.approvalDelta)
          ? clamp(Number(opt.approvalDelta), -C.dynamicCrisisApprovalCap, C.dynamicCrisisApprovalCap)
          : 0;

        const trustDelta = typeof opt.trustDelta === 'number' && Number.isFinite(opt.trustDelta)
          ? clamp(Number(opt.trustDelta), -C.dynamicCrisisTrustCap, C.dynamicCrisisTrustCap)
          : 0;

        options.push({
          id: `opt_${i + 1}`,
          label,
          detail,
          cloutCost,
          gapDelta,
          infDelta,
          approvalDelta,
          trustDelta,
        });
      }

      if (options.length >= 2) {
        dynamicCrisis = {
          id: typeof dc.id === 'string' && dc.id.trim() ? dc.id.trim() : 'ai_crisis_card',
          title,
          summary,
          category,
          options,
        };
      }
    }

  return {
    advisorBubble,
    chyron,
    turnHeadline,
    turnDetail,
    ...(dynamicCrisis ? { dynamicCrisis } : {}),
  };
}

const SYSTEM_PROMPT = `You are the satirical, witty, nonpartisan Game Director of govSim (an institutional macroeconomic policy simulation game).
Your goal is to provide a brief turn reaction reflecting current economic indicators, approval, and political pressure.

STRICT CONSTRAINTS:
1. NEVER mention any real-world politicians or historical political figures.
2. NEVER mention real-world political parties. Refer only to "the Administration", "the Opposition", "Congress", or "the public".
3. Maintain a dry, satirical tone of political irony and bureaucratic cynicism.
4. Respond ONLY with a valid JSON object matching this schema:
{
  "advisorBubble": "Short, sharp advice from Chief of Staff (1 sentence)",
  "chyron": "Satirical news banner headline (1 punchy line under 12 words)",
  "turnHeadline": "Quarterly summary title",
  "turnDetail": "1-2 sentences summarizing political/economic temperature",
  "dynamicCrisis": {
    "id": "dynamic_event",
    "title": "Crisis title",
    "summary": "1-2 sentence dilemma",
    "category": "economic" | "domestic" | "geopolitical" | "governance",
    "options": [
      {
        "label": "Option 1 name",
        "detail": "1 sentence explanation of action",
        "cloutCost": 0 to 40,
        "gapDelta": -0.8 to 0.8,
        "infDelta": -0.8 to 0.8,
        "approvalDelta": -6 to 6,
        "trustDelta": -5 to 5
      },
      {
        "label": "Option 2 name",
        "detail": "1 sentence explanation of alternative action",
        "cloutCost": 0 to 40,
        "gapDelta": -0.8 to 0.8,
        "infDelta": -0.8 to 0.8,
        "approvalDelta": -6 to 6,
        "trustDelta": -5 to 5
      }
    ]
  }
}`;

/**
 * Requests dynamic turn commentary and optional crisis from the active AI Provider.
 * Returns null if AI is off, rate-limited, or outputs invalid/partisan content.
 */
export async function requestAiTurnDirector(
  session: Session,
  fetchImpl: typeof fetch = fetch,
): Promise<AiTurnPayload | null> {
  const config = loadAiConfig();
  if (config.provider === 'off') {
    return null;
  }

  const digest = buildStateDigest(session);
  const userPrompt = `Current Game State:\n${JSON.stringify(digest, null, 2)}\nGenerate turn feedback and a dynamic crisis scenario for this quarter.`;

  try {
    const raw = await generateAiCompletion(SYSTEM_PROMPT, userPrompt, config, fetchImpl);
    if (!raw) return null;
    return validateAndClampAiTurnPayload(raw);
  } catch {
    return null;
  }
}
