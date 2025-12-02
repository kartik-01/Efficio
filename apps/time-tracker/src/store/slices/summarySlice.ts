import { create } from 'zustand';
import { DailySummary, Category } from '../../types';
import { timeApi } from '../../services/timeApi';
import { toast } from 'sonner';

interface SummaryState {
  summary: DailySummary;
  loading: boolean;
  error: string | null;
  
  fetchSummary: (date: string, tz: string, isToday: boolean) => Promise<void>;
}

export const useSummaryStore = create<SummaryState>((set) => ({
  summary: { totalMinutes: 0, focusMinutes: 0, topCategory: null },
  loading: false,
  error: null,
  
  fetchSummary: async (date: string, tz: string, isToday: boolean) => {
    set({ loading: true, error: null });
    try {
      const fetchedSummary = isToday
        ? await timeApi.getSummary({ range: 'today', tz })
        : await timeApi.getDailySummary(date, tz);
      
      const summaryData = fetchedSummary?.data || { 
        totalMinutes: 0, 
        byCategory: [], 
        focus: { deepMinutes: 0, otherMinutes: 0 } 
      };
      
      const topCategory = summaryData.byCategory && summaryData.byCategory.length > 0
        ? (summaryData.byCategory[0].categoryId.charAt(0).toUpperCase() + 
           summaryData.byCategory[0].categoryId.slice(1)) as Category
        : null;
      
      set({
        summary: {
          totalMinutes: summaryData.totalMinutes || 0,
          focusMinutes: summaryData.focus?.deepMinutes || 0,
          topCategory,
        },
        loading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch summary';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },
}));

