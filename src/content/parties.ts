// The only file allowed to name real parties (A4); the Phase 2 content gate allow-lists it.
// Parties are display names only: they live in Session options and never reach the engine (D4).

export const PARTIES = [
  { id: 'D', name: 'Democratic Party' },
  { id: 'R', name: 'Republican Party' },
] as const;

export type PartyId = (typeof PARTIES)[number]['id'];
