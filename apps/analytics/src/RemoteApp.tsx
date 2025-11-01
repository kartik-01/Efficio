import { NavLink, Route, Routes } from "react-router-dom";
import { ActivitySquare, LineChart } from "lucide-react";

import { Card } from "@efficio/ui";

import { DeepDiveView } from "./pages/DeepDiveView";
import { ExecutiveSummary } from "./pages/ExecutiveSummary";

const SubNav = () => {
  const links = [
    { to: ".", label: "Executive", end: true, icon: LineChart },
    { to: "deep-dive", label: "Deep dive", icon: ActivitySquare }
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

export const AnalyticsApp = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Analytics</h2>
        <p className="text-sm text-slate-500">
          Monitor cross-workspace KPIs, trends, and operational health in real
          time.
        </p>
      </div>

      <SubNav />

      <Routes>
        <Route index element={<ExecutiveSummary />} />
        <Route path="deep-dive" element={<DeepDiveView />} />
      </Routes>
    </div>
  );
};

