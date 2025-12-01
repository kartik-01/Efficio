import { create } from 'zustand';
import { Plan } from '../../services/timeApi';
import { plansApi } from '../../services/timeApi';
import { toast } from 'sonner';

interface PlansState {
  plans: Plan[];
  loading: boolean;
  error: string | null;
  
  fetchPlans: (date: string, tz: string) => Promise<void>;
  createPlan: (data: any) => Promise<Plan>;
  updatePlan: (id: string, updates: Partial<Plan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
}

export const usePlansStore = create<PlansState>((set, get) => ({
  plans: [],
  loading: false,
  error: null,
  
  fetchPlans: async (date: string, tz: string) => {
    set({ loading: true, error: null });
    try {
      const plans = await plansApi.getPlans({ date, tz });
      set({ plans, loading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch plans';
      set({ error: errorMessage, loading: false });
      toast.error(errorMessage);
    }
  },
  
  createPlan: async (data: any) => {
    try {
      const plan = await plansApi.createPlan(data);
      set(state => ({ plans: [...state.plans, plan] }));
      return plan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create plan';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  },
  
  updatePlan: async (id: string, updates: Partial<Plan>) => {
    try {
      await plansApi.updatePlan(id, updates);
      set(state => ({
        plans: state.plans.map(p => {
          const pId = (p as any)._id || p.id;
          return pId === id ? { ...p, ...updates } : p;
        }),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update plan';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  },
  
  deletePlan: async (id: string) => {
    try {
      await plansApi.deletePlan(id);
      set(state => ({
        plans: state.plans.filter(p => {
          const pId = (p as any)._id || p.id;
          return pId !== id;
        }),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete plan';
      set({ error: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  },
}));

