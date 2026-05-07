// public/plugins/moduli001.js
// Plugin: Väestörakenne ja huoltosuhde 1985–2045
// Sopimus: ESM, default export { id, mount, unmount }.
// Lukee dataa AINOASTAAN core.data.load("<tiedosto>") -kautta (/data/views/).

console.log("[moduli001] tiedosto evaluoitu, ladataan d3…");
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
console.log("[moduli001] d3 ladattu:", typeof d3, d3?.version);

const ID = "moduli001";

const CSS = `
.plugin-${ID}{background:#fafaf7;color:#1a1a1a;font-family:Georgia,"Times New Roman",serif;
  max-width:880px;margin:0 auto;padding:24px;border:1px solid #e6e2d4;border-radius:4px;
  opacity:0;transition:opacity .4s ease}
.plugin-${ID}.is-mounted{opacity:1}
.plugin-${ID} h3{font-family:Georgia,serif;font-size:22px;margin:0 0 6px;color:#1a1a1a}
.plugin-${ID} .lead{color:#555;font-size:13px;margin:0 0 18px;line-height:1.55}
.plugin-${ID} .charts{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}
.plugin-${ID} .chart-title{font:600 11px/1 ui-sans-serif,system-ui;text-transform:uppercase;
  letter-spacing:.08em;color:#6b6b6b;margin-bottom:8px}
.plugin-${ID} svg{width:100%;height:auto;display:block;font:11px ui-sans-serif,system-ui}
.plugin-${ID} .axis path,.plugin-${ID} .axis line{stroke:#d4d4cf;stroke-opacity:.7}
.plugin-${ID} .axis text{fill:#6b6b6b}
.plugin-${ID} .grid line{stroke:#d4d4cf;stroke-opacity:.4;shape-rendering:crispEdges}
.plugin-${ID} .grid path{display:none}
.plugin-${ID} .insight{background:#f0ede2;border-left:3px solid #2f6b46;
  padding:12px 16px;margin-top:18px;font-size:13px;line-height:1.55;border-radius:2px}
.plugin-${ID} .insight strong{font-family:Georgia,serif}
.plugin-${ID} .insight ul{margin:6px 0 0;padding-left:18px}
.plugin-${ID} .insight li{margin:3px 0}
.plugin-${ID} .source{color:#888;font-size:11px;margin-top:14px;font-style:italic}
.plugin-${ID} .legend{display:flex;gap:14px;font-size:11px;color:#444;margin-top:6px}
.plugin-${ID} .legend i{display:inline-block;width:10px;height:10px;margin-right:4px;vertical-align:middle}
.plugin-${ID} .tip{position:fixed;background:#1a1a1a;color:#fafaf7;font:11px ui-sans-serif,system-ui;
  padding:5px 8px;border-radius:3px;pointer-events:none;opacity:0;transition:opacity .15s;z-index:9999}
.plugin-${ID}__sr-only{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}
@media (max-width:640px){.plugin-${ID} .charts{grid-template-columns:1fr}}
`;

function ensureStyles() {
  if (document.getElementById("style-" + ID)) return;
  const s = document.createElement("style");
  s.id = "style-" + ID;
  s.textContent = CSS;
  document.head.appendChild(s);
}

function tip(root) {
  let el = root.querySelector(".tip");
  if (!el) {
    el = document.createElement("div");
    el.className = "tip";
    document.body.appendChild(el);
  }
  return {
    show(html, ev) {
      el.innerHTML = html;
      el.style.left = ev.clientX + 12 + "px";
      el.style.top = ev.clientY + 12 + "px";
      el.style.opacity = "1";
    },
    hide() { el.style.opacity = "0"; },
    destroy() { el.remove(); },
  };
}

