import { ArrowUpRight, Layers, Timer } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@efficio/ui";

const kpis = [
  {
    label: "Tasks completed",
    value: "128",
    delta: "+18%",
    tone: "text-emerald-500",
    icon: ArrowUpRight
  },
  {
    label: "Average cycle time",
    value: "3.4 days",
    delta: "-0.6d",
    tone: "text-amber-500",
    icon: Timer
  },
  {
    label: "Open initiatives",
    value: "24",
    delta: "4 high risk",
    tone: "text-brand-secondary",
    icon: Layers
  }
];

const trends = [
  { label: "On track", value: 62, tone: "bg-emerald-500" },
  { label: "At risk", value: 24, tone: "bg-amber-500" },
  { label: "Off track", value: 14, tone: "bg-rose-500" }
];

export const ExecutiveSummary = () => {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        {kpis.map(({ label, value, delta, icon: Icon, tone }) => (
          <Card key={label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase text-slate-500">{label}</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {value}
                </p>
                <p className={`text-xs font-medium ${tone}`}>{delta}</p>
              </div>
              <Icon className={`h-6 w-6 ${tone}`} />
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Initiative health</CardTitle>
          <CardDescription>Distribution across current portfolios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
          <div className="flex flex-1 items-center justify-center">
            <div className="relative h-44 w-44">
              <div className="absolute inset-0 rounded-full border-[18px] border-brand-primary/80" />
              <div className="absolute inset-4 rounded-full border-[18px] border-amber-400/80" />
              <div className="absolute inset-8 rounded-full border-[18px] border-emerald-400/80" />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3">
            {trends.map(({ label, value, tone }) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <span className={`h-2 w-8 rounded-full ${tone}`} />
                <span className="flex-1 text-slate-600">{label}</span>
                <span className="font-semibold text-slate-900">{value}%</span>
              </div>
            ))}
          </div>
        </div>
        </CardContent>
      </Card>
    </div>
  );
};

