<script lang="ts">
  import Overlay from './Overlay.svelte';

  let {
    onClose,
    onOpenReport,
  }: {
    onClose: () => void;
    onOpenReport?: () => void;
  } = $props();
</script>

<Overlay title="About govSim & Privacy" {onClose}>
  <div class="about-modal" data-testid="about-modal">
    <header class="about-header">
      <div class="header-titles">
        <h2 class="about-title">About govSim</h2>
        <span class="about-subtitle">Nonpartisan, Educational, Institutional Strategy Simulation</span>
      </div>
      <button type="button" class="close-x" onclick={onClose} aria-label="Close dialog">✕</button>
    </header>

    <div class="about-body">
      <!-- Left Column: Mission, Sources, Privacy, Credits -->
      <div class="about-left">
        <section class="about-section">
          <h3 class="sec-h">Mission & Simulation Philosophy</h3>
          <p class="sec-p">
            govSim is an institutional policy simulation modeling the macroeconomy, federal budget, presidential powers,
            and democratic accountability. You govern as President across four-year terms, balancing growth, debt,
            unemployment, inflation, and public approval against congressional politics and historic crises.
          </p>
        </section>

        <section class="about-section">
          <h3 class="sec-h">Model Data & Official Sources</h3>
          <p class="sec-p">
            Data, fiscal rules, and baseline indicators are calibrated against published methodologies from the
            Congressional Budget Office (CBO), Bureau of Economic Analysis (BEA), Bureau of Labor Statistics (BLS),
            and the Federal Reserve System. All economic trade-offs are grounded in empirical institutional research.
          </p>
        </section>

        <section class="about-section privacy-card">
          <div class="privacy-badge">ZERO TELEMETRY · ZERO TRACKING</div>
          <h3 class="sec-h">Privacy & Client-Side Storage</h3>
          <p class="sec-p">
            govSim stores all game saves and history locally in your browser (localStorage). No tracking cookies,
            analytics pixels, or personal data collection exist in this game. Hetzner/Coolify web server access logs and
            Cloudflare R2 static asset delivery logs are kept strictly for operational reliability. See PRIVACY.md for
            our full policy.
          </p>
        </section>

        <section class="about-section credits-sec">
          <h3 class="sec-h">Credits & Open Licenses</h3>
          <ul class="credits-list">
            <li><strong>Typefaces:</strong> Atkinson Hyperlegible (Braille Institute) &amp; Rokkitt (Vernon Adams) under SIL Open Font License 1.1 (OFL-1.1).</li>
            <li><strong>Design &amp; Content:</strong> Creative Commons Attribution 4.0 International (CC BY 4.0).</li>
            <li><strong>Software:</strong> MIT License. Full source code freely auditable.</li>
          </ul>
        </section>
      </div>

      <!-- Right Column: Actions & External Links -->
      <aside class="about-right">
        <div class="action-card card">
          <h4 class="act-title">Diagnostics & Community</h4>
          <p class="act-p">
            Encountered a bug, calculation discrepancy, or layout issue? Generate a diagnostic bundle without sending any data over the network.
          </p>
          {#if onOpenReport}
            <button
              type="button"
              class="report-btn"
              data-testid="about-report-btn"
              onclick={() => {
                onClose();
                onOpenReport();
              }}
            >
              Report a Problem
            </button>
          {/if}
          <a
            href="https://github.com/brbrainerd/govSim"
            target="_blank"
            rel="noopener noreferrer"
            class="github-link"
            data-testid="about-github-link"
          >
            View Source Code on GitHub ↗
          </a>
        </div>

        <button
          type="button"
          class="stamp-btn primary-stamp"
          data-testid="about-close-btn"
          onclick={onClose}
        >
          CLOSE
        </button>
      </aside>
    </div>
  </div>
</Overlay>

<style>
  .about-modal {
    display: flex;
    flex-direction: column;
    gap: clamp(10px, 1.5vh, 18px);
    max-height: calc(100dvh - 48px);
    overflow-y: auto;
    color: var(--ink);
  }

  .about-header {
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

  .about-title {
    font: 700 clamp(20px, 1.8vw, 24px) var(--font-headline);
    margin: 0;
    color: var(--ink);
    letter-spacing: -0.01em;
  }

  .about-subtitle {
    font: 600 clamp(12px, 0.9vw, 13px) var(--font-label);
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

  .close-x:hover {
    color: var(--ink);
  }

  .about-body {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(240px, 1fr);
    gap: clamp(14px, 2vw, 24px);
  }

  .about-left {
    display: flex;
    flex-direction: column;
    gap: clamp(10px, 1.4vh, 16px);
  }

  .about-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .sec-h {
    font: 700 14px var(--font-label);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
    color: var(--ink);
  }

  .sec-p {
    font: 400 13px/1.45 var(--font-body);
    margin: 0;
    color: var(--ink);
  }

  .privacy-card {
    background: var(--card-alt);
    border: 1.5px solid var(--ink);
    padding: 12px;
    border-radius: 4px;
    gap: 6px;
  }

  .privacy-badge {
    align-self: flex-start;
    padding: 2px 8px;
    background: var(--ink);
    color: var(--paper);
    font: 700 11px var(--font-label);
    letter-spacing: 0.06em;
    border-radius: 3px;
  }

  .credits-list {
    margin: 4px 0 0 16px;
    padding: 0;
    font: 400 12px/1.4 var(--font-body);
    color: var(--ink);
  }

  .about-right {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 16px;
  }

  .action-card {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    background: var(--card-alt);
    border: 1.5px solid var(--ink);
  }

  .act-title {
    font: 700 13px var(--font-label);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
    color: var(--ink);
  }

  .act-p {
    font: 400 12px/1.4 var(--font-body);
    margin: 0;
    color: var(--ink-soft);
  }

  .report-btn {
    padding: 8px 12px;
    background: var(--gold-soft);
    color: var(--ink);
    border: 2px solid var(--ink);
    box-shadow: 2px 2px 0 var(--ink);
    font: 700 12px var(--font-label);
    letter-spacing: 0.04em;
    cursor: pointer;
    text-transform: uppercase;
    text-align: center;
  }

  .github-link {
    display: inline-block;
    padding: 6px 10px;
    background: var(--paper);
    color: var(--ink);
    border: 1.5px solid var(--ink);
    font: 600 12px var(--font-ui);
    text-decoration: none;
    text-align: center;
  }

  .stamp-btn {
    padding: 10px 16px;
    background: var(--alert);
    color: var(--paper);
    border: 2px solid var(--ink);
    box-shadow: 2px 2px 0 var(--ink);
    font: 700 14px var(--font-label);
    letter-spacing: 0.06em;
    cursor: pointer;
    text-transform: uppercase;
  }
</style>
