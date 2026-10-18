import type { GameState } from '../engine/game';
import { draw } from '../engine/rng';

export interface ChyronCategory {
  readonly id: string;
  readonly headlines: readonly string[];
}

export const CHYRON_POOL = {
  evil_high_heat: [
    'White House paper shredder overheats. Press office blames dry winter air.',
    'Staff cannot find old files after office cat knocks over a metal box.',
    'House committee asks for desk logs. Aides send back sweet cookie recipes.',
    'Chief of staff claims twelve missing hard drives fell into the rose garden pond.',
    'Press room lights flicker as aides plug in four new paper shredders.',
    'Watchdog clerk gets locked in the broom room. Staff blames a sticky brass latch.',
  ],
  evil_default: [
    'Small island bank opens branch inside executive coat closet.',
    'New paper firm sets mailing spot behind the Oval Office snack bar.',
    'Special envoy lands with heavy black bags. Refuses to speak to airport guards.',
    'White House gift shop now accepts wire transfers from unnamed shell firms.',
    'Gold-plated golf carts spotted on the South Lawn. Aides cite morale boost.',
    'Donor dinner features gold soup spoons. Guests asked to leave phones at the gate.',
  ],
  high_inflation: [
    'Local baker offers thirty-year loans on sourdough toast.',
    'Diners print new brunch menus on paper towels to save money.',
    'Price of nickel coins rises above five cents. Mint asks citizens to stop melting pennies.',
    'Grocery store adds armed guard next to the cage of organic brown eggs.',
    'Family trades used sedan for two bags of coffee beans and a ripe avocado.',
    'Fast food chain debuts layaway plan for value meal with extra cheese.',
  ],
  high_unemployment: [
    'Job fair offers free coffee and advice on how to enjoy long naps.',
    'Job seekers line up early for unpaid work at local lemonade stands.',
    'State jobs office adds ping pong tables to help passing the time.',
    'Entry-level dog walker post asks for ten years of management work.',
    'Local mall hires mime to pretend stores are still busy on weekdays.',
    'Career coach advises grads to list couch surfing as travel logistics.',
  ],
  high_debt: [
    'Treasury prints new bonds. Wall Street asks if they come with free tote bags.',
    'National debt clock adds an extra row of light bulbs.',
    'Budget aides suggest paying debt back with warm smiles and hope.',
    'Treasury checks couch cushions in the West Wing for loose silver dimes.',
    'Bond traders ask if federal IOUs can be redeemed for national park passes.',
    'House panel proposes bake sale on Capitol steps to trim interest bills.',
  ],
  high_tariffs: [
    'Cargo ship docks with imported rubber ducks. Customs inspects each toy twice.',
    'Port cranes take a restful nap as new trade forms pile up.',
    'Steel shops cheer new trade fees while bike makers shed quiet tears.',
    'Border agents measure French cheese wheels with tiny brass rulers.',
    'Local cafe owner tries growing coffee beans in a cold shed.',
    'Foreign trade minister sends gift basket of tariff forms tied with red tape.',
  ],
  high_approval: [
    'Voters briefly agree that things are fine. Pundits remain deeply unsettled.',
    'Poll shows public support so high that aides check the math twice.',
    'Party leaders warn that sudden peace may harm spicy TV debates.',
    'Cable news hosts struggle to fill hour after failing to find a new scandal.',
    'Town hall crowd claps politely and goes home before eight.',
    'Rival party admits the lawn looks nice. Promises to complain next week.',
  ],
  low_approval: [
    'Local poll finds stray golden retriever leading in three swing counties.',
    'Press secretary insists that quiet boos are just friendly sighs of respect.',
    'Voters say they prefer candidates who stay off the evening news.',
    'Pollster confirms giant meteor now trails the White House by just two points.',
    'Backbench lawmaker claims he has never met the President in his life.',
    'White House tour guide skips the West Wing to avoid awkward questions.',
  ],
  default: [
    'Congress debates daily lunch menu for six hours. Calls it a productive week.',
    'Senate panel forms a new club to study the need for more talks.',
    'Draft bill grows to four thousand pages. Nobody can find a stapler.',
    'Staff confirms that broken coffee maker is top White House priority.',
    'Traffic in capital slows to crawl as three motorcades pass each other.',
    'Bipartisan group agrees to name a small rural post office on Tuesday.',
    'Floor speech hits hour nine as lawmaker reads a warm peach pie recipe.',
    'House panel holds long hearing on why tax forms use such tiny print.',
  ],
} as const;

export interface SessionChyronView {
  readonly current: GameState;
  readonly isEvilMode?: boolean;
}

export function pickChyron(session: SessionChyronView): string {
  const state = session.current;
  const turn = state.turn ?? 1;
  const seed = Number.isInteger(state.seed) ? state.seed : 1;
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

  const seedOffset = Math.floor(draw(seed, 'events', 1, 'chyron_offset') * pool.length);
  const idx = (seedOffset + Math.abs(turn - 1)) % pool.length;
  return pool[idx]!;
}
