import { CheckCircle2, CircleDashed, Clock3, Users } from "lucide-react";

import { Card } from "@efficio/ui";

const metrics = [
  {
    label: "Active tasks",
    value: "42",
    delta: "+6 this week",
    icon: CircleDashed,
    tone: "text-brand-primary"
  },
  {
    label: "Completed",
    value: "128",
    delta: "+18% vs last sprint",
    icon: CheckCircle2,
    tone: "text-emerald-500"
  },
  {
    label: "Average cycle",
    value: "3.4 days",
    delta: "-0.6 days",
    icon: Clock3,
    tone: "text-amber-500"
  },
  {
    label: "Collaborators",
    value: "12",
    delta: "2 new joiners",
    icon: Users,
    tone: "text-brand-secondary"
  }
];

const backlog = [
  {
    id: "OPS-124",
    title: "Refresh onboarding checklist",
    owner: "Alex Rivera",
    status: "In Review"
  },
  {
    id: "OPS-131",
    title: "Automate weekly digest",
    owner: "Priya Shah",
    status: "In Progress"
  },
  {
    id: "OPS-129",
    title: "Vendor contract assessment",
    owner: "Linh Tran",
    status: "Blocked"
  }
];

export const Overview = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, delta, icon: Icon, tone }) => (
          <Card key={label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {value}
                </p>
                <p className="text-xs text-slate-400">{delta}</p>
              </div>
              <Icon className={`h-8 w-8 ${tone}`} />
            </div>
          </Card>
        ))}
      </div>

      <Card title="Latest backlog" description="Prioritised tasks awaiting action">
        <div className="divide-y divide-slate-200">
          {backlog.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {item.title}
                </p>
                <p className="text-xs text-slate-500">{item.id}</p>
              </div>
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <span>{item.owner}</span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

