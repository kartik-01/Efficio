import { useState } from 'react';
import { GoalsList } from './GoalsList';
import { CreateGoalForm } from './CreateGoalForm';

interface GoalsInsightsViewProps {
  getAccessToken?: () => Promise<string | undefined>;
}

export function GoalsInsightsView({ getAccessToken }: GoalsInsightsViewProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Goals List */}
      <GoalsList onUpdate={refreshData} getAccessToken={getAccessToken} refreshTrigger={refreshTrigger} />

      {/* Create Goal Form */}
      <CreateGoalForm onGoalCreated={refreshData} getAccessToken={getAccessToken} />
    </div>
  );
}
