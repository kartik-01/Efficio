import { useState, useEffect } from 'react';
import { Category } from '../types';
import { formatTime, getCategoryColor, getCategoryCardColors } from '../lib/utils';
import { Button } from '@efficio/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@efficio/ui';
import { Input } from '@efficio/ui';
import { Label } from '@efficio/ui';
import { Check, Calendar, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { plansApi, timeApi, initializeTimeApi, isTimeApiReady, Plan } from '../services/timeApi';

// Map backend category IDs to frontend Category type
const mapCategoryIdToCategory = (categoryId: string): Category => {
  const mapping: Record<string, Category> = {
    work: 'Work',
    learning: 'Learning',
    admin: 'Admin',
    health: 'Health',
    personal: 'Personal',
    rest: 'Rest',
  };
  return mapping[categoryId.toLowerCase()] || 'Work';
};


interface PlannedTimeBlocksProps {
  selectedDate: Date;
  getAccessToken?: () => Promise<string | undefined>;
  onUpdate: () => void;
}

export function PlannedTimeBlocks({ selectedDate, getAccessToken, onUpdate }: PlannedTimeBlocksProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    startTime: '', // HH:MM format
    endTime: '', // HH:MM format
  });

  // Initialize API
  useEffect(() => {
    if (getAccessToken) {
      initializeTimeApi(getAccessToken);
    }
  }, [getAccessToken]);

  // Fetch plans
  useEffect(() => {
    const loadPlans = async () => {
      if (!isTimeApiReady()) return;

      try {
        setLoading(true);
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const fetchedPlans = await plansApi.listPlans({ date: dateStr, tz });
        setPlans(fetchedPlans);
      } catch (error) {
        console.error('Failed to load plans:', error);
        toast.error('Failed to load planned blocks');
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, [selectedDate, getAccessToken]);

  const handleTimeSlotClick = (hour: number) => {
    // Create a 1-hour block starting at the clicked hour
    const startTimeStr = `${String(hour).padStart(2, '0')}:00`;
    const endHour = (hour + 1) % 24;
    const endTimeStr = `${String(endHour).padStart(2, '0')}:00`;
    
    setFormData({
      title: '',
      startTime: startTimeStr,
      endTime: endTimeStr,
    });
    setIsModalOpen(true);
  };

  const handleCreatePlan = async () => {
    if (!formData.title || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isTimeApiReady()) {
      toast.error('API not initialized');
      return;
    }

    try {
      // Combine selected date with time inputs
      const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
      const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
      
      const start = new Date(selectedDate);
      start.setHours(startHours, startMinutes, 0, 0);
      
      const end = new Date(selectedDate);
      end.setHours(endHours, endMinutes, 0, 0);

      if (end <= start) {
        toast.error('End time must be after start time');
        return;
      }

      // Classify the task title to get category
      const classification = await timeApi.classifyTitle(formData.title);
      const categoryId = classification.categoryId;

      await plansApi.createPlan({
        taskTitle: formData.title,
        categoryId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });

      toast.success('Planned block created');
      setIsModalOpen(false);
      setFormData({ title: '', startTime: '', endTime: '' });
      await reloadPlans();
      onUpdate();
    } catch (error) {
      console.error('Failed to create plan:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create planned block');
    }
  };

  const handleMarkDone = async (plan: Plan) => {
    if (!isTimeApiReady()) {
      toast.error('API not initialized');
      return;
    }

    try {
      await plansApi.completePlan(plan.id);
      toast.success('Plan marked as done');
      await reloadPlans();
    onUpdate();
    } catch (error) {
      console.error('Failed to mark plan as done:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to mark plan as done');
    }
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    // Extract time portion from the plan's datetime
    const startDate = new Date(plan.startTime);
    const endDate = new Date(plan.endTime);
    const startTimeStr = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
    const endTimeStr = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
    
    setFormData({
      title: plan.taskTitle || '',
      startTime: startTimeStr,
      endTime: endTimeStr,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan || !formData.title || !formData.startTime || !formData.endTime) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isTimeApiReady()) {
      toast.error('API not initialized');
      return;
    }

    try {
      // Combine selected date with time inputs
      const [startHours, startMinutes] = formData.startTime.split(':').map(Number);
      const [endHours, endMinutes] = formData.endTime.split(':').map(Number);
      
      const start = new Date(selectedDate);
      start.setHours(startHours, startMinutes, 0, 0);
      
      const end = new Date(selectedDate);
      end.setHours(endHours, endMinutes, 0, 0);

      if (end <= start) {
        toast.error('End time must be after start time');
        return;
      }

      // Classify the task title to get category
      const classification = await timeApi.classifyTitle(formData.title);
      const categoryId = classification.categoryId;

      await plansApi.updatePlan(editingPlan.id, {
        taskTitle: formData.title,
        categoryId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });

      toast.success('Plan updated');
      setIsEditModalOpen(false);
      setEditingPlan(null);
      setFormData({ title: '', startTime: '', endTime: '' });
      await reloadPlans();
      onUpdate();
    } catch (error) {
      console.error('Failed to update plan:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update plan');
    }
  };

  const handleDeletePlan = async (plan: Plan) => {
    if (!isTimeApiReady()) {
      toast.error('API not initialized');
      return;
    }

    try {
      await plansApi.deletePlan(plan.id);
      toast.success('Plan deleted');
      await reloadPlans();
    onUpdate();
    } catch (error) {
      console.error('Failed to delete plan:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete plan');
    }
  };

  const reloadPlans = async () => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fetchedPlans = await plansApi.listPlans({ date: dateStr, tz });
    setPlans(fetchedPlans);
  };

  // Generate 24 hours
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Calculate position and height for each plan
  const getPlanStyle = (plan: Plan) => {
    const start = new Date(plan.startTime);
    const end = new Date(plan.endTime);
    
    // Get the start of the selected day in local time (midnight)
    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    
    // Normalize the plan's start time to the selected date
    // Extract the time components (hours, minutes) from the plan's start time
    // These are already in local timezone when we use getHours()/getMinutes()
    const startHours = start.getHours();
    const startMins = start.getMinutes();
    const startSecs = start.getSeconds();
    
    // Create a date on the selected day with the plan's time
    const planStartOnSelectedDay = new Date(selectedDate);
    planStartOnSelectedDay.setHours(startHours, startMins, startSecs, 0);
    
    // Calculate the difference in minutes from midnight of the selected day
    const startMinutes = (planStartOnSelectedDay.getTime() - dayStart.getTime()) / 1000 / 60;
    
    // Calculate duration in minutes
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 1000 / 60);
    
    // Each hour is 80px tall, so 1 minute = 80/60 = 1.33px
    // Position the block at the correct time slot
    const pixelsPerMinute = 80 / 60; // 1.33px per minute
    const top = Math.max(0, startMinutes * pixelsPerMinute); // Ensure non-negative
    const height = Math.max(40, durationMinutes * pixelsPerMinute); // Minimum 40px height
    
    return {
      top: `${top}px`,
      height: `${height}px`,
      position: 'absolute' as const,
      left: '0',
      right: '0',
    };
  };

  return (
    <>
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
          <h2 className="text-neutral-900 dark:text-neutral-100 font-semibold">Planned Time Blocks</h2>
      </div>
      
        <div className="relative border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          {/* Time slots */}
          <div className="relative overflow-y-auto" style={{ maxHeight: '600px', height: '1920px' }}>
            {/* Hour labels and clickable areas */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute border-b border-neutral-200 dark:border-neutral-800 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-colors"
                style={{ 
                  top: `${hour * 80}px`,
                  height: '80px',
                  width: '100%',
                  zIndex: 1,
                }}
                onClick={() => handleTimeSlotClick(hour)}
              >
                <div className="flex h-full">
                  <div className="w-16 px-3 py-2 text-sm text-neutral-500 dark:text-neutral-400 border-r border-neutral-200 dark:border-neutral-800 flex-shrink-0 z-10 relative bg-white dark:bg-neutral-900">
                    {formatHour(hour)}
                  </div>
                  <div className="flex-1 relative"></div>
                </div>
              </div>
            ))}
            
            {/* Plans overlay - positioned absolutely, starts after time column */}
            <div className="absolute inset-0 pointer-events-none" style={{ left: '64px', top: 0, right: 0, bottom: 0 }}>
              {plans
                .filter(plan => {
                  // Only show plans that are on the selected date
                  const planStart = new Date(plan.startTime);
                  const planEnd = new Date(plan.endTime);
                  const selectedDayStart = new Date(selectedDate);
                  selectedDayStart.setHours(0, 0, 0, 0);
                  const selectedDayEnd = new Date(selectedDate);
                  selectedDayEnd.setHours(23, 59, 59, 999);
                  
                  // Plan overlaps with selected day if it starts before day ends and ends after day starts
                  return planStart <= selectedDayEnd && planEnd >= selectedDayStart;
                })
                .map(plan => {
                  const style = getPlanStyle(plan);
                  
                  // Only render if the plan is within the visible day (0-1920px = 24 hours * 80px)
                  const topValue = parseFloat(style.top);
                  if (topValue < 0 || topValue > 1920) {
                    return null;
                  }
                  return (
                    <div
                      key={plan.id}
                      className="pointer-events-auto"
                      style={{ ...style, zIndex: 10 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditPlan(plan);
                      }}
                    >
                      <PlanBlock
                        plan={plan}
                        onMarkDone={() => handleMarkDone(plan)}
                        onDelete={() => handleDeletePlan(plan)}
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Create Plan Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Planned Block</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                type="text"
                placeholder="What are you planning to do?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                />
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePlan}
              className="bg-blue-600 dark:bg-indigo-700 hover:bg-blue-700 dark:hover:bg-indigo-800"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Planned Block</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                type="text"
                placeholder="What are you planning to do?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                />
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                />
              </div>
        </div>
    </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingPlan(null);
                setFormData({ title: '', startTime: '', endTime: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdatePlan}
              className="bg-blue-600 dark:bg-indigo-700 hover:bg-blue-700 dark:hover:bg-indigo-800"
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PlanBlock({ plan, onMarkDone, onDelete }: { 
  plan: Plan; 
  onMarkDone: () => void;
  onDelete: () => void;
}) {
  const category = mapCategoryIdToCategory(plan.categoryId);
  const cardColors = getCategoryCardColors(category);
  const status = plan.status;

  return (
    <div
      className={`h-full mx-1 rounded px-2 py-1 border ${cardColors.bg} ${cardColors.border} cursor-pointer hover:shadow-md transition-shadow overflow-hidden`}
    >
      <div className="flex items-start justify-between h-full gap-2">
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">
            {plan.taskTitle || 'Untitled'}
          </div>
          <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-0.5 truncate">
            {formatTime(new Date(plan.startTime))} - {formatTime(new Date(plan.endTime))}
          </div>
          <div className="mt-1">
            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs border ${getCategoryColor(category)}`}>
              {category}
            </span>
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {status === 'scheduled' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkDone();
              }}
              className="p-1 hover:bg-white/20 rounded"
              title="Mark Done"
            >
              <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 hover:bg-white/20 rounded"
            title="Delete"
          >
            <Trash2 className="w-3 h-3 text-neutral-600 dark:text-neutral-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

function formatHour(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}

