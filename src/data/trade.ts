// Trade definitions, statutory authorities, and state export exposure data (Phase 16, TRADE-01, TRADE-02).
// Data definitions sit in src/data/ and are referenced by the pure engine and UI screens.

export type SectorTariffId = 'chips' | 'minerals' | 'cleanEnergy';
export type TradeAgreementId = 'eu' | 'indoPacific' | 'americas';

export interface SectorTariffDef {
  readonly id: SectorTariffId;
  readonly name: string;
  readonly ratePct: number;
  readonly statutoryBasis: string;
  readonly description: string;
  readonly domesticBenefit: string;
  readonly consumerImpact: string;
  readonly retaliatoryWeight: number;
}

export interface TradeAgreementDef {
  readonly id: TradeAgreementId;
  readonly name: string;
  readonly partnerBloc: string;
  readonly cloutCost: number;
  readonly statutoryBasis: string;
  readonly description: string;
  readonly economicBenefit: string;
  readonly retaliatoryMitigation: number;
}

export const SECTOR_TARIFFS_CATALOG: readonly SectorTariffDef[] = [
  {
    id: 'chips',
    name: 'Advanced Semiconductors & Microelectronics',
    ratePct: 25,
    statutoryBasis: 'Section 301, Trade Act of 1974',
    description: 'Targeted 25% tariff on foreign semiconductor components and microelectronics.',
    domesticBenefit: 'Incentivizes domestic fabrication capacity and protects semiconductor IP.',
    consumerImpact: 'Increases commercial electronics and automotive input component costs.',
    retaliatoryWeight: 1.5,
  },
  {
    id: 'minerals',
    name: 'Critical Minerals & Rare Earth Elements',
    ratePct: 15,
    statutoryBasis: 'Section 232, Trade Expansion Act of 1962 (National Defense)',
    description: '15% tariff on unrefined and processed foreign critical rare earth minerals.',
    domesticBenefit: 'Reduces strategic defense dependency on adversarial supply monopolies.',
    consumerImpact: 'Raises battery, defense procurement, and magnet assembly costs.',
    retaliatoryWeight: 1.0,
  },
  {
    id: 'cleanEnergy',
    name: 'Clean Energy Hardware & Electric Vehicles',
    ratePct: 25,
    statutoryBasis: 'Section 301, Trade Act of 1974',
    description: '25% tariff on imported foreign photovoltaic panels, battery cells, and electric vehicles.',
    domesticBenefit: 'Shields domestic clean technology factories from state-subsidized foreign dumping.',
    consumerImpact: 'Increases consumer purchase prices for solar installations and electric cars.',
    retaliatoryWeight: 1.5,
  },
] as const;

export const TRADE_AGREEMENTS_CATALOG: readonly TradeAgreementDef[] = [
  {
    id: 'eu',
    name: 'Transatlantic Trade & Tech Accord',
    partnerBloc: 'European Union (27 nations)',
    cloutCost: 25,
    statutoryBasis: 'Bilateral Executive Trade Agreement (Trade Act of 1974)',
    description: 'Comprehensive regulatory alignment and tariff elimination on industrial and tech goods.',
    economicBenefit: 'Expands US aerospace, pharmaceutical, and technology export markets.',
    retaliatoryMitigation: 4.0,
  },
  {
    id: 'indoPacific',
    name: 'Indo-Pacific Supply Chain Partnership',
    partnerBloc: 'Japan, South Korea, Australia, ASEAN',
    cloutCost: 20,
    statutoryBasis: 'Bilateral Framework Executive Agreement',
    description: 'Nearshore supply chain security treaty with preferred customs clearance.',
    economicBenefit: 'Secures semiconductor inputs and unlocks agricultural export markets.',
    retaliatoryMitigation: 3.5,
  },
  {
    id: 'americas',
    name: 'Western Hemisphere Nearshoring Pact',
    partnerBloc: 'USMCA+, Latin American Economic Forum',
    cloutCost: 15,
    statutoryBasis: 'Regional Trade Protocol',
    description: 'Duty-free nearshoring corridors for manufacturing and agricultural trade.',
    economicBenefit: 'Lowers food and raw materials import costs; boosts machinery exports.',
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
