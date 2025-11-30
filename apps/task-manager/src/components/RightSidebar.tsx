import { motion } from 'framer-motion';
import { Avatar, AvatarImage, AvatarFallback, Badge, ScrollArea, Button, Tooltip, TooltipContent, TooltipTrigger } from '@efficio/ui';
import { History, ChevronRight } from 'lucide-react';

import { useAuth0 } from '@auth0/auth0-react';

export interface Activity {
  id: string;
  type: 'task_created' | 'task_moved' | 'task_deleted' | 'task_updated' | 'member_added' | 'member_removed' | 'member_role_changed' | 'member_rejoined';
  taskTitle?: string;
  taskId?: string;
  userId: string;
  userName?: string | null;
  userEmail?: string | null;
  userInitials?: string | null;
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
  isMobile?: boolean; // Indicates if sidebar is in mobile Sheet
}

export function RightSidebar({ activities, onToggleCollapse, formatTimestamp, groups = [], isMobile = false }: RightSidebarProps) {
  const { user: auth0User } = useAuth0();
  const currentUserId = auth0User?.sub || '';

  return (
    <div className="flex flex-col h-full space-y-4 overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-gray-600 dark:text-muted-foreground" />
          <h2 className="text-[#101828] dark:text-foreground text-[15px] font-semibold">Recent Activity</h2>
        </div>
        {!isMobile && onToggleCollapse && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onToggleCollapse}
                variant="outline"
                size="sm"
                className="p-2 h-[32px] w-[32px] rounded-[6px] border-gray-200 dark:border-transparent hover:bg-gray-100 dark:hover:bg-accent cursor-pointer"
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
              const isCurrentUser = activity.userId === currentUserId;
              const palette = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500'];
              // Use a neutral gray for email-only users to match reload UI; keep indigo for current user
              const userAvatarColor = isCurrentUser
                ? 'bg-indigo-500 dark:bg-indigo-600'
                : (!activity.userPicture && activity.userEmail ? 'bg-gray-300 dark:bg-gray-600' : palette[index % palette.length]);
              
              // Compute a user-facing display name that avoids repeating initials
              const displayName = (() => {
                if (isCurrentUser) return 'You';
                if (activity.userName) return activity.userName;
                if (activity.userEmail) return activity.userEmail;
                if (activity.userInitials) return `Someone (${activity.userInitials})`;
                return 'Someone';
              })();

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
                        {activity.userPicture && <AvatarImage src={activity.userPicture} alt={displayName} />}
                        <AvatarFallback className={`${userAvatarColor} text-white text-[11px]`}>
                          {(() => {
                            if (isCurrentUser) return 'You';
                            if (activity.userInitials) return activity.userInitials;
                            const name = activity.userName || '';
                            const parts = name.trim().split(/\s+/).filter(Boolean);
                            if (parts.length === 0) return '';
                            if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
                            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
                          })()}
                        </AvatarFallback>
                      </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#101828] dark:text-foreground text-[12px] leading-[16px]">
                          <span className="font-semibold">{displayName}</span>
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

