<script lang="ts">
  import type { Session } from '../app/session.svelte';
  import type { ScreenId } from '../app/screens';
  import ScreenLayout from '../ui/ScreenLayout.svelte';
  import {
    SECTOR_TARIFFS_CATALOG,
    TRADE_AGREEMENTS_CATALOG,
    TRADE_EXPOSED_STATES,
    type SectorTariffId,
    type TradeAgreementId,
  } from '../engine/trade';

  import type { ExplainerId } from '../content/explainers';
  import TradeoffPill from '../ui/TradeoffPill.svelte';

  let {
    session,
    question,
    go,
    onOpenMyth,
    onOpenExplainer,
  }: {
    session: Session;
    question: string;
    go?: (id: ScreenId) => void;
    onOpenMyth?: (mythId: string) => void;
    onOpenExplainer?: (explainerId: ExplainerId) => void;
  } = $props();

  const tradeBalance = $derived(session.tradeBalance);
  const effectiveTrade = $derived(session.effectiveTrade);
  const activeSectors = $derived(effectiveTrade.sectorTariffs);
  const activeAgreements = $derived(effectiveTrade.agreements);

  const isSectorActive = (id: SectorTariffId) => activeSectors.includes(id);
  const isAgreementActive = (id: TradeAgreementId) => activeAgreements.includes(id);

  const canAffordAgreement = (id: TradeAgreementId) => {
    if (isAgreementActive(id)) return true;
    const def = TRADE_AGREEMENTS_CATALOG.find((a) => a.id === id);
    return session.clout >= (def?.cloutCost ?? 0);
  };
</script>

