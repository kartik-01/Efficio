export type Category = 'Work' | 'Learning' | 'Admin' | 'Health' | 'Personal' | 'Rest';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  category?: string; // Category from task manager
  fromTime?: string; // HH:mm format
  toTime?: string; // HH:mm format
  groupTag?: string; // Group/Workspace tag
  timePlanning?: {
    enabled?: boolean;
    defaultStartTime?: string;
    defaultEndTime?: string;
    defaultDuration?: number;
    categoryId?: string;
    recurrence?: {
      type?: 'none' | 'daily' | 'weekdays';
      endDate?: string;
      activatedAt?: string;
    };
    autoPlanOnStart?: boolean;
    showPlanningPrompt?: boolean;
    lastPlanGenerated?: string;
    planInstanceCount?: number;
    excludedDates?: string[]; // ISO date strings: ["YYYY-MM-DD", ...]
  };
}

export interface TimeSession {
  id: string;
  taskId?: string;
  taskTitle: string;
  category: Category;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
}

export interface PlannedBlock {
  id: string;
  title: string;
  category: Category;
  startTime: Date;
  endTime: Date;
  status: 'scheduled' | 'in-progress' | 'done' | 'canceled';
  taskId?: string | null; // If this is from a task
  isVirtual?: boolean; // True if generated from task, false if real TimePlan entry
  planId?: string; // Real plan ID if this is an override/real plan
  sessionId?: string; // Session ID if timer is running
}

export interface Goal {
  id: string;
  category: Category;
  period: 'daily' | 'weekly';
  targetMinutes: number;
  isActive: boolean;
}

export interface DailySummary {
  totalMinutes: number;
  focusMinutes: number;
  topCategory: Category | null;
}