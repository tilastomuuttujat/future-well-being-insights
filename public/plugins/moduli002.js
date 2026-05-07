// public/plugins/moduli002.js
// Plugin: Sektorimenot per asukas — minne raha menee?
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const ID = "moduli002";

const CSS = `
.plugin-${ID}{background:#fafaf7;color:#1a1a1a;font-family:Georgia,"Times New Roman",serif;
  max-width:880px;margin:0 auto;padding:24px;border:1px solid #e6e2d4;border-radius:4px;
  opacity:0;transition:opacity .4s ease}
.plugin-${ID}.is-mounted{opacity:1}
.plugin-${ID} h3{font-family:Georgia,serif;font-size:22px;margin:0 0 6px}
.plugin-${ID} .lead{color:#555;font-size:13px;margin:0 0 18px;line-height:1.55}
.plugin-${ID} .stack{margin-bottom:20px}
.plugin-${ID} .smalls{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.plugin-${ID} .panel{background:#fff;border:1px solid #ece8da;border-radius:3px;padding:8px}
.plugin-${ID} .panel-title{font:600 10px/1 ui-sans-serif,system-ui;text-transform:uppercase;
  letter-spacing:.08em;color:#6b6b6b;margin-bottom:4px}
.plugin-${ID} .panel-val{font:600 16px ui-sans-serif,system-ui;color:#1a1a1a}
.plugin-${ID} .panel-delta{font:11px ui-sans-serif,system-ui;margin-left:6px}
.plugin-${ID} svg{width:100%;height:auto;display:block;font:10px ui-sans-serif,system-ui}
.plugin-${ID} .axis path,.plugin-${ID} .axis line{stroke:#d4d4cf;stroke-opacity:.7}
.plugin-${ID} .axis text{fill:#6b6b6b}
.plugin-${ID} .insight{background:#f0ede2;border-left:3px solid #2f6b46;
  padding:12px 16px;margin-top:18px;font-size:13px;line-height:1.55;border-radius:2px}
.plugin-${ID} .insight ul{margin:6px 0 0;padding-left:18px}
.plugin-${ID} .source{color:#888;font-size:11px;margin-top:14px;font-style:italic}
.plugin-${ID} .legend{display:flex;flex-wrap:wrap;gap:12px;font-size:11px;color:#444;margin-top:6px}
.plugin-${ID} .legend i{display:inline-block;width:10px;height:10px;margin-right:4px;vertical-align:middle}
.plugin-${ID} .tip{position:fixed;background:#1a1a1a;color:#fafaf7;font:11px ui-sans-serif,system-ui;
  padding:5px 8px;border-radius:3px;pointer-events:none;opacity:0;transition:opacity .15s;z-index:9999}
.plugin-${ID}__sr-only{position:absolute;left:-9999px}
@media (max-width:640px){.plugin-${ID} .smalls{grid-template-columns:1fr 1fr}}
`;

function ensureStyles() {
  if (document.getElementById("style-" + ID)) return;
  const s = document.createElement("style");
  s.id = "style-" + ID;
  s.textContent = CSS;
  document.head.appendChild(s);
}

function tip(root) {
  let el = document.createElement("div");
  el.className = "tip";
  document.body.appendChild(el);
  return {
    show(h, ev){ el.innerHTML=h; el.style.left=(ev.clientX+12)+"px"; el.style.top=(ev.clientY+12)+"px"; el.style.opacity=1; },
    hide(){ el.style.opacity=0; },
    destroy(){ el.remove(); },
  };
}

