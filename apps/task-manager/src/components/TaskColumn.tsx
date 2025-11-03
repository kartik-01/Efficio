import { useDrop } from 'react-dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { TaskCard, Task } from './TaskCard';

import { Badge } from '@efficio/ui';

interface Group {
  id: string;
  tag: string;
  name: string;
  color: string;
  owner: string;
  collaborators: Array<{
    userId: string;
    name: string;
    email: string;
    role: 'viewer' | 'editor' | 'admin';
    status: 'pending' | 'accepted' | 'declined';
  }>;
}

interface TaskColumnProps {
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  tasks: Task[];
  group?: Group; // Group data to pass to TaskCard (for single group view)
  groups?: Group[]; // All groups array (for "All Tasks" view to find group per task)
  currentUserId?: string; // Current user's auth0Id
  userRole?: 'viewer' | 'editor' | 'admin' | 'owner'; // Current user's role in the group
  onTaskDrop: (taskId: string, newStatus: 'pending' | 'in-progress' | 'completed') => void;
  onProgressChange?: (taskId: string, progress: number) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  newlyAddedTaskId?: string | null;
  taskListRef?: React.RefObject<HTMLDivElement>;
}

const statusColors = {
  pending: 'bg-blue-100 text-blue-700',
  'in-progress': 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
};

export function TaskColumn({ title, status, tasks, group, groups, currentUserId, userRole, onTaskDrop, onProgressChange, onEdit, onDelete, newlyAddedTaskId, taskListRef }: TaskColumnProps) {
  // Helper function to get group for a task (for "All Tasks" view)
  const getTaskGroup = (task: Task): Group | undefined => {
    if (group) return group; // If single group is provided, use it
    if (!task.groupTag || task.groupTag === '@personal') return undefined; // Personal tasks have no group
    return groups?.find(g => g.tag === task.groupTag);
  };
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TASK',
    drop: (item: { id: string; status: string }, monitor) => {
      if (item.status !== status && !monitor.didDrop()) {
        onTaskDrop(item.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [status, onTaskDrop]);

  return (
    <div className="flex-1 min-w-0 flex flex-col h-full">
      <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-transparent shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3)] flex flex-col h-full">
        <div className="border-b border-gray-200 dark:border-transparent p-4 bg-white dark:bg-card flex-shrink-0 rounded-t-xl sticky top-[64px] z-30 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-gray-900 dark:text-card-foreground font-semibold">{title}</h2>
            <Badge variant="secondary" className={`${statusColors[status]} rounded-full`}>
              {tasks.length}
            </Badge>
          </div>
        </div>

        <div
          ref={drop as any}
          className={`flex-1 transition-colors rounded-b-xl flex flex-col min-h-[calc(100vh-420px)] ${
            isOver ? 'bg-indigo-50 dark:bg-indigo-950/30' : 'bg-white dark:bg-card'
          }`}
        >
          <div ref={taskListRef} className="p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {tasks.map((task, index) => {
              const isNewlyAdded = task.id === newlyAddedTaskId;
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={isNewlyAdded ? { opacity: 0, y: 10, scale: 0.95 } : false}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    transition: {
                      duration: isNewlyAdded ? 0.4 : 0.3,
                      ease: [0.34, 1.56, 0.64, 1], // Spring-like easing for pop effect
                    }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.9, 
                    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } 
                  }}
                  transition={{
                    layout: { 
                      duration: 0.3,
                      ease: [0.4, 0, 0.2, 1]
                    }
                  }}
                  style={{ willChange: "transform" }}
                >
                  <TaskCard 
                    task={task}
                    group={getTaskGroup(task)}
                    currentUserId={currentUserId}
                    userRole={userRole}
                    onProgressChange={onProgressChange}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

