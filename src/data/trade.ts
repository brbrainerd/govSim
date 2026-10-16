// Trade definitions, statutory authorities, and state export exposure data (Phase 16, TRADE-01, TRADE-02, COPY-01).
// Data definitions sit in src/data/ and are referenced by the pure engine and UI screens.

export type SectorTariffId = 'chips' | 'minerals' | 'cleanEnergy';
export type TradeAgreementId = 'eu' | 'indoPacific' | 'americas';

export interface SectorTariffDef {
  readonly id: SectorTariffId;
  readonly emoji: string;
  readonly name: string;
  readonly wonkLabel: string;
  readonly ratePct: number;
  readonly statutoryBasis: string;
  readonly description: string;
  readonly whyClick: string;
  readonly domesticBenefit: string;
  readonly consumerImpact: string;
  readonly upside: string;
  readonly catchText: string;
  readonly retaliatoryWeight: number;
}

export interface TradeAgreementDef {
  readonly id: TradeAgreementId;
  readonly emoji: string;
  readonly name: string;
  readonly wonkLabel: string;
  readonly partnerBloc: string;
  readonly cloutCost: number;
  readonly statutoryBasis: string;
  readonly description: string;
  readonly whyClick: string;
  readonly economicBenefit: string;
  readonly upside: string;
  readonly catchText: string;
  readonly retaliatoryMitigation: number;
}

export const SECTOR_TARIFFS_CATALOG: readonly SectorTariffDef[] = [
  {
    id: 'chips',
    emoji: '💻',
    name: 'Computer Chips & Tech Parts',
    wonkLabel: 'Section 301 Semiconductor & Microelectronics Tariff',
    ratePct: 25,
    statutoryBasis: 'Section 301, Trade Act of 1974',
    description: 'Puts a 25% import tax on foreign computer chips and electronics.',
    whyClick: 'Pushes tech firms to build chip plants at home and brings in $20B a year.',
    domesticBenefit: 'Rewards home chip plants and brings in $20B in customs cash.',
    consumerImpact: 'Makes laptops, phones, and new cars cost a bit more.',
    upside: '+$20B/yr customs cash & home chip jobs',
    catchText: 'Raises tech prices & sparks foreign pushback',
    retaliatoryWeight: 1.5,
  },
  {
    id: 'minerals',
    emoji: '⛏️',
    name: 'Rare Earths & Battery Metals',
    wonkLabel: 'Section 232 Critical Minerals National Security Tariff',
    ratePct: 15,
    statutoryBasis: 'Section 232, Trade Expansion Act of 1962 (National Defense)',
    description: 'Puts a 15% import tax on foreign mined metals used in batteries and jets.',
    whyClick: 'Backs home metal mines for defense and batteries with low pushback.',
    domesticBenefit: 'Backs home metal mines for defense and batteries.',
    consumerImpact: 'Raises costs slightly for battery makers and defense plants.',
    upside: '+$20B/yr revenue & safer defense supply',
    catchText: 'Nudges battery and parts costs higher',
    retaliatoryWeight: 1.0,
  },
  {
    id: 'cleanEnergy',
    emoji: '🔋',
    name: 'Solar Panels & Electric Cars',
    wonkLabel: 'Section 301 Photovoltaic & EV Counter-Subsidy Tariff',
    ratePct: 25,
    statutoryBasis: 'Section 301, Trade Act of 1974',
    description: 'Puts a 25% import tax on cheap foreign solar panels, batteries, and electric cars.',
    whyClick: 'Protects Midwest auto and battery plants from cheap foreign imports.',
    domesticBenefit: 'Protects home auto and clean tech plants from cheap foreign goods.',
    consumerImpact: 'Raises the sticker price on home solar roofs and electric cars.',
    upside: 'Protects auto states & adds +$20B/yr cash',
    catchText: 'Higher EV prices & farm export counter-tariffs',
    retaliatoryWeight: 1.5,
  },
] as const;

