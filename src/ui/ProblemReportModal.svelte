<script lang="ts">
  import { onMount } from 'svelte';
  import type { Session } from '../app/session.svelte';
  import { encodeRunCode } from '../app/share';
  import { stableHash } from '../engine/hash';
  import Overlay from './Overlay.svelte';

  let {
    session,
    onClose,
  }: {
    session: Session;
    onClose: () => void;
  } = $props();

  let runCode = $state<string>('generating...');
  let copyStatus = $state<'idle' | 'copied' | 'error'>('idle');

  onMount(async () => {
    try {
      runCode = await encodeRunCode(session);
    } catch {
      runCode = 'unavailable';
    }
  });

  const bundleData = $derived({
    app: 'govSim',
    version: '0.2.0',
    timestamp: new Date().toISOString(),
    session: {
      seed: session.current.seed,
      party: session.options.party,
      turn: session.current.turn,
      screen: session.screen,
      stateCheck: stableHash(session.current),
      inputsLength: session.inputs.length,
      unlockedBadges: session.unlockedBadges,
    },
    client: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'unknown',
    },
    runCode,
  });

  const bundleJson = $derived(JSON.stringify(bundleData, null, 2));

  async function handleCopy() {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(bundleJson);
        copyStatus = 'copied';
        setTimeout(() => {
          copyStatus = 'idle';
        }, 2500);
      } else {
        copyStatus = 'error';
      }
    } catch {
      copyStatus = 'error';
    }
  }
</script>

<Overlay title="Report a Problem" {onClose}>
  <div class="problem-modal" data-testid="problem-modal">
    <header class="modal-header">
      <div class="header-titles">
        <h2 class="modal-title">Diagnostic Problem Report</h2>
        <span class="modal-subtitle">Review before copying · Zero network transmission</span>
      </div>
      <button type="button" class="close-x" onclick={onClose} aria-label="Close dialog">✕</button>
    </header>

    <!-- Caution Banner -->
    <div class="caution-banner" role="status">
      <strong>REVIEW BEFORE COPYING:</strong> Everything below remains entirely in your browser until you choose to paste it. Zero data is sent automatically.
    </div>

    <!-- Diagnostic Pre Box -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="code-container" role="region" aria-label="Diagnostic JSON bundle" tabindex="0">
      <pre class="diag-preview" data-testid="diagnostic-pre">{bundleJson}</pre>
    </div>

    <!-- Footer Actions -->
    <footer class="modal-footer">
      <div class="footer-left">
        <a
          href="https://github.com/brbrainerd/govSim/issues/new"
          target="_blank"
          rel="noopener noreferrer"
          class="github-btn"
          data-testid="github-issue-link"
        >
          Open GitHub Issue ↗
        </a>
      </div>
      <div class="footer-right">
        <button
          type="button"
          class="copy-btn"
          class:copied={copyStatus === 'copied'}
          data-testid="copy-bundle-btn"
          onclick={handleCopy}
        >
          {copyStatus === 'copied' ? 'COPIED TO CLIPBOARD!' : 'COPY DIAGNOSTIC BUNDLE'}
        </button>
        <button
          type="button"
          class="close-btn"
          onclick={onClose}
        >
          CLOSE
        </button>
      </div>
    </footer>
  </div>
</Overlay>

<style>
  .problem-modal {
    display: flex;
    flex-direction: column;
    gap: clamp(10px, 1.4vh, 16px);
    max-height: calc(100dvh - 48px);
    overflow-y: auto;
    color: var(--ink);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--ink);
  }

  .header-titles {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .modal-title {
    font: 700 clamp(18px, 1.6vw, 22px) var(--font-headline);
    margin: 0;
    color: var(--ink);
  }

  .modal-subtitle {
    font: 600 clamp(11px, 0.9vw, 12px) var(--font-label);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ink-soft);
  }

  .close-x {
    background: none;
    border: none;
    font-size: 20px;
    color: var(--ink-soft);
    cursor: pointer;
    padding: 4px 8px;
  }

  .caution-banner {
    padding: 10px 14px;
    background: var(--gold-soft);
    border: 1.5px solid var(--ink);
    font: 500 12px/1.4 var(--font-ui);
    color: var(--ink);
  }

  .caution-banner strong {
    font-weight: 700;
  }

  .code-container {
    max-height: clamp(180px, 28vh, 320px);
    overflow-y: auto;
    border: 2px solid var(--ink);
    background: var(--paper);
  }

  .diag-preview {
    margin: 0;
    padding: 12px;
    font: 500 11px/1.4 monospace;
    color: var(--ink);
    white-space: pre-wrap;
    word-break: break-all;
  }

  .modal-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding-top: 8px;
    border-top: 1.5px solid var(--rule);
  }

  .github-btn {
    display: inline-block;
    padding: 8px 12px;
    background: var(--card-alt);
    border: 1.5px solid var(--ink);
    color: var(--ink);
    font: 600 12px var(--font-ui);
    text-decoration: none;
  }

  .footer-right {
    display: flex;
    gap: 8px;
  }

  .copy-btn {
    padding: 8px 14px;
    background: var(--alert);
    color: var(--paper);
    border: 2px solid var(--ink);
    box-shadow: 2px 2px 0 var(--ink);
    font: 700 13px var(--font-label);
    letter-spacing: 0.04em;
    cursor: pointer;
    text-transform: uppercase;
    transition: background 0.15s ease;
  }

  .copy-btn.copied {
    background: var(--sage);
  }

  .close-btn {
    padding: 8px 14px;
    background: var(--card);
    color: var(--ink);
    border: 2px solid var(--ink);
    box-shadow: 2px 2px 0 var(--ink);
    font: 700 13px var(--font-label);
    letter-spacing: 0.04em;
    cursor: pointer;
    text-transform: uppercase;
  }
</style>
