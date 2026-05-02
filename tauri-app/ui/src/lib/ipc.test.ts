/**
 * Tests for ipc.ts helpers that have pure-function implementations.
 *
 * Covers:
 *  - decodeCivicRights: bitmask → labelled array mapping
 *  - CIVIC_RIGHTS: structural invariants (9 entries, unique bits, unique labels)
 *
 * No Tauri bridge or tinro import — ipc.ts only imports from @tauri-apps/api/core
 * which is mocked below.
 */
import { describe, it, expect, vi } from "vitest";

// @tauri-apps/api/core is only available inside a real Tauri window.
// Stub invoke so the module loads cleanly in Node.
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { CIVIC_RIGHTS, decodeCivicRights } from "./ipc";

// ── CIVIC_RIGHTS structural invariants ────────────────────────────────────────

describe("CIVIC_RIGHTS", () => {
  it("contains exactly 9 entries (one per CivicRights flag in Rust)", () => {
    expect(CIVIC_RIGHTS).toHaveLength(9);
  });

  it("all bits are distinct powers of two", () => {
    const bits = CIVIC_RIGHTS.map(r => r.bit);
    const uniqueBits = new Set(bits);
    expect(uniqueBits.size).toBe(9);
    bits.forEach(b => {
      // A power of two has exactly one set bit: b & (b-1) === 0 and b > 0
      expect(b).toBeGreaterThan(0);
      expect(b & (b - 1)).toBe(0);
    });
  });

  it("all labels are non-empty and unique", () => {
    const labels = CIVIC_RIGHTS.map(r => r.label);
    const unique  = new Set(labels);
    expect(unique.size).toBe(9);
    labels.forEach(l => expect(l.length).toBeGreaterThan(0));
  });

  it("all descriptions are non-empty strings", () => {
    CIVIC_RIGHTS.forEach(r => {
      expect(typeof r.description).toBe("string");
      expect(r.description.length).toBeGreaterThan(0);
    });
  });

  it("bits cover the range 1<<0 through 1<<8", () => {
    const bits = new Set(CIVIC_RIGHTS.map(r => r.bit));
    for (let i = 0; i <= 8; i++) {
      expect(bits.has(1 << i)).toBe(true);
    }
  });
});

// ── decodeCivicRights ─────────────────────────────────────────────────────────

describe("decodeCivicRights", () => {
  it("returns an array of length 9 for any input", () => {
    expect(decodeCivicRights(0)).toHaveLength(9);
    expect(decodeCivicRights(0b111111111)).toHaveLength(9);
    expect(decodeCivicRights(0xFFFF)).toHaveLength(9);
  });

  it("all rights are withheld when bits = 0", () => {
    const result = decodeCivicRights(0);
    expect(result.every(r => !r.granted)).toBe(true);
  });

  it("all rights are granted when all 9 bits are set", () => {
    const allBits = CIVIC_RIGHTS.reduce((acc, r) => acc | r.bit, 0);
    const result  = decodeCivicRights(allBits);
    expect(result.every(r => r.granted)).toBe(true);
  });

  it("correctly grants only Universal Suffrage (bit 0)", () => {
    const result = decodeCivicRights(1 << 0);
    const suffrage = result.find(r => r.label === "Universal Suffrage");
    expect(suffrage?.granted).toBe(true);
    // All other rights must be withheld
    result.filter(r => r.label !== "Universal Suffrage").forEach(r => {
      expect(r.granted).toBe(false);
    });
  });

  it("correctly grants only Free Speech (bit 7)", () => {
    const result    = decodeCivicRights(1 << 7);
    const freeSpeech = result.find(r => r.label === "Free Speech");
    expect(freeSpeech?.granted).toBe(true);
    result.filter(r => r.label !== "Free Speech").forEach(r => {
      expect(r.granted).toBe(false);
    });
  });

  it("correctly grants only Abolition of Slavery (bit 8)", () => {
    const result    = decodeCivicRights(1 << 8);
    const abolition = result.find(r => r.label === "Abolition of Slavery");
    expect(abolition?.granted).toBe(true);
    result.filter(r => r.label !== "Abolition of Slavery").forEach(r => {
      expect(r.granted).toBe(false);
    });
  });

  it("granted count matches popcount of the bits argument", () => {
    // 0b000001101 = bits 0 + 2 + 3 → 3 rights granted
    const bits    = (1 << 0) | (1 << 2) | (1 << 3);
    const granted = decodeCivicRights(bits).filter(r => r.granted).length;
    expect(granted).toBe(3);
  });

  it("output preserves CIVIC_RIGHTS label order", () => {
    const result = decodeCivicRights(0);
    const labels = result.map(r => r.label);
    expect(labels).toEqual(CIVIC_RIGHTS.map(r => r.label));
  });

  it("extra high bits beyond bit 8 are ignored (no phantom rights)", () => {
    // Set bits 0-8 plus bits 9-15 — should still show exactly 9 granted
    const allValidBits = CIVIC_RIGHTS.reduce((acc, r) => acc | r.bit, 0);
    const withJunk     = allValidBits | (1 << 9) | (1 << 15);
    const result       = decodeCivicRights(withJunk);
    expect(result).toHaveLength(9);
    expect(result.every(r => r.granted)).toBe(true);
  });
});
