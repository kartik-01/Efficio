import { NavLink, Route, Routes } from "react-router-dom";
import { CheckCircle2, Kanban } from "lucide-react";

import { Card } from "@efficio/ui";

import { BoardView } from "./pages/BoardView";
import { Overview } from "./pages/Overview";

const SubNav = () => {
  const links = [
    { to: ".", label: "Overview", end: true, icon: CheckCircle2 },
    { to: "board", label: "Board", icon: Kanban }
  ];

  return (
    <Card className="flex flex-wrap items-center gap-2 bg-white/90">
      {links.map(({ to, label, end, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            [
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              isActive
                ? "bg-brand-primary text-white shadow"
                : "text-slate-600 hover:bg-slate-100"
            ].join(" ")
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </Card>
  );
};

export const TaskManagerApp = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">
          Task Manager
        </h2>
        <p className="text-sm text-slate-500">
          Coordinate workstreams, assign owners, and track delivery from one
          place.
        </p>
      </div>

      <SubNav />

      <Routes>
        <Route index element={<Overview />} />
        <Route path="board" element={<BoardView />} />
      </Routes>
    </div>
  );
};

