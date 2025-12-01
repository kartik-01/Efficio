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
    Work: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Learning: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    Admin: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Health: 'bg-green-500/10 text-green-400 border-green-500/20',
    Personal: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    Rest: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20',
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