function drawPyramid(container, snapshots, core) {
  // Slider valitsee vuoden, pyramid piirretään uudelleen.
  const years = snapshots.map(s => s.year);
  const wrap = d3.select(container);
  wrap.selectAll("*").remove();

  const ctrl = wrap.append("div").attr("class","chart-title");
  ctrl.append("span").text("Ikäpyramidi · ");
  const yearLabel = ctrl.append("span").attr("class","year-label").style("color","#1a1a1a");

  const slider = wrap.append("input")
    .attr("type","range")
    .attr("min", 0).attr("max", years.length - 1).attr("step", 1).attr("value", 0)
    .style("width","100%").style("margin","4px 0 8px");

  const W = 360, H = 220, M = {t:8,r:8,b:24,l:50};
  const svg = wrap.append("svg").attr("viewBox",`0 0 ${W} ${H}`);
  const ages = snapshots[0].ageBands.map(b => b.age);
  const y = d3.scaleBand().domain(ages).range([M.t, H-M.b]).padding(0.18);
  const maxV = d3.max(snapshots, s => d3.max(s.ageBands, b => Math.max(b.m, b.f)));
  const xL = d3.scaleLinear().domain([0, maxV]).range([(W/2), M.l]);
  const xR = d3.scaleLinear().domain([0, maxV]).range([(W/2), W - M.r]);

  svg.append("g").attr("class","axis").attr("transform",`translate(0,${H-M.b})`)
    .call(d3.axisBottom(d3.scaleLinear().domain([-maxV,maxV]).range([M.l,W-M.r]))
      .ticks(5).tickFormat(d => Math.abs(d/1000)+"k"));
  svg.append("g").attr("class","axis").attr("transform",`translate(${W/2},0)`)
    .call(d3.axisLeft(y).tickSize(0)).call(g => g.select(".domain").remove())
    .selectAll("text").attr("x", -4);

  const gM = svg.append("g"), gF = svg.append("g");
  const t = tip(container);

  function render(idx) {
    const snap = snapshots[idx];
    yearLabel.text(snap.year);
    const m = gM.selectAll("rect").data(snap.ageBands, d=>d.age);
    m.join("rect").transition().duration(350)
      .attr("x", d => xL(d.m)).attr("y", d => y(d.age))
      .attr("width", d => W/2 - xL(d.m)).attr("height", y.bandwidth())
      .attr("fill","#3a5f8a").attr("opacity",0.85);
    const f = gF.selectAll("rect").data(snap.ageBands, d=>d.age);
    f.join("rect").transition().duration(350)
      .attr("x", W/2).attr("y", d => y(d.age))
      .attr("width", d => xR(d.f) - W/2).attr("height", y.bandwidth())
      .attr("fill","#a8401f").attr("opacity",0.85);
    gM.selectAll("rect")
      .on("mousemove", (ev,d) => t.show(`${d.age} · miehet ${d.m.toLocaleString("fi-FI")}`, ev))
      .on("mouseleave", t.hide);
    gF.selectAll("rect")
      .on("mousemove", (ev,d) => t.show(`${d.age} · naiset ${d.f.toLocaleString("fi-FI")}`, ev))
      .on("mouseleave", t.hide);
  }
  render(0);
  slider.on("input", function(){ render(+this.value); });

  wrap.append("div").attr("class","legend").html(
    `<span><i style="background:#3a5f8a"></i>Miehet</span>
     <span><i style="background:#a8401f"></i>Naiset</span>`
  );
  return () => t.destroy();
}

