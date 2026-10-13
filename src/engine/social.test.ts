import { describe, expect, it } from 'vitest';
import {
  getSocialLever,
  sanitizeSocial,
  socialBaseline,
  socialLevers,
  type SocialDomain,
} from './social';

describe('social levers engine', () => {
  it('defines 12 social levers across 4 domains', () => {
    expect(socialLevers).toHaveLength(12);
    const domains = new Set(socialLevers.map((l) => l.domain));
    const expectedDomains: SocialDomain[] = ['healthcare', 'immigration', 'energy', 'education'];
    for (const d of expectedDomains) {
      expect(domains.has(d)).toBe(true);
    }
  });

  it('guarantees unique IDs across all levers', () => {
    const ids = socialLevers.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('generates valid default baseline draft', () => {
    const base = socialBaseline();
    for (const l of socialLevers) {
      expect(base[l.id]).toBe(l.base);
      expect(base[l.id]).toBeGreaterThanOrEqual(l.min);
      expect(base[l.id]).toBeLessThanOrEqual(l.max);
    }
  });

  it('sanitizes empty, non-object, and malformed inputs to baseline', () => {
    const base = socialBaseline();
    expect(sanitizeSocial(null)).toEqual(base);
    expect(sanitizeSocial(undefined)).toEqual(base);
    expect(sanitizeSocial('string')).toEqual(base);
    expect(sanitizeSocial(42)).toEqual(base);
    expect(sanitizeSocial([1, 2, 3])).toEqual(base);
    expect(sanitizeSocial({})).toEqual(base);
  });

  it('clamps values strictly within [min, max]', () => {
    const raw = {
      aca: 999, // max is 150
      drg: -50, // min is 0
      pub: 5,   // max is 1
      vis: -10, // min is 50
    };
    const sanitized = sanitizeSocial(raw);
    expect(sanitized.aca).toBe(150);
    expect(sanitized.drg).toBe(0);
    expect(sanitized.pub).toBe(1);
    expect(sanitized.vis).toBe(50);
  });

  it('reverts NaN and non-finite numbers to base', () => {
    const raw = {
      aca: NaN,
      drg: Infinity,
      bdr: -Infinity,
      k12: 'high',
    };
    const sanitized = sanitizeSocial(raw);
    expect(sanitized.aca).toBe(getSocialLever('aca')!.base);
    expect(sanitized.drg).toBe(getSocialLever('drg')!.base);
    expect(sanitized.bdr).toBe(getSocialLever('bdr')!.base);
    expect(sanitized.k12).toBe(getSocialLever('k12')!.base);
  });

  it('correctly retrieves levers by ID via getSocialLever', () => {
    expect(getSocialLever('aca')?.label).toBe('ACA Health Subsidies');
    expect(getSocialLever('unknown')).toBeUndefined();
  });
});
