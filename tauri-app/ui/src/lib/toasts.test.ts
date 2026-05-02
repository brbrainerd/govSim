/**
 * Tests for toasts.svelte.ts — push/dismiss and convenience helpers.
 *
 * Covers:
 *  - pushToast: item created with correct shape; id increments; duration stored.
 *  - dismissToast: removes the matching item; does not affect others.
 *  - toast.info / success / warning / danger: correct variant set.
 *  - toast.error: converts Error object to message; uses "danger" variant.
 *  - Auto-dismiss: setTimeout fires after the specified duration (fake timers).
 *  - Sticky toast: duration=0 does not register a setTimeout.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { toasts, pushToast, dismissToast, toast } from "./toasts.svelte";

// Reset item list before each test so tests are isolated.
beforeEach(() => { toasts.items = []; });

// ── pushToast ─────────────────────────────────────────────────────────────────

describe("pushToast", () => {
  it("adds exactly one item to toasts.items", () => {
    pushToast("hello");
    expect(toasts.items).toHaveLength(1);
  });

  it("stores the message text", () => {
    pushToast("test message");
    expect(toasts.items[0].message).toBe("test message");
  });

  it("defaults variant to 'info' when not specified", () => {
    pushToast("x");
    expect(toasts.items[0].variant).toBe("info");
  });

  it("stores the supplied variant", () => {
    pushToast("x", { variant: "success" });
    expect(toasts.items[0].variant).toBe("success");
  });

  it("stores the optional title", () => {
    pushToast("x", { title: "My Title" });
    expect(toasts.items[0].title).toBe("My Title");
  });

  it("defaults duration to 4000ms", () => {
    pushToast("x");
    expect(toasts.items[0].duration).toBe(4000);
  });

  it("stores a custom duration", () => {
    pushToast("x", { duration: 2000 });
    expect(toasts.items[0].duration).toBe(2000);
  });

  it("assigns a unique, incrementing id to each toast", () => {
    const id1 = pushToast("first");
    const id2 = pushToast("second");
    expect(id2).toBeGreaterThan(id1);
    expect(toasts.items[0].id).toBe(id1);
    expect(toasts.items[1].id).toBe(id2);
  });

  it("appends (FIFO order preserved)", () => {
    pushToast("a"); pushToast("b"); pushToast("c");
    const msgs = toasts.items.map(t => t.message);
    expect(msgs).toEqual(["a", "b", "c"]);
  });

  it("returns the new toast id", () => {
    const id = pushToast("x");
    expect(typeof id).toBe("number");
  });
});

// ── dismissToast ──────────────────────────────────────────────────────────────

describe("dismissToast", () => {
  it("removes the matching toast", () => {
    const id = pushToast("bye");
    expect(toasts.items).toHaveLength(1);
    dismissToast(id);
    expect(toasts.items).toHaveLength(0);
  });

  it("does not remove other toasts", () => {
    const id1 = pushToast("a");
    const id2 = pushToast("b");
    dismissToast(id1);
    expect(toasts.items).toHaveLength(1);
    expect(toasts.items[0].id).toBe(id2);
  });

  it("is a no-op for an unknown id", () => {
    pushToast("a");
    dismissToast(9999); // non-existent
    expect(toasts.items).toHaveLength(1);
  });
});

// ── Auto-dismiss ──────────────────────────────────────────────────────────────

describe("auto-dismiss", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("removes the toast after the specified duration", () => {
    pushToast("gone", { duration: 100 });
    expect(toasts.items).toHaveLength(1);
    vi.advanceTimersByTime(100);
    expect(toasts.items).toHaveLength(0);
  });

  it("does not remove the toast before the duration elapses", () => {
    pushToast("still here", { duration: 500 });
    vi.advanceTimersByTime(499);
    expect(toasts.items).toHaveLength(1);
  });

  it("duration=0 is sticky — no auto-dismiss fires", () => {
    pushToast("sticky", { duration: 0 });
    vi.advanceTimersByTime(60_000);
    expect(toasts.items).toHaveLength(1);
  });
});

// ── toast convenience helpers ─────────────────────────────────────────────────

describe("toast.info", () => {
  it("pushes a toast with variant 'info'", () => {
    toast.info("hello info");
    expect(toasts.items[0].variant).toBe("info");
    expect(toasts.items[0].message).toBe("hello info");
  });

  it("stores optional title", () => {
    toast.info("msg", "My Info");
    expect(toasts.items[0].title).toBe("My Info");
  });
});

describe("toast.success", () => {
  it("pushes a toast with variant 'success'", () => {
    toast.success("done");
    expect(toasts.items[0].variant).toBe("success");
    expect(toasts.items[0].message).toBe("done");
  });
});

describe("toast.warning", () => {
  it("pushes a toast with variant 'warning'", () => {
    toast.warning("careful");
    expect(toasts.items[0].variant).toBe("warning");
  });
});

describe("toast.danger", () => {
  it("pushes a toast with variant 'danger' and 8s duration", () => {
    toast.danger("oh no");
    expect(toasts.items[0].variant).toBe("danger");
    expect(toasts.items[0].duration).toBe(8000);
  });
});

describe("toast.error", () => {
  it("converts an Error object to its message string", () => {
    toast.error(new Error("boom"));
    expect(toasts.items[0].message).toBe("boom");
  });

  it("uses 'danger' variant", () => {
    toast.error("string error");
    expect(toasts.items[0].variant).toBe("danger");
  });

  it("uses a long 8s duration so errors are readable", () => {
    toast.error("x");
    expect(toasts.items[0].duration).toBe(8000);
  });

  it("uses default title 'Error' when none supplied", () => {
    toast.error("x");
    expect(toasts.items[0].title).toBe("Error");
  });

  it("accepts a custom title", () => {
    toast.error("x", "Custom title");
    expect(toasts.items[0].title).toBe("Custom title");
  });

  it("stringifies a non-Error thrown value", () => {
    toast.error("plain string value");
    expect(toasts.items[0].message).toBe("plain string value");
  });

  it("stringifies a number thrown value", () => {
    toast.error(42);
    expect(toasts.items[0].message).toBe("42");
  });
});
