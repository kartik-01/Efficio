import * as React from "react";

const TaskManager = React.lazy(() => import("task_manager/Widget"));
const TimeTracker = React.lazy(() => import("time_tracker/Widget"));
const Analytics = React.lazy(() => import("analytics/Widget"));

export function Routes() {
  return (
    <React.Suspense fallback={<div className="p-6">Loading…</div>}>
      <div className="p-6 space-y-6">
        <TaskManager />
        <TimeTracker />
        <Analytics />
      </div>
    </React.Suspense>
  );
}