export const TRADE_AGREEMENTS_CATALOG: readonly TradeAgreementDef[] = [
  {
    id: 'eu',
    emoji: '🇪🇺',
    name: 'Europe Trade & Tech Deal',
    wonkLabel: 'Transatlantic Trade & Technology Executive Accord',
    partnerBloc: 'European Union (27 nations)',
    cloutCost: 25,
    statutoryBasis: 'Bilateral Executive Trade Agreement (Trade Act of 1974)',
    description: 'Cuts red tape and import taxes on tech, planes, and goods traded with Europe.',
    whyClick: 'Our biggest shield against foreign trade wars—cuts retaliation by 4 full points.',
    economicBenefit: 'Opens huge European markets for home planes, medicine, and tech.',
    upside: 'Shields exports (−4.0% retaliation) & boosts growth',
    catchText: 'Costs 25 Clout to sign with allies',
    retaliatoryMitigation: 4.0,
  },
  {
    id: 'indoPacific',
    emoji: '🌏',
    name: 'Pacific Supply Chain Pact',
    wonkLabel: 'Indo-Pacific Economic Framework Supply Accord',
    partnerBloc: 'Japan, South Korea, Australia, ASEAN',
    cloutCost: 20,
    statutoryBasis: 'Bilateral Framework Executive Agreement',
    description: 'Speeds up port shipping and locks in chip and farm trade with Pacific allies.',
    whyClick: 'Protects farm and chip exports across the Pacific for a moderate Clout cost.',
    economicBenefit: 'Keeps chip parts flowing and opens Asian markets for home farmers.',
    upside: 'Cuts retaliation (−3.5%) & helps farm exports',
    catchText: 'Costs 20 Clout in diplomatic effort',
    retaliatoryMitigation: 3.5,
  },
  {
    id: 'americas',
    emoji: '🌎',
    name: 'Americas Near-Shore Pact',
    wonkLabel: 'Western Hemisphere Nearshoring & USMCA+ Protocol',
    partnerBloc: 'USMCA+, Latin American Economic Forum',
    cloutCost: 15,
    statutoryBasis: 'Regional Trade Protocol',
    description: 'Creates tax-free trade lanes for food and factory parts across the Americas.',
    whyClick: 'Cheapest trade pact (15 Clout) to lower grocery import costs and help factories.',
    economicBenefit: 'Lowers food and raw material costs while boosting tractor exports.',
    upside: 'Cools grocery prices & cuts retaliation (−2.5%)',
    catchText: 'Costs 15 Clout to negotiate',
    retaliatoryMitigation: 2.5,
  },
] as const;

/** High trade-exposure states vulnerable to agricultural and manufacturing retaliatory tariffs (TRADE-02). */
export const TRADE_EXPOSED_STATES = [
  { state: 'IA', sector: 'agriculture', sharePct: 28, label: 'Iowa (Soybeans & Corn)' },
  { state: 'IL', sector: 'agriculture', sharePct: 24, label: 'Illinois (Grain & Ag Machinery)' },
  { state: 'NE', sector: 'agriculture', sharePct: 26, label: 'Nebraska (Beef & Feed)' },
  { state: 'KS', sector: 'agriculture', sharePct: 22, label: 'Kansas (Wheat & Sorghum)' },
  { state: 'MN', sector: 'agriculture', sharePct: 19, label: 'Minnesota (Pork & Ag)' },
  { state: 'MI', sector: 'manufacturing', sharePct: 25, label: 'Michigan (Automotive & Parts)' },
  { state: 'OH', sector: 'manufacturing', sharePct: 21, label: 'Ohio (Machinery & Steel)' },
  { state: 'PA', sector: 'manufacturing', sharePct: 18, label: 'Pennsylvania (Industrial Equipment)' },
  { state: 'WI', sector: 'manufacturing', sharePct: 20, label: 'Wisconsin (Engines & Dairy)' },
  { state: 'IN', sector: 'manufacturing', sharePct: 23, label: 'Indiana (Transportation & Auto)' },
] as const;
