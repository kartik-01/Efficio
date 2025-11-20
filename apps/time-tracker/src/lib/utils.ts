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

export const calculateDailySummary = (sessions: TimeSession[], date: Date): DailySummary => {
  const daySessions = sessions.filter(s => isSameDay(s.startTime, date) && s.endTime);
  
  const totalMinutes = daySessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  
  // Focus time = Work + Learning categories
  const focusMinutes = daySessions
    .filter(s => s.category === 'Work' || s.category === 'Learning')
    .reduce((sum, s) => sum + (s.duration || 0), 0);
  
  // Calculate top category
  const categoryMinutes = new Map<Category, number>();
  daySessions.forEach(s => {
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
    Work: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    Learning: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    Admin: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
    Health: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    Personal: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    Rest: 'bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20',
  };
  return colors[category];
};

// Get category-based card background and border colors
export const getCategoryCardColors = (category: Category): { bg: string; border: string; hoverBorder: string } => {
  const colors: Record<Category, { bg: string; border: string; hoverBorder: string }> = {
    Work: {
      bg: 'bg-blue-50 dark:bg-blue-950/20',
      border: 'border-blue-200 dark:border-blue-800/50',
      hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
    },
    Learning: {
      bg: 'bg-purple-50 dark:bg-purple-950/20',
      border: 'border-purple-200 dark:border-purple-800/50',
      hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-700',
    },
    Admin: {
      bg: 'bg-orange-50 dark:bg-orange-950/20',
      border: 'border-orange-200 dark:border-orange-800/50',
      hoverBorder: 'hover:border-orange-300 dark:hover:border-orange-700',
    },
    Health: {
      bg: 'bg-green-50 dark:bg-green-950/20',
      border: 'border-green-200 dark:border-green-800/50',
      hoverBorder: 'hover:border-green-300 dark:hover:border-green-700',
    },
    Personal: {
      bg: 'bg-pink-50 dark:bg-pink-950/20',
      border: 'border-pink-200 dark:border-pink-800/50',
      hoverBorder: 'hover:border-pink-300 dark:hover:border-pink-700',
    },
    Rest: {
      bg: 'bg-neutral-50 dark:bg-neutral-950',
      border: 'border-neutral-200 dark:border-neutral-800',
      hoverBorder: 'hover:border-neutral-300 dark:hover:border-neutral-700',
    },
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
