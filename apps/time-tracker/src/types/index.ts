export type Category = 'Work' | 'Learning' | 'Admin' | 'Health' | 'Personal' | 'Rest';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
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
  status: 'scheduled' | 'in-progress' | 'done';
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
