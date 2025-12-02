import { useState } from 'react';
import { Button, Input, Label } from '@efficio/ui';
import { Plus } from 'lucide-react';
import { sessionsApi, isTimeApiReady } from '../services/timeApi';
import { classifyTitleToCategoryId } from '../lib/classification';
import { toast } from 'sonner';

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

  const handleSave = async () => {
    if (!title || !startTime || !endTime) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isTimeApiReady()) {
      toast.error('API not initialized');
      return;
    }

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
      
      // Classify title to get category
      const categoryId = await classifyTitleToCategoryId(title);

      // Create session via API
      await sessionsApi.createSession({
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
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-neutral-900 dark:text-neutral-100">Title</Label>
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
          <Label className="text-neutral-900 dark:text-neutral-100">Start Time</Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-neutral-900 dark:text-neutral-100">End Time</Label>
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
        disabled={!title || !startTime || !endTime || loading}
        className="w-full bg-blue-600 dark:bg-indigo-700 hover:bg-blue-700 dark:hover:bg-indigo-800"
      >
        <Plus className="w-4 h-4 mr-2" />
        {loading ? 'Saving...' : 'Save Entry'}
      </Button>
    </div>
  );
}