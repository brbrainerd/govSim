// Pure deterministic endgame verdict classification for satirical Evil Mode (UI-03).
// Evaluates offshore stash, impeachment conviction, and election status to assign
// kleptocratic heist tiers, satirical debriefs, and post-presidency epilogues.
// Strictly nonpartisan and arithmetic-only.

import type { GameState } from './game';
import {
  TIER_GILDED_OLIGARCH_MAX,
  TIER_PETTY_GRIFTER_MAX,
  TIER_SOVEREIGN_PLUNDERER_MAX,
} from './units';

export type KleptocratTier =
  | 'Disgraced Convict'
  | 'Ousted Grifter'
  | 'Petty Grifter'
  | 'Gilded Oligarch'
  | 'Sovereign Plunderer'
  | 'Transnational Kleptocrat';

export interface KleptocratVerdict {
  readonly tier: KleptocratTier;
  readonly title: string;
  readonly summary: string;
  readonly epilogue: string;
  readonly stashBn: number;
  readonly heat: number;
  readonly isConvicted: boolean;
}

export interface EvilEndgameContext {
  readonly state: GameState;
  readonly reelectionLost?: boolean;
}

/**
 * Classifies an Evil Mode presidency into satirical kleptocrat heist tiers (UI-03).
 * Evaluates conviction status, election loss, and accumulated offshore wealth.
 */
export function classifyKleptocratVerdict(
  context: EvilEndgameContext,
): KleptocratVerdict {
  const evil = context.state.evil;
  const isConvicted = Boolean(evil?.convicted);
  const heat = evil?.heat ?? 0;
  const stashBn = isConvicted ? 0 : (evil?.offshoreStashBn ?? 0);

  if (isConvicted) {
    return {
      tier: 'Disgraced Convict',
      title: 'Disgraced & Forfeited',
      summary:
        'Impeached by the House and convicted by a two-thirds Senate supermajority. The entire offshore stash was seized by the Department of Justice.',
      epilogue:
        'Sentenced to serve consecutive terms at a minimum-security federal facility, your presidential memoirs are ghostwritten from the prison recreation room while the foreign shell companies dissolve under international forfeiture orders.',
      stashBn,
      heat,
      isConvicted: true,
    };
  }

  if (context.reelectionLost) {
    return {
      tier: 'Ousted Grifter',
      title: 'Electorally Ousted & Under Investigation',
      summary:
        'Voted out of office after one term. While congressional investigators continue issuing subpoenas, your corrupt proceeds remain precariously stashed across overseas tax havens.',
      epilogue:
        'Departing Washington under a cloud of federal grand jury proceedings, you retreat to a gated estate in a non-extradition jurisdiction, funding an aggressive legal defense team from your offshore accounts.',
      stashBn,
      heat,
      isConvicted: false,
    };
  }

  if (stashBn < TIER_PETTY_GRIFTER_MAX) {
    return {
      tier: 'Petty Grifter',
      title: 'Modest Siphoner',
      summary:
        'A modest haul by executive corruption standards. You walked away with secret accounts, but failed to truly capitalize on the boundless siphoning power of the federal government.',
      epilogue:
        'You quietly retire to a comfortable Florida compound with a discreet numbered Swiss vault, giving lucrative paid speeches to private equity seminars while keeping a low public profile.',
      stashBn,
      heat,
      isConvicted: false,
    };
  }

  if (stashBn < TIER_GILDED_OLIGARCH_MAX) {
    return {
      tier: 'Gilded Oligarch',
      title: 'Established Kleptocrat',
      summary:
        'A textbook extraction of federal assets. By auctioning exemptions and securing no-bid procurement kickbacks, you amassed generational wealth while dodging congressional retribution.',
      epilogue:
        'Living aboard a 400-foot megayacht in Mediterranean waters, your presidential library foundation serves as a tax-exempt family treasury while your political cronies run your domestic shell holdings.',
      stashBn,
      heat,
      isConvicted: false,
    };
  }

  if (stashBn < TIER_SOVEREIGN_PLUNDERER_MAX) {
    return {
      tier: 'Sovereign Plunderer',
      title: 'Sovereign Heist Mastermind',
      summary:
        'An audacious pillaging of the United States Treasury. You converted the levers of the executive branch into an industrial-scale private enrichment machine.',
      epilogue:
        'Possessing private islands, golden residences, and diplomatic immunity passports, international watchdogs rank your presidency alongside history\'s most brazen sovereign plunderers.',
      stashBn,
      heat,
      isConvicted: false,
    };
  }

  return {
    tier: 'Transnational Kleptocrat',
    title: 'Supreme Heist Legend',
    summary:
      'A historic, epoch-defining heist. You hollowed out federal procurement and asset registries, transforming the executive branch into the wealthiest private cartel on Earth.',
    epilogue:
      'Surrounded by private paramilitary security and sovereign golden monuments, global finance ministers can only marvel at the sheer magnitude of wealth extracted right under Congress\'s nose.',
    stashBn,
    heat,
    isConvicted: false,
  };
}
