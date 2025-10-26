import { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Calendar, Circle } from 'lucide-react';
import { Badge } from '@efficio/ui/src/components/ui/badge';
import { Progress } from '@efficio/ui/src/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@efficio/ui/src/components/ui/popover';
import { Slider } from '@efficio/ui/src/components/ui/slider';

export interface Task {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: string;
  progress?: number;
  isOverdue?: boolean;
}

interface TaskCardProps {
  task: Task;
  onProgressChange?: (taskId: string, progress: number) => void;
}

const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    Work: 'bg-blue-500',
    Personal: 'bg-green-500',
    Shopping: 'bg-purple-500',
  };
  return colors[category] || 'bg-gray-500';
};

const priorityColors = {
  High: 'bg-red-100 text-red-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-green-100 text-green-800',
};

export function TaskCard({ task, onProgressChange }: TaskCardProps) {
  const [localProgress, setLocalProgress] = useState(task.progress || 0);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: { id: task.id, status: task.status },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [task.id, task.status]);

  // Close popover when dragging starts
  if (isDragging && isPopoverOpen) {
    setIsPopoverOpen(false);
  }

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    setLocalProgress(newProgress);
    if (onProgressChange) {
      onProgressChange(task.id, newProgress);
    }
  };

  const bgColor = task.status === 'completed' 
    ? 'bg-green-50 border-green-200 opacity-75' 
    : task.isOverdue 
    ? 'bg-red-50 border-red-200' 
    : 'bg-white border-gray-200';

  return (
    <div
      ref={drag as any}
      className={`p-4 rounded-lg border ${bgColor} cursor-move transition-opacity shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className={`flex-1 ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
          {task.title}
        </h4>
        <Badge variant="secondary" className={`${priorityColors[task.priority]} shrink-0`}>
          {task.priority}
        </Badge>
      </div>

      <p className={`text-sm text-gray-600 mb-4 ${task.status === 'completed' ? 'line-through' : ''}`}>
        {task.description}
      </p>

      {task.progress !== undefined && task.status === 'in-progress' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm text-gray-600">{localProgress}%</span>
          </div>
          {isDragging ? (
            <Progress value={localProgress} className="h-2 [&>*]:bg-indigo-500" />
          ) : (
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <div className="cursor-pointer hover:opacity-80 transition-opacity">
                  <Progress value={localProgress} className="h-2 [&>*]:bg-indigo-500" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-64 bg-white" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Set Progress</span>
                    <span className="text-sm font-semibold text-indigo-600">{localProgress}%</span>
                  </div>
                  <Slider
                    value={[localProgress]}
                    onValueChange={handleProgressChange}
                    min={0}
                    max={100}
                    step={5}
                    className="[&_[data-slot=slider-range]]:bg-indigo-500 [&_[data-slot=slider-thumb]]:border-indigo-500"
                  />
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        {task.category && (
          <div className="flex items-center gap-2">
            <Circle className={`h-3 w-3 ${getCategoryColor(task.category)} rounded-full fill-current`} />
            <span className="text-sm text-gray-600">{task.category}</span>
          </div>
        )}

        {task.dueDate && (
          <div className={`flex items-center gap-1.5 text-sm ${task.isOverdue ? 'text-red-600' : task.status === 'completed' ? 'text-green-600' : 'text-gray-600'} ${!task.category ? 'ml-auto' : ''}`}>
            <Calendar className="h-3.5 w-3.5" />
            <span>{task.dueDate}</span>
          </div>
        )}
      </div>
    </div>
  );
}
