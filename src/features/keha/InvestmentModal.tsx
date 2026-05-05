import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { computeRoi, getDecadeData } from "./decade";
import { EVERYDAY_IMPACT } from "./profileRail";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  phase: string;
  area: string;
}

/**
 * Investointikortti: säätää shock-kerrointa ja takaisinmaksun pituutta,
 * näyttää kumulatiivisen tuottokäyrän ja arjen vaikutuslistan.
 */
export const InvestmentModal = ({ open, onOpenChange, phase, area }: Props) => {
  const data = useMemo(() => getDecadeData(phase, area), [phase, area]);
  const [shockMult, setShockMult] = useState<number>(data.fix.shockMult);
  const [payoff, setPayoff] = useState<number>(data.fix.payoffYears);

  const roi = useMemo(() => {
    const overridden = { ...data, fix: { ...data.fix, shockMult, payoffYears: payoff } };
    return computeRoi(overridden);
  }, [data, shockMult, payoff]);

  const impacts = EVERYDAY_IMPACT[phase] || EVERYDAY_IMPACT.tyoikainen;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            Investointikortti · {data.label}
          </DialogTitle>
          <DialogDescription className="text-[12px]">
            {data.takeaway}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-3">
            <SliderRow
              label="Shokkikerroin"
              value={shockMult}
              min={0.5} max={4} step={0.1}
              onChange={setShockMult}
              suffix="×"
            />
            <SliderRow
              label="Takaisinmaksuaika"
              value={payoff}
              min={3} max={20} step={1}
              onChange={setPayoff}
              suffix=" v"
            />
          </div>

          <RoiChart roi={roi} />

          <div>
            <p className="eyebrow mb-2">Mitä arjessa tapahtuu</p>
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {impacts.map((s) => (
                <li key={s} className="text-[12px] text-ink flex items-baseline gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-ink/60 shrink-0 translate-y-[-1px]" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const SliderRow = ({
  label, value, min, max, step, onChange, suffix,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; suffix?: string;
}) => (
  <div>
    <div className="flex items-baseline justify-between mb-1">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mute">{label}</span>
      <span className="font-mono text-[11px] text-ink">{value.toFixed(step < 1 ? 1 : 0)}{suffix}</span>
    </div>
    <Slider value={[value]} min={min} max={max} step={step} onValueChange={(v) => onChange(v[0])} />
  </div>
);

const RoiChart = ({ roi }: { roi: ReturnType<typeof computeRoi> }) => {
  if (!roi) return (
    <div className="text-[12px] text-ink-mute font-mono p-3 border border-ink/10 rounded">
      Tämän profiilin nykypanostus riittää tarpeeseen — ei mallinnettavaa vajetta.
    </div>
  );
  const W = 540, H = 180, P = 24;
  const xs = (t: number) => P + (t / roi.N) * (W - 2 * P);
  const cums = roi.series.map((p) => p.cum);
  const lo = Math.min(...cums, 0), hi = Math.max(...cums, 0);
  const ys = (v: number) => H - P - ((v - lo) / (hi - lo || 1)) * (H - 2 * P);
  const path = roi.series.map((p, i) => `${i === 0 ? "M" : "L"}${xs(p.t)},${ys(p.cum)}`).join(" ");
  const zeroY = ys(0);
  return (
    <div className="border border-ink/10 rounded p-2 bg-paper">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}>
        <line x1={P} y1={zeroY} x2={W - P} y2={zeroY} stroke="hsl(var(--border))" strokeDasharray="2 3" />
        <path d={path} fill="none" stroke="#2d5a3d" strokeWidth={2} />
        {roi.payback != null && (
          <>
            <line x1={xs(roi.payback)} y1={P} x2={xs(roi.payback)} y2={H - P} stroke="#7a3010" strokeDasharray="3 3" />
            <text x={xs(roi.payback) + 4} y={P + 10} fontSize={10} fontFamily="monospace" fill="#7a3010">
              takaisinmaksu v {roi.payback}
            </text>
          </>
        )}
        <text x={P} y={H - 6} fontSize={9} fontFamily="monospace" fill="hsl(var(--muted-foreground))">vuosi 0</text>
        <text x={W - P - 30} y={H - 6} fontSize={9} fontFamily="monospace" fill="hsl(var(--muted-foreground))">v {roi.N}</text>
      </svg>
    </div>
  );
};