<ScreenLayout {question}>
  {#snippet main()}
    <div class="trade-container">
      <!-- 1. Top Trade Balance Metrics Strip (TRADE-03) -->
      <section class="metrics-strip" aria-label="Trade balance and macro price indicators">
        <div class="metric-card card">
          <span class="label">🚢 US Exports</span>
          <span class="num">${tradeBalance.baseExportsBn.toFixed(1)}B</span>
          <span class="subtext">{session.vocabMode === 'wonk' ? 'Nominal goods & services' : 'Goods we sell abroad'}</span>
        </div>
        <div class="metric-card card">
          <span class="label">📦 US Imports</span>
          <span class="num">${tradeBalance.baseImportsBn.toFixed(1)}B</span>
          <span class="subtext">{session.vocabMode === 'wonk' ? 'Inbound commercial trade' : 'Goods we buy from abroad'}</span>
        </div>
        <div class="metric-card card">
          <span class="label">⚖️ Trade Deficit</span>
          <span class="num alert" class:positive={tradeBalance.netExportsBn >= 0}>
            {tradeBalance.netExportsBn >= 0 ? `+$${tradeBalance.netExportsBn.toFixed(1)}B` : `-$${tradeBalance.tradeDeficitBn.toFixed(1)}B`}
          </span>
          <span class="subtext">{tradeBalance.netExportsBn >= 0 ? 'Net trade surplus' : 'Net trade deficit'}</span>
        </div>
        <div class="metric-card card">
          <span class="label">🛒 Price Pass-Through</span>
          <span class="num">{tradeBalance.pricePassThroughPct > 0 ? `+${tradeBalance.pricePassThroughPct.toFixed(2)}%` : '0.00%'}</span>
          <span class="subtext">{session.vocabMode === 'wonk' ? 'CPI consumer inflation' : 'Store price impact on families'}</span>
        </div>
        <div class="metric-card card" class:highlight-alert={tradeBalance.retaliatoryRatePct > 0}>
          <span class="label">🪃 Foreign Retaliation</span>
          <span class="num" class:alert={tradeBalance.retaliatoryRatePct > 0}>
            {tradeBalance.retaliatoryRatePct.toFixed(1)}%
          </span>
          <span class="subtext">{session.vocabMode === 'wonk' ? 'Reciprocal foreign tariff rate' : 'Foreign pushback on US farms'}</span>
        </div>
      </section>

      <!-- 2. Strategic Sector Tariffs (TRADE-01) -->
      <section class="tariffs-section" aria-label="Strategic Sector Tariffs">
        <div class="section-header">
          <div class="header-titles">
            <span class="section-tag">
              {session.vocabMode === 'wonk' ? 'EXECUTIVE DIRECTIVES • STATUTORY AUTHORITIES' : '🛡️ PROTECT HOME FACTORIES • SOLO PRESIDENTIAL TARIFFS'}
            </span>
            <h3 class="section-title">Strategic Sector Tariffs</h3>
          </div>
          <span class="tariff-status-count">
            <b>{activeSectors.length}</b> of 3 active in force
          </span>
        </div>
        <p class="section-desc">
          {session.vocabMode === 'wonk'
            ? 'Targeted protective duties enacted under executive trade statutes to shield critical industries from state-subsidized dumping, foster domestic production capacity, and safeguard national security supply chains.'
            : 'Target specific foreign imports to protect American factory jobs — but watch out for higher store prices and foreign counter-tariffs on our farmers.'}
        </p>

        <div class="sector-grid">
          {#each SECTOR_TARIFFS_CATALOG as sector (sector.id)}
            {@const active = isSectorActive(sector.id)}
            <div class="sector-card card" class:active>
              <div class="card-head">
                <div class="title-group">
                  <span class="statutory-badge">{sector.statutoryBasis}</span>
                  <h4 class="sector-name">
                    <span aria-hidden="true">{sector.emoji}</span> {sector.name}
                  </h4>
                </div>
                <div class="rate-badge">+{sector.ratePct}% Duty</div>
              </div>

              <p class="sector-summary">{sector.description}</p>
              <p class="why-note"><b>💡 Why click:</b> {sector.whyClick}</p>

              <TradeoffPill
                variant="compact"
                upside={sector.upside}
                catchText={sector.catchText}
                whyClick={sector.whyClick}
                realTerm={sector.wonkLabel}
                legalBasis={sector.statutoryBasis}
                vocabMode={session.vocabMode}
              />

              <div class="impact-columns">
                <div class="impact-item benefit">
                  <span class="impact-label">Domestic Impact:</span>
                  <span class="impact-val">{sector.domesticBenefit}</span>
                </div>
                <div class="impact-item cost">
                  <span class="impact-label">Consumer Friction:</span>
                  <span class="impact-val">{sector.consumerImpact}</span>
                </div>
              </div>

              <div class="card-footer">
                <div class="retaliation-hint">
                  Retaliatory friction weight: <b>+{sector.retaliatoryWeight.toFixed(1)}%</b>
                </div>
                <button
                  type="button"
                  class="btn toggle-btn"
                  class:active-btn={active}
                  aria-pressed={active}
                  onclick={() => session.toggleSectorTariff(sector.id)}
                  data-testid={`toggle-sector-${sector.id}`}
                >
                  {active ? 'Repeal Sector Tariff' : 'Enact Sector Tariff'}
                </button>
              </div>
            </div>
          {/each}
        </div>
      </section>

      <!-- 3. Bilateral Trade Agreements (TRADE-02) -->
      <section class="agreements-section" aria-label="Bilateral Trade Agreements">
        <div class="section-header">
          <div class="header-titles">
            <span class="section-tag">
              {session.vocabMode === 'wonk' ? 'EXECUTIVE TRADE PACTS • MARKET ACCESS' : '🤝 OPEN FOREIGN MARKETS • COOL DOWN TRADE WARS'}
            </span>
            <h3 class="section-title">Bilateral Trade Agreements</h3>
          </div>
          <span class="agreement-status-count">
            <b>{activeAgreements.length}</b> ratified accords
          </span>
        </div>
        <p class="section-desc">
          {session.vocabMode === 'wonk'
            ? 'Negotiated bilateral frameworks that eliminate reciprocal tariffs, harmonize regulatory standards, and mitigate foreign counter-tariff retaliation on American farm and industrial exports.'
            : 'Spend Clout to strike trade deals with friendly regions, opening new buyers for US farms and calming down foreign tariff retaliation.'}
        </p>

        <div class="agreements-grid">
          {#each TRADE_AGREEMENTS_CATALOG as accord (accord.id)}
            {@const active = isAgreementActive(accord.id)}
            {@const affordable = canAffordAgreement(accord.id)}
            <div class="accord-card card" class:active>
              <div class="card-head">
                <div class="title-group">
                  <span class="partner-badge">{accord.partnerBloc}</span>
                  <h4 class="accord-name">
                    <span aria-hidden="true">{accord.emoji}</span> {accord.name}
                  </h4>
                </div>
                <div class="cost-badge" class:free={active}>
                  {active ? 'In Force' : `${accord.cloutCost} Clout`}
                </div>
              </div>

              <p class="accord-summary">{accord.description}</p>
              <p class="why-note"><b>💡 Why click:</b> {accord.whyClick}</p>

              <TradeoffPill
                variant="compact"
                upside={accord.upside}
                catchText={accord.catchText}
                whyClick={accord.whyClick}
                realTerm={accord.wonkLabel}
                legalBasis={accord.statutoryBasis}
                vocabMode={session.vocabMode}
              />

              <div class="impact-columns">
                <div class="impact-item benefit">
                  <span class="impact-label">Export Access:</span>
                  <span class="impact-val">{accord.economicBenefit}</span>
                </div>
                <div class="impact-item mitigation">
                  <span class="impact-label">Retaliation Mitigation:</span>
                  <span class="impact-val"><b>-{accord.retaliatoryMitigation.toFixed(1)}%</b> Foreign counter-tariff discount</span>
                </div>
              </div>

              <div class="card-footer">
                <span class="statutory-note">{accord.statutoryBasis}</span>
                <button
                  type="button"
                  class="btn accord-btn"
                  class:active-btn={active}
                  disabled={!active && !affordable}
                  aria-pressed={active}
                  onclick={() => session.toggleTradeAgreement(accord.id)}
                  data-testid={`toggle-agreement-${accord.id}`}
                >
                  {#if active}
                    Withdraw Accord
                  {:else if affordable}
                    Ratify Agreement ({accord.cloutCost} Clout)
                  {:else}
                    Requires {accord.cloutCost} Clout
                  {/if}
                </button>
              </div>
            </div>
          {/each}
        </div>
      </section>

      <!-- 4. State Export Exposure & Vulnerabilities (TRADE-03) -->
      <section class="exposure-section" aria-label="State Export Exposure and Agricultural Vulnerabilities">
        <div class="section-header">
          <div class="header-titles">
            <span class="section-tag">REGIONAL IMPACT • COMMODITY EXPOSURE</span>
            <h3 class="section-title">State Export Vulnerability Matrix</h3>
          </div>
          {#if tradeBalance.retaliatoryRatePct > 0}
            <span class="drag-warning alert">
              Foreign Retaliation: <b>-{tradeBalance.agExportDropPct.toFixed(1)}%</b> Farm & Industrial Drag
            </span>
          {:else}
            <span class="drag-warning safe">
              Trade Friction Contained (0.0% Retaliatory Drag)
            </span>
          {/if}
        </div>
        <p class="section-desc">
          Key agricultural and manufacturing states whose local economies face disproportionate risk when foreign trading partners
          enact reciprocal retaliatory tariffs on American commodities and machinery.
        </p>

        <!-- Accessible Table Fallback (TRADE-03) -->
        <div class="table-wrap card">
          <table class="exposure-table" aria-label="Export Exposed States and Vulnerability Levels">
            <thead>
              <tr>
                <th scope="col">State</th>
                <th scope="col">Vulnerable Sector</th>
                <th scope="col">State Export Concentration</th>
                <th scope="col">Tariff Retaliation Exposure</th>
              </tr>
            </thead>
            <tbody>
              {#each TRADE_EXPOSED_STATES as item (item.state)}
                {@const isAg = item.sector === 'agriculture'}
                <tr>
                  <td class="state-cell">
                    <b>{item.label}</b>
                  </td>
                  <td class="sector-cell">
                    <span class="sector-pill" class:ag={isAg} class:mfg={!isAg}>
                      {isAg ? 'Agriculture & Commodities' : 'Heavy Manufacturing & Tech'}
                    </span>
                  </td>
                  <td class="share-cell">{item.sharePct}% of state exports</td>
                  <td class="status-cell">
                    {#if tradeBalance.retaliatoryRatePct > 4}
                      <span class="badge-alert">Critical Risk (-{tradeBalance.agExportDropPct.toFixed(1)}%)</span>
                    {:else if tradeBalance.retaliatoryRatePct > 0}
                      <span class="badge-warn">Moderate Friction (-{tradeBalance.agExportDropPct.toFixed(1)}%)</span>
                    {:else}
                      <span class="badge-safe">Unfettered Market Access</span>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  {/snippet}

  {#snippet learn()}
    <button type="button" class="link" data-testid="how-it-works-btn" onclick={() => onOpenExplainer?.('trade')}>How tariffs &amp; trade work</button>
    <button type="button" class="ticket" onclick={() => onOpenMyth?.('trade_deficits')}>Myth? Foreign nations pay tariffs?</button>
  {/snippet}

  {#snippet next()}
    <div class="trade-sidebar">
      <div class="stance-card card">
        <span class="label">Trade Policy Stance</span>
        <h4 class="stance-title">Executive Trade Overview</h4>

        <div class="stance-metrics">
          <div class="stance-row">
            <span class="metric-label">General Tariff Lever:</span>
            <span class="metric-value"><b>{session.draft.budget.tar ?? session.current.policy.tar ?? 11}%</b></span>
          </div>
          <div class="stance-row">
            <span class="metric-label">Sector Tariffs in Force:</span>
            <span class="metric-value"><b>{activeSectors.length}</b> / 3</span>
          </div>
          <div class="stance-row">
            <span class="metric-label">Bilateral Accords:</span>
            <span class="metric-value"><b>{activeAgreements.length}</b> / 3</span>
          </div>
          <div class="stance-row">
            <span class="metric-label">Annual Customs Revenue:</span>
            <span class="metric-value positive"><b>+${tradeBalance.sectorRevenueBn.toFixed(1)}B/yr</b></span>
          </div>
          <div class="stance-row">
            <span class="metric-label">Export Growth Drag:</span>
            <span class="metric-value" class:alert={tradeBalance.exportGrowthDragPct > 0}>
              <b>{tradeBalance.exportGrowthDragPct > 0 ? `-${tradeBalance.exportGrowthDragPct.toFixed(2)}%` : '0.00%'}</b>
            </span>
          </div>
        </div>

        <p class="stance-hint">
          Sector tariffs generate customs revenues but elevate consumer prices and spark foreign retaliation unless balanced with bilateral trade accords.
        </p>
      </div>

      {#if onOpenMyth}
        <button
          type="button"
          class="mirage-lever-btn"
          data-testid="mirage-lever-trade"
          onclick={() => onOpenMyth?.('trade_deficits')}
        >
          ⚡ Bill Foreign Nations for Tariffs
        </button>
      {/if}

      <div class="nav-shortcuts card">
        <span class="label">Cross-Policy Levers</span>
        <div class="shortcut-buttons">
          {#if go}
            <button class="btn shortcut-btn" onclick={() => go('budget')}>
              Adjust General Tariffs in Budget →
            </button>
            <button class="btn shortcut-btn" onclick={() => go('economy')}>
              View Inflation & Macro Indicators →
            </button>
            <button class="btn shortcut-btn" onclick={() => go('voters')}>
              Check Farm & Industrial State Mood →
            </button>
          {/if}
        </div>
      </div>
    </div>
  {/snippet}
</ScreenLayout>

<style>
  .trade-container {
    display: flex;
    flex-direction: column;
    gap: clamp(16px, 2vh, 24px);
    padding-bottom: 24px;
  }

  /* Metrics strip */
  .metrics-strip {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: clamp(8px, 1vw, 14px);
  }
  .metric-card {
    padding: clamp(10px, 1.2vh, 14px);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .subtext {
    font: 500 clamp(11px, 0.8vw, 12px) var(--font-ui);
    color: var(--ink-soft);
  }
  .positive {
    color: var(--sage-dark) !important;
  }
  .alert {
    color: var(--alert) !important;
  }
  .highlight-alert {
    border-color: var(--alert) !important;
    background: var(--alert-tint) !important;
  }

  /* Section headers */
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 6px;
    border-bottom: 2px solid var(--ink);
    padding-bottom: 4px;
  }
  .header-titles {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .section-tag {
    font: 700 11px var(--font-ui);
    letter-spacing: 0.08em;
    color: var(--ink-soft);
    text-transform: uppercase;
  }
  .section-title {
    font: 700 clamp(18px, 1.6vw, 22px) var(--font-display);
    color: var(--ink);
    margin: 0;
  }
  .tariff-status-count, .agreement-status-count {
    font: 600 13px var(--font-ui);
    color: var(--ink-soft);
  }
  .section-desc {
    font: 400 clamp(13px, 0.95vw, 15px)/1.4 var(--font-body);
    color: var(--ink-soft);
    margin: 0 0 12px 0;
  }

  /* Sector Grid */
  .sector-grid, .agreements-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: clamp(12px, 1.2vw, 16px);
  }
  .sector-card, .accord-card {
    padding: clamp(12px, 1.4vh, 16px);
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: transform var(--dur-fast), border-color var(--dur-fast);
  }
  .sector-card.active, .accord-card.active {
    border-color: var(--ink);
    background: var(--card);
    box-shadow: 4px 4px 0 var(--gold-dark);
  }
  .card-head {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 8px;
  }
  .title-group {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .statutory-badge, .partner-badge {
    font: 700 10px var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ink-soft);
    background: var(--ink-tint);
    padding: 2px 6px;
    border-radius: 4px;
    display: inline-block;
    max-width: fit-content;
  }
  .sector-name, .accord-name {
    font: 700 clamp(15px, 1.2vw, 17px)/1.2 var(--font-ui);
    color: var(--ink);
    margin: 0;
  }
  .rate-badge {
    font: 700 12px var(--font-ui);
    background: var(--ink);
    color: var(--card);
    padding: 3px 8px;
    border-radius: 6px;
    white-space: nowrap;
  }
  .cost-badge {
    font: 700 12px var(--font-ui);
    background: var(--gold-dark);
    color: var(--card);
    padding: 3px 8px;
    border-radius: 6px;
    white-space: nowrap;
  }
  .cost-badge.free {
    background: var(--sage-dark);
  }
  .sector-summary, .accord-summary {
    font: 400 13px/1.35 var(--font-body);
    color: var(--ink);
    margin: 0;
  }
  .why-note {
    font: 500 12px/1.3 var(--font-body);
    color: var(--ink);
    background: var(--paper-dark);
    padding: 5px 8px;
    border-radius: 4px;
    margin: 0;
  }
  .impact-columns {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: var(--dot);
    padding: 8px 10px;
    border-radius: 6px;
  }
  .impact-item {
    font: 400 12px/1.3 var(--font-body);
    color: var(--ink);
  }
  .impact-label {
    font-weight: 700;
    font-family: var(--font-ui);
    margin-right: 4px;
  }
  .impact-item.benefit .impact-label {
    color: var(--sage-dark);
  }
  .impact-item.cost .impact-label {
    color: var(--alert);
  }
  .impact-item.mitigation .impact-label {
    color: var(--sky);
  }

  .card-footer {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: auto;
    padding-top: 8px;
    border-top: 1px dashed var(--ink-soft);
  }
  .retaliation-hint, .statutory-note {
    font: 500 11px var(--font-ui);
    color: var(--ink-soft);
  }
  .toggle-btn, .accord-btn {
    width: 100%;
    text-align: center;
    justify-content: center;
  }
  .active-btn {
    background: var(--alert-dark);
    color: var(--card);
    box-shadow: 2px 2px 0 var(--ink);
  }

  /* Table styling */
  .table-wrap {
    overflow-x: auto;
    padding: 12px;
  }
  .exposure-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    text-align: left;
  }
  .exposure-table th {
    font: 700 12px var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ink-soft);
    padding: 8px 12px;
    border-bottom: 2px solid var(--ink);
  }
  .exposure-table td {
    padding: 10px 12px;
    border-bottom: 1px solid var(--dot);
    vertical-align: middle;
  }
  .sector-pill {
    font: 600 11px var(--font-ui);
    padding: 2px 8px;
    border-radius: 12px;
    display: inline-block;
  }
  .sector-pill.ag {
    background: var(--sage-tint);
    color: var(--sage-dark);
    border: 1px solid var(--sage);
  }
  .sector-pill.mfg {
    background: var(--ink-tint);
    color: var(--ink);
    border: 1px solid var(--ink-soft);
  }
  .badge-alert {
    font: 700 11px var(--font-ui);
    background: var(--alert-tint);
    color: var(--alert-dark);
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid var(--alert);
  }
  .badge-warn {
    font: 700 11px var(--font-ui);
    background: var(--card);
    color: var(--gold-dark);
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid var(--gold-dark);
  }
  .badge-safe {
    font: 700 11px var(--font-ui);
    background: var(--sage-tint);
    color: var(--sage-dark);
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid var(--sage);
  }
  .drag-warning {
    font: 700 13px var(--font-ui);
    padding: 4px 10px;
    border-radius: 6px;
  }
  .drag-warning.safe {
    background: var(--sage-tint);
    color: var(--sage-dark);
    border: 1px solid var(--sage);
  }

  /* Sidebar */
  .trade-sidebar {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .mirage-lever-btn {
    padding: 3px 8px;
    font: 700 11px/1.1 var(--font-ui);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: var(--paper);
    color: var(--alert-dark);
    border: 1.5px solid var(--alert);
    border-radius: var(--r-sm);
    box-shadow: 1px 1px 0 var(--ink);
    cursor: pointer;
    white-space: nowrap;
    align-self: flex-start;
    transition: transform var(--dur-fast), background var(--dur-fast);
  }
  .mirage-lever-btn:hover {
    background: var(--gold);
    color: var(--ink);
    transform: translateY(-1px);
  }
  .stance-card, .nav-shortcuts {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .stance-title {
    font: 700 17px var(--font-display);
    color: var(--ink);
    margin: 0;
  }
  .stance-metrics {
    display: flex;
    flex-direction: column;
    gap: 6px;
    background: var(--dot);
    padding: 10px;
    border-radius: 6px;
  }
  .stance-row {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
  }
  .metric-label {
    font-family: var(--font-ui);
    color: var(--ink-soft);
  }
  .stance-hint {
    font: 400 12px/1.35 var(--font-body);
    color: var(--ink-soft);
    margin: 0;
  }
  .shortcut-buttons {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .shortcut-btn {
    width: 100%;
    text-align: left;
    font-size: 13px;
  }
</style>
