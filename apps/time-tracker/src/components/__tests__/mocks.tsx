// Mock components for testing
import React from 'react';

// Mock Session data
export const mockSession = {
  id: 'session-1',
  taskId: 'task-1',
  taskTitle: 'Test Task',
  category: 'Work' as const,
  startTime: new Date('2024-01-01T09:00:00Z'),
  endTime: new Date('2024-01-01T10:00:00Z'),
  duration: 60,
};

// Mock Task data
export const mockTask = {
  id: 'task-1',
  title: 'Test Task',
  status: 'in-progress' as const,
  category: 'Work',
  groupTag: '@personal',
  fromTime: '09:00',
  toTime: '10:00',
};

// Mock Plan data
export const mockPlan = {
  id: 'plan-1',
  taskId: 'task-1',
  taskTitle: 'Planned Task',
  categoryId: 'work',
  startTime: new Date('2024-01-01T09:00:00Z'),
  endTime: new Date('2024-01-01T10:00:00Z'),
  status: 'scheduled' as const,
};

// Mock Summary data
export const mockSummary = {
  totalMinutes: 120,
  focusMinutes: 100,
  topCategory: 'Work' as const,
};

// Mock getAccessToken function
export const mockGetAccessToken = jest.fn().mockResolvedValue('test-token');

// Mock store state
export const mockStoreState = {
  sessions: [mockSession],
  activeSession: null,
  loading: false,
  error: null,
  tasks: [mockTask],
  plans: [mockPlan],
  summary: mockSummary,
  selectedDate: new Date(),
  externalTimerStart: null,
  timerTick: Date.now(),
};

// Mock store actions
export const mockStoreActions = {
  fetchSessions: jest.fn(),
  fetchActiveSession: jest.fn(),
  startSession: jest.fn(),
  stopSession: jest.fn(),
  deleteSession: jest.fn(),
  updateSession: jest.fn(),
  setActiveSession: jest.fn(),
  fetchTasks: jest.fn(),
  updateTask: jest.fn(),
  fetchPlans: jest.fn(),
  createPlan: jest.fn(),
  updatePlan: jest.fn(),
  deletePlan: jest.fn(),
  fetchSummary: jest.fn(),
  setSelectedDate: jest.fn(),
  setExternalTimerStart: jest.fn(),
  updateTimerTick: jest.fn(),
};

