import { motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback, Badge, ScrollArea } from '@efficio/ui';

import { useAuth0 } from '@auth0/auth0-react';

export interface Activity {
  id: string;
  type: 'task_created' | 'task_moved' | 'task_deleted' | 'task_updated' | 'member_added' | 'member_removed' | 'member_role_changed' | 'member_rejoined';
  taskTitle?: string;
  taskId?: string;
  userId: string;
  userName: string;
  userPicture?: string | null; // Profile picture for the user who performed the activity
  timestamp: string;
  fromStatus?: 'pending' | 'in-progress' | 'completed';
  toStatus?: 'pending' | 'in-progress' | 'completed';
  groupTag?: string;
}

interface RightSidebarProps {
  activities: Activity[];
  onToggleCollapse?: () => void;
  formatTimestamp: (timestamp: string) => string;
  groups?: Array<{ tag: string; name: string }>; // For getting group names
}

export function RightSidebar({ activities, onToggleCollapse, formatTimestamp, groups = [] }: RightSidebarProps) {
  const { user: auth0User } = useAuth0();
  const currentUserId = auth0User?.sub || '';

  return (
    <div className="flex flex-col h-full space-y-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-[#101828] dark:text-foreground text-[15px] font-semibold">Recent Activity</h2>
      </div>
      
      <ScrollArea className="flex-1 min-h-0 overflow-hidden">
        <div className="space-y-3 pr-2 pb-4">
          {activities.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#4a5565] dark:text-muted-foreground text-[13px]">No activity yet</p>
            </div>
          ) : (
            activities.map((activity, index) => {
              const isCurrentUser = activity.userId === currentUserId;
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
                    {activity.userPicture && <AvatarImage src={activity.userPicture} alt={activity.userName} />}
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
                      ) : activity.type === 'task_deleted' ? (
                        <>
                          {' '}deleted task{' '}
                          {activity.taskTitle && (
                            <span className="font-medium">"{activity.taskTitle}"</span>
                          )}
                        </>
                      ) : activity.type === 'task_updated' ? (
                        <>
                          {' '}updated task{' '}
                          {activity.taskTitle && (
                            <span className="font-medium">"{activity.taskTitle}"</span>
                          )}
                        </>
                      ) : activity.type === 'member_added' ? (
                        <>
                          {' '}joined{' '}
                          {activity.groupTag && groups.find(g => g.tag === activity.groupTag) && (
                            <span className="font-medium">{groups.find(g => g.tag === activity.groupTag)?.name}</span>
                          )}
                        </>
                      ) : activity.type === 'member_removed' ? (
                        <>
                          {' '}left{' '}
                          {activity.groupTag && groups.find(g => g.tag === activity.groupTag) && (
                            <span className="font-medium">{groups.find(g => g.tag === activity.groupTag)?.name}</span>
                          )}
                        </>
                      ) : activity.type === 'member_rejoined' ? (
                        <>
                          {' '}rejoined{' '}
                          {activity.groupTag && groups.find(g => g.tag === activity.groupTag) && (
                            <span className="font-medium">{groups.find(g => g.tag === activity.groupTag)?.name}</span>
                          )}
                        </>
                      ) : activity.type === 'member_role_changed' ? (
                        <>updated member permissions</>
                      ) : null}
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