function drawRatio(container, series) {
  const wrap = d3.select(container);
  wrap.selectAll("*").remove();
  wrap.append("div").attr("class","chart-title").text("Huoltosuhde — lapset (0–14) ja eläke (65+) / työikä");

  const W = 380, H = 230, M = {t:10,r:10,b:28,l:34};
  const svg = wrap.append("svg").attr("viewBox",`0 0 ${W} ${H}`);
  const x = d3.scaleLinear().domain(d3.extent(series, d=>d.year)).range([M.l, W-M.r]);
  const y = d3.scaleLinear().domain([0, d3.max(series, d=>d.elderly + d.child) * 1.05]).nice()
    .range([H-M.b, M.t]);

  svg.append("g").attr("class","grid").attr("transform",`translate(${M.l},0)`)
    .call(d3.axisLeft(y).tickSize(-(W-M.l-M.r)).tickFormat(""));
  svg.append("g").attr("class","axis").attr("transform",`translate(0,${H-M.b})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));
  svg.append("g").attr("class","axis").attr("transform",`translate(${M.l},0)`)
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => d+"%"));

  const lineChild = d3.line().x(d=>x(d.year)).y(d=>y(d.child));
  const lineEld = d3.line().x(d=>x(d.year)).y(d=>y(d.elderly));
  const lineTot = d3.line().x(d=>x(d.year)).y(d=>y(d.elderly + d.child));

  const paths = [
    {d: lineChild(series), c: "#3a5f8a", w: 1.5, dash: ""},
    {d: lineEld(series),   c: "#a8401f", w: 2,   dash: ""},
    {d: lineTot(series),   c: "#1a1a1a", w: 1.5, dash: "3 3"},
  ];
  paths.forEach(p => {
    const path = svg.append("path").attr("d", p.d).attr("fill","none")
      .attr("stroke", p.c).attr("stroke-width", p.w).attr("stroke-dasharray", p.dash);
    const len = path.node().getTotalLength();
    path.attr("stroke-dasharray", `${len} ${len}`).attr("stroke-dashoffset", len)
      .transition().duration(900).attr("stroke-dashoffset", 0)
      .on("end", () => path.attr("stroke-dasharray", p.dash || null));
  });

  // Hover-katseviiva
  const t = tip(container);
  const focus = svg.append("line").attr("y1",M.t).attr("y2",H-M.b)
    .attr("stroke","#1a1a1a").attr("stroke-opacity",0).attr("stroke-width",1);
  svg.append("rect").attr("x",M.l).attr("y",M.t).attr("width",W-M.l-M.r).attr("height",H-M.b-M.t)
    .attr("fill","transparent")
    .on("mousemove", function(ev){
      const [mx] = d3.pointer(ev,this);
      const yr = Math.round(x.invert(mx + M.l));
      const d = series.reduce((a,b)=>Math.abs(b.year-yr)<Math.abs(a.year-yr)?b:a);
      focus.attr("x1",x(d.year)).attr("x2",x(d.year)).attr("stroke-opacity",0.4);
      t.show(`<b>${d.year}</b><br>Lapset ${d.child}%<br>Eläke ${d.elderly}%<br>Yht. ${(d.child+d.elderly).toFixed(1)}%`, ev);
    })
    .on("mouseleave", () => { focus.attr("stroke-opacity",0); t.hide(); });

  wrap.append("div").attr("class","legend").html(
    `<span><i style="background:#3a5f8a"></i>Lapset/työikä</span>
     <span><i style="background:#a8401f"></i>Eläke/työikä</span>
     <span><i style="background:#1a1a1a"></i>Yhteensä</span>`
  );
  return () => t.destroy();
}

let _cleanups = [];

function errorText(err) {
  if (!err) return "Tuntematon virhe";
  return err.stack || err.message || String(err);
}

async function mount(host, core) {
  console.log("[moduli001] mount kutsuttu, host=", host, "core=", core);
  ensureStyles();
  host.innerHTML = `
    <section class="plugin-${ID}" aria-label="Väestörakenne ja huoltosuhde 1985–2045">
      <h3>Väestörakenne ja huoltosuhde 1985–2045</h3>
      <p class="lead">Yksi demografinen kuva, joka kytkee hoivan, eläkkeet ja työvoiman.
        Vasemmalla ikäpyramidi liukurilla, oikealla huoltosuhteen pitkä trendi.</p>
      <div class="charts">
        <div class="pyramid"></div>
        <div class="ratio"></div>
      </div>
      <div class="insight">
        <strong>Mitä tämä kertoo:</strong>
        <ul id="insight-${ID}"></ul>
      </div>
      <div class="source"></div>
      <table class="plugin-${ID}__sr-only" aria-hidden="false">
        <caption>Huoltosuhteen vuosiarvot</caption>
        <thead><tr><th>Vuosi</th><th>Lapset/työikä</th><th>Eläke/työikä</th></tr></thead>
        <tbody id="sr-${ID}"></tbody>
      </table>
    </section>`;

  const root = host.querySelector(`.plugin-${ID}`);
  try {
    console.log("[moduli001] aloitetaan datan lataus…");
    const [summary, perCap] = await Promise.all([
      core.data.load("v_crisis_summary.json").then(d => { console.log("[moduli001] v_crisis_summary OK", d); return d; }),
      core.data.load("per_capita_trend.json").then(d => { console.log("[moduli001] per_capita_trend OK", d); return d; }),
    ]);
    console.log("[moduli001] data ladattu:", { summary: !!summary, perCap: !!perCap });

    _cleanups.push(drawPyramid(root.querySelector(".pyramid"), summary.pyramid));
    _cleanups.push(drawRatio(root.querySelector(".ratio"), summary.dependencyRatio));

    // Insight-bulletit lasketaan datasta.
    const dr = summary.dependencyRatio;
    const first = dr[0], last = dr[dr.length - 1];
    const elderlyMul = (last.elderly / first.elderly).toFixed(1);
    const totFirst = first.child + first.elderly, totLast = last.child + last.elderly;
    const totDelta = (totLast - totFirst).toFixed(1);
    const pcFirst = perCap.series[0], pcLast = perCap.series[perCap.series.length - 1];
    const pcGrowth = (((pcLast.total - pcFirst.total) / pcFirst.total) * 100).toFixed(0);
    const ul = root.querySelector(`#insight-${ID}`);
    ul.innerHTML = `
      <li>Eläkehuoltosuhde kasvaa ${first.year}→${last.year} <b>${elderlyMul}-kertaiseksi</b> (${first.elderly}% → ${last.elderly}%).</li>
      <li>Kokonaishuoltosuhde nousee <b>+${totDelta} prosenttiyksikköä</b> (${totFirst.toFixed(1)}% → ${totLast.toFixed(1)}%).</li>
      <li>Per asukas julkismenot ovat samaan aikaan kasvaneet reaalisesti <b>+${pcGrowth}%</b> — kasvu jakautuu yhä pienemmälle työikäisten joukolle.</li>
      <li>Hoivan, eläkkeiden ja työvoiman politiikkavalinnat ovat saman demografisen yhtälön puolia, eivät erillisiä ongelmia.</li>`;

    root.querySelector(".source").textContent =
      `Lähde: ${summary._meta?.source ?? "–"}. Päivitetty ${summary._meta?.updated ?? "–"}.`;
    const tbody = root.querySelector(`#sr-${ID}`);
    tbody.innerHTML = dr.map(r => `<tr><td>${r.year}</td><td>${r.child}</td><td>${r.elderly}</td></tr>`).join("");
    requestAnimationFrame(() => root.classList.add("is-mounted"));
  } catch (err) {
    console.error("[moduli001] virhe mountissa:", {
      name: err?.name,
      message: err?.message,
      stack: err?.stack,
    }, err);
    root.innerHTML = `<div style="padding:16px;color:#a8401f;white-space:pre-wrap">Datan lataus epäonnistui: ${errorText(err)}</div>`;
  }
}

function unmount(host) {
  _cleanups.forEach(fn => { try { fn && fn(); } catch {} });
  _cleanups = [];
  if (host) host.innerHTML = "";
}

export default { id: ID, mount, unmount };
