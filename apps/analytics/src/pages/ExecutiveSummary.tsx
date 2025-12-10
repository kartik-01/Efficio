import React, { useState, useEffect, useCallback } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';

// API Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';

// Types
interface Task {
  _id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  groupTag?: string;
  category?: string;
}

interface CategorySummary {
  categoryId: string;
  minutes: number;
}

interface TimeSummary {
  totalMinutes: number;
  byCategory: CategorySummary[];
  focus: {
    deepMinutes: number;
    otherMinutes: number;
  };
}


interface TimeSession {
  _id: string;
  userId: string;
  taskId?: string;
  taskTitle?: string;
  groupTag: string;
  categoryId: string;
  startTime: string;
  endTime?: string;
  source: string;
  notes?: string;
}

interface DashboardData {
  tasksCompleted: number;
  totalTasks: number;
  focusTime: string;
  overdueTasks: number;
  productivityScore: number;
  sprintProgress: { name: string; planned: number; actual: number }[];
  topPerformers: { name: string; tasks: number; percentage: number; avatar: string }[];
  productivityTrend: { day: string; value: number }[];
  timeDistribution: { category: string; hours: number }[];
  tasksByStatus: { name: string; value: number; color: string }[];
  tasksByGroup: { group: string; pending: number; inProgress: number; completed: number }[];
  // Time Sessions data
  totalTimeTracked: string;
  totalSessions: number;
  avgSessionDuration: string;
  sessionsByCategory: { category: string; hours: number; sessions: number }[];
  dailyTimeTracked: { day: string; hours: number }[];
  // Tasks List
  tasksList: { title: string; project: string; category: string; status: string; createdAt: string; completedAt: string }[];
}

// Category ID to readable name mapping (matches TimeSession schema)
const CATEGORY_NAMES: Record<string, string> = {
  'work': 'Work',
  'learning': 'Learning',
  'admin': 'Admin',
  'health': 'Health',
  'personal': 'Personal',
  'rest': 'Rest',
  // Legacy/fallback
  'dev': 'Development',
  'design': 'Design',
  'meeting': 'Meetings',
  'break': 'Break',
  'other': 'Other',
};

// Avatar colors for users
// KPI Card Component
const KPICard: React.FC<{
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
}> = ({ title, value, change, changeType, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <div className="flex items-center justify-between w-full">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {change && (
          <div className={`text-sm flex items-center mt-2 ${
            changeType === 'positive' ? 'text-green-600' : 
            changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
          }`}>
            <span className="mr-1">{change}</span>
            {changeType && changeType !== 'neutral' && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d={changeType === 'positive' ? 
                  "M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" :
                  "M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 15.586l5.293-5.293a1 1 0 011.414 0z"
                } clipRule="evenodd" />
              </svg>
            )}
          </div>
        )}
      </div>
      <div className="text-3xl">{icon}</div>
    </div>
  </div>
);

// Top Performer Component
const TopPerformer: React.FC<{
  name: string;
  tasks: number;
  percentage: number;
  avatar: string;
}> = ({ name, tasks, percentage, avatar }) => (
  <div className="flex items-center justify-between w-full py-3">
    <div className="flex items-center">
      <div className={`w-10 h-10 rounded-full ${avatar} text-white flex items-center justify-center font-medium`}>
        {name.split(' ').map(n => n[0]).join('')}
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-gray-900">{name}</p>
        <p className="text-sm text-gray-500">{tasks} tasks</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-semibold text-gray-900">{percentage}%</p>
    </div>
  </div>
);

// Helper function to format minutes to readable time
const formatMinutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
};

