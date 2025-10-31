import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@efficio/ui";

const correlations = [
  {
    metric: "Cycle time vs Utilisation",
    insight: "Teams with >80% utilisation show 1.2d faster cycle time",
    action: "Balance workload to maintain focus slots"
  },
  {
    metric: "Task handoffs",
    insight: "Average of 3.6 handoffs per epic correlates with delays",
    action: "Identify automation avenues for routine reviews"
  },
  {
    metric: "Time tracker adherence",
    insight: "94% compliance when daily reminders triggered",
    action: "Keep nudges on for distributed squads"
  }
];

const forecast = [
  { week: "May 05", completion: 68, confidence: "High" },
  { week: "May 12", completion: 74, confidence: "Medium" },
  { week: "May 19", completion: 83, confidence: "High" },
  { week: "May 26", completion: 91, confidence: "Medium" }
];

export const DeepDiveView = () => {
  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Cross-workflow insights</CardTitle>
          <CardDescription>Data blended across task, time, and delivery modules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
          {correlations.map((row) => (
            <div
              key={row.metric}
              className="rounded-lg border border-slate-200 bg-slate-50/70 p-4"
            >
              <p className="text-sm font-semibold text-slate-900">
                {row.metric}
              </p>
              <p className="mt-2 text-sm text-slate-600">{row.insight}</p>
              <p className="mt-3 text-xs font-medium text-brand-secondary">
                Recommendation: {row.action}
              </p>
            </div>
          ))}
        </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Completion forecast</CardTitle>
          <CardDescription>Projected weekly completion for active initiatives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Week</th>
                <th className="px-4 py-3">Projected completion</th>
                <th className="px-4 py-3">Confidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {forecast.map((entry) => (
                <tr key={entry.week}>
                  <td className="px-4 py-3 text-slate-700">{entry.week}</td>
                  <td className="px-4 py-3 text-slate-900">{entry.completion}%</td>
                  <td className="px-4 py-3 text-slate-500">{entry.confidence}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </CardContent>
      </Card>
    </div>
  );
};

