import { describe, expect, it } from 'vitest';
import {
  sanitizeAiText,
  validateAndClampAiTurnPayload,
  buildStateDigest,
} from './ai-director';
import { C } from '../engine/coefficients';
import { Session } from './session.svelte';
import { START } from '../engine/fixture';

describe('AI Director Prompt Builder, Sanitizer & Clamping (AI-03, AI-04)', () => {
  it('sanitizeAiText detects and rejects banned politicians and partisan labels', () => {
    expect(sanitizeAiText('President Biden visited Capitol Hill')).toBeNull();
    expect(sanitizeAiText('Trump administration policies renewed')).toBeNull();
    expect(sanitizeAiText('Harris holds press briefing')).toBeNull();
    expect(sanitizeAiText('The Democrat party caucus divided')).toBeNull();
    expect(sanitizeAiText('GOP leadership blocks procedural vote')).toBeNull();
    expect(sanitizeAiText('Republican senators issue joint declaration')).toBeNull();
    expect(sanitizeAiText('')).toBeNull();
    expect(sanitizeAiText('   ')).toBeNull();

    // Valid nonpartisan strings pass through cleanly
    expect(sanitizeAiText('Congressional leaders express cautious optimism')).toBe(
      'Congressional leaders express cautious optimism',
    );
    expect(sanitizeAiText('Treasury bond yields edge higher amid labor tight markets')).toBe(
      'Treasury bond yields edge higher amid labor tight markets',
    );
  });

  it('validateAndClampAiTurnPayload parses valid JSON and strips code fences', () => {
    const raw = `\`\`\`json
{
  "advisorBubble": "Budget negotiations are stalling; we should pressure moderate members.",
  "chyron": "CAPITOL DISPUTE GROWS AS FISCAL DEADLINE APPROACHES",
  "turnHeadline": "Mid-Year Fiscal Standoff",
  "turnDetail": "Treasury warnings mount as the quarterly budget deficit narrows slightly."
}
\`\`\``;

    const payload = validateAndClampAiTurnPayload(raw);
    expect(payload).not.toBeNull();
    expect(payload?.advisorBubble).toContain('Budget negotiations');
    expect(payload?.chyron).toBe('CAPITOL DISPUTE GROWS AS FISCAL DEADLINE APPROACHES');
    expect(payload?.turnHeadline).toBe('Mid-Year Fiscal Standoff');
  });

  it('validateAndClampAiTurnPayload strictly clamps dynamic crisis deltas within coefficient caps', () => {
    const raw = JSON.stringify({
      advisorBubble: "Emergency session convened over sudden port bottlenecks.",
      chyron: "DOCKWORKER STRIKE THREATENS PACIFIC SUPPLY LINES",
      turnHeadline: "Supply Chain Crisis",
      turnDetail: "Container freight rates double over thirty days.",
      dynamicCrisis: {
        title: "Pacific Freight Congestion",
        summary: "Shipping delays threaten retail inflation and quarterly GDP.",
        category: "economic",
        options: [
          {
            label: "Federal Maritime Intervention",
            detail: "Order federal coordination to expedite container offloading.",
            cloutCost: 20,
            gapDelta: 999.0, // Should clamp to C.dynamicCrisisGapCap
            infDelta: -50.0, // Should clamp to -C.dynamicCrisisInfCap
            approvalDelta: 100, // Should clamp to C.dynamicCrisisApprovalCap
            trustDelta: -80, // Should clamp to -C.dynamicCrisisTrustCap
          },
          {
            label: "Market Self-Correction",
            detail: "Let carrier spot rates resolve queue bottlenecks naturally.",
            cloutCost: 0,
            gapDelta: -0.2,
            infDelta: 0.1,
            approvalDelta: -2,
            trustDelta: -1,
          },
        ],
      },
    });

    const payload = validateAndClampAiTurnPayload(raw);
    expect(payload).not.toBeNull();
    expect(payload?.dynamicCrisis).toBeDefined();

    const opt1 = payload!.dynamicCrisis!.options[0]!;
    expect(opt1.gapDelta).toBe(C.dynamicCrisisGapCap);
    expect(opt1.infDelta).toBe(-C.dynamicCrisisInfCap);
    expect(opt1.approvalDelta).toBe(C.dynamicCrisisApprovalCap);
    expect(opt1.trustDelta).toBe(-C.dynamicCrisisTrustCap);

    const opt2 = payload!.dynamicCrisis!.options[1]!;
    expect(opt2.gapDelta).toBe(-0.2);
    expect(opt2.infDelta).toBe(0.1);
  });

  it('validateAndClampAiTurnPayload rejects output containing banned terms in crisis text', () => {
    const partisanPayload = JSON.stringify({
      advisorBubble: "The economy is steady.",
      chyron: "LOCAL ELECTIONS APPROACH",
      turnHeadline: "Quarterly Overview",
      turnDetail: "Voters review state ballots.",
      dynamicCrisis: {
        title: "Congressional Split",
        summary: "House Republicans clash with the Administration.",
        category: "governance",
        options: [
          { label: "Bipartisan Accord", detail: "Work with moderates.", cloutCost: 10, gapDelta: 0, infDelta: 0, approvalDelta: 1, trustDelta: 1 },
          { label: "Executive Action", detail: "Proceed unilaterally.", cloutCost: 15, gapDelta: 0, infDelta: 0, approvalDelta: -1, trustDelta: -1 },
        ],
      },
    });

    expect(validateAndClampAiTurnPayload(partisanPayload)).toBeNull();
  });

  it('validateAndClampAiTurnPayload returns null on malformed or incomplete JSON', () => {
    expect(validateAndClampAiTurnPayload('not valid json {')).toBeNull();
    expect(validateAndClampAiTurnPayload('{}')).toBeNull();
    expect(validateAndClampAiTurnPayload('{"advisorBubble": "Only one field"}')).toBeNull();
  });

  it('buildStateDigest extracts clean state indicators from Session', () => {
    const session = new Session(42, START, { party: 'D' });
    const digest = buildStateDigest(session);

    expect(digest.turn).toBe(1);
    expect(digest.party).toBe('D');
    expect(digest.approval).toBeTypeOf('number');
    expect(digest.gdpGrowthAnnualized).toBeTypeOf('number');
    expect(digest.inflationAnnualized).toBeTypeOf('number');
    expect(digest.debtPctOfGdp).toBeTypeOf('number');
    expect(digest.clout).toBe(120);
  });
});
