import { ExecutiveSummary } from "./pages/ExecutiveSummary";

interface AnalyticsAppProps {
  getAccessToken?: () => Promise<string | undefined>;
}

export const AnalyticsApp: React.FC<AnalyticsAppProps> = ({ getAccessToken }) => {
  return (
    <div className="flex flex-col bg-background -mx-8 px-8 pt-6 pb-6">
      {/* Page Header - matching task-manager spacing */}
      <div className="mb-4 md:mb-8">
        <h1 className="text-[#101828] dark:text-foreground text-[20px] md:text-[24px] leading-[28px] md:leading-[32px] tracking-[0.0703px]">
          Analytics Dashboard
        </h1>
        <p className="text-[#4a5565] dark:text-muted-foreground text-[12px] md:text-[14px] leading-[18px] md:leading-[20px] mt-1">
          Visualize your productivity across tasks and workflows
        </p>
      </div>

      <ExecutiveSummary getAccessToken={getAccessToken} />
    </div>
  );
};
