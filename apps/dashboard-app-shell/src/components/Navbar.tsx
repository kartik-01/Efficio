import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/tasks", label: "Task Manager" },
  { to: "/time-tracker", label: "Time Tracker" },
  { to: "/analytics", label: "Analytics" }
];

export const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <nav className="app-shell-content flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary text-white font-semibold">
            EF
          </div>
          <div className="hidden flex-col md:flex">
            <span className="text-base font-semibold text-slate-900">
              Efficio Workspace
            </span>
            <span className="text-sm text-slate-500">
              Unified productivity micro-frontends
            </span>
          </div>
        </div>
        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                [
                  "text-sm font-medium transition-colors",
                  isActive
                    ? "text-brand-primary"
                    : "text-slate-500 hover:text-slate-900"
                ].join(" ")
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 md:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>
      {mobileOpen && (
        <div className="app-shell-content flex flex-col gap-3 pb-4 md:hidden">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                [
                  "rounded-lg px-4 py-3 text-sm font-medium",
                  isActive
                    ? "bg-brand-primary/10 text-brand-primary"
                    : "text-slate-600 hover:bg-slate-100"
                ].join(" ")
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  );
};

