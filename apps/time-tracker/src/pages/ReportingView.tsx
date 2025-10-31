import { BarChart3, TrendingUp, Watch } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@efficio/ui";

const highlights = [
  {
    title: "Utilisation",
    value: "78%",
    change: "+5% vs last sprint",
    icon: TrendingUp,
    tone: "text-emerald-500"
  },
  {
    title: "Billable",
    value: "126 hrs",
    change: "12 hours non-billable",
    icon: Watch,
    tone: "text-amber-500"
  },
  {
    title: "Top project",
    value: "Platform Migration",
    change: "42% of total time",
    icon: BarChart3,
    tone: "text-brand-primary"
  }
];

const weekly = [
  { day: "Mon", hours: 7.5 },
  { day: "Tue", hours: 8 },
  { day: "Wed", hours: 6.5 },
  { day: "Thu", hours: 7.2 },
  { day: "Fri", hours: 5.8 }
];

export const ReportingView = () => {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        {highlights.map(({ title, value, change, icon: Icon, tone }) => (
          <Card key={title}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase text-slate-500">{title}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {value}
                </p>
                <p className="text-xs text-slate-400">{change}</p>
              </div>
              <Icon className={`h-6 w-6 ${tone}`} />
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly velocity</CardTitle>
          <CardDescription>Hours logged across the current week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
          {weekly.map((entry) => (
            <div key={entry.day} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-40 w-full items-end rounded-lg bg-slate-100 p-2">
                <div
                  className="w-full rounded-md bg-brand-secondary"
                  style={{ height: `${entry.hours * 10}%`, minHeight: "20%" }}
                />
              </div>
              <span className="text-xs font-medium text-slate-500">
                {entry.day}
              </span>
            </div>
          ))}
        </div>
        </CardContent>
      </Card>
    </div>
  );
};

