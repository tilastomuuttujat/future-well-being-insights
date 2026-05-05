/**
 * Ilmiöverkon vanilla-D3-toteutus lukijaversiolle.
 * Lukee data/ilmiot.json (paistettu build-scripts/-skriptillä).
 * Replikoi alkuperäisen prototyypin "kuminauha"-tunnun: drag reheattaa
 * simulaation, partikkelit virtaavat aktiivisilla linkeillä.
 */

const DATA_URL = "./data/ilmiot.json";

// ── Engine (kopio editorin data.ts:n simulate-funktiosta) ─────
const DAMPING = 0.55;
const CHAIN_ITER = 2;

function timeFactor(lag, t) {
  const denom = Math.max(lag, 3);
  return Math.max(0, Math.min(1, 1 - Math.abs(lag - t) / denom));
}

function clampPhenom(v, key, PHENOMENA) {
  const ph = PHENOMENA[key];
  return Math.max(ph.base * 0.05, Math.min(ph.base * 3.5, v));
}

function simulate(vars, t, D) {
  const { PHENOMENA, DRIVERS, LINKS, PHENOM_LINKS } = D;
  const phenom = {};
  for (const k of Object.keys(PHENOMENA)) phenom[k] = PHENOMENA[k].base;

  for (const lnk of LINKS) {
    const d = DRIVERS[lnk.from];
    if (!d) continue;
    const norm = (vars[lnk.from] - d.base) / (d.max - d.min);
    const tf = timeFactor(lnk.lag, t);
    phenom[lnk.to] += norm * lnk.weight * Math.abs(PHENOMENA[lnk.to].base) * tf;
  }
  for (const k of Object.keys(phenom)) phenom[k] = clampPhenom(phenom[k], k, PHENOMENA);

  for (let it = 0; it < CHAIN_ITER; it++) {
    const upd = {};
    for (const lnk of PHENOM_LINKS) {
      const fromBase = Math.abs(PHENOMENA[lnk.from].base);
      const normDelta = (phenom[lnk.from] - PHENOMENA[lnk.from].base) / fromBase;
      const impact = normDelta * lnk.weight * DAMPING * Math.abs(PHENOMENA[lnk.to].base);
      upd[lnk.to] = (upd[lnk.to] ?? 0) + impact;
    }
    for (const k of Object.keys(upd)) {
      phenom[k] = clampPhenom(phenom[k] + upd[k], k, PHENOMENA);
    }
  }
  return phenom;
}

// ── Driver-formaatti (rakennetaan unitin perusteella) ─────────
function fmtValue(d, v) {
  if (d.unit === "%") return `${v > 0 && d.base === 1.0 ? "+" : ""}${v.toFixed(1)} %`;
  if (d.unit === "ind") return v.toFixed(2);
  return v.toFixed(1);
}

