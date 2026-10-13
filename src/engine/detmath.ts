// Arithmetic-only replacements for platform Math (D10): + - * / compare bit-for-bit in every engine,
// Math.tanh/exp/log do not.
export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Pade(3,2) tanh; exactly +-1 from |x| = 3 (the approximant meets 1 there). Max error ~0.024. */
export const tanhPade = (x: number): number =>
  Math.abs(x) < 3 ? (x * (27 + x * x)) / (27 + 9 * x * x) : Math.sign(x);

/** Deterministic Newton-Raphson square root (D10 arithmetic-only). */
export function sqrt(x: number): number {
  if (x <= 0) return 0;
  let r = x;
  for (let i = 0; i < 8; i++) {
    r = (r + x / r) / 2;
  }
  return r;
}

/** Arithmetic absolute value. */
export const abs = (x: number): number => (x < 0 ? -x : x);

/** Deterministic rounding to nearest integer. */
export const round = (x: number): number => (x >= 0 ? Math.floor(x + 0.5) : Math.ceil(x - 0.5));


