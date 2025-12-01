import { ExecutiveSummary } from "./pages/ExecutiveSummary";

interface AnalyticsAppProps {
  getAccessToken?: () => Promise<string | undefined>;
}

export const AnalyticsApp: React.FC<AnalyticsAppProps> = ({ getAccessToken }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Analytics Dashboard</h2>
        <p className="text-sm text-slate-500">
          Track your productivity across all your projects and tasks
        </p>
      </div>

      <ExecutiveSummary getAccessToken={getAccessToken} />
    </div>
  );
};
