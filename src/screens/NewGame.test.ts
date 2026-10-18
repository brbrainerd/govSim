import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import NewGame from './NewGame.svelte';

describe('NewGame screen component (EVIL-01)', () => {
  it('renders party choices and game mode selection', () => {
    const { html } = render(NewGame, {
      props: {
        onStart: () => {},
      },
    });

    expect(html).toContain('Which party do you lead?');
    expect(html).toContain('Governing Objective');
    expect(html).toContain('Public Servant (Standard)');
    expect(html).toContain('Satirical "Evil Mode"');
    expect(html).toContain('Loot the treasury');
    expect(html).toContain('Load save file (.json)');
    expect(html).toContain('Start the term');
    expect(html).toContain('data-testid="newgame-portico-banner"');
    expect(html).toContain('data-testid="president-look-selector"');
    expect(html).toContain('data-testid="president-look-option-0"');
    expect(html).toContain('data-testid="president-look-option-1"');
    expect(html).toContain('data-testid="president-look-option-2"');
    expect(html).toContain('data-testid="president-look-option-3"');
  });
});
