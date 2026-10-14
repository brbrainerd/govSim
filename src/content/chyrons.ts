import type { GameState } from '../engine/game';

export interface ChyronCategory {
  readonly id: string;
  readonly headlines: readonly string[];
}

export const CHYRON_POOL = {
  evil_high_heat: [
    'White House paper shredder overheats. Press office blames dry winter air.',
    'Staff cannot find old files after office cat knocks over a metal box.',
    'House committee asks for desk logs. Aides send back sweet cookie recipes.',
  ],
  evil_default: [
    'Small island bank opens branch inside executive coat closet.',
    'New paper firm sets mailing spot behind the Oval Office snack bar.',
    'Special envoy lands with heavy black bags. Refuses to speak to airport guards.',
  ],
  high_inflation: [
    'Local baker offers thirty-year loans on sourdough toast.',
    'Diners print new brunch menus on paper towels to save money.',
    'Price of nickel coins rises above five cents. Mint asks citizens to stop melting pennies.',
  ],
  high_unemployment: [
    'Job fair offers free coffee and advice on how to enjoy long naps.',
    'Job seekers line up early for unpaid work at local lemonade stands.',
    'State jobs office adds ping pong tables to help passing the time.',
  ],
  high_debt: [
    'Treasury prints new bonds. Wall Street asks if they come with free tote bags.',
    'National debt clock adds an extra row of light bulbs.',
    'Budget aides suggest paying debt back with warm smiles and hope.',
  ],
  high_tariffs: [
    'Cargo ship docks with imported rubber ducks. Customs inspects each toy twice.',
    'Port cranes take a restful nap as new trade forms pile up.',
    'Steel shops cheer new trade fees while bike makers shed quiet tears.',
  ],
  high_approval: [
    'Voters briefly agree that things are fine. Pundits remain deeply unsettled.',
    'Poll shows public support so high that aides check the math twice.',
    'Party leaders warn that sudden peace may harm spicy TV debates.',
  ],
  low_approval: [
    'Local poll finds stray golden retriever leading in three swing counties.',
    'Press secretary insists that quiet boos are just friendly sighs of respect.',
    'Voters say they prefer candidates who stay off the evening news.',
  ],
  default: [
    'Congress debates daily lunch menu for six hours. Calls it a productive week.',
    'Senate panel forms a new club to study the need for more talks.',
    'Draft bill grows to four thousand pages. Nobody can find a stapler.',
    'Staff confirms that broken coffee maker is top White House priority.',
    'Traffic in capital slows to crawl as three motorcades pass each other.',
  ],
} as const;

export interface SessionChyronView {
  readonly current: GameState;
  readonly isEvilMode?: boolean;
}

export function pickChyron(session: SessionChyronView): string {
  const state = session.current;
  const turn = state.turn ?? 1;
  const isEvil = Boolean(session.isEvilMode);
  const heat = state.evil?.heat ?? 0;
  const inflation = state.econ?.inflation ?? 2.0;
  const unemployment = state.econ?.unemployment ?? 4.0;
  const debtGdp = state.econ ? (state.econ.debt / (state.econ.gdp || 1)) * 100 : 100;
  const tariff = state.policy?.tar ?? 11;
  const approval = state.approval ?? 50;

  let pool: readonly string[];

  if (isEvil && heat > 50) {
    pool = CHYRON_POOL.evil_high_heat;
  } else if (isEvil) {
    pool = CHYRON_POOL.evil_default;
  } else if (inflation > 4.5) {
    pool = CHYRON_POOL.high_inflation;
  } else if (unemployment > 6.0) {
    pool = CHYRON_POOL.high_unemployment;
  } else if (debtGdp > 120) {
    pool = CHYRON_POOL.high_debt;
  } else if (tariff > 20) {
    pool = CHYRON_POOL.high_tariffs;
  } else if (approval > 65) {
    pool = CHYRON_POOL.high_approval;
  } else if (approval < 40) {
    pool = CHYRON_POOL.low_approval;
  } else {
    pool = CHYRON_POOL.default;
  }

  const idx = Math.abs(turn - 1) % pool.length;
  return pool[idx]!;
}
