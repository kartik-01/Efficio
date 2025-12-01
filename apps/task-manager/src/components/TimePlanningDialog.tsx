import { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@efficio/ui';
import { Button } from '@efficio/ui';
import { Label } from '@efficio/ui';
import { Input } from '@efficio/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@efficio/ui';
import { Switch } from '@efficio/ui';
import { TimePlanning } from '../services/taskApi';

interface TimePlanningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle: string;
  onSave: (config: Partial<TimePlanning>) => Promise<void>;
  initialConfig?: TimePlanning;
  onSkip?: () => void;
}

export function TimePlanningDialog({
  open,
  onOpenChange,
  taskTitle,
  onSave,
  initialConfig,
  onSkip
}: TimePlanningDialogProps) {
  const [enabled, setEnabled] = useState(initialConfig?.enabled || false);
  const [defaultStartTime, setDefaultStartTime] = useState(initialConfig?.defaultStartTime || '09:00');
  const [defaultEndTime, setDefaultEndTime] = useState(initialConfig?.defaultEndTime || '10:00');
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekdays'>(initialConfig?.recurrence?.type || 'none');
  const [autoPlanOnStart, setAutoPlanOnStart] = useState(initialConfig?.autoPlanOnStart || false);
  const [showPlanningPrompt, setShowPlanningPrompt] = useState(initialConfig?.showPlanningPrompt !== false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && initialConfig) {
      setEnabled(initialConfig.enabled || false);
      setDefaultStartTime(initialConfig.defaultStartTime || '09:00');
      setDefaultEndTime(initialConfig.defaultEndTime || '10:00');
      setRecurrence(initialConfig.recurrence?.type || 'none');
      setAutoPlanOnStart(initialConfig.autoPlanOnStart || false);
      setShowPlanningPrompt(initialConfig.showPlanningPrompt !== false);
    }
  }, [open, initialConfig]);

  const handleSave = async () => {
    if (!enabled) {
      // If disabling, just save the disabled state
      setLoading(true);
      try {
        await onSave({ enabled: false });
        onOpenChange(false);
      } catch (error) {
        console.error('Failed to save time planning config:', error);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Validate times
    if (!defaultStartTime || !defaultEndTime) {
      return;
    }

    const [startHours, startMins] = defaultStartTime.split(':').map(Number);
    const [endHours, endMins] = defaultEndTime.split(':').map(Number);
    
    const startMinutes = startHours * 60 + startMins;
    const endMinutes = endHours * 60 + endMins;
    
    if (endMinutes <= startMinutes) {
      // End time should be after start time
      return;
    }

    setLoading(true);
    try {
      await onSave({
        enabled: true,
        defaultStartTime,
        defaultEndTime,
        recurrence: {
          type: recurrence,
        },
        autoPlanOnStart,
        showPlanningPrompt,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to save time planning config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Plan Time for "{taskTitle}"
          </DialogTitle>
          <DialogDescription>
            Set up automatic time planning for this task. When the task is in-progress, time blocks will be created automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Time Planning</Label>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Automatically create time blocks for this task
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {enabled && (
            <>
              {/* Time Slot */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                  <Label>Default Time Slot</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={defaultStartTime}
                      onChange={(e) => setDefaultStartTime(e.target.value)}
                      className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={defaultEndTime}
                      onChange={(e) => setDefaultEndTime(e.target.value)}
                      className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800"
                    />
                  </div>
                </div>
              </div>

              {/* Recurrence Pattern */}
              <div className="space-y-2">
                <Label>Recurrence</Label>
                <Select value={recurrence} onValueChange={(v) => setRecurrence(v as 'none' | 'daily' | 'weekdays')}>
                  <SelectTrigger className="bg-white dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">One-time (today only)</SelectItem>
                    <SelectItem value="daily">Daily (every day)</SelectItem>
                    <SelectItem value="weekdays">Weekdays (Mon-Fri)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {recurrence === 'none' && 'Plan will be created only for today'}
                  {recurrence === 'daily' && 'Plan will be created every day until task is completed'}
                  {recurrence === 'weekdays' && 'Plan will be created on weekdays until task is completed'}
                </p>
              </div>

              {/* Auto-plan on Start */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-create Plans</Label>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Automatically create plans when task moves to in-progress
                  </p>
                </div>
                <Switch checked={autoPlanOnStart} onCheckedChange={setAutoPlanOnStart} />
              </div>

              {/* Show Prompt */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Planning Prompt</Label>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Ask before creating plans when task moves to in-progress
                  </p>
                </div>
                <Switch checked={showPlanningPrompt} onCheckedChange={setShowPlanningPrompt} />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {onSkip && (
            <Button variant="outline" onClick={handleSkip} disabled={loading}>
              Skip
            </Button>
          )}
          <Button
            onClick={handleSave}
            disabled={loading || (enabled && (!defaultStartTime || !defaultEndTime))}
            className="bg-blue-600 dark:bg-indigo-700 hover:bg-blue-700 dark:hover:bg-indigo-800"
          >
            {loading ? 'Saving...' : enabled ? 'Save & Create Plans' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

