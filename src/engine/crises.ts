// Pure, deterministic crisis catalog and option definitions (design.md §3, EVT-01..03).
import { C } from './coefficients';
import type { Channel } from './modifiers';

export type CrisisType = 'exogenous' | 'endogenous';

export interface CrisisEffect {
  readonly channel: Channel;
  readonly amount: number;
}

export interface CrisisOption {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly cloutCost: number;
  readonly autopilot?: boolean;
  readonly effects: readonly CrisisEffect[];
  readonly scheduledKind?: string;
  readonly scheduledData?: Record<string, string | number>;
}

export interface CrisisDefinition {
  readonly id: string;
  readonly name: string;
  readonly headline: string;
  readonly description: string;
  readonly type: CrisisType;
  readonly explainerTitle: string;
  readonly options: readonly CrisisOption[];
}

export const CRISIS_CATALOG: readonly CrisisDefinition[] = [
  {
    id: 'hurricane',
    name: 'Gulf Coast Hurricane',
    headline: 'Hurricane hits the Gulf Coast',
    description: 'A major storm causes extensive flooding and power grid failures across coastal communities.',
    type: 'exogenous',
    explainerTitle: 'disaster aid',
    options: [
      {
        id: 'emergency',
        label: 'Declare an emergency',
        description: 'Release federal emergency aid and deploy FEMA personnel to open shelters.',
        cloutCost: C.crisisCloutLow,
        autopilot: true,
        effects: [
          { channel: 'approval', amount: C.disasterRallyApproval },
          { channel: 'debtBn', amount: C.disasterAidSpend },
        ],
        scheduledKind: 'disaster_rally',
        scheduledData: { quarters: C.disasterRallyDuration },
      },
      {
        id: 'reconstruction',
        label: 'Comprehensive reconstruction package',
        description: 'Fund full public infrastructure repairs and flood mitigation grants.',
        cloutCost: C.crisisCloutHigh,
        effects: [
          { channel: 'approval', amount: C.disasterRallyApproval + 1 },
          { channel: 'debtBn', amount: C.disasterReconSpend },
          { channel: 'potential', amount: C.disasterPotentialBoost },
        ],
      },
      {
        id: 'wait',
        label: 'Wait and see',
        description: 'Limit federal involvement and rely strictly on state and local reserves.',
        cloutCost: 0,
        effects: [
          { channel: 'approval', amount: -C.disasterNeglectApprovalHit },
          { channel: 'trust', amount: -C.disasterNeglectTrustHit },
        ],
      },
    ],
  },
  {
    id: 'oil_shock',
    name: 'Global Oil Shock',
    headline: 'Global energy supply disruption',
    description: 'International tensions restrict maritime shipping lanes, raising energy prices worldwide.',
    type: 'exogenous',
    explainerTitle: 'energy reserves',
    options: [
      {
        id: 'reserve',
        label: 'Release Strategic Petroleum Reserve',
        description: 'Inject crude oil reserves into refineries to stabilize domestic fuel prices.',
        cloutCost: C.crisisCloutLow,
        autopilot: true,
        effects: [
          { channel: 'inflation', amount: -C.oilReserveRelief },
        ],
      },
      {
        id: 'subsidize',
        label: 'Consumer fuel & transit relief grants',
        description: 'Offset heating and transportation costs directly for low-income households.',
        cloutCost: C.crisisCloutMedium,
        effects: [
          { channel: 'debtBn', amount: C.oilTransitSpend },
          { channel: 'approval', amount: 1 },
        ],
      },
      {
        id: 'market',
        label: 'Allow market prices to clear',
        description: 'Avoid federal market intervention and let consumer demand adjust.',
        cloutCost: 0,
        effects: [
          { channel: 'inflation', amount: C.oilNeglectSpike },
          { channel: 'approval', amount: -C.disasterRallyApproval },
        ],
      },
    ],
  },
  {
    id: 'epidemic',
    name: 'Respiratory Outbreak',
    headline: 'Regional respiratory virus outbreak',
    description: 'A virulent respiratory strain causes elevated hospital admissions and workplace absenteeism.',
    type: 'exogenous',
    explainerTitle: 'public health response',
    options: [
      {
        id: 'targeted',
        label: 'Targeted health advisory & surveillance',
        description: 'Coordinate hospital bed capacity and issue clear voluntary medical guidance.',
        cloutCost: C.crisisCloutLow,
        autopilot: true,
        effects: [
          { channel: 'debtBn', amount: C.epidemicTargetedSpend },
        ],
      },
      {
        id: 'mobilize',
        label: 'Emergency medical manufacturing mobilization',
        description: 'Invoke federal production incentives for rapid test kits and antiviral treatments.',
        cloutCost: C.crisisCloutHigh,
        effects: [
          { channel: 'debtBn', amount: C.epidemicMobilizeSpend },
          { channel: 'trust', amount: 1 },
        ],
      },
      {
        id: 'voluntary',
        label: 'Rely on existing healthcare capacity',
        description: 'Avoid new emergency spending or federal mandates.',
        cloutCost: 0,
        effects: [
          { channel: 'approval', amount: -1 },
          { channel: 'trust', amount: -C.scotusSwiftTrustGain },
        ],
      },
    ],
  },
  {
    id: 'scotus_vacancy',
    name: 'Supreme Court Vacancy',
    headline: 'Supreme Court justice announces retirement',
    description: 'A senior justice steps down, creating a pivotal lifetime vacancy on the federal bench.',
    type: 'exogenous',
    explainerTitle: 'judicial confirmations',
    options: [
      {
        id: 'centrist',
        label: 'Nominate consensus jurist',
        description: 'Select an experienced centrist judge with broad cross-aisle support.',
        cloutCost: C.crisisCloutLow,
        autopilot: true,
        effects: [
          { channel: 'trust', amount: C.scotusSwiftTrustGain },
        ],
      },
      {
        id: 'bold',
        label: 'Nominate principled ideological champion',
        description: 'Advance a staunch legal jurist who excites grassroots activists and voters.',
        cloutCost: C.crisisCloutHigh,
        effects: [
          { channel: 'approval', amount: C.scotusBoldApprovalRally },
          { channel: 'trust', amount: -1 },
        ],
      },
      {
        id: 'delay',
        label: 'Delay nomination to next congressional term',
        description: 'Leave the seat vacant pending political developments.',
        cloutCost: 0,
        effects: [
          { channel: 'trust', amount: -C.scotusDelayTrustHit },
          { channel: 'approval', amount: -C.scotusSwiftTrustGain },
        ],
      },
    ],
  },
  {
    id: 'wildfire',
    name: 'Western Wildfires',
    headline: 'Western wildfires threaten communities',
    description: 'Severe drought and high winds cause uncontrollable forest fires in multiple western states.',
    type: 'exogenous',
    explainerTitle: 'emergency firefighting',
    options: [
      {
        id: 'federal_air',
        label: 'Deploy federal aerial firefighting fleet',
        description: 'Provide immediate air support, smokejumpers, and logistical coordinators.',
        cloutCost: C.crisisCloutLow,
        autopilot: true,
        effects: [
          { channel: 'debtBn', amount: C.disasterAidSpend },
          { channel: 'approval', amount: 1 },
        ],
      },
      {
        id: 'resilience',
        label: 'National forest resilience & clean-up grant',
        description: 'Fund controlled burns and fuel breaks to safeguard towns permanently.',
        cloutCost: C.crisisCloutMedium,
        effects: [
          { channel: 'debtBn', amount: C.disasterReconSpend },
          { channel: 'potential', amount: C.disasterPotentialBoost },
        ],
      },
      {
        id: 'local_response',
        label: 'Rely on state and local responders',
        description: 'Do not deploy federal emergency assets.',
        cloutCost: 0,
        effects: [
          { channel: 'approval', amount: -C.disasterRallyApproval },
          { channel: 'trust', amount: -C.scotusSwiftTrustGain },
        ],
      },
    ],
  },
  {
    id: 'flood',
    name: 'Midwest River Flooding',
    headline: 'Mississippi River breaches levees',
    description: 'Record seasonal snowmelt and rainfall flood thousands of acres of farmland and towns.',
    type: 'exogenous',
    explainerTitle: 'flood control',
    options: [
      {
        id: 'corps_deploy',
        label: 'Deploy Army Corps emergency engineering',
        description: 'Dispatch engineers and emergency barrier pumps to secure critical levees.',
        cloutCost: C.crisisCloutLow,
        autopilot: true,
        effects: [
          { channel: 'debtBn', amount: C.disasterAidSpend },
          { channel: 'approval', amount: 1 },
        ],
      },
      {
        id: 'basin_plan',
        label: 'Long-term basin water management program',
        description: 'Invest in permanent watershed retention zones and agricultural spillways.',
        cloutCost: C.crisisCloutMedium,
        effects: [
          { channel: 'debtBn', amount: C.disasterReconSpend },
          { channel: 'potential', amount: C.disasterPotentialBoost },
        ],
      },
      {
        id: 'local_dikes',
        label: 'Leave levee defense to local districts',
        description: 'Allow local flood authorities to handle cresting waters.',
        cloutCost: 0,
        effects: [
          { channel: 'approval', amount: -C.disasterRallyApproval },
          { channel: 'trust', amount: -1 },
        ],
      },
    ],
  },
  {
    id: 'cyberattack',
    name: 'Critical Infrastructure Cyber Incident',
    headline: 'Cyberattack targets regional pipeline controls',
    description: 'A coordinated cyber intrusion temporarily halts computerized distribution controls.',
    type: 'exogenous',
    explainerTitle: 'cyber defense',
    options: [
      {
        id: 'cisa_response',
        label: 'Deploy CISA cyber incident incident team',
        description: 'Provide federal decryption keys and secure network restoration protocols.',
        cloutCost: C.crisisCloutLow,
        autopilot: true,
        effects: [
          { channel: 'trust', amount: 1 },
        ],
      },
      {
        id: 'national_hardening',
        label: 'National infrastructure cybersecurity grant',
        description: 'Mandate and subsidize hardware air-gapping across private utilities.',
        cloutCost: C.crisisCloutMedium,
        effects: [
          { channel: 'debtBn', amount: C.disasterAidSpend },
          { channel: 'trust', amount: C.scotusSwiftTrustGain },
        ],
      },
      {
        id: 'operator_remedy',
        label: 'Rely on private utility response',
        description: 'Do not deploy federal technical personnel or issue mandates.',
        cloutCost: 0,
        effects: [
          { channel: 'gap', amount: -C.disasterPotentialBoost },
          { channel: 'trust', amount: -C.scotusSwiftTrustGain },
        ],
      },
    ],
  },
  {
    id: 'crop_blight',
    name: 'Agricultural Drought',
    headline: 'Severe drought threatens breadbasket harvest',
    description: 'Prolonged dry heat across the Great Plains threatens grain harvests and livestock feed.',
    type: 'exogenous',
    explainerTitle: 'agricultural safety net',
    options: [
      {
        id: 'crop_insurance',
        label: 'Accelerate USDA crop insurance indemnities',
        description: 'Release standard disaster assistance payments to keep family farms solvent.',
        cloutCost: C.crisisCloutLow,
        autopilot: true,
        effects: [
          { channel: 'debtBn', amount: C.disasterAidSpend },
        ],
      },
      {
        id: 'irrigation_surge',
        label: 'Emergency water transport and irrigation credit',
        description: 'Subsidize well drilling and emergency aquifer transport pipelines.',
        cloutCost: C.crisisCloutMedium,
        effects: [
          { channel: 'debtBn', amount: C.oilTransitSpend },
          { channel: 'approval', amount: 1 },
        ],
      },
      {
        id: 'market_grain',
        label: 'Allow food commodity markets to adjust',
        description: 'Avoid extraordinary federal farm interventions.',
        cloutCost: 0,
        effects: [
          { channel: 'inflation', amount: C.disasterPotentialBoost },
          { channel: 'approval', amount: -1 },
        ],
      },
    ],
  },
  {
    id: 'foreign_turmoil',
    name: 'Overseas Banking Turmoil',
    headline: 'Foreign banking distress ripples through credit markets',
    description: 'A major foreign financial institution experiences deposit runs, spreading global risk aversion.',
    type: 'exogenous',
    explainerTitle: 'international central banking',
    options: [
      {
        id: 'swap_lines',
        label: 'Affirm international currency swap liquidity',
        description: 'Support central bank cross-currency liquidity facilities to calm interbank lending.',
        cloutCost: C.crisisCloutLow,
        autopilot: true,
        effects: [
          { channel: 'trust', amount: 1 },
        ],
      },
      {
        id: 'export_credit',
        label: 'Emergency trade finance credit guarantee',
        description: 'Backstop domestic export manufacturers against foreign counterparty default.',
        cloutCost: C.crisisCloutMedium,
        effects: [
          { channel: 'debtBn', amount: C.disasterAidSpend },
          { channel: 'approval', amount: 1 },
        ],
      },
      {
        id: 'standoff_market',
        label: 'Let foreign regulatory authorities manage the fallout',
        description: 'Take no extraordinary bilateral or multilateral action.',
        cloutCost: 0,
        effects: [
          { channel: 'gap', amount: -C.disasterPotentialBoost },
          { channel: 'trust', amount: -1 },
        ],
      },
    ],
  },
  {
    id: 'grid_failure',
    name: 'Regional Power Grid Failure',
    headline: 'Substation explosion triggers regional blackout',
    description: 'Severe transformer failures knock out power across multiple metropolitan centers.',
    type: 'exogenous',
    explainerTitle: 'grid reliability',
    options: [
      {
        id: 'energy_emergency',
        label: 'Issue federal energy emergency order',
        description: 'Direct neighboring interstate grid interconnects to wheel emergency power.',
        cloutCost: C.crisisCloutLow,
        autopilot: true,
        effects: [
          { channel: 'approval', amount: 1 },
        ],
      },
      {
        id: 'grid_modernize',
        label: 'Regional grid modernization & hardening fund',
        description: 'Financially support deployment of high-capacity transformers and microgrids.',
        cloutCost: C.crisisCloutMedium,
        effects: [
          { channel: 'debtBn', amount: C.disasterReconSpend },
          { channel: 'potential', amount: C.disasterPotentialBoost },
        ],
      },
      {
        id: 'local_repair',
        label: 'Wait for private utility crews to restore service',
        description: 'Avoid federal grid coordination.',
        cloutCost: 0,
        effects: [
          { channel: 'approval', amount: -C.disasterRallyApproval },
          { channel: 'trust', amount: -1 },
        ],
      },
    ],
  },
  {
    id: 'heat_wave',
    name: 'Extreme Continental Heat Wave',
    headline: 'Record heat wave strains energy and public health',
    description: 'Triple-digit temperatures persist for weeks, raising heat illness and peaking air conditioning demand.',
    type: 'exogenous',
    explainerTitle: 'extreme weather resilience',
    options: [
      {
        id: 'cooling_aid',
        label: 'Release emergency low-income cooling funds',
        description: 'Expand LIHEAP energy utility assistance and open federally funded cooling centers.',
        cloutCost: C.crisisCloutLow,
        autopilot: true,
        effects: [
          { channel: 'debtBn', amount: C.epidemicTargetedSpend },
          { channel: 'approval', amount: 1 },
        ],
      },
      {
        id: 'urban_canopy',
        label: 'National urban shade & heat mitigation initiative',
        description: 'Fund tree planting, cool roofs, and heat-reflective street paving.',
        cloutCost: C.crisisCloutMedium,
        effects: [
          { channel: 'debtBn', amount: C.disasterAidSpend },
          { channel: 'trust', amount: 1 },
        ],
      },
      {
        id: 'heat_minimal',
        label: 'Rely on state health departments and municipal shelters',
        description: 'No federal emergency weather allocation.',
        cloutCost: 0,
        effects: [
          { channel: 'approval', amount: -1 },
          { channel: 'trust', amount: -1 },
        ],
      },
    ],
  },
  {
    id: 'supply_chain',
    name: 'Major Port Freight Backlog',
    headline: 'Container congestion halts major shipping ports',
    description: 'Logistical bottlenecks and crane staffing delays strand container ships off maritime harbors.',
    type: 'exogenous',
    explainerTitle: 'freight logistics',
    options: [
      {
        id: 'port_envoy',
        label: 'Appoint federal port envoy for 24/7 operations',
        description: 'Broker agreements between dockworkers, railroads, and truckers to clear container yards.',
        cloutCost: C.crisisCloutLow,
        autopilot: true,
        effects: [
          { channel: 'trust', amount: 1 },
        ],
      },
      {
        id: 'freight_corridor',
        label: 'Emergency freight corridor inland staging grant',
        description: 'Fund pop-up inland rail yards to store containers and free up docks.',
        cloutCost: C.crisisCloutMedium,
        effects: [
          { channel: 'debtBn', amount: C.disasterAidSpend },
          { channel: 'approval', amount: 1 },
        ],
      },
      {
        id: 'let_market_move',
        label: 'Let shipping carriers and importers resolve delays',
        description: 'Do not deploy federal mediation or logistics support.',
        cloutCost: 0,
        effects: [
          { channel: 'inflation', amount: C.disasterPotentialBoost },
          { channel: 'approval', amount: -1 },
        ],
      },
    ],
  },
  {
    id: 'debt_crisis',
    name: 'Sovereign Debt Stress',
    headline: 'Treasury yields spike amidst debt concerns',
    description: 'Bond markets demand higher yields on government debt as national borrowing surges.',
    type: 'endogenous',
    explainerTitle: 'sovereign debt stress',
    options: [
      {
        id: 'commission',
        label: 'Convene bipartisan debt commission',
        description: 'Partner with congressional leaders on binding long-term fiscal targets.',
        cloutCost: C.crisisCloutMedium,
        autopilot: true,
        effects: [
          { channel: 'trust', amount: 1 },
        ],
      },
      {
        id: 'austerity',
        label: 'Executive discretionary spending freeze',
        description: 'Halt non-essential agency spending immediately to reassure bond markets.',
        cloutCost: C.crisisCloutLow,
        effects: [
          { channel: 'gap', amount: -C.unrestNeglectGrowthHit },
          { channel: 'approval', amount: -C.scotusSwiftTrustGain },
        ],
      },
      {
        id: 'defend_debt',
        label: 'Dismiss bond market pressure',
        description: 'Publicly defend current federal expenditures and reject austerity.',
        cloutCost: 0,
        effects: [
          { channel: 'inflation', amount: C.unrestNeglectGrowthHit },
          { channel: 'trust', amount: -C.scotusDelayTrustHit },
        ],
      },
    ],
  },
  {
    id: 'civil_unrest',
    name: 'Urban Demonstrations',
    headline: 'Protests and civil unrest in major cities',
    description: 'Economic pressures and widening inequality spark widespread street protests.',
    type: 'endogenous',
    explainerTitle: 'community stability',
    options: [
      {
        id: 'grant',
        label: 'Emergency community opportunity grants',
        description: 'Target federal investments toward impacted neighborhood development.',
        cloutCost: C.crisisCloutMedium,
        autopilot: true,
        effects: [
          { channel: 'debtBn', amount: C.unrestPackageSpend },
          { channel: 'trust', amount: 1 },
        ],
      },
      {
        id: 'surge',
        label: 'Deploy federal public safety personnel',
        description: 'Order federal officers to secure transit hubs and government buildings.',
        cloutCost: C.crisisCloutLow,
        effects: [
          { channel: 'trust', amount: -C.unrestSurgeTrustHit },
          { channel: 'approval', amount: 1 },
        ],
      },
      {
        id: 'address',
        label: 'Deliver televised address calling for calm',
        description: 'Appeal for national unity without committing federal dollars.',
        cloutCost: 0,
        effects: [
          { channel: 'gap', amount: -C.unrestNeglectGrowthHit },
          { channel: 'approval', amount: -C.scotusSwiftTrustGain },
        ],
      },
    ],
  },
  {
    id: 'market_panic',
    name: 'Financial Turmoil',
    headline: 'Stock market selloff and credit squeeze',
    description: 'Sudden policy shifts trigger market volatility and a tightening in corporate lending.',
    type: 'endogenous',
    explainerTitle: 'liquidity backstops',
    options: [
      {
        id: 'backstop',
        label: 'Coordinate central bank liquidity facility',
        description: 'Support federal banking regulators in maintaining credit flow to employers.',
        cloutCost: C.crisisCloutLow,
        autopilot: true,
        effects: [
          { channel: 'trust', amount: 1 },
        ],
      },
      {
        id: 'business_credit',
        label: 'Emergency payroll guarantee program',
        description: 'Provide low-interest loans to prevent immediate corporate layoffs.',
        cloutCost: C.crisisCloutMedium,
        effects: [
          { channel: 'debtBn', amount: C.disasterAidSpend },
          { channel: 'approval', amount: 1 },
        ],
      },
      {
        id: 'steady',
        label: 'Maintain current regulatory stance',
        description: 'Allow market corrections to proceed without federal credit intervention.',
        cloutCost: 0,
        effects: [
          { channel: 'gap', amount: -C.marketPanicTariffDrag },
          { channel: 'approval', amount: -C.scotusSwiftTrustGain },
        ],
      },
    ],
  },
];

export const EXOGENOUS_CRISES = CRISIS_CATALOG.filter((c) => c.type === 'exogenous');
export const ENDOGENOUS_CRISES = CRISIS_CATALOG.filter((c) => c.type === 'endogenous');

export function getCrisis(id: string): CrisisDefinition | undefined {
  return CRISIS_CATALOG.find((c) => c.id === id);
}
