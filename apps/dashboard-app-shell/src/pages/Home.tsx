import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Button, Card } from "@efficio/ui";

const modules = [
  {
    name: "Task Manager",
    description: "Plan, prioritise, and track team workstreams in real time.",
    href: "/tasks"
  },
  {
    name: "Time Tracker",
    description: "Keep accurate logs of billable and productive hours effortlessly.",
    href: "/time-tracker"
  },
  {
    name: "Analytics",
    description: "Insights and dashboards to understand team performance trends.",
    href: "/analytics"
  }
];

export const Home = () => {
  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-r from-brand-primary/10 via-brand-secondary/10 to-brand-secondary/5">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold text-slate-900">
            Welcome to Efficio Workspace
          </h1>
          <p className="text-base text-slate-600">
            Your unified shell aggregates specialised micro-frontends for task
            management, time tracking, and insight-rich analytics. Launch any
            workspace to get started.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild>
              <Link to="/tasks">
                Go to Task Manager
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/analytics">View Analytics</Link>
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {modules.map((module) => (
          <Card
            key={module.name}
            title={module.name}
            description={module.description}
            actions={
              <Button asChild variant="secondary" size="sm">
                <Link to={module.href}>
                  Open module
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            }
          >
            <div className="text-sm text-slate-500">
              Responsive, federated, and fully theme-aware.
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

