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
      // Convert Date objects to ISO strings for API
      const apiUpdates: any = { ...updates };
      if (apiUpdates.startTime instanceof Date) {
        apiUpdates.startTime = apiUpdates.startTime.toISOString();
      }
      if (apiUpdates.endTime instanceof Date) {
        apiUpdates.endTime = apiUpdates.endTime.toISOString();
      }
      if (apiUpdates.instanceDate instanceof Date) {
        apiUpdates.instanceDate = apiUpdates.instanceDate.toISOString().split('T')[0];
      }
      
      // Get the updated plan from the API (it returns the full updated plan with proper Date objects)
      const updatedPlan = await plansApi.updatePlan(id, apiUpdates);
      
      // Update the store with the returned plan (which has proper Date objects)
      set(state => ({
        plans: state.plans.map(p => {
          const pId = (p as any)._id || p.id;
          if (pId === id) {
            // Use the updated plan from API, ensuring proper Date conversion
            return {
              ...updatedPlan,
              id: updatedPlan._id || updatedPlan.id || id,
              startTime: typeof updatedPlan.startTime === 'string' ? new Date(updatedPlan.startTime) : updatedPlan.startTime,
              endTime: typeof updatedPlan.endTime === 'string' ? new Date(updatedPlan.endTime) : updatedPlan.endTime,
            };
          }
          return p;
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

