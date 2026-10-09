// Seat positions for a half-circle chamber, sorted left → right.
// ponytail: proportional rows; fine for 100–500 seats.

export const HEMI = { w: 640, h: 340, cx: 320, cy: 322, r0: 118, r1: 262, rows: 9 } as const;

export interface Seat { x: number; y: number; a: number }

export function hemicycle(n: number): Seat[] {
  const { cx, cy, r0, r1, rows } = HEMI;
  const radii = Array.from({ length: rows }, (_, i) => r0 + ((r1 - r0) * i) / (rows - 1));
  const sum = radii.reduce((a, b) => a + b, 0);
  const pts: Seat[] = [];
  let left = n;
  radii.forEach((r, i) => {
    const k = i === rows - 1 ? left : Math.round((n * r) / sum);
    left -= k;
    for (let j = 0; j < k; j++) {
      const a = Math.PI - (Math.PI * (j + 0.5)) / k;
      pts.push({ x: cx + r * Math.cos(a), y: cy - r * Math.sin(a), a });
    }
  });
  return pts.sort((p, q) => q.a - p.a);
}

/** Point on the arc at angle a (radians), radius r. */
export const arcPoint = (a: number, r: number) => ({ x: HEMI.cx + r * Math.cos(a), y: HEMI.cy - r * Math.sin(a) });
