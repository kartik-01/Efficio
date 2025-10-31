import { Card } from "@efficio/ui";

const columns = [
  {
    title: "Backlog",
    hue: "bg-slate-200/60",
    tasks: [
      { id: "OPS-140", title: "Draft QA automation plan", owner: "Irene" },
      { id: "OPS-141", title: "Prep stakeholder sync agenda", owner: "Luis" }
    ]
  },
  {
    title: "In Progress",
    hue: "bg-brand-primary/10",
    tasks: [
      { id: "OPS-132", title: "Update compliance report", owner: "Noor" },
      { id: "OPS-138", title: "Launch beta feedback form", owner: "Kai" }
    ]
  },
  {
    title: "Review",
    hue: "bg-amber-100",
    tasks: [
      { id: "OPS-134", title: "Document deployment checklist", owner: "Mei" }
    ]
  },
  {
    title: "Done",
    hue: "bg-emerald-100",
    tasks: [
      { id: "OPS-125", title: "Publish release notes", owner: "Owen" },
      { id: "OPS-126", title: "Archive completed epics", owner: "Riya" }
    ]
  }
];

export const BoardView = () => {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {columns.map((column) => (
        <Card key={column.title} title={column.title} className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            {column.tasks.map((task) => (
              <div
                key={task.id}
                className={`rounded-lg ${column.hue} p-3 text-sm text-slate-700`}
              >
                <p className="font-medium text-slate-900">{task.title}</p>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                  <span>{task.id}</span>
                  <span>{task.owner}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
};

