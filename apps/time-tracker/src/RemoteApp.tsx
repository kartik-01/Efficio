import { TodayView } from './components/TodayView';

interface TimeTrackerAppProps {
  getAccessToken?: () => Promise<string | undefined>;
}

export function TimeTrackerApp({ getAccessToken }: TimeTrackerAppProps) {
  return (
    <div className="min-h-screen bg-background w-full">
      <div className="max-w-[1280px] mx-auto w-full">
        {/* Header */}

        {/* Main Content */}
        <main className="w-full px-4 py-6 text-neutral-900 dark:text-neutral-100">
          <TodayView getAccessToken={getAccessToken} />
        </main>
      </div>
    </div>
  );
}

export default TimeTrackerApp;
