import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import { ShellLayout } from "./components/ShellLayout";
import { RemoteBoundary } from "./components/RemoteBoundary";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";

const TaskManagerModule = lazy(() => import("task_manager/Module"));
const TimeTrackerModule = lazy(() => import("time_tracker/Module"));
const AnalyticsModule = lazy(() => import("analytics/Module"));

const TaskManagerRoute = () => (
  <RemoteBoundary title="Task Manager" moduleName="task-manager">
    <TaskManagerModule />
  </RemoteBoundary>
);

const TimeTrackerRoute = () => (
  <RemoteBoundary title="Time Tracker" moduleName="time-tracker">
    <TimeTrackerModule />
  </RemoteBoundary>
);

const AnalyticsRoute = () => (
  <RemoteBoundary title="Analytics" moduleName="analytics">
    <AnalyticsModule />
  </RemoteBoundary>
);

const App = () => {
  return (
    <BrowserRouter>
      <ShellLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/tasks/*" element={<TaskManagerRoute />} />
          <Route path="/time-tracker/*" element={<TimeTrackerRoute />} />
          <Route path="/analytics/*" element={<AnalyticsRoute />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ShellLayout>
    </BrowserRouter>
  );
};

export default App;

