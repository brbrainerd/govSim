// Arithmetic-only replacements for platform Math (D10): + - * / compare bit-for-bit in every engine,
// Math.tanh/exp/log do not.
export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Pade(3,2) tanh; exactly +-1 from |x| = 3 (the approximant meets 1 there). Max error ~0.024. */
export const tanhPade = (x: number): number =>
  Math.abs(x) < 3 ? (x * (27 + x * x)) / (27 + 9 * x * x) : Math.sign(x);