function drawStack(container, series, core) {
  const wrap = d3.select(container);
  wrap.selectAll("*").remove();
  wrap.append("div").style("font","600 11px/1 ui-sans-serif,system-ui")
    .style("text-transform","uppercase").style("letter-spacing",".08em")
    .style("color","#6b6b6b").style("margin-bottom","6px")
    .text("Kokonaismeno per asukas (€), sektoreittain");

  const years = series[0].values.map(v => v.year);
  const data = years.map(y => {
    const row = { year: y };
    series.forEach(s => { row[s.sector] = s.values.find(v => v.year === y).eur; });
    return row;
  });
  const keys = series.map(s => s.sector);
  const colors = Object.fromEntries(series.map(s => [s.sector, s.color]));

  const W = 820, H = 200, M = {t:6,r:10,b:24,l:48};
  const svg = wrap.append("svg").attr("viewBox",`0 0 ${W} ${H}`);
  const x = d3.scaleLinear().domain(d3.extent(years)).range([M.l, W-M.r]);
  const y = d3.scaleLinear().domain([0, d3.max(data, d => d3.sum(keys, k => d[k]))]).nice().range([H-M.b, M.t]);

  const stack = d3.stack().keys(keys)(data);
  const area = d3.area().x(d => x(d.data.year)).y0(d => y(d[0])).y1(d => y(d[1]));

  const t = tip();
  const paths = svg.append("g").selectAll("path").data(stack).join("path")
    .attr("d", area).attr("fill", d => colors[d.key]).attr("opacity", 0.85)
    .style("cursor","pointer")
    .on("mousemove", (ev, d) => {
      const [mx] = d3.pointer(ev, svg.node());
      const yr = Math.round(x.invert(mx));
      const row = data.find(r => r.year === yr) || data[data.length-1];
      core?.bus?.emit("highlight.sector", d.key);
      t.show(`<b>${d.key}</b> · ${row.year}<br>${row[d.key].toLocaleString("fi-FI")} €/asukas`, ev);
    })
    .on("mouseleave", () => { t.hide(); core?.bus?.emit("highlight.sector", null); })
    .on("click", (ev, d) => core?.bus?.emit("selection.sector", d.key));

  // vuosivalinnan korostus pystyviivana
  const yearLine = svg.append("line").attr("y1",M.t).attr("y2",H-M.b)
    .attr("stroke","#1a1a1a").attr("stroke-width",1.2).attr("stroke-opacity",0);
  function setYear(yr) {
    if (yr == null) { yearLine.attr("stroke-opacity",0); return; }
    yearLine.attr("x1",x(yr)).attr("x2",x(yr)).attr("stroke-opacity",0.7);
  }
  const offY = core?.bus?.on("selection.year", (yr) => setYear(yr));
  const offHY = core?.bus?.on("highlight.year", (yr) => setYear(yr));

  // sektorin korostus
  function setSectorHL(sector) {
    paths.attr("opacity", (d) => sector == null ? 0.85 : (d.key === sector ? 0.95 : 0.25));
  }
  const offS = core?.bus?.on("highlight.sector", (s, meta) => {
    if (meta?.source === core.pluginId) return;
    setSectorHL(s);
  });
  const offSelS = core?.bus?.on("selection.sector", (s) => setSectorHL(s));

  svg.append("g").attr("class","axis").attr("transform",`translate(0,${H-M.b})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));
  svg.append("g").attr("class","axis").attr("transform",`translate(${M.l},0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => (d/1000).toFixed(0)+"k"));

  wrap.append("div").attr("class","legend").html(
    keys.map(k => `<span data-sector="${k}" style="cursor:pointer"><i style="background:${colors[k]}"></i>${k}</span>`).join("")
  );
  wrap.selectAll(".legend span").on("click", function(){
    core?.bus?.emit("selection.sector", this.dataset.sector);
  });
  return () => { offY?.(); offHY?.(); offS?.(); offSelS?.(); t.destroy(); };
}

