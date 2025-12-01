import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { TimeSession, Category, DailySummary } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours === 0) {
    return `${mins}m`;
  }
  return `${hours}h ${mins}m`;
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

// Helper function to calculate minutes between two dates
const minutesBetween = (a: Date, b: Date): number => {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
};

// Get day window (start and end of day in local timezone)
const getDayWindow = (date: Date): { start: Date; end: Date } => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
};

// Focus categories (Work and Learning)
const FOCUS_CATEGORIES = new Set<Category>(['Work', 'Learning']);

/**
 * Aggregates time sessions for a specific date
 * Handles both completed and running sessions
 * Clamps session times to the day window
 */
export const aggregateSessionsForDate = (sessions: TimeSession[], date: Date): DailySummary => {
  const { start: dayStart, end: dayEnd } = getDayWindow(date);
  const now = new Date();
  
  // Filter sessions that overlap with the day
  const relevantSessions = sessions.filter(s => {
    const sessionStart = s.startTime;
    const sessionEnd = s.endTime || now; // Use current time for running sessions
    
    // Session overlaps with day if:
    // 1. Session starts before day ends AND ends after day starts
    return sessionStart < dayEnd && sessionEnd > dayStart;
  });
  
  // Aggregate by category
  const byCategory = new Map<Category, number>();
  let totalMinutes = 0;
  let focusMinutes = 0;
  
  for (const session of relevantSessions) {
    // Clamp session to day window
    const sessionStart = new Date(Math.max(session.startTime.getTime(), dayStart.getTime()));
    const sessionEnd = new Date(Math.min(
      (session.endTime || now).getTime(),
      dayEnd.getTime()
    ));
    
    const minutes = minutesBetween(sessionStart, sessionEnd);
    if (minutes <= 0) continue;
    
    totalMinutes += minutes;
    
    // Aggregate by category
    const current = byCategory.get(session.category) || 0;
    byCategory.set(session.category, current + minutes);
    
    // Calculate focus time (Work + Learning)
    if (FOCUS_CATEGORIES.has(session.category)) {
      focusMinutes += minutes;
    }
  }
  
  // Find top category
  let topCategory: Category | null = null;
  let maxMinutes = 0;
  byCategory.forEach((minutes, category) => {
    if (minutes > maxMinutes) {
      maxMinutes = minutes;
      topCategory = category;
    }
  });
  
  return {
    totalMinutes,
    focusMinutes,
    topCategory,
  };
};

// Legacy function for backward compatibility
export const calculateDailySummary = (sessions: TimeSession[], date: Date): DailySummary => {
  // Filter to only completed sessions for backward compatibility
  const completedSessions = sessions.filter(s => isSameDay(s.startTime, date) && s.endTime);
  
  const totalMinutes = completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  
  // Focus time = Work + Learning categories
  const focusMinutes = completedSessions
    .filter(s => s.category === 'Work' || s.category === 'Learning')
    .reduce((sum, s) => sum + (s.duration || 0), 0);
  
  // Calculate top category
  const categoryMinutes = new Map<Category, number>();
  completedSessions.forEach(s => {
    const current = categoryMinutes.get(s.category) || 0;
    categoryMinutes.set(s.category, current + (s.duration || 0));
  });
  
  let topCategory: Category | null = null;
  let maxMinutes = 0;
  categoryMinutes.forEach((minutes, category) => {
    if (minutes > maxMinutes) {
      maxMinutes = minutes;
      topCategory = category;
    }
  });
  
  return { totalMinutes, focusMinutes, topCategory };
};

export const getCategoryColor = (category: Category): string => {
  const colors: Record<Category, string> = {
    Work: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Learning: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Admin: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Health: 'bg-green-500/10 text-green-400 border-green-500/20',
    Personal: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    Rest: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
  };
  return colors[category];
};

export const getCategoryCardColor = (category: Category): string => {
  const colors: Record<Category, string> = {
    Work: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/50',
    Learning: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/50',
    Admin: 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800/50',
    Health: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800/50',
    Personal: 'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800/50',
    Rest: 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800',
  };
  return colors[category];
};

export const calculateGoalProgress = (
  sessions: TimeSession[],
  category: Category,
  period: 'daily' | 'weekly',
  targetMinutes: number,
  referenceDate: Date
): { loggedMinutes: number; percentage: number } => {
  let relevantSessions: TimeSession[];
  
  if (period === 'daily') {
    relevantSessions = sessions.filter(s => 
      isSameDay(s.startTime, referenceDate) && s.category === category && s.endTime
    );
  } else {
    const weekStart = getWeekStart(referenceDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    relevantSessions = sessions.filter(s => 
      s.startTime >= weekStart && 
      s.startTime < weekEnd && 
      s.category === category && 
      s.endTime
    );
  }
  
  const loggedMinutes = relevantSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const percentage = Math.min(100, Math.round((loggedMinutes / targetMinutes) * 100));
  
  return { loggedMinutes, percentage };
};
