// Typed Civics Glossary & Progressive Disclosure catalog (Phase 34, VOCAB-01, VOCAB-02).
// Maps simulationist jargon to friendly Kitchen-Table Plain Talk, emoji cues, and real civics terms.
// All plain-talk explanations pass Flesch-Kincaid reading grade <= 9.0 and <= 20 words per sentence.

export type VocabMode = 'plain' | 'wonk';

export type GlossaryTermId =
  | 'cloture'
  | 'reconciliation'
  | 'section_301_232'
  | 'ieepa_ofac'
  | 'major_questions'
  | 'output_gap'
  | 'cpi_pass_through'
  | 'taylor_rule'
  | 'gini'
  | 'tipping_point'
  | 'emp_pop'
  | 'retaliatory_tariff';

export interface GlossaryEntry {
  readonly id: GlossaryTermId;
  readonly emoji: string;
  readonly plainLabel: string;
  readonly wonkLabel: string;
  readonly plainHint: string;
  readonly realTermNote: string;
}

export const GLOSSARY_CATALOG: readonly GlossaryEntry[] = [
  {
    id: 'cloture',
    emoji: '🛑',
    plainLabel: 'Senate Vote Hurdle',
    wonkLabel: 'Senate Cloture & Filibuster',
    plainHint: 'Most big bills need 60 out of 100 Senate votes just to end debate.',
    realTermNote: 'Real term: Senate cloture (Rule XXII filibuster cutoff).',
  },
  {
    id: 'reconciliation',
    emoji: '🧮',
    plainLabel: 'Fast-Track Budget Bill',
    wonkLabel: 'Budget Reconciliation',
    plainHint: 'Once a year, tax and spending bills can pass the Senate with 51 votes.',
    realTermNote: 'Real term: Budget reconciliation (1974 Budget Act).',
  },
  {
    id: 'section_301_232',
    emoji: '🚢',
    plainLabel: 'Import Tax Rules',
    wonkLabel: 'Section 301 & 232 Tariffs',
    plainHint: 'Trade laws let you tax foreign goods to guard home mills and defense.',
    realTermNote: 'Real term: Section 301 (1974 Trade Act) and Section 232 (1962 Trade Act).',
  },
  {
    id: 'ieepa_ofac',
    emoji: '🧊',
    plainLabel: 'Foreign Bank Freezes',
    wonkLabel: 'IEEPA & OFAC Sanctions',
    plainHint: 'You can block foreign rivals from US banks, though oil costs may rise.',
    realTermNote: 'Real term: OFAC financial sanctions under IEEPA (50 U.S.C. § 1701).',
  },
  {
    id: 'major_questions',
    emoji: '⚖️',
    plainLabel: 'Court Lawsuit Risk',
    wonkLabel: 'Major Questions Doctrine',
    plainHint: 'Courts block big solo orders unless Congress clearly gave you that job.',
    realTermNote: 'Real term: Major Questions Doctrine (Supreme Court review).',
  },
  {
    id: 'output_gap',
    emoji: '🏭',
    plainLabel: 'Economy Speed',
    wonkLabel: 'Macro Output Gap',
    plainHint: 'Shows if plants and shops are running fast and hot or slow and cold.',
    realTermNote: 'Real term: Output gap (real GDP vs. potential GDP).',
  },
  {
    id: 'cpi_pass_through',
    emoji: '🛒',
    plainLabel: 'Store Price Hike',
    wonkLabel: 'CPI Tariff Pass-Through',
    plainHint: 'Import taxes raise costs for shops, and shoppers pay more at the store.',
    realTermNote: 'Real term: Consumer Price Index (CPI) tariff pass-through.',
  },
  {
    id: 'taylor_rule',
    emoji: '🏦',
    plainLabel: 'Fed Rate Formula',
    wonkLabel: 'Taylor Rule Monetary Policy',
    plainHint: 'The central bank hikes loan rates when prices jump and cuts them when jobs drop.',
    realTermNote: 'Real term: Taylor rule interest rate reaction function.',
  },
  {
    id: 'gini',
    emoji: '📊',
    plainLabel: 'Wealth Gap',
    wonkLabel: 'Gini Inequality Index',
    plainHint: 'Shows if new gains go to most folks or mainly to the richest homes.',
    realTermNote: 'Real term: Gini coefficient of income inequality.',
  },
  {
    id: 'tipping_point',
    emoji: '🎯',
    plainLabel: 'Must-Win State',
    wonkLabel: 'Tipping-Point State',
    plainHint: 'The close swing state that puts the winner over 270 electoral votes.',
    realTermNote: 'Real term: Electoral College tipping-point state.',
  },
  {
    id: 'emp_pop',
    emoji: '👷',
    plainLabel: 'People Working',
    wonkLabel: 'Employment-to-Population Ratio',
    plainHint: 'The share of working-age adults who hold a paying job right now.',
    realTermNote: 'Real term: Prime-age employment-to-population ratio (BLS).',
  },
  {
    id: 'retaliatory_tariff',
    emoji: '🪃',
    plainLabel: 'Foreign Payback Taxes',
    wonkLabel: 'Reciprocal Retaliatory Tariffs',
    plainHint: 'When you tax foreign goods, other lands tax our farm crops and cars back.',
    realTermNote: 'Real term: Retaliatory counter-tariffs on US exports.',
  },
] as const;

const GLOSSARY_MAP = new Map<GlossaryTermId, GlossaryEntry>(
  GLOSSARY_CATALOG.map((entry) => [entry.id, entry]),
);

export function getGlossaryTerm(id: GlossaryTermId): GlossaryEntry {
  const found = GLOSSARY_MAP.get(id);
  if (!found) {
    throw new Error(`Unknown glossary term id: "${String(id)}"`);
  }
  return found;
}

export function termLabelForMode(
  id: GlossaryTermId,
  mode: VocabMode = 'plain',
  includeEmoji: boolean = false,
): string {
  const entry = getGlossaryTerm(id);
  const text = mode === 'wonk' ? entry.wonkLabel : entry.plainLabel;
  return includeEmoji ? `${entry.emoji} ${text}` : text;
}

export function termTooltipForMode(id: GlossaryTermId, mode: VocabMode = 'plain'): string {
  const entry = getGlossaryTerm(id);
  return mode === 'wonk'
    ? `${entry.plainLabel}: ${entry.plainHint}`
    : `${entry.plainHint} (${entry.realTermNote})`;
}
