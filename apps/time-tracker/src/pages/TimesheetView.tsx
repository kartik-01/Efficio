import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@efficio/ui";

const entries = [
  {
    date: "Mon 06",
    project: "Client Discovery",
    notes: "Workshops & follow ups",
    hours: 6.5
  },
  {
    date: "Tue 07",
    project: "Platform Migration",
    notes: "Schema design + sync",
    hours: 7
  },
  {
    date: "Wed 08",
    project: "Internal Ops",
    notes: "Sprint planning",
    hours: 5
  }
];

export const TimesheetView = () => {
  const total = entries.reduce((sum, entry) => sum + entry.hours, 0);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Recent entries</CardTitle>
          <CardDescription>This week at a glance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-right">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {entries.map((entry) => (
                <tr key={entry.date}>
                  <td className="px-4 py-3 text-slate-700">{entry.date}</td>
                  <td className="px-4 py-3 text-slate-900">{entry.project}</td>
                  <td className="px-4 py-3 text-slate-500">{entry.notes}</td>
                  <td className="px-4 py-3 text-right text-slate-900">
                    {entry.hours.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 font-semibold text-slate-700">
              <tr>
                <td className="px-4 py-3" colSpan={3}>
                  Total logged
                </td>
                <td className="px-4 py-3 text-right">{total.toFixed(1)} hrs</td>
              </tr>
            </tfoot>
          </table>
        </div>
        </CardContent>
      </Card>
    </div>
  );
};