// Helper function to get date range based on filter
const getDateRange = (filter: string): { start: Date; end: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Helper to set end of day (23:59:59.999)
  const endOfDay = (date: Date): Date => {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  };
  
  switch (filter) {
    case 'currentWeek': {
      const dayOfWeek = today.getDay();
      const start = new Date(today);
      start.setDate(today.getDate() - dayOfWeek);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end: endOfDay(end) };
    }
    case 'previousWeek': {
      const dayOfWeek = today.getDay();
      const start = new Date(today);
      start.setDate(today.getDate() - dayOfWeek - 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start, end: endOfDay(end) };
    }
    case 'currentMonth': {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of month
      return { start, end: endOfDay(end) };
    }
    case 'previousMonth': {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of previous month
      return { start, end: endOfDay(end) };
    }
    default:
      return { start: today, end: endOfDay(today) };
  }
};

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Date filter options
const dateFilterOptions = [
  { value: 'currentWeek', label: 'Current Week' },
  { value: 'previousWeek', label: 'Previous Week' },
  { value: 'currentMonth', label: 'Current Month' },
  { value: 'previousMonth', label: 'Previous Month' },
];

// Status colors for pie chart
const STATUS_COLORS = {
  pending: '#F59E0B',    // Amber
  'in-progress': '#3B82F6', // Blue
  completed: '#10B981',  // Green
};

// Cache keys for localStorage - storing raw API data
const RAW_DATA_CACHE_KEY = 'analytics_raw_data_cache';
const RAW_DATA_TIMESTAMP_KEY = 'analytics_raw_data_timestamp';
const SESSIONS_CACHE_KEY = 'analytics_sessions_cache'; // Store sessions by date range
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface RawDataCache {
  tasks: Task[];
  timeSummary: TimeSummary;
  timestamp: number;
}

interface SessionsCache {
  [dateRangeKey: string]: {
    sessions: TimeSession[];
    timestamp: number;
  };
}

