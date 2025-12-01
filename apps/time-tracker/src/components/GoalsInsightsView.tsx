import { useState, useEffect } from 'react';
import { Goal, TimeSession } from '../types';
import { getGoals, getSessions } from '../lib/storage';
import { GoalsList } from './GoalsList';
import { CreateGoalForm } from './CreateGoalForm';

export function GoalsInsightsView() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [sessions, setSessions] = useState<TimeSession[]>([]);

  const refreshData = () => {
    const allGoals = getGoals();
    setGoals(allGoals);
    
    const allSessions = getSessions();
    setSessions(allSessions);
  };

  useEffect(() => {
    refreshData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Goals List */}
      <GoalsList goals={goals} sessions={sessions} onUpdate={refreshData} />

      {/* Create Goal Form */}
      <CreateGoalForm onGoalCreated={refreshData} />
    </div>
  );
}