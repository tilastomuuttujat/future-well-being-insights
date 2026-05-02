import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: Reittiä ei löytynyt:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-5">
      <div className="text-center max-w-md">
        <p className="eyebrow mb-3">Virhe 404</p>
        <h1 className="font-serif text-5xl text-ink mb-4">Polkua ei löytynyt</h1>
        <p className="lede mb-6">
          Reittiä <code className="font-mono text-sm">{location.pathname}</code> ei ole
          olemassa. Palaa lukijaan tai tutki navigaattoria.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            to="/"
            className="font-mono text-[11px] uppercase tracking-[0.16em] px-4 py-2 rounded-full bg-ink text-paper hover:opacity-90"
          >
            Lukijaan
          </Link>
          <Link
            to="/navigaattori"
            className="font-mono text-[11px] uppercase tracking-[0.16em] px-4 py-2 rounded-full border border-ink/20 text-ink hover:bg-paper-deep"
          >
            Navigaattori
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
