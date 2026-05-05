import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Lukija", end: true },
  { to: "/navigaattori", label: "Navigaattori" },
  { to: "/navigaattori/kartta", label: "Kartta" },
  { to: "/navigaattori/keha", label: "Kehä" },
  { to: "/navigaattori/ilmiot", label: "Ilmiöt" },
  { to: "/navigaattori/tietokanta", label: "Tietokanta" },
  { to: "/reseptit", label: "Reseptit" },
];

export const TopNav = () => {
  return (
    <header className="border-b border-ink/10 bg-paper/60 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-5 py-3 flex items-center justify-between gap-6">
        <NavLink to="/" className="flex items-baseline gap-2 group">
          <span className="font-serif text-xl text-ink">V-Signal</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-mute hidden sm:inline">
            Suomen hyvinvointijärjestelmä
          </span>
        </NavLink>
        <nav className="flex items-center gap-1">
          {links.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  "font-mono text-[11px] uppercase tracking-[0.16em] px-3 py-1.5 rounded-full transition-colors",
                  isActive
                    ? "bg-ink text-paper"
                    : "text-ink-mute hover:text-ink hover:bg-paper-deep",
                ].join(" ")
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
};
