<script lang="ts">
  import { sim, navigate, pct, tickToDate, formatMoney } from "$lib/store.svelte";
  import { PARTY_LABELS, CRISIS_LABELS, decodeCivicRights, CIVIC_RIGHTS,
           grantCivicRight, revokeCivicRight } from "$lib/ipc";
  import { toast }     from "$lib/toasts.svelte";
  import { beginLoad, endLoad } from "$lib/store.svelte";
  import LineChart                                           from "../components/LineChart.svelte";

  // Derived approval trend series from the metric ring-buffer.
  // Uses raw [0,1] fractions — yFormatter={pct} handles display, matching
  // all other approval/margin charts in the app.
  const approvalSeries = $derived([{
    name: "Approval",
    data: sim.metricsRows.map(r => r.approval),
  }]);

  const electionMarginSeries = $derived([{
    name: "Election margin",
    data: sim.metricsRows.map(r => r.election_margin),
  }]);

  const approvalLabels = $derived(sim.metricsRows.map(r => tickToDate(r.tick)));

  // Mark law enactments on the approval chart (same logic as Dashboard).
  const lawMarkLines = $derived(
    sim.laws
      .filter(l => !l.repealed)
      .map(l => {
        const row = sim.metricsRows.find(r => r.tick === l.enacted_tick);
        return row
          ? { x: tickToDate(l.enacted_tick), label: `Law #${l.id}`, color: "var(--color-warning)" }
          : null;
      })
      .filter((m): m is NonNullable<typeof m> => m !== null)
  );

  const cs = $derived(sim.currentState);

  const partyLabel = $derived(cs ? (PARTY_LABELS[cs.incumbent_party] ?? "Unknown") : "—");
  const partyColor = $derived(cs
    ? cs.incumbent_party === 1 ? "#6366f1"
    : cs.incumbent_party === 2 ? "#ef4444"
    : "var(--muted)"
    : "var(--muted)");

  const ticksSinceElection = $derived(cs ? sim.tick - cs.last_election_tick : null);
  const approvalOk         = $derived(cs ? cs.approval > 0.5 : null);

  // ── Term progress ─────────────────────────────────────────────────────────
  // Use the authoritative election_cycle field from the backend (always 360 currently).
  const estimatedTermLength = $derived(cs ? cs.election_cycle : 360);

  const termProgressPct = $derived(
    ticksSinceElection !== null
      ? Math.min(100, Math.round((ticksSinceElection / estimatedTermLength) * 100))
      : null
  );

  const ticksUntilElection = $derived(
    ticksSinceElection !== null
      ? Math.max(0, estimatedTermLength - ticksSinceElection)
      : null
  );
  const electionForecast   = $derived(cs
    ? cs.approval > 0.6 ? "Likely re-elected"
    : cs.approval > 0.4 ? "Competitive"
    : "Likely ousted"
    : "—");
  const forecastColor = $derived(cs
    ? cs.approval > 0.6 ? "var(--good)"
    : cs.approval > 0.4 ? "var(--warn)"
    : "var(--danger)"
    : "var(--muted)");

  // Recent elections inferred from metrics: look for ticks where election_margin changes.
  interface ElectionRecord {
    tick:             number;
    incumbent_party:  number;
    margin:           number;
    consecutive_terms: number;
  }

  const electionHistory = $derived((() => {
    const rows = sim.metricsRows;
    const records: ElectionRecord[] = [];
    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1];
      const curr = rows[i];
      // Detect election event: incumbent changes OR consecutive_terms increases.
      if (
        prev.incumbent_party !== curr.incumbent_party ||
        prev.consecutive_terms !== curr.consecutive_terms
      ) {
        records.push({
          tick:              curr.tick,
          incumbent_party:   curr.incumbent_party,
          margin:            curr.election_margin,
          consecutive_terms: curr.consecutive_terms,
        });
      }
    }
    return records.slice(-10).reverse(); // Most recent first, max 10
  })());

  // ── Crisis history ────────────────────────────────────────────────────────
  interface CrisisRecord {
    tick:      number;
    kind:      number;
    /** Approximate duration: ticks until crisis_kind returns to 0. */
    duration:  number;
  }

  const crisisHistory = $derived((() => {
    const rows = sim.metricsRows;
    const records: CrisisRecord[] = [];
    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1];
      const curr = rows[i];
      // Onset: crisis_kind transitions from 0 (None) to non-zero.
      if (prev.crisis_kind === 0 && curr.crisis_kind !== 0) {
        // Scan forward to find when the crisis ends.
        let endTick = curr.tick;
        for (let j = i + 1; j < rows.length; j++) {
          if (rows[j].crisis_kind === 0) { endTick = rows[j].tick; break; }
          endTick = rows[j].tick; // still active at last known row
        }
        records.push({ tick: curr.tick, kind: curr.crisis_kind, duration: endTick - curr.tick });
      }
    }
    return records.slice(-10).reverse(); // Most recent first, max 10
  })());

  // ── Rights granted-at timeline ────────────────────────────────────────────
  // Scan the metric ring-buffer to find the first tick at which each right bit
  // was set. Returns a Record<bit, tick> (undefined = right not yet granted).
  const rightsGrantedAt = $derived.by((): Record<number, number> => {
    const result: Record<number, number> = {};
    for (const row of sim.metricsRows) {
      for (const r of CIVIC_RIGHTS) {
        if (!(r.bit in result) && (row.rights_granted_bits & r.bit) !== 0) {
          result[r.bit] = row.tick;
        }
      }
    }
    return result;
  });

  // ── Rights actions ────────────────────────────────────────────────────────
  let rightsWorking = $state(false);

  async function handleGrant(bit: number, label: string) {
    if (rightsWorking || !sim.currentState) return;
    rightsWorking = true;
    beginLoad();
    try {
      const newBits = await grantCivicRight(bit);
      if (sim.currentState) sim.currentState.rights_granted_bits = newBits;
      toast.success(`${label} granted at tick ${sim.tick}.`);
    } catch (e) {
      toast.error(e, "Failed to grant right");
    } finally {
      rightsWorking = false;
      endLoad();
    }
  }

  async function handleRevoke(bit: number, label: string) {
    if (rightsWorking || !sim.currentState) return;
    rightsWorking = true;
    beginLoad();
    try {
      const [newBits, debt] = await revokeCivicRight(bit);
      if (sim.currentState) sim.currentState.rights_granted_bits = newBits;
      if (debt > 0) {
        toast.warning(`${label} revoked — legitimacy debt +${debt.toFixed(1)}.`);
      } else {
        toast.info(`${label} revoked (was not previously held; no debt).`);
      }
    } catch (e) {
      toast.error(e, "Failed to revoke right");
    } finally {
      rightsWorking = false;
      endLoad();
    }
  }
