import { NavLink, Route, Routes } from "react-router-dom";
import { CalendarClock, PieChart } from "lucide-react";

import { Card } from "@efficio/ui";

import { ReportingView } from "./pages/ReportingView";
import { TimesheetView } from "./pages/TimesheetView";

const SubNav = () => {
  const links = [
    { to: ".", label: "Timesheets", end: true, icon: CalendarClock },
    { to: "reports", label: "Reports", icon: PieChart }
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
                ? "bg-brand-secondary text-white shadow"
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

export const TimeTrackerApp = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Time Tracker</h2>
        <p className="text-sm text-slate-500">
          Capture billable hours, monitor utilisation, and keep your teams on
          schedule.
        </p>
      </div>

      <SubNav />

      <Routes>
        <Route index element={<TimesheetView />} />
        <Route path="reports" element={<ReportingView />} />
      </Routes>
    </div>
  );
};

