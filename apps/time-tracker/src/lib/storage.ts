import { TimeSession, PlannedBlock, Goal, Task } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'efficio_sessions',
  PLANNED_BLOCKS: 'efficio_planned_blocks',
  GOALS: 'efficio_goals',
  TASKS: 'efficio_tasks',
  ACTIVE_SESSION: 'efficio_active_session',
};

// Tasks
export const getTasks = (): Task[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
  if (!stored) {
    // Initialize with sample tasks
    const sampleTasks: Task[] = [
      { id: '1', title: 'Review PRs', status: 'in-progress', fromTime: '09:00', toTime: '11:00' },
      { id: '2', title: 'Update documentation', status: 'in-progress', fromTime: '11:00', toTime: '12:00' },
      { id: '3', title: 'Team meeting', status: 'in-progress', fromTime: '13:00', toTime: '14:00' },
      { id: '4', title: 'Learn React patterns', status: 'in-progress', fromTime: '14:00', toTime: '16:00' },
      { id: '5', title: 'Morning workout', status: 'in-progress', fromTime: '07:00', toTime: '08:00' },
      { id: '6', title: 'Database optimization', status: 'in-progress', fromTime: '10:00', toTime: '12:00' },
      { id: '7', title: 'Client presentation prep', status: 'in-progress', fromTime: '15:00', toTime: '17:00' },
      { id: '8', title: 'Code refactoring', status: 'in-progress', fromTime: '09:30', toTime: '11:30' },
      { id: '9', title: 'Design system updates', status: 'todo' },
      { id: '10', title: 'API integration testing', status: 'todo' },
    ];
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(sampleTasks));
    return sampleTasks;
  }
  return JSON.parse(stored);
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
};

export const updateTask = (id: string, updates: Partial<Task>) => {
  const tasks = getTasks();
  const index = tasks.findIndex(t => t.id === id);
  if (index !== -1) {
    tasks[index] = { ...tasks[index], ...updates };
    saveTasks(tasks);
  }
};

// Sessions
export const getSessions = (): TimeSession[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.SESSIONS);
  if (!stored) return [];
  const sessions = JSON.parse(stored);
  return sessions.map((s: any) => ({
    ...s,
    startTime: new Date(s.startTime),
    endTime: s.endTime ? new Date(s.endTime) : undefined,
  }));
};

export const saveSessions = (sessions: TimeSession[]) => {
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
};

export const addSession = (session: TimeSession) => {
  const sessions = getSessions();
  sessions.push(session);
  saveSessions(sessions);
};

export const updateSession = (id: string, updates: Partial<TimeSession>) => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === id);
  if (index !== -1) {
    sessions[index] = { ...sessions[index], ...updates };
    saveSessions(sessions);
  }
};

// Active Session
export const getActiveSession = (): TimeSession | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
  if (!stored) return null;
  const session = JSON.parse(stored);
  return {
    ...session,
    startTime: new Date(session.startTime),
  };
};

export const setActiveSession = (session: TimeSession | null) => {
  if (session) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
  } else {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
  }
};

// Planned Blocks
export const getPlannedBlocks = (): PlannedBlock[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.PLANNED_BLOCKS);
  if (!stored) {
    // Initialize with sample planned blocks for today
    const today = new Date();
    const sampleBlocks: PlannedBlock[] = [
      {
        id: '1',
        title: 'Focus work session',
        category: 'Work',
        startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0),
        endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0),
        status: 'scheduled',
      },
      {
        id: '2',
        title: 'Learning new framework',
        category: 'Learning',
        startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
        endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30),
        status: 'scheduled',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.PLANNED_BLOCKS, JSON.stringify(sampleBlocks));
    return sampleBlocks;
  }
  const blocks = JSON.parse(stored);
  return blocks.map((b: any) => ({
    ...b,
    startTime: new Date(b.startTime),
    endTime: new Date(b.endTime),
  }));
};

export const savePlannedBlocks = (blocks: PlannedBlock[]) => {
  localStorage.setItem(STORAGE_KEYS.PLANNED_BLOCKS, JSON.stringify(blocks));
};

export const updatePlannedBlock = (id: string, updates: Partial<PlannedBlock>) => {
  const blocks = getPlannedBlocks();
  const index = blocks.findIndex(b => b.id === id);
  if (index !== -1) {
    blocks[index] = { ...blocks[index], ...updates };
    savePlannedBlocks(blocks);
  }
};

export const addPlannedBlock = (block: PlannedBlock) => {
  const blocks = getPlannedBlocks();
  blocks.push(block);
  savePlannedBlocks(blocks);
};

export const deletePlannedBlock = (id: string) => {
  const blocks = getPlannedBlocks();
  const filteredBlocks = blocks.filter(b => b.id !== id);
  savePlannedBlocks(filteredBlocks);
};

// Goals
export const getGoals = (): Goal[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.GOALS);
  if (!stored) {
    // Initialize with sample goals
    const sampleGoals: Goal[] = [
      { id: '1', category: 'Work', period: 'daily', targetMinutes: 240, isActive: true },
      { id: '2', category: 'Learning', period: 'daily', targetMinutes: 60, isActive: true },
      { id: '3', category: 'Health', period: 'weekly', targetMinutes: 300, isActive: true },
    ];
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(sampleGoals));
    return sampleGoals;
  }
  return JSON.parse(stored);
};

export const saveGoals = (goals: Goal[]) => {
  localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(goals));
};

export const addGoal = (goal: Goal) => {
  const goals = getGoals();
  goals.push(goal);
  saveGoals(goals);
};

export const updateGoal = (id: string, updates: Partial<Goal>) => {
  const goals = getGoals();
  const index = goals.findIndex(g => g.id === id);
  if (index !== -1) {
    goals[index] = { ...goals[index], ...updates };
    saveGoals(goals);
  }
};