</script>

<div class="election-view">
  <div class="page-header">
    <h1>Elections</h1>
    <span class="tick-badge">tick {sim.tick} · {tickToDate(sim.tick)}</span>
  </div>

  {#if !cs}
  <div class="empty-msg">Load a scenario to view election data.</div>
  {:else}

  <!-- ── Summary cards ── -->
  <div class="summary-grid">
    <div class="card party-card">
      <span class="card-label">Incumbent Party</span>
      <span class="card-value" style="color:{partyColor}">{partyLabel}</span>
      <span class="card-sub">{cs.consecutive_terms} consecutive term{cs.consecutive_terms !== 1 ? "s" : ""}</span>
    </div>
    <div class="card">
      <span class="card-label">Last Election</span>
      <span class="card-value">tick {cs.last_election_tick}</span>
      <span class="card-sub">{tickToDate(cs.last_election_tick)}</span>
    </div>
    <div class="card">
      <span class="card-label">Victory Margin</span>
      <span class="card-value" style="color:{cs.election_margin > 0.15 ? 'var(--good)' : 'var(--warn)'}">
        {pct(cs.election_margin)}
      </span>
      <span class="card-sub">of the vote</span>
    </div>
    <div class="card">
      <span class="card-label">Ticks Since Election</span>
      <span class="card-value">{ticksSinceElection ?? "—"}</span>
      <span class="card-sub">{ticksSinceElection !== null ? tickToDate(sim.tick - (ticksSinceElection ?? 0)) : ""}</span>
    </div>
    <div class="card">
      <span class="card-label">Current Approval</span>
      <span class="card-value" style="color:{cs.approval > 0.5 ? 'var(--good)' : cs.approval > 0.35 ? 'var(--warn)' : 'var(--danger)'}">
        {pct(cs.approval)}
      </span>
      <span class="card-sub">{approvalOk ? "Above majority" : "Below majority"}</span>
    </div>
    <div class="card forecast-card">
      <span class="card-label">Re-election Forecast</span>
      <span class="card-value" style="color:{forecastColor}">{electionForecast}</span>
      <span class="card-sub">based on approval</span>
    </div>
  </div>

  <!-- ── Term progress ── -->
  {#if termProgressPct !== null}
  <section class="section term-section">
    <div class="term-header">
      <h2 class="section-title" style="margin-bottom:0">Term Progress</h2>
      <span class="term-meta">
        {ticksSinceElection} / ~{estimatedTermLength} ticks
        {#if ticksUntilElection !== null && ticksUntilElection > 0}
          · ~{ticksUntilElection} until next election ({tickToDate(sim.tick + ticksUntilElection)})
        {:else if ticksUntilElection === 0}
          · <strong style="color:var(--warn)">Election due!</strong>
        {/if}
      </span>
    </div>
    <div class="term-bar-track" role="progressbar" aria-valuenow={termProgressPct} aria-valuemin={0} aria-valuemax={100} aria-label="Term progress">
      <div
        class="term-bar-fill"
        style="width:{termProgressPct}%; background:{termProgressPct > 85 ? 'var(--danger)' : termProgressPct > 60 ? 'var(--warn)' : 'var(--accent)'}"
      ></div>
    </div>
    <div class="term-bar-labels">
      <span>Elected · tick {cs.last_election_tick}</span>
      <span>{termProgressPct}% of term</span>
      <span>~Next · {tickToDate(cs.last_election_tick + estimatedTermLength)}</span>
    </div>
    <p class="term-note">Election cycle: {estimatedTermLength} ticks = 1 simulated year.</p>
  </section>
  {/if}

  <!-- ── Approval trend chart ── -->
  <section class="section">
    <h2 class="section-title">Approval Over Time</h2>
    <div class="chart-wrap">
      <LineChart
        series={approvalSeries}
        xLabels={approvalLabels}
        yMin={0}
        yMax={1}
        yFormatter={pct}
        height="160px"
        markLines={lawMarkLines}
      />
    </div>
  </section>

  <!-- ── Election margin trend ── -->
  <section class="section">
    <h2 class="section-title">Election Margin Over Time</h2>
    <div class="chart-wrap">
      <LineChart
        series={electionMarginSeries}
        xLabels={approvalLabels}
        yMin={0}
        yMax={1}
        yFormatter={pct}
        height="120px"
        yMarkLines={[{y: 0.05, label: "< 5% (razor-thin)", color: "var(--color-danger)"}]}
      />
    </div>
  </section>

  <!-- ── Election history table ── -->
  {#if electionHistory.length > 0}
  <section class="section">
    <h2 class="section-title">Detected Elections</h2>
    <table class="hist-table">
      <thead>
        <tr>
          <th>Tick</th>
          <th>Date</th>
          <th>Winner</th>
          <th>Terms</th>
          <th>Margin</th>
        </tr>
      </thead>
      <tbody>
        {#each electionHistory as ev}
        <tr>
          <td>{ev.tick}</td>
          <td>{tickToDate(ev.tick)}</td>
          <td style="color:{ev.incumbent_party === 1 ? '#6366f1' : '#ef4444'}">
            {PARTY_LABELS[ev.incumbent_party] ?? "Unknown"}
          </td>
          <td>{ev.consecutive_terms}</td>
          <td style="color:{ev.margin > 0.15 ? 'var(--good)' : 'var(--warn)'}">
            {pct(ev.margin)}
          </td>
        </tr>
        {/each}
      </tbody>
    </table>
    <p class="table-note">Elections detected from tick-to-tick party or term changes in the metric history.</p>
  </section>
  {/if}

  <!-- ── Crisis history ── -->
  {#if cs.crisis_kind !== 0}
  <section class="section crisis-active-banner">
    <span class="crisis-icon">⚠</span>
    <span>
      <strong>{CRISIS_LABELS[cs.crisis_kind] ?? "Crisis"} in progress</strong>
      — {cs.crisis_remaining_ticks} ticks remaining
    </span>
  </section>
  {/if}

  {#if crisisHistory.length > 0}
  <section class="section">
    <h2 class="section-title">Crisis History</h2>
    <table class="hist-table">
      <thead>
        <tr>
          <th>Tick</th>
          <th>Date</th>
          <th>Crisis</th>
          <th>Duration</th>
        </tr>
      </thead>
      <tbody>
        {#each crisisHistory as ev}
        <tr>
          <td>{ev.tick}</td>
          <td>{tickToDate(ev.tick)}</td>
          <td class="crisis-kind">{CRISIS_LABELS[ev.kind] ?? "Unknown"}</td>
          <td>{ev.duration} ticks</td>
        </tr>
        {/each}
      </tbody>
    </table>
    <p class="table-note">Crises detected from crisis_kind onset transitions in the metric history.</p>
  </section>
  {/if}

  <!-- ── Legitimacy + rights ── -->
  <section class="section">
    <h2 class="section-title">Governance Quality</h2>
    <div class="quality-grid">
      <div class="quality-item">
        <span class="q-label">Legitimacy Debt</span>
        <span class="q-value" style="color:{cs.legitimacy_debt > 0.5 ? 'var(--danger)' : cs.legitimacy_debt > 0.1 ? 'var(--warn)' : 'var(--good)'}">
          {cs.legitimacy_debt.toFixed(3)}
        </span>
      </div>
      <div class="quality-item">
        <span class="q-label">Rights Granted</span>
        <span class="q-value">
          {decodeCivicRights(cs.rights_granted_bits).filter(r => r.granted).length} / 9
        </span>
      </div>
      <div class="quality-item">
        <span class="q-label">Unemployment</span>
        <span class="q-value" style="color:{cs.unemployment > 0.1 ? 'var(--danger)' : 'var(--good)'}">
          {pct(cs.unemployment)}
        </span>
      </div>
      <div class="quality-item">
        <span class="q-label">GDP / capita</span>
        <span class="q-value">{formatMoney(cs.gdp / Math.max(cs.population, 1))}</span>
      </div>
    </div>
  </section>

  <!-- ── Civic Rights Ledger ── -->
  <section class="section">
    <h2 class="section-title">Civic Rights Ledger</h2>
    <div class="rights-grid">
      {#each decodeCivicRights(cs.rights_granted_bits) as right, i (right.label)}
      {@const bit = CIVIC_RIGHTS[i]?.bit ?? 0}
      {@const grantedTick = rightsGrantedAt[bit]}
      <div class="right-item" class:right-granted={right.granted} class:right-withheld={!right.granted} title={right.description}>
        <span class="right-icon" aria-hidden="true">{right.granted ? "✓" : "✗"}</span>
        <div class="right-body">
          <span class="right-label">{right.label}</span>
          {#if right.granted && grantedTick !== undefined}
          <span class="right-since">since {tickToDate(grantedTick)}</span>
          {:else if !right.granted}
          <span class="right-since">not granted</span>
          {/if}
        </div>
        {#if right.granted}
        <button
          class="right-action right-revoke"
          onclick={() => handleRevoke(bit, right.label)}
          disabled={rightsWorking}
          title="Revoke this right (+0.5 legitimacy debt)"
          aria-label="Revoke {right.label}"
        >✕</button>
        {:else}
        <button
          class="right-action right-grant"
          onclick={() => handleGrant(bit, right.label)}
          disabled={rightsWorking}
          title="Grant this right"
          aria-label="Grant {right.label}"
        >+</button>
        {/if}
      </div>
      {/each}
    </div>
    <p class="table-note">
      Granting rights boosts approval; revoking previously granted rights increases Legitimacy Debt.
    </p>
  </section>

  {/if}
</div>

<style>
.election-view { max-width: 900px; }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
h1 { font-size: 20px; font-weight: 700; }
.tick-badge { font-size: 12px; color: var(--muted); }
.empty-msg { text-align: center; color: var(--muted); padding: 60px 0; }

/* Summary cards */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.card-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .4px; }
.card-value  { font-size: 20px; font-weight: 700; line-height: 1.1; }
.card-sub    { font-size: 11px; color: var(--muted); }
.party-card  { border-left: 3px solid; }
.forecast-card { border-left: 3px solid var(--accent); }

/* Sections */
.section { margin-bottom: 24px; }
.section-title { font-size: 13px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .5px; margin-bottom: 10px; }

/* Term progress */
.term-section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; }
.term-header  { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 6px; }
.term-meta    { font-size: 12px; color: var(--muted); }
.term-bar-track {
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 6px;
}
.term-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 300ms ease;
}
.term-bar-labels {
  display: flex;
  justify-content: space-between;
  font-size: 10px;
  color: var(--muted);
}
.term-note { font-size: 11px; color: var(--muted); margin-top: 8px; font-style: italic; }
.chart-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px; }

/* History table */
.hist-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 6px;
}
.hist-table th {
  text-align: left;
  padding: 10px 14px;
  font-size: 11px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: .4px;
  border-bottom: 1px solid var(--border);
}
.hist-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
}
.hist-table tr:last-child td { border-bottom: none; }
.table-note { font-size: 11px; color: var(--muted); }

/* Governance quality */
.quality-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}
.quality-item {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.q-label { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .4px; }
.q-value  { font-size: 18px; font-weight: 700; }

/* Civic Rights Ledger */
.rights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}
.right-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  font-size: 13px;
}
.right-granted {
  background: rgba(34, 197, 94, .08);
  border-color: rgba(34, 197, 94, .3);
}
.right-withheld {
  background: transparent;
  opacity: .55;
}
.right-icon {
  font-size: 14px;
  font-weight: 700;
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}
.right-granted .right-icon { color: var(--good); }
.right-withheld .right-icon { color: var(--muted); }
.right-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
.right-label { font-weight: 500; }
.right-since { font-size: 10px; color: var(--muted); }
.right-action {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin-left: auto;
  transition: opacity .12s;
}
.right-action:disabled { opacity: .4; cursor: default; }
.right-grant {
  background: rgba(34,197,94,.12);
  border-color: rgba(34,197,94,.4);
  color: var(--good);
}
.right-grant:hover:not(:disabled) { background: rgba(34,197,94,.25); }
.right-revoke {
  background: rgba(239,68,68,.08);
  border-color: rgba(239,68,68,.3);
  color: var(--danger);
}
.right-revoke:hover:not(:disabled) { background: rgba(239,68,68,.2); }

/* Crisis */
.crisis-active-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(239, 68, 68, .08);
  border: 1px solid rgba(239, 68, 68, .35);
  border-radius: var(--radius);
  padding: 10px 14px;
  font-size: 13px;
  color: var(--danger);
}
.crisis-icon { font-size: 18px; }
.crisis-kind { font-weight: 600; }
</style>
