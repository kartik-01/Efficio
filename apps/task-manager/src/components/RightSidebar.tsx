import { motion } from 'framer-motion';
import { Button } from '@efficio/ui';
import { Avatar, AvatarFallback, Badge, ScrollArea, Tooltip, TooltipContent, TooltipTrigger } from '@efficio/ui';
import { ChevronRight } from 'lucide-react';

// Mock current user ID (will be replaced with actual auth later)
const CURRENT_USER_ID = 'user123';

export interface Activity {
  id: string;
  type: 'task_created' | 'task_moved' | 'task_deleted' | 'task_updated';
  taskTitle: string;
  taskId: string;
  userId: string;
  userName: string;
  timestamp: string;
  fromStatus?: 'pending' | 'in-progress' | 'completed';
  toStatus?: 'pending' | 'in-progress' | 'completed';
  groupTag?: string;
}

interface RightSidebarProps {
  activities: Activity[];
  onToggleCollapse?: () => void;
  formatTimestamp: (timestamp: string) => string;
}

export function RightSidebar({ activities, onToggleCollapse, formatTimestamp }: RightSidebarProps) {
  return (
    <div className="flex flex-col h-full space-y-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-[#101828] dark:text-foreground text-[15px] font-semibold">Recent Activity</h2>
        {onToggleCollapse && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onToggleCollapse}
                variant="outline"
                size="sm"
                className="p-2 h-[32px] w-[32px] rounded-[6px] border-gray-200 dark:border-transparent hover:bg-gray-100 dark:hover:bg-accent"
              >
                <ChevronRight className="h-4 w-4 text-gray-600 dark:text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Hide Activity (Ctrl+I)</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      
      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <div className="space-y-3 pr-2 pb-4">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#4a5565] dark:text-muted-foreground text-[13px]">No activity yet</p>
            </div>
          ) : (
            activities.map((activity, index) => {
              const isCurrentUser = activity.userId === CURRENT_USER_ID;
              const userAvatarColor = isCurrentUser 
                ? 'bg-indigo-500 dark:bg-indigo-600' 
                : ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500'][index % 5];
              
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-3 p-3 bg-gray-50 dark:bg-muted/30 rounded-[8px] border border-gray-100 dark:border-transparent"
                >
                  <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                    <AvatarFallback className={`${userAvatarColor} text-white text-[11px]`}>
                      {isCurrentUser ? 'You' : activity.userName.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#101828] dark:text-foreground text-[12px] leading-[16px]">
                      <span className="font-semibold">{activity.userName}</span>
                      {activity.type === 'task_moved' ? (
                        <>
                          {' '}moved from{' '}
                          <span className="font-medium text-indigo-500 dark:text-indigo-400 capitalize">{activity.fromStatus?.replace('-', ' ')}</span>
                          {' '}→{' '}
                          <span className="font-medium text-green-500 dark:text-green-400 capitalize">{activity.toStatus?.replace('-', ' ')}</span>
                        </>
                      ) : activity.type === 'task_created' ? (
                        <>
                          {' '}created task{' '}
                          {activity.taskTitle && (
                            <span className="font-medium">"{activity.taskTitle}"</span>
                          )}
                        </>
                      ) : (
                        <>
                          {' '}deleted task{' '}
                          {activity.taskTitle && (
                            <span className="font-medium">"{activity.taskTitle}"</span>
                          )}
                        </>
                      )}
                    </p>
                    <p className="text-[#4a5565] dark:text-muted-foreground text-[11px] mt-0.5">{formatTimestamp(activity.timestamp)}</p>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

