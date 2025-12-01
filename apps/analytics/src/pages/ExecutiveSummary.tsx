import React, { useState, useEffect, useCallback } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api';

// Types
interface Task {
  _id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  groupTag?: string;
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

interface Activity {
  _id: string;
  type: string;
  taskTitle: string;
  userId: string;
  userName: string;
  userPicture?: string;
  timestamp: string;
  fromStatus?: string;
  toStatus?: string;
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
  realtimeActivities: { user: string; action: string; target: string; time: string; avatar: string }[];
  tasksByStatus: { name: string; value: number; color: string }[];
  tasksByGroup: { group: string; pending: number; inProgress: number; completed: number }[];
  // Time Sessions data
  totalTimeTracked: string;
  totalSessions: number;
  avgSessionDuration: string;
  sessionsByCategory: { category: string; hours: number; sessions: number }[];
  dailyTimeTracked: { day: string; hours: number }[];
  // Tasks List
  tasksList: { title: string; project: string; status: string; createdAt: string; completedAt: string }[];
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
const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
];

// KPI Card Component
const KPICard: React.FC<{
  title: string;
  value: string | number;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: string;
}> = ({ title, value, change, changeType, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <div className={`text-sm flex items-center mt-2 ${
          changeType === 'positive' ? 'text-green-600' : 
          changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
        }`}>
          <span className="mr-1">{change}</span>
          {changeType !== 'neutral' && (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d={changeType === 'positive' ? 
                "M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L10 4.414 4.707 9.707a1 1 0 01-1.414 0z" :
                "M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L10 15.586l5.293-5.293a1 1 0 011.414 0z"
              } clipRule="evenodd" />
            </svg>
          )}
        </div>
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
  <div className="flex items-center justify-between py-3">
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

// Activity Feed Item
const ActivityItem: React.FC<{
  user: string;
  action: string;
  target: string;
  time: string;
  avatar: string;
}> = ({ user, action, target, time, avatar }) => (
  <div className="flex items-start space-x-3 py-3">
    <div className={`w-8 h-8 rounded-full ${avatar} text-white text-xs flex items-center justify-center`}>
      {user.split(' ').map(n => n[0]).join('')}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm text-gray-900">
        <span className="font-medium">{user}</span> {action} <span className="text-blue-600">{target}</span>
      </p>
      <p className="text-xs text-gray-500">{time}</p>
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

// Helper to get relative time string
const getRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString();
};

// Helper to map activity type to action text
const getActivityAction = (activity: Activity): string => {
  switch (activity.type) {
    case 'task_created': return 'created';
    case 'task_updated': return 'updated';
    case 'task_deleted': return 'deleted';
    case 'task_moved': return `moved to ${activity.toStatus}`;
    default: return 'updated';
  }
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
    realtimeActivities: [],
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

  // Get timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const headers = await getHeaders();
        const { start, end } = getDateRange(dateFilter);

        // Fetch tasks
        const tasksResponse = await fetch(`${API_BASE_URL}/tasks`, { headers });
        if (!tasksResponse.ok) throw new Error('Failed to fetch tasks');
        const tasksResult = await tasksResponse.json();
        const tasks: Task[] = tasksResult.data || [];

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

        // Fetch activities for real-time feed
        const activitiesResponse = await fetch(`${API_BASE_URL}/activities?limit=10`, { headers });
        let activities: Activity[] = [];
        if (activitiesResponse.ok) {
          const activitiesResult = await activitiesResponse.json();
          activities = activitiesResult.data || [];
        }

        // Fetch time sessions for the selected date range
        const sessionsUrl = `${API_BASE_URL}/time/sessions?start=${formatDate(start)}&end=${formatDate(end)}&tz=${encodeURIComponent(timezone)}`;
        console.log('Fetching sessions from:', sessionsUrl);
        console.log('Date range:', formatDate(start), 'to', formatDate(end));
        
        const sessionsResponse = await fetch(sessionsUrl, { headers });
        let sessions: TimeSession[] = [];
        if (sessionsResponse.ok) {
          const sessionsResult = await sessionsResponse.json();
          console.log('Sessions response:', sessionsResult);
          sessions = sessionsResult.data || [];
        } else {
          console.log('Sessions fetch failed:', sessionsResponse.status, await sessionsResponse.text());
        }

        // Fetch productivity trend (last 7 days)
        const trendData: { day: string; value: number }[] = [];
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          const dateStr = formatDate(date);
          
          try {
            const dailyResponse = await fetch(
              `${API_BASE_URL}/time/summary/daily?date=${dateStr}&tz=${encodeURIComponent(timezone)}`,
              { headers }
            );
            if (dailyResponse.ok) {
              const dailyResult = await dailyResponse.json();
              const dailyData = dailyResult.data;
              trendData.push({
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                value: dailyData?.totalMinutes || 0,
              });
            } else {
              trendData.push({
                day: date.toLocaleDateString('en-US', { weekday: 'short' }),
                value: 0,
              });
            }
          } catch {
            trendData.push({
              day: date.toLocaleDateString('en-US', { weekday: 'short' }),
              value: 0,
            });
          }
        }

        // Calculate metrics from tasks
        const now = new Date();
        const tasksInRange = tasks.filter(task => {
          const createdAt = new Date(task.createdAt);
          return createdAt >= start && createdAt <= end;
        });
        
        const completedTasks = tasks.filter(t => t.status === 'completed');
        const completedInRange = tasksInRange.filter(t => t.status === 'completed');
        const overdueTasks = tasks.filter(t => 
          t.dueDate && 
          new Date(t.dueDate) < now && 
          t.status !== 'completed'
        );

        // Calculate productivity score (completed tasks ratio * 100)
        const productivityScore = tasks.length > 0 
          ? Math.round((completedTasks.length / tasks.length) * 100) 
          : 0;

        // Calculate tasks by status for pie chart
        const pendingCount = tasks.filter(t => t.status === 'pending').length;
        const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;
        const completedCount = completedTasks.length;
        
        const tasksByStatus = [
          { name: 'Pending', value: pendingCount, color: STATUS_COLORS.pending },
          { name: 'In Progress', value: inProgressCount, color: STATUS_COLORS['in-progress'] },
          { name: 'Completed', value: completedCount, color: STATUS_COLORS.completed },
        ].filter(item => item.value > 0); // Only show statuses with tasks

        // Calculate tasks by group with status breakdown
        const groupMap = new Map<string, { pending: number; inProgress: number; completed: number }>();
        tasks.forEach(task => {
          const groupName = task.groupTag || '@personal';
          // Format group name (remove @ and capitalize)
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

        // Process time sessions data
        let totalMinutesTracked = 0;
        const categoryTimeMap = new Map<string, { minutes: number; sessions: number }>();
        const dailyTimeMap = new Map<string, number>();

        sessions.forEach(session => {
          if (session.startTime && session.endTime) {
            const startTime = new Date(session.startTime);
            const endTime = new Date(session.endTime);
            const durationMinutes = Math.max(0, (endTime.getTime() - startTime.getTime()) / 60000);
            
            totalMinutesTracked += durationMinutes;

            // Group by category
            const category = CATEGORY_NAMES[session.categoryId] || session.categoryId || 'Other';
            if (!categoryTimeMap.has(category)) {
              categoryTimeMap.set(category, { minutes: 0, sessions: 0 });
            }
            const catData = categoryTimeMap.get(category)!;
            catData.minutes += durationMinutes;
            catData.sessions += 1;

            // Group by day
            const dayKey = startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            dailyTimeMap.set(dayKey, (dailyTimeMap.get(dayKey) || 0) + durationMinutes);
          }
        });

        const totalTimeTracked = formatMinutesToTime(Math.round(totalMinutesTracked));
        const totalSessions = sessions.length;
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

        // Build tasks list with dates
        const tasksList = tasks.map(task => {
          const groupName = task.groupTag || '@personal';
          const projectName = groupName.startsWith('@') 
            ? groupName.slice(1).charAt(0).toUpperCase() + groupName.slice(2) 
            : groupName;
          
          return {
            title: task.title,
            project: projectName,
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

        // Build sprint progress (daily breakdown for the week)
        const sprintProgress: { name: string; planned: number; actual: number }[] = [];
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 0; i < 7; i++) {
          const date = new Date(start);
          date.setDate(start.getDate() + i);
          if (date > end) break;
          
          const dayTasks = tasks.filter(t => {
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

        // Build time distribution from categories
        const timeDistribution = timeSummary.byCategory.map(cat => ({
          category: CATEGORY_NAMES[cat.categoryId] || cat.categoryId,
          hours: Math.round((cat.minutes / 60) * 10) / 10,
        }));

        // Build real-time activities
        const realtimeActivities = activities.map((activity, index) => ({
          user: activity.userName || 'Unknown User',
          action: getActivityAction(activity),
          target: activity.taskTitle || 'a task',
          time: getRelativeTime(activity.timestamp),
          avatar: AVATAR_COLORS[index % AVATAR_COLORS.length],
        }));

        // Build top performers (current user's stats since backend is per-user)
        const topPerformers = [{
          name: 'You',
          tasks: completedTasks.length,
          percentage: productivityScore,
          avatar: 'bg-blue-500',
        }];

        // Update state with all calculated data
        setData({
          tasksCompleted: completedInRange.length,
          totalTasks: tasksInRange.length,
          focusTime: formatMinutesToTime(timeSummary.focus.deepMinutes),
          overdueTasks: overdueTasks.length,
          productivityScore,
          sprintProgress,
          topPerformers,
          productivityTrend: trendData,
          timeDistribution,
          realtimeActivities,
          tasksByStatus,
          tasksByGroup,
          // Time Sessions
          totalTimeTracked,
          totalSessions,
          avgSessionDuration,
          sessionsByCategory,
          dailyTimeTracked,
          // Tasks List
          tasksList,
        });

        setLoading(false);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
        setLoading(false);
      }
    };

    fetchData();
  }, [dateFilter, getHeaders, timezone]);

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
    <div className="bg-gray-50 pb-8">
      {/* Filters */}
      <div className="mb-6">
        <div className="relative w-full md:w-64">
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 cursor-pointer"
          >
            {dateFilterOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Tasks Completed"
          value={`${data.tasksCompleted}/${data.totalTasks}`}
          change={data.totalTasks > 0 ? `${Math.round((data.tasksCompleted / data.totalTasks) * 100)}%` : '0%'}
          changeType={data.tasksCompleted > 0 ? 'positive' : 'neutral'}
          icon="📋"
        />
        <KPICard
          title="Focus Time Today"
          value={data.focusTime}
          change="Deep work"
          changeType="neutral"
          icon="⏰"
        />
        <KPICard
          title="Overdue Tasks"
          value={data.overdueTasks}
          change={data.overdueTasks === 0 ? 'All on track!' : 'Need attention'}
          changeType={data.overdueTasks === 0 ? 'positive' : 'negative'}
          icon="⚠️"
        />
        <KPICard
          title="Productivity Score"
          value={`${data.productivityScore}%`}
          change="Task completion rate"
          changeType={data.productivityScore >= 70 ? 'positive' : data.productivityScore >= 40 ? 'neutral' : 'negative'}
          icon="📊"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Sprint Progress Analytics */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
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

        {/* Task Status Distribution - Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">📊 Task Status Distribution</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">All tasks by current status</p>
          {data.tasksByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
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
            <div className="flex items-center justify-center h-[280px] text-gray-500">
              No tasks found
            </div>
          )}
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
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No tasks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-Time Activity Feed */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold text-gray-900">⚡ Recent Activity</h3>
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Live
              </span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">Recent updates from your tasks</p>
              </div>
        <div className="p-6">
          {data.realtimeActivities.length > 0 ? (
            <div className="space-y-1">
              {data.realtimeActivities.map((activity, index) => (
                <ActivityItem
                  key={index}
                  user={activity.user}
                  action={activity.action}
                  target={activity.target}
                  time={activity.time}
                  avatar={activity.avatar}
                />
            ))}
          </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
export const ExecutiveSummary = Analytics;
