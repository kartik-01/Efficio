import { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Calendar, Circle, MoreVertical, Edit, Trash2 } from 'lucide-react';

import { Badge, Progress, Popover, PopoverContent, PopoverTrigger, Slider } from '@efficio/ui';

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
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
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

export function TaskCard({ task, onProgressChange, onEdit, onDelete }: TaskCardProps) {
  const [localProgress, setLocalProgress] = useState(task.progress || 0);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const handleEdit = () => {
    setIsMenuOpen(false);
    if (onEdit) {
      onEdit(task);
    }
  };

  const handleDelete = () => {
    setIsMenuOpen(false);
    if (onDelete) {
      onDelete(task.id);
    }
  };

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
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className={`${priorityColors[task.priority]}`}>
            {task.priority}
          </Badge>
          <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(true);
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Task options"
              >
                <MoreVertical className="h-4 w-4 text-gray-600" />
              </button>
            </PopoverTrigger>
            <PopoverContent 
              className="w-48 p-2 bg-white" 
              onClick={(e) => e.stopPropagation()}
              align="end"
            >
              <div className="flex flex-col gap-1">
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Edit Task
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Task
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
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
            <Progress value={localProgress} className="h-2 [&>div]:bg-indigo-500" />
          ) : (
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <div className="cursor-pointer hover:opacity-80 transition-opacity">
                  <Progress value={localProgress} className="h-2 [&>div]:bg-indigo-500" />
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
                    className="[&_[data-radix-slider-range]]:bg-indigo-500 [&_[data-radix-slider-thumb]]:border-indigo-500"
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

