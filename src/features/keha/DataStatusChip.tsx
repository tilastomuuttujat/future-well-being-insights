import { Link } from "react-router-dom";
import { CLUSTER_COVERAGE } from "@/features/meta/data";

interface Props {
  cid: string | undefined | null;
  fallbackLabel?: string;
}

/**
 * Pieni datatilan merkki klusterille — kattavuus-% + linkki meta-sivulle.
 * Käyttää CLUSTER_COVERAGE-mappausta (0..1).
 */
export const DataStatusChip = ({ cid, fallbackLabel }: Props) => {
  const cov = cid ? CLUSTER_COVERAGE[cid] : undefined;
  if (cov == null) {
    return (
      <Link
        to="/navigaattori/tietokanta#kattavuus"
        className="font-mono text-[10px] text-ink-faint hover:text-gold"
        title="Datakattavuus tuntematon — avaa tietokannan kokonaisarvio"
      >
        {fallbackLabel ?? "data —"}
      </Link>
    );
  }
  const pct = Math.round(cov * 100);
  const color =
    pct >= 80 ? "var(--fn-vahvistava)" : pct >= 60 ? "var(--gold)" : "var(--fn-korjaava)";
  return (
    <Link
      to="/navigaattori/tietokanta#kattavuus"
      className="inline-flex items-center gap-1 font-mono text-[10px] hover:opacity-80"
      title={`Klusterin datakattavuus ${pct} % · avaa tietokannan kokonaisarvio`}
      style={{ color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      data {pct}%
    </Link>
  );
};