// ── App ───────────────────────────────────────────────────────
async function main() {
  const D = await fetch(DATA_URL).then((r) => r.json());
  const { phenomena: PHENOMENA, drivers: DRIVERS, links: LINKS,
          phenomLinks: PHENOM_LINKS, scenarios: SCENARIOS, confMeta: CONF_META } = D;

  const dataRefs = { PHENOMENA, DRIVERS, LINKS, PHENOM_LINKS };

  // State
  const vars = {};
  for (const [k, d] of Object.entries(DRIVERS)) vars[k] = d.base;
  let t = 6;
  let activeScenario = null;

  // ── Driver panel ────────────────────────────────────────────
  const driversEl = document.getElementById("drivers");
  function renderDrivers() {
    driversEl.innerHTML = "";
    for (const [id, d] of Object.entries(DRIVERS)) {
      const v = vars[id];
      const changed = Math.abs(v - d.base) > 1e-3;
      const row = document.createElement("div");
      row.className = "driver-row" + (changed ? " changed" : "");
      row.innerHTML = `
        <div class="label">
          <span class="name">${d.label}</span>
          <span class="val">${fmtValue(d, v)}</span>
        </div>
        <input type="range" min="${d.min}" max="${d.max}" step="${d.step}" value="${v}" data-id="${id}" />
      `;
      driversEl.appendChild(row);
    }
    driversEl.querySelectorAll("input").forEach((inp) => {
      inp.addEventListener("input", (e) => {
        const id = e.target.dataset.id;
        vars[id] = +e.target.value;
        activeScenario = null;
        renderScenarios();
        renderDrivers();
        update();
      });
    });
  }

  document.getElementById("reset-drivers").addEventListener("click", () => {
    for (const [k, d] of Object.entries(DRIVERS)) vars[k] = d.base;
    activeScenario = null;
    renderScenarios();
    renderDrivers();
    update();
  });

  // ── Scenarios ───────────────────────────────────────────────
  const scenariosEl = document.getElementById("scenarios");
  function renderScenarios() {
    scenariosEl.innerHTML = "";
    SCENARIOS.forEach((s, i) => {
      const btn = document.createElement("button");
      btn.className = "scenario" + (activeScenario === i ? " active" : "");
      btn.innerHTML = `<div class="name">${s.name}</div><div class="desc">${s.desc}</div>`;
      btn.addEventListener("click", () => {
        // Reset baseline first
        for (const [k, d] of Object.entries(DRIVERS)) vars[k] = d.base;
        for (const [k, delta] of Object.entries(s.changes)) {
          if (DRIVERS[k]) vars[k] = Math.max(DRIVERS[k].min, Math.min(DRIVERS[k].max, DRIVERS[k].base + delta));
        }
        activeScenario = i;
        renderScenarios();
        renderDrivers();
        update();
      });
      scenariosEl.appendChild(btn);
    });
  }

  // ── Time control ────────────────────────────────────────────
  const timeInp = document.getElementById("time");
  const timeVal = document.getElementById("time-val");
  timeInp.addEventListener("input", (e) => {
    t = +e.target.value;
    timeVal.textContent = `${t} v.`;
    update();
  });

  // ── D3 network ──────────────────────────────────────────────
  const svg = d3.select("#net");
  const stageEl = document.querySelector(".stage");
  let W = stageEl.clientWidth, H = stageEl.clientHeight || 600;
  svg.attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");

  const phenKeys = Object.keys(PHENOMENA);
  const driverKeys = Object.keys(DRIVERS);
  const cx = W / 2, cy = H / 2;

  const nodes = [
    ...phenKeys.map((k, i) => {
      const a = (i / phenKeys.length) * Math.PI * 2 - Math.PI / 2;
      return { id: k, kind: "phenom", label: PHENOMENA[k].label, short: PHENOMENA[k].short,
               x: cx + Math.cos(a) * 160, y: cy + Math.sin(a) * 160 };
    }),
    ...driverKeys.map((k, i) => {
      const a = (i / driverKeys.length) * Math.PI * 2 - Math.PI / 2;
      return { id: k, kind: "driver", label: DRIVERS[k].label,
               x: cx + Math.cos(a) * 280, y: cy + Math.sin(a) * 280 };
    }),
  ];
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const links = [
    ...LINKS.map((l, i) => ({ key: `dp-${i}`, source: l.from, target: l.to,
      weight: l.weight, lag: l.lag, conf: l.conf, kind: "dp" })),
    ...PHENOM_LINKS.map((l, i) => ({ key: `pp-${i}`, source: l.from, target: l.to,
      weight: l.weight, conf: "chain", kind: "pp" })),
  ];

  const sim = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id((d) => d.id)
      .distance((l) => (l.kind === "pp" ? 180 : 150))
      .strength((l) => (l.kind === "pp" ? 0.15 : 0.35 * Math.abs(l.weight))))
    .force("charge", d3.forceManyBody().strength((d) => d.kind === "phenom" ? -680 : -180))
    .force("center", d3.forceCenter(cx, cy).strength(0.06))
    .force("collide", d3.forceCollide().radius((d) => d.kind === "phenom" ? 46 : 14).strength(0.9))
    .force("radial-phen", d3.forceRadial(150, cx, cy).strength((d) => d.kind === "phenom" ? 0.25 : 0))
    .force("radial-drv", d3.forceRadial(280, cx, cy).strength((d) => d.kind === "driver" ? 0.18 : 0))
    .alpha(1).alphaDecay(0.04);

  // SVG defs + root g
  svg.append("defs").html(`
    <radialGradient id="phenomFill" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="var(--paper)" />
      <stop offset="100%" stop-color="var(--paper-deep)" />
    </radialGradient>
  `);
  const root = svg.append("g");

  // Zoom (vain wheel, ei pania solmuilta)
  const zoom = d3.zoom()
    .scaleExtent([0.6, 2.2])
    .filter((event) => {
      const target = event.target;
      if (target && target.closest && target.closest('[data-node="1"]')) return false;
      if (event.type === "wheel") return true;
      if (event.type === "mousedown") return event.button === 0;
      if (event.type === "touchstart" || event.type === "pointerdown") return true;
      return !event.ctrlKey && !event.button;
    })
    .on("zoom", (e) => root.attr("transform", e.transform));
  svg.call(zoom).on("dblclick.zoom", null);

  const linkG = root.append("g").attr("class", "links");
  const nodeG = root.append("g").attr("class", "nodes");

  const confColor = (c) => c === "chain" ? "#7a4a8a" : (CONF_META[c]?.color ?? "#888");

  // Drag
  const drag = d3.drag()
    .on("start", (event, d) => {
      if (!event.active) sim.alphaTarget(0.4).restart();
      d.fx = d.x; d.fy = d.y;
    })
    .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
    .on("end", (event, d) => {
      if (!event.active) sim.alphaTarget(0);
      d.fx = null; d.fy = null;
    });

  // Build link & node DOM once
  const linkSel = linkG.selectAll("path").data(links).join("path")
    .attr("fill", "none")
    .style("transition", "stroke 250ms ease, stroke-opacity 250ms ease, stroke-width 250ms ease");

  const nodeSel = nodeG.selectAll("g").data(nodes).join("g")
    .attr("data-node", "1")
    .style("cursor", "grab")
    .style("touch-action", "none")
    .call(drag);

  // Phenom: circle + text; Driver: small circle + label tag
  nodeSel.each(function(d) {
    const g = d3.select(this);
    if (d.kind === "phenom") {
      g.append("circle").attr("class", "ph-bg").attr("r", 40)
        .attr("fill", "url(#phenomFill)").attr("stroke", "var(--ink)").attr("stroke-width", 1).attr("stroke-opacity", 0.55);
      g.append("circle").attr("class", "ph-ring").attr("r", 40).attr("fill", "none");
      g.append("text").attr("class", "ph-label").attr("y", -16).attr("text-anchor", "middle")
        .attr("font-family", "var(--mono)").attr("font-size", 9.5).attr("fill", "var(--ink-mute)").text(PHENOMENA[d.id].short);
      g.append("text").attr("class", "ph-val").attr("y", 2).attr("text-anchor", "middle")
        .attr("font-size", 14).attr("font-weight", 600).attr("fill", "var(--ink)");
    } else {
      g.append("circle").attr("r", 18).attr("fill", "transparent"); // hit area
      g.append("circle").attr("class", "drv-dot").attr("r", 2.6).attr("fill", "var(--ink-faint)");
      g.append("g").attr("class", "drv-label").style("pointer-events", "none");
    }
  });

  // ── Particle phase ─────────────────────────────────────────
  let phase = 0;
  let lastNow = performance.now();

  // ── Render loop ────────────────────────────────────────────
  let phenom = simulate(vars, t, dataRefs);

  function update() {
    phenom = simulate(vars, t, dataRefs);
    // (links/nodes redraw next tick — but reheat to react to changed deltas)
    sim.alpha(0.3).restart();
  }

  function tick() {
    const now = performance.now();
    const dt = (now - lastNow) / 1000; lastNow = now;
    phase = (phase + dt * 0.5) % 1;

    linkSel.each(function(l) {
      const s = l.source, tn = l.target;
      let intensity = 0, dir = 0;
      if (l.kind === "dp") {
        const d = DRIVERS[s.id];
        const delta = ((vars[s.id] ?? d.base) - d.base) / (d.max - d.min);
        const tf = timeFactor(l.lag ?? 0, t);
        intensity = Math.abs(delta) * Math.abs(l.weight) * tf;
        dir = Math.sign(delta * l.weight);
      } else {
        const fromBase = Math.abs(PHENOMENA[s.id].base);
        const fromDelta = (phenom[s.id] - PHENOMENA[s.id].base) / fromBase;
        intensity = Math.abs(fromDelta * l.weight);
        dir = Math.sign(fromDelta * l.weight);
      }
      const active = intensity > 0.005;
      const stroke = active ? (dir > 0 ? "var(--fn-vahvistava)" : "var(--fn-korjaava)") : confColor(l.conf);
      const sw = Math.max(0.6, Math.abs(l.weight) * (active ? 5 + intensity * 22 : 3.2));
      const op = active ? 0.55 : 0.18;
      const path = l.kind === "pp"
        ? `M${s.x} ${s.y} Q ${(s.x + tn.x) / 2 + (tn.y - s.y) * 0.18} ${(s.y + tn.y) / 2 - (tn.x - s.x) * 0.18} ${tn.x} ${tn.y}`
        : `M${s.x} ${s.y} L ${tn.x} ${tn.y}`;
      const dash = active ? null
        : l.conf === "spec" ? "3 3"
        : l.conf === "lit" ? "6 3"
        : l.kind === "pp" ? "2 4" : null;
      const sel = d3.select(this);
      sel.attr("d", path).attr("stroke", stroke).attr("stroke-width", sw).attr("stroke-opacity", op);
      if (dash) sel.attr("stroke-dasharray", dash); else sel.attr("stroke-dasharray", null);
    });

    // Particles layer (rebuilt cheaply)
    let particleLayer = root.select("g.particles");
    if (particleLayer.empty()) particleLayer = root.append("g").attr("class", "particles").style("pointer-events", "none");
    const particles = [];
    links.forEach((l) => {
      if (l.kind !== "dp") return;
      const s = l.source, tn = l.target;
      const d = DRIVERS[s.id]; if (!d) return;
      const delta = ((vars[s.id] ?? d.base) - d.base) / (d.max - d.min);
      const tf = timeFactor(l.lag ?? 0, t);
      const intensity = Math.abs(delta) * Math.abs(l.weight) * tf;
      if (intensity <= 0.005) return;
      const dir = Math.sign(delta * l.weight);
      const stroke = dir > 0 ? "var(--fn-vahvistava)" : "var(--fn-korjaava)";
      const count = Math.min(4, 1 + Math.floor(intensity * 30));
      const speed = 0.4 + intensity * 2.5;
      const dx = tn.x - s.x, dy = tn.y - s.y;
      for (let i = 0; i < count; i++) {
        const f = ((phase * speed + i / count) % 1);
        particles.push({ x: s.x + dx * f, y: s.y + dy * f, r: Math.min(3, 1.2 + intensity * 8), fill: stroke });
      }
    });
    const psel = particleLayer.selectAll("circle").data(particles);
    psel.exit().remove();
    psel.enter().append("circle").merge(psel)
      .attr("cx", (d) => d.x).attr("cy", (d) => d.y).attr("r", (d) => d.r).attr("fill", (d) => d.fill).attr("opacity", 0.5);

    nodeSel.attr("transform", (d) => `translate(${d.x},${d.y})`);
    nodeSel.each(function(n) {
      const g = d3.select(this);
      if (n.kind === "phenom") {
        const ph = PHENOMENA[n.id];
        const v = phenom[n.id];
        const dPct = ((v - ph.base) / ph.base) * 100;
        const critical = Math.abs(dPct) > 15;
        const beneficial = (dPct > 0 ? 1 : -1) === ph.good;
        const accent = beneficial ? "var(--fn-vahvistava)" : "var(--fn-korjaava)";
        g.select(".ph-bg")
          .attr("stroke", critical ? accent : "var(--ink)")
          .attr("stroke-width", critical ? 2.5 : 1)
          .attr("stroke-opacity", critical ? 0.9 : 0.55);
        g.select(".ph-val").text(v.toFixed(ph.base < 10 ? 2 : 1)).attr("fill", critical ? accent : "var(--ink)");
      } else {
        const d = DRIVERS[n.id];
        const v = vars[n.id] ?? d.base;
        const delta = (v - d.base) / (d.max - d.min);
        const changed = Math.abs(delta) > 1e-3;
        g.select(".drv-dot")
          .attr("r", changed ? 4 : 2.6)
          .attr("fill", changed ? "var(--gold)" : "var(--ink-faint)");
        const lbl = g.select(".drv-label");
        lbl.selectAll("*").remove();
        if (changed) {
          const ang = Math.atan2(n.y - cy, n.x - cx);
          const tx = Math.cos(ang) * 12, ty = Math.sin(ang) * 12;
          const anchor = Math.cos(ang) > 0.25 ? "start" : Math.cos(ang) < -0.25 ? "end" : "middle";
          const txt = d.label.length > 22 ? d.label.slice(0, 20) + "…" : d.label;
          lbl.append("text").attr("x", tx).attr("y", ty + 2).attr("text-anchor", anchor)
            .attr("font-family", "var(--mono)").attr("font-size", 9).attr("fill", "var(--gold)").text(txt);
          lbl.append("text").attr("x", tx).attr("y", ty + 12).attr("text-anchor", anchor)
            .attr("font-family", "var(--mono)").attr("font-size", 8.5).attr("font-weight", 600).attr("fill", "var(--gold)").text(fmtValue(d, v));
        }
      }
    });
  }
  sim.on("tick", tick);

  // Resize
  window.addEventListener("resize", () => {
    W = stageEl.clientWidth; H = stageEl.clientHeight || 600;
    svg.attr("viewBox", `0 0 ${W} ${H}`);
    sim.force("center", d3.forceCenter(W / 2, H / 2).strength(0.06)).alpha(0.3).restart();
  });

  renderDrivers();
  renderScenarios();
  update();
}

main();
