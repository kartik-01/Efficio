import { useState } from 'react';
import { TimeSession, Category } from '../types';
import { addSession } from '../lib/storage';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@efficio/ui';
import { Plus } from 'lucide-react';

const CATEGORIES: Category[] = ['Work', 'Learning', 'Admin', 'Health', 'Personal', 'Rest'];

interface ManualTimeEntryProps {
  onSave: () => void;
  selectedDate: Date;
}

export function ManualTimeEntry({ onSave, selectedDate }: ManualTimeEntryProps) {
  const [title, setTitle] = useState('');
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [category, setCategory] = useState<Category>('Work');

  const handleSave = () => {
    if (!title || !startDateTime || !endDateTime) return;

    const start = new Date(startDateTime);
    const end = new Date(endDateTime);

    if (end <= start) {
      alert('End time must be after start time');
      return;
    }

    const duration = (end.getTime() - start.getTime()) / 1000 / 60;

    const newSession: TimeSession = {
      id: Date.now().toString(),
      taskTitle: title,
      category,
      startTime: start,
      endTime: end,
      duration: Math.round(duration),
    };

    addSession(newSession);
    
    // Reset form
    setTitle('');
    setStartDateTime('');
    setEndDateTime('');
    setCategory('Work');
    
    onSave();
  };

  // Helper to get default datetime-local values
  const getDefaultStartTime = () => {
    const date = new Date(selectedDate);
    date.setHours(9, 0, 0, 0);
    return formatDateTimeLocal(date);
  };

  const getDefaultEndTime = () => {
    const date = new Date(selectedDate);
    date.setHours(10, 0, 0, 0);
    return formatDateTimeLocal(date);
  };

  return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            type="text"
            placeholder="What did you work on?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-neutral-950 border-neutral-800"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Start Time</Label>
            <Input
              type="datetime-local"
              value={startDateTime}
              onChange={(e) => setStartDateTime(e.target.value)}
              className="bg-neutral-950 border-neutral-800"
            />
          </div>

          <div className="space-y-2">
            <Label>End Time</Label>
            <Input
              type="datetime-local"
              value={endDateTime}
              onChange={(e) => setEndDateTime(e.target.value)}
              className="bg-neutral-950 border-neutral-800"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger className="bg-neutral-950 border-neutral-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={handleSave} 
          disabled={!title || !startDateTime || !endDateTime}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Save Entry
        </Button>
    </div>
  );
}

function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}