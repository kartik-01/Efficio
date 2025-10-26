import { useDrop } from 'react-dnd';
import { TaskCard, Task } from './TaskCard';
import { Badge } from '@efficio/ui/src/components/ui/badge';

interface TaskColumnProps {
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  tasks: Task[];
  onTaskDrop: (taskId: string, newStatus: 'pending' | 'in-progress' | 'completed') => void;
  onProgressChange?: (taskId: string, progress: number) => void;
}

const statusColors = {
  pending: 'bg-gray-200 text-gray-700',
  'in-progress': 'bg-amber-100 text-amber-700',
  completed: 'bg-green-100 text-green-700',
};

export function TaskColumn({ title, status, tasks, onTaskDrop, onProgressChange }: TaskColumnProps) {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item: { id: string; status: string }) => {
      if (item.status !== status) {
        onTaskDrop(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [status, onTaskDrop]);

  return (
    <div className="flex-1 min-w-0">
      <div className="bg-white rounded-lg border border-gray-200 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-900">{title}</h2>
            <Badge variant="secondary" className={`${statusColors[status]} rounded-full`}>
              {tasks.length}
            </Badge>
          </div>
        </div>

        <div
          ref={drop as any}
          className={`p-4 space-y-4 min-h-[500px] transition-colors ${
            isOver ? 'bg-indigo-50' : 'bg-white'
          }`}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onProgressChange={onProgressChange} />
          ))}
        </div>
      </div>
    </div>
  );
}