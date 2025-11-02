import { useState } from 'react';
import { useDrag } from 'react-dnd';
import { Calendar, Circle, MoreVertical, Edit, Trash2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Badge, Progress, Popover, PopoverContent, PopoverTrigger, Slider, Avatar, AvatarFallback, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@efficio/ui';

export interface Task {
  id: string;
  userId?: string; // Task owner's auth0Id
  title: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: string;
  progress?: number;
  isOverdue?: boolean;
  groupTag?: string; // Group tag (e.g., '@web-ui', '@personal')
  assignedTo?: string[]; // Array of user IDs assigned to this task
  assignedUsers?: Array<{ userId: string; name: string; email?: string }>; // Assigned user info (for displaying exited users)
}

interface GroupCollaborator {
  userId: string;
  name: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  status: 'pending' | 'accepted' | 'declined';
}

interface Group {
  id: string;
  tag: string;
  name: string;
  color: string;
  owner: string;
  collaborators: GroupCollaborator[];
}

interface TaskCardProps {
  task: Task;
  group?: Group; // Optional group data if task belongs to a group
  currentUserId?: string; // Current user's auth0Id
  userRole?: 'viewer' | 'editor' | 'admin' | 'owner'; // Current user's role in the group
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

export function TaskCard({ task, group, currentUserId, userRole, onProgressChange, onEdit, onDelete }: TaskCardProps) {
  const [localProgress, setLocalProgress] = useState(task.progress || 0);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check if user can drag this task
  const canDrag = (): boolean => {
    // If it's a personal task or no group, always allow dragging
    if (!group || !task.groupTag || task.groupTag === '@personal') {
      return true;
    }

    // Check if user owns the task (can always drag their own tasks)
    const taskOwnerId = task.userId?.trim();
    const currentUserIdTrimmed = currentUserId?.trim();
    const userOwnsTask = taskOwnerId && currentUserIdTrimmed && taskOwnerId === currentUserIdTrimmed;
    
    // Check if user is assigned to the task
    const isAssigned = task.assignedTo?.some(id => id?.trim() === currentUserIdTrimmed) || false;
    
    // Debug log (only in development)
    if (process.env.NODE_ENV === 'development' && task.groupTag && task.groupTag !== '@personal') {
      if (!userOwnsTask && !isAssigned && userRole === 'viewer') {
        console.debug('Task drag check:', {
          taskId: task.id,
          taskTitle: task.title,
          taskUserId: taskOwnerId,
          currentUserId: currentUserIdTrimmed,
          userOwnsTask,
          isAssigned,
          assignedTo: task.assignedTo,
          userRole,
          canDrag: userOwnsTask || isAssigned
        });
      }
    }

    // If userRole is not provided, check directly from group data
    if (!userRole) {
      // Check if user is the group owner
      if (group.owner === currentUserId) {
        return true;
      }
      // Check if user is an accepted collaborator
      const collaborator = group.collaborators.find(
        c => c.userId === currentUserId && c.status === 'accepted'
      );
      if (collaborator) {
        // Editor, admin, and owner can drag any task
        if (collaborator.role === 'editor' || collaborator.role === 'admin') {
          return true;
        }
        // Viewer can drag their own tasks (by userId or assignedTo)
        if (collaborator.role === 'viewer') {
          return userOwnsTask || isAssigned;
        }
      }
      // If user owns or is assigned to the task, allow dragging even if no role found
      if (userOwnsTask || isAssigned) {
        return true;
      }
      // If no role found, default to allowing (fallback)
      return true;
    }

    // Admin and owner can drag any task
    if (userRole === 'admin' || userRole === 'owner') {
      return true;
    }

    // Editor can drag any task
    if (userRole === 'editor') {
      return true;
    }

    // Viewer can only drag their own tasks (by userId or assignedTo)
    if (userRole === 'viewer') {
      return userOwnsTask || isAssigned;
    }

    return true; // Default allow
  };

  const isDraggable = canDrag();

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TASK',
    item: { id: task.id, status: task.status },
    canDrag: isDraggable,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [task.id, task.status, isDraggable]);

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
    ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-transparent opacity-75' 
    : task.isOverdue 
    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-transparent' 
    : 'bg-background';

  const isGroupTask = group && group.collaborators.length > 0 && task.groupTag && task.groupTag !== '@personal';
  
  // Get assigned users - filter by group members (active users)
  const assignedUsers = task.assignedTo && group 
    ? group.collaborators.filter(c => c.status === 'accepted' && task.assignedTo?.includes(c.userId))
    : [];
  
  // Find assigned users who are no longer in the group (exited users)
  // Use assignedUsers from task if available (contains name/email), otherwise fallback to userId lookup
  const exitedAssignedUsers = task.assignedTo && group
    ? task.assignedTo
        .filter(userId => {
          const isActive = group.collaborators.some(c => c.userId === userId && c.status === 'accepted');
          const isOwner = userId === group.owner;
          return !isActive && !isOwner;
        })
        .map(userId => {
          // Try to get name from task.assignedUsers (stored info), otherwise use generic
          const storedInfo = task.assignedUsers?.find(u => u.userId === userId);
          return {
            userId,
            name: storedInfo?.name || 'User',
            email: storedInfo?.email,
            isExited: true
          };
        })
    : [];
  
  // Combine active and exited users for display
  const allAssignedUsers = [...assignedUsers, ...exitedAssignedUsers];

  // Check if user can edit this task
  const canEditTask = (): boolean => {
    if (!group || !task.groupTag || task.groupTag === '@personal' || !userRole) return true;
    
    // Owner and admin can edit any task
    if (userRole === 'owner' || userRole === 'admin') return true;
    
    // Editor can edit any task
    if (userRole === 'editor') return true;
    
    // Viewer cannot edit any task
    if (userRole === 'viewer') return false;
    
    return true;
  };

  // Check if user can delete this task
  const canDeleteTask = (): boolean => {
    if (!group || !task.groupTag || task.groupTag === '@personal' || !userRole) return true;
    
    // Owner and admin can delete any task
    if (userRole === 'owner' || userRole === 'admin') return true;
    
    // Editor can delete any task
    if (userRole === 'editor') return true;
    
    // Viewer cannot delete any task
    if (userRole === 'viewer') return false;
    
    return true;
  };

  const userCanEdit = canEditTask();
  const userCanDelete = canDeleteTask();

  const handleEdit = () => {
    if (!userCanEdit) {
      return;
    }
    setIsMenuOpen(false);
    if (onEdit) {
      onEdit(task);
    }
  };

  const handleDelete = () => {
    if (!userCanDelete) {
      return;
    }
    setIsMenuOpen(false);
    if (onDelete) {
      onDelete(task.id);
    }
  };

  const dragRef = isDraggable ? drag : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={dragRef as any}
            className={`p-4 rounded-lg ${bgColor} ${isGroupTask ? 'border-l-4 border-l-emerald-500 dark:border-l-emerald-600' : ''} ${
              isDraggable ? 'cursor-move' : 'cursor-not-allowed'
            } transition-all shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3)] ${
              isDragging ? 'opacity-50' : isDraggable ? 'opacity-100' : 'opacity-60'
            } ${!isDraggable ? 'hover:opacity-70 hover:bg-gray-100 dark:hover:bg-muted/50' : 'hover:shadow-md'}`}
          >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h4 className={`flex-1 ${task.status === 'completed' ? 'line-through text-gray-500 dark:text-muted-foreground' : 'text-gray-900 dark:text-foreground'}`}>
          {task.title}
        </h4>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="secondary" className={`${priorityColors[task.priority]}`}>
            {task.priority}
          </Badge>
          {(userCanEdit || userCanDelete) && (
            <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <PopoverTrigger asChild>
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(true);
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-muted rounded transition-colors"
                  aria-label="Task options"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <MoreVertical className="h-4 w-4 text-gray-600 dark:text-muted-foreground" />
                </motion.button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-48 p-2 bg-white dark:bg-popover" 
                onClick={(e) => e.stopPropagation()}
                align="end"
                asChild
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{
                    duration: 0.15,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                >
                  <div className="flex flex-col gap-1">
                    {userCanEdit && (
                      <motion.button
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-popover-foreground hover:bg-gray-100 dark:hover:bg-accent rounded transition-colors"
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.1 }}
                      >
                        <Edit className="h-4 w-4" />
                        Edit Task
                      </motion.button>
                    )}
                    {userCanDelete && (
                      <motion.button
                        onClick={handleDelete}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-destructive hover:bg-red-50 dark:hover:bg-destructive/10 rounded transition-colors"
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.1 }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Task
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <p className={`text-sm text-gray-600 dark:text-muted-foreground mb-4 ${task.status === 'completed' ? 'line-through' : ''}`}>
        {task.description}
      </p>

      {task.progress !== undefined && task.status === 'in-progress' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600 dark:text-muted-foreground">Progress</span>
            <span className="text-sm text-gray-600 dark:text-muted-foreground">{localProgress}%</span>
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
              <PopoverContent className="w-64 bg-white dark:bg-popover" onClick={(e) => e.stopPropagation()}>
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
        <div className="flex items-center gap-2">
          {allAssignedUsers.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex -space-x-1.5">
                    {allAssignedUsers.slice(0, 2).map((user: any) => (
                      <TooltipProvider key={user.userId}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Avatar className={`h-5 w-5 border-2 border-white dark:border-card ${user.isExited ? 'opacity-50' : ''}`}>
                              <AvatarFallback className={`text-white text-[9px] ${['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500'][allAssignedUsers.indexOf(user) % 5]}`}>
                                {user.isExited ? '?' : user.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          {user.isExited && (
                            <TooltipContent>
                              <p className="text-[11px]">User left the group</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                    {allAssignedUsers.length > 2 && (
                      <div className="h-5 w-5 border-2 border-white dark:border-card rounded-full bg-gray-200 dark:bg-muted flex items-center justify-center">
                        <span className="text-[#4a5565] dark:text-muted-foreground text-[8px] font-semibold">+{allAssignedUsers.length - 2}</span>
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    {allAssignedUsers.map((user: any) => (
                      <p key={user.userId} className={`text-[11px] ${user.isExited ? 'opacity-60 italic' : ''}`}>
                        {user.isExited ? `${user.name} (left the group)` : user.name}
                      </p>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {task.category && (
            <div className="flex items-center gap-2">
              <Circle className={`h-3 w-3 ${getCategoryColor(task.category)} rounded-full fill-current`} />
              <span className="text-sm text-gray-600 dark:text-muted-foreground">{task.category}</span>
            </div>
          )}
        </div>

        {task.dueDate && (
          <div className={`flex items-center gap-1.5 text-sm ${task.isOverdue ? 'text-red-600 dark:text-destructive' : task.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-muted-foreground'} ${!task.category && assignedUsers.length === 0 ? 'ml-auto' : ''}`}>
            <Calendar className="h-3.5 w-3.5" />
            <span>{task.dueDate}</span>
          </div>
        )}
      </div>
          </div>
        </TooltipTrigger>
        {!isDraggable && userRole === 'viewer' && (
          <TooltipContent>
            <p className="text-xs">You can only move your own tasks</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

