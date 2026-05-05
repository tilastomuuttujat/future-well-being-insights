import { useState } from "react";
import { IMPACT, INDICATORS, SECTORS } from "./impact";

const cellColor = (b: number) => {
  const a = Math.min(1, Math.abs(b) / 0.4);
  if (b > 0) return `rgba(47, 107, 70, ${0.10 + a * 0.65})`;
  if (b < 0) return `rgba(168, 64, 31, ${0.10 + a * 0.65})`;
  return "rgba(26,29,36,0.04)";
};

export const ImpactMatrix = () => {
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const detail = hover ? { ind: INDICATORS[hover.r], sec: SECTORS[hover.c], b: IMPACT[hover.r][hover.c] } : null;

  return (
    <div>
      <div className="paper p-3 overflow-x-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="p-1.5"></th>
              {SECTORS.map((s) => (
                <th key={s} className="p-1.5 font-mono text-[9px] text-ink-mute uppercase tracking-[0.1em] text-left align-bottom"
                  style={{ minWidth: 60 }}>
                  <div className="origin-bottom-left -rotate-45 whitespace-nowrap translate-y-[-4px]">{s}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INDICATORS.map((ind, r) => (
              <tr key={ind}>
                <td className="p-1.5 font-mono text-[10px] text-ink whitespace-nowrap pr-3">{ind}</td>
                {SECTORS.map((_, c) => {
                  const b = IMPACT[r][c];
                  const isHi = hover?.r === r && hover.c === c;
                  return (
                    <td key={c} className="p-0">
                      <button
                        onMouseEnter={() => setHover({ r, c })}
                        onMouseLeave={() => setHover(null)}
                        className="w-full h-7 font-mono text-[9px] transition-all"
                        style={{
                          background: cellColor(b),
                          outline: isHi ? "1.5px solid var(--ink)" : "1px solid rgba(26,29,36,0.05)",
                          color: Math.abs(b) > 0.25 ? "white" : "var(--ink-mute)",
                        }}
                        title={`${ind} ← ${SECTORS[c]} · β=${b > 0 ? "+" : ""}${b.toFixed(2)}`}
                      >
                        {b === 0 ? "·" : (b > 0 ? "+" : "") + b.toFixed(2)}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-ink-mute">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: "rgba(47,107,70,0.7)" }} />
            +β · panostus parantaa
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: "rgba(168,64,31,0.7)" }} />
            −β · heikentää
          </span>
        </div>
        <span className="font-mono text-[10px] text-ink-faint">
          {detail
            ? `${detail.ind} ← ${detail.sec} · β=${detail.b > 0 ? "+" : ""}${detail.b.toFixed(2)}`
            : "vie kursori solun päälle"}
        </span>
      </div>
    </div>
  );
};
