// Structural hash for replay comparison (FND-02). Non-cryptographic 53-bit cyrb53 over a canonical walk:
// never use it for save integrity (Phase 2 uses crypto.subtle). Throws on NaN/Infinity (T-1-05).
const view = new DataView(new ArrayBuffer(8));

export function stableHash(value: unknown): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  const word = (w: number) => {
    h1 = Math.imul(h1 ^ w, 2654435761);
    h2 = Math.imul(h2 ^ w, 1597334677);
  };
  const str = (s: string) => {
    word(s.length);
    for (let i = 0; i < s.length; i++) word(s.charCodeAt(i));
  };
  const walk = (v: unknown, path: string): void => {
    if (v === null) return word(1);
    switch (typeof v) {
      case 'boolean': return word(v ? 3 : 2);
      case 'string': word(4); return str(v);
      case 'number': {
        if (!Number.isFinite(v)) throw new Error(`stableHash: non-finite number ${v} at ${path || '<root>'}`);
        view.setFloat64(0, v === 0 ? 0 : v); // -0 -> 0; big-endian halves, platform independent
        word(5); word(view.getUint32(0)); return word(view.getUint32(4));
      }
      case 'object': {
        if (Array.isArray(v)) {
          word(6); word(v.length);
          return v.forEach((x, i) => walk(x, `${path}[${i}]`));
        }
        const proto: unknown = Object.getPrototypeOf(v);
        if (proto !== Object.prototype && proto !== null) throw new Error(`stableHash: non-plain object at ${path || '<root>'}`);
        const o = v as Record<string, unknown>;
        const keys = Object.keys(o).filter((k) => o[k] !== undefined).sort();
        word(7); word(keys.length);
        return keys.forEach((k) => { str(k); walk(o[k], `${path}.${k}`); });
      }
      default: throw new Error(`stableHash: unsupported ${typeof v} at ${path || '<root>'}`);
    }
  };
  walk(value, '');
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
}