// Helper functions for caching raw data
const getRawDataCache = (): RawDataCache | null => {
  try {
    const cached = localStorage.getItem(RAW_DATA_CACHE_KEY);
    const timestamp = localStorage.getItem(RAW_DATA_TIMESTAMP_KEY);
    
    if (cached && timestamp) {
      const cacheAge = Date.now() - Number.parseInt(timestamp, 10);
      if (cacheAge < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    console.error('Error reading raw data cache:', error);
  }
  return null;
};

const setRawDataCache = (rawData: Omit<RawDataCache, 'timestamp'>) => {
  try {
    localStorage.setItem(RAW_DATA_CACHE_KEY, JSON.stringify({ ...rawData, timestamp: Date.now() }));
    localStorage.setItem(RAW_DATA_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error writing raw data cache:', error);
  }
};

const getSessionsCache = (dateRangeKey: string): TimeSession[] | null => {
  try {
    const cached = localStorage.getItem(SESSIONS_CACHE_KEY);
    if (cached) {
      const sessionsCache: SessionsCache = JSON.parse(cached);
      const cachedData = sessionsCache[dateRangeKey];
      if (cachedData) {
        const cacheAge = Date.now() - cachedData.timestamp;
        if (cacheAge < CACHE_DURATION) {
          return cachedData.sessions;
        }
      }
    }
  } catch (error) {
    console.error('Error reading sessions cache:', error);
  }
  return null;
};

const setSessionsCache = (dateRangeKey: string, sessions: TimeSession[]) => {
  try {
    const cached = localStorage.getItem(SESSIONS_CACHE_KEY);
    const sessionsCache: SessionsCache = cached ? JSON.parse(cached) : {};
    sessionsCache[dateRangeKey] = {
      sessions,
      timestamp: Date.now(),
    };
    // Clean up old entries (keep only last 10 date ranges)
    const entries = Object.entries(sessionsCache).sort((a, b) => b[1].timestamp - a[1].timestamp);
    const cleanedCache: SessionsCache = {};
    entries.slice(0, 10).forEach(([key, value]) => {
      cleanedCache[key] = value;
    });
    localStorage.setItem(SESSIONS_CACHE_KEY, JSON.stringify(cleanedCache));
  } catch (error) {
    console.error('Error writing sessions cache:', error);
  }
};

// Helper to create a date range key for caching sessions
const getDateRangeKey = (start: Date, end: Date): string => {
  return `${formatDate(start)}_${formatDate(end)}`;
};

const Analytics: React.FC<{ getAccessToken?: () => Promise<string | undefined> }> = ({ getAccessToken }) => {
  const [data, setData] = useState<DashboardData>({
    tasksCompleted: 0,
    totalTasks: 0,
    focusTime: '0h',
    overdueTasks: 0,
    productivityScore: 0,
    sprintProgress: [],
    topPerformers: [],
    productivityTrend: [],
    timeDistribution: [],
    tasksByStatus: [],
    tasksByGroup: [],
    // Time Sessions
    totalTimeTracked: '0h',
    totalSessions: 0,
    avgSessionDuration: '0m',
    sessionsByCategory: [],
    dailyTimeTracked: [],
    // Tasks List
    tasksList: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState('currentWeek');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Get timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Refresh function - clears cache and forces fresh data fetch
  const handleRefresh = useCallback(() => {
    try {
      localStorage.removeItem(RAW_DATA_CACHE_KEY);
      localStorage.removeItem(RAW_DATA_TIMESTAMP_KEY);
      localStorage.removeItem(SESSIONS_CACHE_KEY);
      setRefreshTrigger(prev => prev + 1);
      setLoading(true);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }, []);

  // Build auth headers
  const getHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (getAccessToken) {
      const token = await getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return headers;
  }, [getAccessToken]);

  // Fetch dashboard data
  // Process raw data into dashboard data based on filters (client-side filtering)
  const processRawData = useCallback((
    tasks: Task[],
    sessions: TimeSession[],
    timeSummary: TimeSummary,
    currentDateFilter: string,
    currentProjectFilter: string,
    currentCategoryFilter: string,
    timezone: string
  ): DashboardData => {
    const { start, end } = getDateRange(currentDateFilter);

    // Filter tasks by project if a specific project is selected
    let filteredTasks = tasks;
    if (currentProjectFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => {
        const groupName = task.groupTag || '@personal';
        const displayName = groupName.startsWith('@') 
          ? groupName.slice(1).charAt(0).toUpperCase() + groupName.slice(2) 
          : groupName;
        return displayName === currentProjectFilter;
      });
    }

    // Filter tasks by category if a specific category is selected
    if (currentCategoryFilter !== 'all') {
      filteredTasks = filteredTasks.filter(task => {
        return task.category && task.category.trim() === currentCategoryFilter;
      });
    }

    // Filter tasks by date range
    const tasksInRange = filteredTasks.filter(task => {
      const createdAt = new Date(task.createdAt);
      return createdAt >= start && createdAt <= end;
    });

    // Calculate metrics from filtered tasks
    const now = new Date();
    const completedTasks = filteredTasks.filter(t => t.status === 'completed');
    const completedInRange = tasksInRange.filter(t => t.status === 'completed');
    const overdueTasks = filteredTasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < now && 
      t.status !== 'completed'
    );

    const productivityScore = filteredTasks.length > 0 
      ? Math.round((completedTasks.length / filteredTasks.length) * 100) 
      : 0;

    // Filter time sessions by project if a specific project is selected
    let filteredSessions = sessions;
    if (currentProjectFilter !== 'all') {
      filteredSessions = sessions.filter(session => {
        const groupName = session.groupTag || '@personal';
        const displayName = groupName.startsWith('@') 
          ? groupName.slice(1).charAt(0).toUpperCase() + groupName.slice(2) 
          : groupName;
        return displayName === currentProjectFilter;
      });
    }

    // Filter sessions by date range
    filteredSessions = filteredSessions.filter(session => {
      if (!session.startTime) return false;
      const sessionDate = new Date(session.startTime);
      return sessionDate >= start && sessionDate <= end;
    });

    // Process time sessions data
    let totalMinutesTracked = 0;
    const categoryTimeMap = new Map<string, { minutes: number; sessions: number }>();
    const dailyTimeMap = new Map<string, number>();

    filteredSessions.forEach(session => {
      if (session.startTime && session.endTime) {
        const startTime = new Date(session.startTime);
        const endTime = new Date(session.endTime);
        const durationMinutes = Math.max(0, (endTime.getTime() - startTime.getTime()) / 60000);
        
        totalMinutesTracked += durationMinutes;

        const category = CATEGORY_NAMES[session.categoryId] || session.categoryId || 'Other';
        if (!categoryTimeMap.has(category)) {
          categoryTimeMap.set(category, { minutes: 0, sessions: 0 });
        }
        const catData = categoryTimeMap.get(category)!;
        catData.minutes += durationMinutes;
        catData.sessions += 1;

        const dayKey = startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        dailyTimeMap.set(dayKey, (dailyTimeMap.get(dayKey) || 0) + durationMinutes);
      }
    });

    const totalTimeTracked = formatMinutesToTime(Math.round(totalMinutesTracked));
    const totalSessions = filteredSessions.length;
    const avgSessionMinutes = totalSessions > 0 ? Math.round(totalMinutesTracked / totalSessions) : 0;
    const avgSessionDuration = formatMinutesToTime(avgSessionMinutes);

    const sessionsByCategory = Array.from(categoryTimeMap.entries())
      .map(([category, data]) => ({
        category,
        hours: Math.round((data.minutes / 60) * 10) / 10,
        sessions: data.sessions,
      }))
      .sort((a, b) => b.hours - a.hours);

    const dailyTimeTracked = Array.from(dailyTimeMap.entries())
      .map(([day, minutes]) => ({
        day,
        hours: Math.round((minutes / 60) * 10) / 10,
      }));

    // Calculate tasks by status
    const pendingCount = filteredTasks.filter(t => t.status === 'pending').length;
    const inProgressCount = filteredTasks.filter(t => t.status === 'in-progress').length;
    const completedCount = completedTasks.length;
    
    const tasksByStatus = [
      { name: 'Pending', value: pendingCount, color: STATUS_COLORS.pending },
      { name: 'In Progress', value: inProgressCount, color: STATUS_COLORS['in-progress'] },
      { name: 'Completed', value: completedCount, color: STATUS_COLORS.completed },
    ].filter(item => item.value > 0);

    // Calculate tasks by group
    const groupMap = new Map<string, { pending: number; inProgress: number; completed: number }>();
    filteredTasks.forEach(task => {
      const groupName = task.groupTag || '@personal';
      const displayName = groupName.startsWith('@') 
        ? groupName.slice(1).charAt(0).toUpperCase() + groupName.slice(2) 
        : groupName;
      
      if (!groupMap.has(displayName)) {
        groupMap.set(displayName, { pending: 0, inProgress: 0, completed: 0 });
      }
      const group = groupMap.get(displayName)!;
      if (task.status === 'pending') group.pending++;
      else if (task.status === 'in-progress') group.inProgress++;
      else if (task.status === 'completed') group.completed++;
    });
    
    const tasksByGroup = Array.from(groupMap.entries()).map(([group, counts]) => ({
      group,
      pending: counts.pending,
      inProgress: counts.inProgress,
      completed: counts.completed,
    }));

    // Build tasks list
    const tasksList = filteredTasks.map(task => {
      const groupName = task.groupTag || '@personal';
      const projectName = groupName.startsWith('@') 
        ? groupName.slice(1).charAt(0).toUpperCase() + groupName.slice(2) 
        : groupName;
      
      return {
        title: task.title,
        project: projectName,
        category: task.category || 'Uncategorized',
        status: task.status,
        createdAt: new Date(task.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        completedAt: task.completedAt 
          ? new Date(task.completedAt).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'NA',
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Build sprint progress
    const sprintProgress: { name: string; planned: number; actual: number }[] = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      if (date > end) break;
      
      const dayTasks = filteredTasks.filter(t => {
        const created = new Date(t.createdAt);
        return created.toDateString() === date.toDateString();
      });
      const dayCompleted = dayTasks.filter(t => t.status === 'completed');
      
      sprintProgress.push({
        name: weekDays[date.getDay()],
        planned: dayTasks.length,
        actual: dayCompleted.length,
      });
    }

    // Build time distribution
    const timeDistribution = (timeSummary.byCategory || []).map(cat => ({
      category: CATEGORY_NAMES[cat.categoryId] || cat.categoryId,
      hours: Math.round((cat.minutes / 60) * 10) / 10,
    }));

    // Build top performers
    const topPerformers = [{
      name: 'You',
      tasks: completedTasks.length,
      percentage: productivityScore,
      avatar: 'bg-blue-500',
    }];

    // Calculate productivity trend (simplified - can enhance later)
    const trendData: { day: string; value: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      
      const dayTasks = filteredTasks.filter(t => {
        const created = new Date(t.createdAt);
        return created.toDateString() === date.toDateString();
      });
      const dayCompleted = dayTasks.filter(t => t.status === 'completed');
      
      trendData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        value: dayCompleted.length,
      });
    }

    return {
      tasksCompleted: completedInRange.length,
      totalTasks: tasksInRange.length,
      focusTime: formatMinutesToTime(timeSummary.focus?.deepMinutes || 0),
      overdueTasks: overdueTasks.length,
      productivityScore,
      sprintProgress,
      topPerformers,
      productivityTrend: trendData,
      timeDistribution,
      tasksByStatus,
      tasksByGroup,
      totalTimeTracked,
      totalSessions,
      avgSessionDuration,
      sessionsByCategory,
      dailyTimeTracked,
      tasksList,
    };
  }, []);

  // Instant filtering when filters change - process cached raw data immediately
  useEffect(() => {
    const { start, end } = getDateRange(dateFilter);
    const dateRangeKey = getDateRangeKey(start, end);
    
    // Check for cached raw data
    const cachedRawData = getRawDataCache();
    const cachedSessions = getSessionsCache(dateRangeKey);
    
    // If we have cached raw data, process it instantly without API call
    if (cachedRawData && cachedSessions) {
      const dashboardData = processRawData(
        cachedRawData.tasks,
        cachedSessions,
        cachedRawData.timeSummary,
        dateFilter,
        projectFilter,
        categoryFilter,
        timezone
      );
      setData(dashboardData);
      setLoading(false);
      
      // Extract available projects and categories from cached tasks
      const uniqueProjects = new Set<string>();
      const uniqueCategories = new Set<string>();
      cachedRawData.tasks.forEach(task => {
        const groupName = task.groupTag || '@personal';
        const displayName = groupName.startsWith('@') 
          ? groupName.slice(1).charAt(0).toUpperCase() + groupName.slice(2) 
          : groupName;
        uniqueProjects.add(displayName);
        if (task.category && task.category.trim()) {
          uniqueCategories.add(task.category.trim());
        }
      });
      setAvailableProjects(Array.from(uniqueProjects).sort((a, b) => a.localeCompare(b)));
      setAvailableCategories(Array.from(uniqueCategories).sort((a, b) => a.localeCompare(b)));
    }
  }, [dateFilter, projectFilter, categoryFilter, processRawData, timezone]);

  // Fetch dashboard data (only runs when cache is missing or needs refresh)
  useEffect(() => {
    const fetchData = async () => {
      const headers = await getHeaders();
      const { start, end } = getDateRange(dateFilter);
      const dateRangeKey = getDateRangeKey(start, end);

      // Check if we have fresh cached raw data - if so, skip fetch (instant filtering effect will handle it)
      const cachedRawData = getRawDataCache();
      const cachedSessions = getSessionsCache(dateRangeKey);
      
      if (cachedRawData && cachedSessions) {
        const cacheAge = Date.now() - cachedRawData.timestamp;
        // If cache is fresh, don't fetch (instant filtering effect already processed it)
        if (cacheAge < CACHE_DURATION) {
          return;
        }
        // Cache is stale - fetch in background but don't show loading (instant filtering already showed data)
      } else {
        // No cache - show loading and fetch
        setLoading(true);
        setError(null);
      }

      try {
        // Fetch tasks
        let tasksResponse: Response;
        try {
          tasksResponse = await fetch(`${API_BASE_URL}/tasks`, { headers });
        } catch (fetchError) {
          throw new Error(`Network error: Failed to connect to ${API_BASE_URL}/tasks. Please check if the API server is running.`);
        }
        
        if (!tasksResponse.ok) {
          const errorText = await tasksResponse.text();
          let errorMessage = `Failed to fetch tasks (${tasksResponse.status} ${tasksResponse.statusText})`;
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorMessage;
          } catch {
            if (errorText) errorMessage += `: ${errorText}`;
          }
          throw new Error(errorMessage);
        }
        
        const tasksResult = await tasksResponse.json();
        const tasks: Task[] = tasksResult.data || [];

        // Extract unique projects from tasks for the dropdown
        const uniqueProjects = new Set<string>();
        tasks.forEach(task => {
          const groupName = task.groupTag || '@personal';
          const displayName = groupName.startsWith('@') 
            ? groupName.slice(1).charAt(0).toUpperCase() + groupName.slice(2) 
            : groupName;
          uniqueProjects.add(displayName);
        });
        const projectsList = Array.from(uniqueProjects).sort((a, b) => a.localeCompare(b));
        setAvailableProjects(projectsList);

        // Extract unique categories from tasks for the dropdown
        const uniqueCategories = new Set<string>();
        tasks.forEach(task => {
          if (task.category && task.category.trim()) {
            uniqueCategories.add(task.category.trim());
          }
        });
        const categoriesList = Array.from(uniqueCategories).sort((a, b) => a.localeCompare(b));
        setAvailableCategories(categoriesList);

        // Determine effective project filter (reset to 'all' if current selection is no longer available)
        const effectiveProjectFilter = (projectFilter !== 'all' && !projectsList.includes(projectFilter)) 
          ? 'all' 
          : projectFilter;
        
        // Determine effective category filter (reset to 'all' if current selection is no longer available)
        const effectiveCategoryFilter = (categoryFilter !== 'all' && !categoriesList.includes(categoryFilter)) 
          ? 'all' 
          : categoryFilter;
        
        // Update filter state if needed (outside of dependency array to avoid loops)
        if (effectiveProjectFilter !== projectFilter) {
          setProjectFilter(effectiveProjectFilter);
        }
        if (effectiveCategoryFilter !== categoryFilter) {
          setCategoryFilter(effectiveCategoryFilter);
        }

        // Fetch today's time summary
        const summaryResponse = await fetch(
          `${API_BASE_URL}/time/summary?range=today&tz=${encodeURIComponent(timezone)}`,
          { headers }
        );
        let timeSummary: TimeSummary = { totalMinutes: 0, byCategory: [], focus: { deepMinutes: 0, otherMinutes: 0 } };
        if (summaryResponse.ok) {
          const summaryResult = await summaryResponse.json();
          timeSummary = summaryResult.data || timeSummary;
        }

        // Fetch time sessions for the selected date range
        const sessionsUrl = `${API_BASE_URL}/time/sessions?start=${formatDate(start)}&end=${formatDate(end)}&tz=${encodeURIComponent(timezone)}`;
        
        const sessionsResponse = await fetch(sessionsUrl, { headers });
        let sessions: TimeSession[] = [];
        if (sessionsResponse.ok) {
          const sessionsResult = await sessionsResponse.json();
          sessions = sessionsResult.data || [];
        }

        // Use processRawData to compute dashboard data (avoiding code duplication)
        const dashboardData = processRawData(
          tasks,
          sessions,
          timeSummary,
          dateFilter,
          effectiveProjectFilter,
          effectiveCategoryFilter,
          timezone
        );

        // Update state with all calculated data
        setData(dashboardData);
        setLoading(false);
        
        // Save raw data to cache for instant filtering
        setRawDataCache({
          tasks,
          timeSummary,
        });
        setSessionsCache(dateRangeKey, sessions);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        let errorMessage = 'Failed to load dashboard';
        if (err instanceof Error) {
          errorMessage = err.message;
        } else if (typeof err === 'string') {
          errorMessage = err;
        }
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchData();
  }, [dateFilter, projectFilter, categoryFilter, getHeaders, timezone, refreshTrigger, processRawData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Filters and Refresh Button */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4 items-end justify-between">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="relative w-full md:w-64">
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select 
              id="date-filter"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 cursor-pointer"
            >
              {dateFilterOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="relative w-full md:w-64">
            <label htmlFor="project-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <select 
              id="project-filter"
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 cursor-pointer"
              disabled={loading || availableProjects.length === 0}
            >
              <option value="all">All Projects</option>
              {availableProjects.map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          </div>
          <div className="relative w-full md:w-64">
            <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select 
              id="category-filter"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 cursor-pointer"
              disabled={loading || availableCategories.length === 0}
            >
              <option value="all">All Categories</option>
              {availableCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Right side: Refresh Button */}
        <div className="flex items-end">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors h-fit"
            title="Refresh data from server"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Sprint Progress Analytics */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between w-full mb-6">
              <div>
              <h3 className="text-lg font-semibold text-gray-900">Task Progress</h3>
              <p className="text-sm text-gray-500">Daily created vs completed tasks</p>
            </div>
          </div>
          {data.sprintProgress.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.sprintProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="planned" fill="#3B82F6" name="Created" />
                <Bar dataKey="actual" fill="#10B981" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No task data for this period
            </div>
          )}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              {data.tasksCompleted}/{data.totalTasks} tasks completed this period
            </p>
          </div>
        </div>

        {/* Right Column: Task Status Distribution */}
        <div>
          {/* Task Status Distribution - Pie Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between w-full mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">📊 Task Status Distribution</h3>
                <p className="text-sm text-gray-500">All tasks by current status</p>
              </div>
            </div>
            {data.tasksByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.tasksByStatus}
                    cx="50%"
                    cy="45%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={true}
                    fontSize={11}
                  >
                    {data.tasksByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value} tasks`, name]} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No tasks found
              </div>
            )}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                {data.tasksByStatus.reduce((sum, item) => sum + item.value, 0)} total tasks
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Productivity Trend */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Time Tracked Trend</h3>
            <p className="text-sm text-gray-500">Minutes tracked over the last 7 days</p>
          </div>
          {data.productivityTrend.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.productivityTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value: number) => [`${value} min`, 'Time']} />
                <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#DBEAFE" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-500">
              No time tracking data yet
            </div>
          )}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">7-day trend analysis</p>
          </div>
        </div>

        {/* Time Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Time Distribution</h3>
            <p className="text-sm text-gray-500">Hours by category (today)</p>
              </div>
          {data.timeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.timeDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="category" type="category" width={100} />
                <Tooltip formatter={(value: number) => [`${value}h`, 'Hours']} />
                <Bar dataKey="hours" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-500">
              No time categories tracked today
            </div>
          )}
        </div>
      </div>

      {/* Group Task Distribution */}
      {data.tasksByGroup.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900">📁 Tasks by Group & Status</h3>
            <p className="text-sm text-gray-500">Distribution of tasks across workspaces</p>
          </div>
          <ResponsiveContainer width="100%" height={Math.max(200, data.tasksByGroup.length * 50)}>
            <BarChart data={data.tasksByGroup} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="group" type="category" width={80} fontSize={12} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="pending" stackId="a" fill={STATUS_COLORS.pending} name="Pending" />
              <Bar dataKey="inProgress" stackId="a" fill={STATUS_COLORS['in-progress']} name="In Progress" />
              <Bar dataKey="completed" stackId="a" fill={STATUS_COLORS.completed} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tasks List Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">📋 My Tasks List</h3>
          <p className="text-sm text-gray-500 mt-1">All tasks with creation and completion dates</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.tasksList && data.tasksList.length > 0 ? (
                data.tasksList.map((task, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {task.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {task.project}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {task.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.status === 'completed' ? 'bg-green-100 text-green-800' :
                        task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {task.status === 'in-progress' ? 'In Progress' : 
                         task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.createdAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.completedAt}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No tasks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Analytics;
export const ExecutiveSummary = Analytics;
