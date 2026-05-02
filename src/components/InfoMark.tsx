import { Link } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RECIPES } from "@/data/recipes";

interface InfoMarkProps {
  recipeId: keyof typeof RECIPES;
  /** Vapaamuotoinen lisäkuvaus (esim. "Tunnistaa rakennemurroksen 2008–2012") */
  note?: string;
}

/**
 * Pieni "i"-merkki, joka kertoo tooltippinä mistä reseptistä havainto tulee
 * ja vie klikkauksesta suoraan reseptimyllyn yksittäiseen reseptiin.
 */
export const InfoMark = ({ recipeId, note }: InfoMarkProps) => {
  const recipe = RECIPES[recipeId];
  if (!recipe) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={`/reseptit/${recipe.id}`}
          className="info-mark"
          aria-label={`Lue resepti: ${recipe.title}`}
        >
          i
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          <div className="font-mono text-[10px] uppercase tracking-wider opacity-70">
            Resepti · {recipe.title}
          </div>
          <div className="text-xs">{note ?? recipe.oneliner}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
