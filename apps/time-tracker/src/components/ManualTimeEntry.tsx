import { useState, useEffect } from 'react';
import { Button } from '@efficio/ui';
import { Input } from '@efficio/ui';
import { Label } from '@efficio/ui';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { timeApi, initializeTimeApi, isTimeApiReady } from '../services/timeApi';

interface ManualTimeEntryProps {
  onSave: () => void;
  selectedDate: Date;
  getAccessToken?: () => Promise<string | undefined>;
}

export function ManualTimeEntry({ onSave, selectedDate, getAccessToken }: ManualTimeEntryProps) {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [loading, setLoading] = useState(false);

  // Initialize API
  useEffect(() => {
    if (getAccessToken) {
      initializeTimeApi(getAccessToken);
    }
  }, [getAccessToken]);

  const handleSave = async () => {
    if (!title || !startTime || !endTime) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isTimeApiReady()) {
      toast.error('API not initialized');
      return;
    }

    // Combine selected date with time inputs
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const start = new Date(selectedDate);
    start.setHours(startHours, startMinutes, 0, 0);
    
    const end = new Date(selectedDate);
    end.setHours(endHours, endMinutes, 0, 0);

    if (end <= start) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      setLoading(true);

      // Classify the task title to get category
      const classification = await timeApi.classifyTitle(title);
      const categoryId = classification.categoryId;

      // Create manual session via API
      await timeApi.createManualSession({
        taskTitle: title,
        categoryId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        notes: '',
      });

      // Reset form
      setTitle('');
      setStartTime('09:00');
      setEndTime('10:00');
      
      toast.success('Time entry saved');
      onSave();
    } catch (error) {
      console.error('Failed to save manual entry:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save time entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6">
      <h2 className="text-neutral-900 dark:text-neutral-100 mb-4 font-semibold">Manual Time Entry</h2>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            type="text"
            placeholder="What did you work on?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
            />
          </div>

          <div className="space-y-2">
            <Label>End Time</Label>
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
            />
          </div>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={loading || !title || !startTime || !endTime}
          className="w-full bg-blue-600 dark:bg-indigo-700 hover:bg-blue-700 dark:hover:bg-indigo-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          {loading ? 'Saving...' : 'Save Entry'}
        </Button>
      </div>
    </div>
  );
}
