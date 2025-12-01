import { create } from 'zustand';
import { Category } from '../../types';

interface UIState {
  selectedDate: Date;
  externalTimerStart: { taskId: string; taskTitle: string; category: Category } | null;
  timerTick: number; // Timestamp for real-time updates
  
  setSelectedDate: (date: Date) => void;
  setExternalTimerStart: (start: { taskId: string; taskTitle: string; category: Category } | null) => void;
  updateTimerTick: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedDate: new Date(),
  externalTimerStart: null,
  timerTick: Date.now(),
  
  setSelectedDate: (date: Date) => set({ selectedDate: date }),
  setExternalTimerStart: (start) => set({ externalTimerStart: start }),
  updateTimerTick: () => set({ timerTick: Date.now() }),
}));

