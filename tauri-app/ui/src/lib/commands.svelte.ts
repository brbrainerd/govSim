/**
 * Command registry. Every action invokable from the command palette
 * (cmd+k) lives here. Components register commands at module-load time.
 *
 * Commands are pure functions. Side-effects happen via store mutation
 * or IPC calls inside the run() callback.
 */

export interface Command {
  /** Stable id (e.g., "nav.dashboard", "sim.step.30"). */
  id:       string;
  /** Human label shown in the palette. */
  label:    string;
  /** Optional grouping ("Navigation", "Simulation", "Settings"). */
  group?:   string;
  /** Optional emoji/icon. */
  icon?:    string;
  /** Optional keyboard shortcut hint string (e.g., "g d", "⌘+S"). */
  shortcut?: string;
  /** What to run when executed. */
  run:      () => void | Promise<void>;
}

export const commands = $state<{ items: Command[] }>({ items: [] });

/** Whether the command palette overlay is open. Read by `<CommandPalette>`. */
export const palette = $state<{ open: boolean }>({ open: false });

/** Open the palette programmatically. */
export function openPalette()  { palette.open = true; }
export function closePalette() { palette.open = false; }
export function togglePalette() { palette.open = !palette.open; }

export function registerCommand(cmd: Command) {
  // Replace existing command with same id (so dynamic re-registration is safe).
  commands.items = [...commands.items.filter(c => c.id !== cmd.id), cmd];
}

export function unregisterCommand(id: string) {
  commands.items = commands.items.filter(c => c.id !== id);
}

/** Tiny fuzzy match: lowercased substring of label or id matches the query. */
export function searchCommands(query: string): Command[] {
  if (!query.trim()) return commands.items;
  const q = query.toLowerCase();
  // Score by: exact substring in label > word-prefix in label > substring in id.
  return commands.items
    .map(c => {
      const label = c.label.toLowerCase();
      const id    = c.id.toLowerCase();
      let score = 0;
      if (label.includes(q)) score += 10;
      if (label.startsWith(q)) score += 5;
      if (label.split(" ").some(w => w.startsWith(q))) score += 3;
      if (id.includes(q)) score += 1;
      return { c, score };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.c);
}