function drawSmalls(container, series, core) {
  const wrap = d3.select(container);
  wrap.selectAll("*").remove();
  const cleanups = [];
  series.forEach(s => {
    const panel = wrap.append("div").attr("class","panel");
    const first = s.values[0], last = s.values[s.values.length - 1];
    const pct = ((last.eur - first.eur) / first.eur * 100);
    const dColor = pct > 50 ? "#a8401f" : pct < 5 ? "#6b6b6b" : "#3a5f8a";

    panel.append("div").attr("class","panel-title").style("color", s.color).text(s.sector);
    const head = panel.append("div");
    head.append("span").attr("class","panel-val").text(`${last.eur.toLocaleString("fi-FI")} €`);
    head.append("span").attr("class","panel-delta").style("color", dColor)
      .text(`${pct >= 0 ? "+" : ""}${pct.toFixed(0)} % vs. ${first.year}`);

    const W = 240, H = 70, M = {t:4,r:4,b:14,l:4};
    const svg = panel.append("svg").attr("viewBox",`0 0 ${W} ${H}`);
    const x = d3.scaleLinear().domain(d3.extent(s.values, d=>d.year)).range([M.l, W-M.r]);
    const y = d3.scaleLinear().domain([0, d3.max(s.values, d=>d.eur)]).range([H-M.b, M.t]);
    const line = d3.line().x(d=>x(d.year)).y(d=>y(d.eur)).curve(d3.curveMonotoneX);
    const area = d3.area().x(d=>x(d.year)).y0(H-M.b).y1(d=>y(d.eur)).curve(d3.curveMonotoneX);
    svg.append("path").attr("d", area(s.values)).attr("fill", s.color).attr("opacity",0.15);
    svg.append("path").attr("d", line(s.values)).attr("fill","none")
      .attr("stroke", s.color).attr("stroke-width",1.6);

    const t = tip();
    cleanups.push(() => t.destroy());
    svg.selectAll("circle").data(s.values).join("circle")
      .attr("cx", d=>x(d.year)).attr("cy", d=>y(d.eur)).attr("r",2.5)
      .attr("fill", s.color)
      .on("mousemove", (ev,d) => t.show(`<b>${s.sector}</b> · ${d.year}<br>${d.eur.toLocaleString("fi-FI")} €/asukas`, ev))
      .on("mouseleave", t.hide);
    svg.append("text").attr("x", M.l).attr("y", H-2).attr("fill","#888").text(s.values[0].year);
    svg.append("text").attr("x", W-M.r).attr("y", H-2).attr("text-anchor","end").attr("fill","#888").text(last.year);
  });
  return () => cleanups.forEach(fn => fn());
}

let _cleanups = [];

async function mount(host, core) {
  ensureStyles();
  host.innerHTML = `
    <section class="plugin-${ID}" aria-label="Sektorimenot per asukas">
      <h3>Sektorimenot per asukas — minne raha menee?</h3>
      <p class="lead">Reaalimenot per asukas (BKT 2024 -hinnoissa) viidellä sektorilla.
        Kasvu ei jakaudu tasaisesti: jotkin sektorit ovat moninkertaistuneet, toiset ovat polkeneet paikallaan.</p>
      <div class="stack"></div>
      <div class="smalls"></div>
      <div class="insight">
        <strong>Mitä tämä kertoo:</strong>
        <ul id="insight-${ID}"></ul>
      </div>
      <div class="source"></div>
    </section>`;

  const root = host.querySelector(`.plugin-${ID}`);
  try {
    const data = await core.data.load("sector_spending_per_capita.json");
    _cleanups.push(drawStack(root.querySelector(".stack"), data.series, core));
    _cleanups.push(drawSmalls(root.querySelector(".smalls"), data.series, core));

    // Insight-bulletit
    const grown = data.series.map(s => {
      const a = s.values[0].eur, b = s.values[s.values.length-1].eur;
      return { sector: s.sector, pct: (b-a)/a*100 };
    }).sort((x,y) => y.pct - x.pct);
    const ul = root.querySelector(`#insight-${ID}`);
    ul.innerHTML = `
      <li>Nopein kasvu: <b>${grown[0].sector}</b> (+${grown[0].pct.toFixed(0)} % per asukas reaalisesti).</li>
      <li>Hitain kasvu: <b>${grown[grown.length-1].sector}</b> (${grown[grown.length-1].pct >= 0 ? "+" : ""}${grown[grown.length-1].pct.toFixed(0)} %).</li>
      <li>Korjaavat sektorit kasvavat ehkäiseviä nopeammin — sama euro tuottaa eri tuottoa eri vaiheissa.</li>
      <li>Per asukas -tarkastelu erottaa väestönkasvun rakenteellisesta menojen kasvusta.</li>`;
    root.querySelector(".source").textContent =
      `Lähde: ${data._meta?.source ?? "–"}. Deflaattori: ${data._meta?.deflator ?? "–"}.`;
    requestAnimationFrame(() => root.classList.add("is-mounted"));
  } catch (err) {
    root.innerHTML = `<div style="padding:16px;color:#a8401f">Datan lataus epäonnistui: ${err.message}</div>`;
  }
}

function unmount(host) {
  _cleanups.forEach(fn => { try { fn && fn(); } catch {} });
  _cleanups = [];
  if (host) host.innerHTML = "";
}

export default { id: ID, mount, unmount };
