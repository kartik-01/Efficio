import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast, Toaster } from 'sonner';
import { TaskColumn } from '../components/TaskColumn';
import { TaskCard, Task } from '../components/TaskCard';
import { LeftSidebar, Group, GroupCollaborator } from '../components/LeftSidebar';
import { RightSidebar, Activity } from '../components/RightSidebar';
import { Card } from '@efficio/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@efficio/ui';
import { Input } from '@efficio/ui';
import { Button } from '@efficio/ui';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@efficio/ui';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@efficio/ui';
import { Label } from '@efficio/ui';
import { Textarea } from '@efficio/ui';
import { Checkbox } from '@efficio/ui';
import { Slider } from '@efficio/ui';
import { ListTodo, Clock, TrendingUp, AlertCircle, Search, Plus, Calendar, Circle, Users, Settings, Bell, X, CheckCircle2, History, User as UserIcon, ArrowRight, Menu, ChevronLeft, ChevronRight, Activity as ActivityIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, ScrollArea, Separator, Avatar, AvatarImage, AvatarFallback, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, Tabs, TabsList, TabsTrigger, TabsContent } from '@efficio/ui';
import { taskApi } from '../services/taskApi';
import { activityApi } from '../services/activityApi';
import { useAuth0 } from '@auth0/auth0-react';

// Types are now imported from LeftSidebar component

// Mock groups data (temporarily hardcoded)
const GROUP_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

import { SYSTEM_CATEGORIES, getCategoryColor } from '../utils/categories';

// Helper function to map backend activity from API to frontend Activity format
const mapApiActivityToFrontend = (act: any): Activity => ({
  id: act.id || act._id || '',
  type: act.type,
  taskTitle: act.taskTitle || '',
  taskId: act.taskId || '',
  userId: act.userId,
  userName: act.userName,
  userPicture: act.userPicture || null,
  timestamp: act.timestamp || act.createdAt || new Date().toISOString(),
  fromStatus: act.fromStatus,
  toStatus: act.toStatus,
  groupTag: act.groupTag,
});

// Helper function to map backend task from API to frontend Task format
const mapApiTaskToFrontend = (task: any): Task => ({
  ...task,
  id: task.id || (task as any)._id || '',
  userId: (task.userId || (task as any).userId || '').toString().trim(),
  groupTag: task.groupTag || (task as any).groupTag || undefined,
  assignedTo: (task.assignedTo || (task as any).assignedTo || []).map((id: string) => id?.toString().trim()).filter(Boolean),
  assignedUsers: task.assignedUsers || (task as any).assignedUsers || [],
});

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]); // Filtered tasks for current view
  const [allTasks, setAllTasks] = useState<Task[]>([]); // All tasks for counting in sidebar (personal + assigned only, matching "All Tasks" view)
  const [groupTasksMap, setGroupTasksMap] = useState<Map<string, Task[]>>(new Map()); // Tasks per group for accurate group counts
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('dueDate');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    category: '',
    priority: 'Medium',
    status: 'pending',
    dueDate: '',
    progress: 20,
  });
  // Modal category selection state (system categories + 'Other')
  const [categorySelection, setCategorySelection] = useState<string>('');
  const [includeProgress, setIncludeProgress] = useState(false);
  const [newlyAddedTaskId, setNewlyAddedTaskId] = useState<string | null>(null);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [skipModalAnimation, setSkipModalAnimation] = useState(false); // Flag to skip animation during task creation
  const [previewTask, setPreviewTask] = useState<Partial<Task> | null>(null); // Task data for the collapsing preview
  const [targetCardWidth, setTargetCardWidth] = useState<number>(320); // Target width for the card
  const [flyingTask, setFlyingTask] = useState<{ task: Partial<Task>; fromRect: DOMRect; toRect: DOMRect } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const pendingColumnRef = useRef<HTMLDivElement>(null);
  const pendingTaskListRef = useRef<HTMLDivElement>(null);

  const { user: auth0User } = useAuth0();
  const currentUserId = auth0User?.sub || '';

  // Collaboration state
  const [groups, setGroups] = useState<Group[]>([
    {
      id: 'group1',
      tag: '@web-ui',
      name: 'Web UI Project',
      color: '#3b82f6',
      owner: currentUserId,
      collaborators: [
        { userId: 'user456', name: 'Sarah Chen', email: 'sarah@example.com', role: 'editor', status: 'accepted', invitedAt: '2025-01-15T10:00:00.000Z', acceptedAt: '2025-01-15T11:00:00.000Z' },
        { userId: 'user789', name: 'Mike Johnson', email: 'mike@example.com', role: 'editor', status: 'accepted', invitedAt: '2025-01-15T10:00:00.000Z', acceptedAt: '2025-01-15T12:00:00.000Z' },
      ],
      createdAt: '2025-01-15T10:00:00.000Z',
    },
  ]);
  // Selected group state (persisted in localStorage)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('taskManagerSelectedGroup');
      return saved !== null ? (saved === 'null' ? null : saved) : null;
    }
    return null;
  });
  
  // Save selectedGroup to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('taskManagerSelectedGroup', selectedGroup === null ? 'null' : selectedGroup);
    }
  }, [selectedGroup]);
  
  // Sidebar collapse states (persisted in localStorage)
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('leftSidebarCollapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rightSidebarCollapsed');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileActivity, setShowMobileActivity] = useState(false);
  const [mobileActiveTab, setMobileActiveTab] = useState<'pending' | 'in-progress' | 'completed'>('pending');
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [taskForStatusChange, setTaskForStatusChange] = useState<Task | null>(null);

  // Listen for events from Navbar to toggle mobile sidebars
  useEffect(() => {
    const handleToggleSidebar = () => {
      setShowMobileSidebar(prev => !prev);
    };
    const handleToggleActivity = () => {
      setShowMobileActivity(prev => !prev);
    };

    window.addEventListener('toggleMobileSidebar', handleToggleSidebar);
    window.addEventListener('toggleMobileActivity', handleToggleActivity);

    return () => {
      window.removeEventListener('toggleMobileSidebar', handleToggleSidebar);
      window.removeEventListener('toggleMobileActivity', handleToggleActivity);
    };
  }, []);

  // Activity type is now imported from RightSidebar component

  const [activities, setActivities] = useState<Activity[]>([]);
  
  // Function to load activities (can be called manually for refresh)
  const loadActivities = useCallback(async (groupTag?: string | null) => {
    try {
      const fetchedActivities = await activityApi.getActivities({
        groupTag: groupTag !== undefined ? (groupTag || undefined) : (selectedGroup || undefined),
        limit: 50,
      });
      
      // Map backend activities to frontend format
      const mappedActivities: Activity[] = fetchedActivities.map(mapApiActivityToFrontend);
      
      setActivities(mappedActivities);
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  }, [selectedGroup]);

  // Fetch activities on mount and when selected group changes
  useEffect(() => {
    loadActivities();
  }, [selectedGroup, loadActivities]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Fetch tasks when selected group changes (this also handles initial load)
  useEffect(() => {
    fetchTasks(selectedGroup);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup]);
  
  // Persist sidebar states
  useEffect(() => {
    localStorage.setItem('leftSidebarCollapsed', JSON.stringify(leftSidebarCollapsed));
  }, [leftSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('rightSidebarCollapsed', JSON.stringify(rightSidebarCollapsed));
  }, [rightSidebarCollapsed]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setLeftSidebarCollapsed((prev: boolean) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        setRightSidebarCollapsed((prev: boolean) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Listen for navigation events from notifications
  useEffect(() => {
    const handleNavigateToGroup = (event: CustomEvent) => {
      const { groupTag, taskId } = event.detail || {};
      if (groupTag) {
        setSelectedGroup(groupTag);
        // Optionally scroll to or highlight the task if taskId is provided
        if (taskId) {
          // Could add logic to highlight the specific task
          setTimeout(() => {
            const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
            if (taskElement) {
              taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Add a highlight effect
              taskElement.classList.add('ring-2', 'ring-indigo-500');
              setTimeout(() => {
                taskElement.classList.remove('ring-2', 'ring-indigo-500');
              }, 2000);
            }
          }, 500);
        }
      }
    };

    const handleOpenPendingInvitations = () => {
      // This will be handled by LeftSidebar component
      window.dispatchEvent(new CustomEvent('leftSidebarOpenInvitations'));
    };

    window.addEventListener('navigateToGroup', handleNavigateToGroup as EventListener);
    window.addEventListener('openPendingInvitations', handleOpenPendingInvitations);
    
    return () => {
      window.removeEventListener('navigateToGroup', handleNavigateToGroup as EventListener);
      window.removeEventListener('openPendingInvitations', handleOpenPendingInvitations);
    };
  }, [setSelectedGroup]);

  const fetchTasks = async (groupTag?: string | null) => {
    try {
      setLoading(true);
      // Fetch tasks filtered by groupTag if provided
      const fetchedTasks = await taskApi.getTasks(groupTag || undefined);
      // Ensure all tasks have id property and userId (map _id to id if needed)
      const mappedTasks = fetchedTasks.map(mapApiTaskToFrontend);
      
      // Update groupTasksMap BEFORE updating tasks to ensure counts are accurate
      if (groupTag) {
        // Store all tasks for this specific group (for accurate group count)
        setGroupTasksMap((prev) => {
          const newMap = new Map(prev);
          if (groupTag === '@personal') {
            newMap.set('@personal', mappedTasks);
          } else {
            newMap.set(groupTag, mappedTasks);
          }
          return newMap;
        });
      } else {
        // If no groupTag, this is "All Tasks" - update allTasks with fetched tasks
        // These are already filtered by backend to show personal + assigned only
        setAllTasks(mappedTasks);
      }
      
      // Update tasks state AFTER groupTasksMap to ensure consistency
      setTasks(mappedTasks);
    } catch (error) {
      toast.error('Failed to Fetch Tasks', {
        description: error instanceof Error ? error.message : 'An unknown error occurred while loading tasks.',
        duration: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all tasks for sidebar counting (on mount and when groups change)
  // Apply same filtering logic as "All Tasks" view: personal tasks + assigned group tasks only
  useEffect(() => {
    const fetchAllTasks = async () => {
      try {
        // Fetch all tasks (no groupTag filter) for counting in sidebar
        const fetchedAllTasks = await taskApi.getTasks(undefined);
        const mappedAllTasks = fetchedAllTasks.map(mapApiTaskToFrontend);
        
        // Apply same filtering as "All Tasks" view:
        // - Personal tasks: always include
        // - Group tasks: only include if user has accepted access AND is assigned
        const filteredAllTasks = mappedAllTasks.filter(task => {
          // Personal tasks always visible
          if (!task.groupTag || task.groupTag === '@personal') {
            return true;
          }
          // For group tasks:
          // 1. User must have accepted access to the group (not just pending)
          const group = groups.find(g => g.tag === task.groupTag);
          if (!group) return false;
          
          const hasAcceptedAccess = group.owner === currentUserId || 
            group.collaborators.some(c => c.userId === currentUserId && c.status === 'accepted');
          
          if (!hasAcceptedAccess) return false;
          
          // 2. User must be assigned to the task
          const isAssigned = task.assignedTo && task.assignedTo.some((id: string) => id?.trim() === currentUserId?.trim());
          return isAssigned;
        });
        
        setAllTasks(filteredAllTasks);
      } catch (error) {
        console.error('Failed to fetch all tasks for counting:', error);
      }
    };
    
    if (groups.length > 0 && currentUserId) {
      fetchAllTasks();
    }
  }, [groups, currentUserId]); // Reload when groups or currentUserId changes

  const handleTaskDrop = async (taskId: string, newStatus: 'pending' | 'in-progress' | 'completed') => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (task && task.status !== newStatus) {
      // Optimistically update UI
      setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === taskId ? { ...t, status: newStatus } : t
          )
        );
      setAllTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === taskId ? { ...t, status: newStatus } : t
        )
      );
      // Also update in groupTasksMap
      setGroupTasksMap((prev) => {
        const newMap = new Map(prev);
        newMap.forEach((groupTasks, groupTag) => {
          const updatedTasks = groupTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
          newMap.set(groupTag, updatedTasks);
        });
        return newMap;
      });
        
        // Update via API and get the created activity back so we can update sidebar immediately
        const result: any = await taskApi.updateTaskStatus(taskId, newStatus);
        if (result && result.activity) {
          try {
            const mapped = mapApiActivityToFrontend(result.activity);
            // If the returned activity lacks a userPicture (backend may not populate it
            // for immediate responses), use the current Auth0 user's picture as a fallback
            // to avoid showing the "You" text fallback. This mirrors the server-side
            // behavior used when listing activities.
            if (!mapped.userPicture && mapped.userId === currentUserId) {
              mapped.userPicture = auth0User?.picture || null;
            }
            setActivities(prev => [mapped, ...prev].slice(0, 50));
          } catch (err) {
            console.error('Failed to map returned activity:', err);
            // Fallback: reload activities if mapping fails
            loadActivities(selectedGroup || undefined);
          }
        } else {
          // Fallback: reload activities if API didn't return an activity
          loadActivities(selectedGroup || undefined);
        }
      }
    } catch (error) {
      // Revert on error - refetch both
      await fetchTasks(selectedGroup);
    }
  };

  const handleProgressChange = async (taskId: string, progress: number) => {
    try {
      // Optimistically update UI
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, progress } : task
        )
      );
      setAllTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, progress } : task
        )
      );
      // Also update in groupTasksMap
      setGroupTasksMap((prev) => {
        const newMap = new Map(prev);
        newMap.forEach((groupTasks, groupTag) => {
          const updatedTasks = groupTasks.map(t => t.id === taskId ? { ...t, progress } : t);
          newMap.set(groupTag, updatedTasks);
        });
        return newMap;
      });
      
      // Update via API
      await taskApi.updateTaskProgress(taskId, progress);
    } catch (error) {
      // Revert on error - refetch both
      await fetchTasks(selectedGroup);
    }
  };

  const handleMobileStatusChange = (task: Task, newStatus: 'pending' | 'in-progress' | 'completed') => {
    setTaskForStatusChange(null);
    setShowStatusSheet(false);
    handleTaskDrop(task.id, newStatus);
  };

  const handleOpenStatusSheet = (task: Task) => {
    setTaskForStatusChange(task);
    setShowStatusSheet(true);
  };

  const handleEdit = (task: Task) => {
    // Check if user can edit this task
    const canEdit = () => {
      if (!selectedGroupData || selectedGroup === '@personal') return true; // Personal tasks always editable
      if (!userRole) return true; // No role means personal task
      
      // Owner and admin can edit any task
      if (userRole === 'owner' || userRole === 'admin') return true;
      
      // Editor can edit any task
      if (userRole === 'editor') return true;
      
      // Viewer can only edit their own tasks
      if (userRole === 'viewer') {
        return task.userId === currentUserId;
      }
      
      return true;
    };

    if (!canEdit()) {
      toast.error('You do not have permission to edit this task');
      return;
    }

    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate || '',
      progress: task.progress || 20,
      assignedTo: task.assignedTo || [],
    });
    // Initialize category selection state for the modal
    if (task.category && SYSTEM_CATEGORIES.includes(task.category)) {
      setCategorySelection(task.category);
    } else if (task.category) {
      // Any non-system category is represented as 'Other'
      setCategorySelection('Other');
    } else {
      setCategorySelection('');
    }
    setIncludeProgress(task.progress !== undefined);
    setSkipModalAnimation(false); // Ensure animations are enabled for edit mode
    setShowModal(true);
  };

  const handleDeleteClick = (taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
      return;
    }

    const taskIdToDelete = taskToDelete;
    // Close dialog first
    setDeleteDialogOpen(false);
    
    try {
      const taskToDeleteObj = tasks.find(t => t.id === taskIdToDelete);
      await taskApi.deleteTask(taskIdToDelete);
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskIdToDelete));
      setAllTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskIdToDelete));
      // Also remove from groupTasksMap
      if (taskToDeleteObj?.groupTag) {
        setGroupTasksMap((prev) => {
          const newMap = new Map(prev);
          const groupTag = taskToDeleteObj.groupTag === '@personal' || !taskToDeleteObj.groupTag 
            ? '@personal' 
            : taskToDeleteObj.groupTag;
          const groupTasks = newMap.get(groupTag) || [];
          newMap.set(groupTag, groupTasks.filter(t => t.id !== taskIdToDelete));
          return newMap;
        });
      }
      
      // Activities are now fetched from API automatically
      // Refresh activities after deletion
      const refreshedActivities = await activityApi.getActivities({
        groupTag: selectedGroup || undefined,
        limit: 50,
      });
      const mappedActivities: Activity[] = refreshedActivities.map(mapApiActivityToFrontend);
      setActivities(mappedActivities);
      
      console.log('🍞 Toast: Task Deleted');
      toast.success('Task Deleted', {
        description: 'The task has been permanently removed from your list.',
        duration: 2000,
      });
      console.log('🍞 Toast called for Task Deleted');
    } catch (error) {
      toast.error('Failed to Delete Task', {
        description: error instanceof Error ? error.message : 'An unknown error occurred while deleting the task.',
        duration: 2000,
      });
    } finally {
      setTaskToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  // Clean up taskToDelete when dialog closes
  useEffect(() => {
    if (!deleteDialogOpen) {
      setTaskToDelete(null);
    }
  }, [deleteDialogOpen]);

  const capitalizeWords = (str: string) => {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleAddTask = async () => {
    if (!newTask.title?.trim()) return;

    const computeCategory = () => {
      if (categorySelection) return capitalizeWords(categorySelection);
      return '';
    };

    const finalCategory = computeCategory();

    const taskData = {
      title: newTask.title,
      description: newTask.description || '',
      category: finalCategory,
      priority: (newTask.priority || 'Medium') as 'High' | 'Medium' | 'Low',
      status: editingTask ? (newTask.status || 'pending') : 'pending',
      dueDate: newTask.dueDate || '',
      progress: includeProgress ? (newTask.progress || 0) : undefined,
      groupTag: selectedGroup || '@personal', // Add groupTag to task
      assignedTo: newTask.assignedTo || [], // Add assignedTo array
    };

    try {
      let savedTask: any;
      
      if (editingTask) {
        // Update existing task
        savedTask = await taskApi.updateTask(editingTask.id, taskData);
        const updatedTask: Task = { ...savedTask, id: savedTask.id || savedTask._id || '' };
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === editingTask.id ? updatedTask : task))
        );
        setAllTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === editingTask.id ? updatedTask : task))
        );
        // Also update in groupTasksMap
        setGroupTasksMap((prev) => {
          const newMap = new Map(prev);
          if (updatedTask.groupTag) {
            const groupTag = updatedTask.groupTag === '@personal' ? '@personal' : updatedTask.groupTag;
            const groupTasks = newMap.get(groupTag) || [];
            newMap.set(groupTag, groupTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
          }
          return newMap;
        });
        console.log('🍞 Toast: Task Updated');
        toast.success('Task Updated', {
          description: 'Your task has been successfully updated.',
          duration: 2000,
        });
        console.log('🍞 Toast called for Task Updated');
      } else {
        // Create new task
        savedTask = await taskApi.createTask(taskData);
        
        // Check if this is the first task (when there are no tasks, kanban board isn't rendered)
        const isFirstTask = pendingTasks.length === 0 && inProgressTasks.length === 0 && completedTasks.length === 0;
        
        // Fallback: if refs aren't available OR if it's the first task, add task without flying animation
        if (isFirstTask || !modalContentRef.current || !pendingColumnRef.current) {
          const newTask: Task = { ...savedTask, id: savedTask.id || savedTask._id || '' };
          setTasks((prevTasks) => [...prevTasks, newTask]);
          setAllTasks((prevTasks) => [...prevTasks, newTask]);
          // Also add to groupTasksMap if it's a group task
          if (newTask.groupTag) {
            setGroupTasksMap((prev) => {
              const newMap = new Map(prev);
              const groupTag = newTask.groupTag === '@personal' ? '@personal' : newTask.groupTag!;
              const groupTasks = newMap.get(groupTag) || [];
              newMap.set(groupTag, [...groupTasks, newTask]);
              return newMap;
            });
          }
          
          // For first task, ensure we don't skip modal animation
          // Close modal with normal animation after task is added to state
          setSkipModalAnimation(false); // Ensure animation is enabled
          setTimeout(() => {
            setShowModal(false);
          }, 100); // Small delay to ensure task is added to state first
          
          // Reset form after modal closing animation completes
          setTimeout(() => {
            setNewTask({
              title: '',
              description: '',
              category: '',
              priority: 'Medium',
              status: 'pending',
              dueDate: '',
              progress: 20,
              assignedTo: [],
            });
            setIncludeProgress(false);
            setEditingTask(null);
          }, 400); // After modal closing animation completes (0.2s animation + buffer)
          
          console.log('🍞 Toast: Task Added (fallback path)');
          toast.success('Task Added', {
            description: 'Your new task has been successfully added to the list.',
            duration: 2000,
          });
          console.log('🍞 Toast called for Task Added (fallback path)');
          
          // Refresh activities after task creation
          const refreshedActivities = await activityApi.getActivities({
            groupTag: selectedGroup || undefined,
            limit: 50,
          });
          const mappedActivities: Activity[] = refreshedActivities.map(mapApiActivityToFrontend);
          setActivities(mappedActivities);
        } else {
          // Get positions BEFORE starting animation
          const fromRect = modalContentRef.current.getBoundingClientRect();
          const columnRect = pendingColumnRef.current.getBoundingClientRect();
          
          // Calculate target card width (column width minus padding)
          const cardWidth = columnRect.width - 32;
          setTargetCardWidth(cardWidth);
          
          // Set the preview task data directly (not using state which is async)
          setPreviewTask(savedTask);
          
          // Calculate the position at the end of the task list
          let toRect: DOMRect;
          if (pendingTaskListRef.current) {
            const taskListRect = pendingTaskListRef.current.getBoundingClientRect();
            const lastChild = pendingTaskListRef.current.lastElementChild;
            
            if (lastChild) {
              // Position after the last task (with 16px gap for space-y-4)
              const lastChildRect = lastChild.getBoundingClientRect();
              toRect = new DOMRect(
                columnRect.left + 16,
                lastChildRect.bottom + 16,
                columnRect.width - 32,
                180 // Approximate card height
              );
            } else {
              // No tasks yet, position at the top of the list
              toRect = new DOMRect(
                columnRect.left + 16,
                taskListRect.top,
                columnRect.width - 32,
                180
              );
            }
          } else {
            // Fallback to column position
            toRect = new DOMRect(
              columnRect.left + 16,
              columnRect.top + 80,
              columnRect.width - 32,
              180
            );
          }

          // Skip modal animation during task creation to avoid conflict with fly animation
          setSkipModalAnimation(true);
          
          // Close the modal immediately (without animation) and start animation
          setShowModal(false);
          setIsCollapsing(true);
          
          // Small delay to allow Dialog to start closing, then start collapse animation
          setTimeout(() => {
            // After collapse animation, start flying
            setTimeout(() => {
              // Clear the preview and start flying animation
              setPreviewTask(null);
              setFlyingTask({ task: savedTask, fromRect, toRect });
              
                // Add task to list after flying animation completes
              setTimeout(() => {
                setFlyingTask(null);
                const newTask: Task = { ...savedTask, id: savedTask.id || savedTask._id || '' };
                setTasks((prevTasks) => [...prevTasks, newTask]);
                setNewlyAddedTaskId(savedTask.id);
                setIsCollapsing(false); // Reset collapsing state
                
                // Reset the newly added flag after animation completes
                setTimeout(() => {
                  setNewlyAddedTaskId(null);
                }, 600);
              }, 1300); // Total flight duration - 1.3s for smoother, slower travel
            }, 450); // Collapse duration - 0.45s for fairly quick (7/10)
          }, 10); // Small delay to render updated state first

          console.log('🍞 Toast: Task Added (with animation)');
          toast.success('Task Added', {
            description: 'Your new task has been successfully added to the list.',
            duration: 2000,
          });
          console.log('🍞 Toast called for Task Added (with animation)');
          
          // Activities are now fetched from API automatically
          // Refresh activities after task creation
          const refreshedActivities = await activityApi.getActivities({
            groupTag: selectedGroup || undefined,
            limit: 50,
          });
          const mappedActivities: Activity[] = refreshedActivities.map(mapApiActivityToFrontend);
          setActivities(mappedActivities);
        }
      }

      // Reset form
      // For editing, close modal normally (will have animation)
      // For creating, modal is already closed via setSkipModalAnimation (no animation to avoid conflict)
      if (editingTask) {
        setShowModal(false);
      }
      // Reset skip animation flag after fly animation completes
      setTimeout(() => {
        setSkipModalAnimation(false);
      }, 2000); // Wait for fly animation to complete
      
      setEditingTask(null);
      setNewTask({
        title: '',
        description: '',
        category: '',
        priority: 'Medium',
        status: 'pending',
        dueDate: '',
        progress: 20,
      });
      setCategorySelection('');
      setIncludeProgress(false);
    } catch (error) {
      console.log('🍞 Toast ERROR:', editingTask ? 'Failed to Update Task' : 'Failed to Add Task');
      toast.error(editingTask ? 'Failed to Update Task' : 'Failed to Add Task', {
        description: error instanceof Error ? error.message : 'An unknown error occurred. Please try again.',
        duration: 2000,
      });
      console.log('🍞 Toast error called');
    }
  };

  // Helper functions for groups
  const hasGroupAccess = (group: Group) => {
    if (group.owner === currentUserId) return true;
    return group.collaborators.some(c => c.userId === currentUserId && c.status === 'accepted');
  };

  const accessibleGroups = [
    { id: 'personal', tag: '@personal', name: 'Personal', color: '#9ca3af', owner: currentUserId, collaborators: [], createdAt: '' },
    ...groups.filter(hasGroupAccess),
  ];

  const pendingInvitations = groups.filter(group =>
    group.collaborators.some(c => c.userId === currentUserId && c.status === 'pending')
  );

  // Memoize selectedGroupData to update when groups or selectedGroup changes
  const selectedGroupData = useMemo(() => {
    return selectedGroup ? groups.find(g => g.tag === selectedGroup) : null;
  }, [selectedGroup, groups, currentUserId]);
  
  const acceptedCollaborators = useMemo(() => {
    return selectedGroupData?.collaborators.filter(c => c.status === 'accepted') || [];
  }, [selectedGroupData]);
  
  // Calculate current user's role in the selected group
  const userRole = useMemo((): 'viewer' | 'editor' | 'admin' | 'owner' | undefined => {
    if (!selectedGroupData || selectedGroup === '@personal') return undefined;
    
    // Check if user is the owner
    if (selectedGroupData.owner === currentUserId) {
      return 'owner';
    }
    
    // Find user's collaborator entry - check for accepted status
    const collaborator = selectedGroupData.collaborators.find(
      c => c.userId === currentUserId && c.status === 'accepted'
    );
    
    // If no accepted collaborator found, try to find any collaborator entry (might be pending)
    // But only return role if accepted
    if (collaborator) {
      return collaborator.role as 'viewer' | 'editor' | 'admin';
    }
    
    // Debug: log if we can't find the role
    if (selectedGroupData.collaborators.some(c => c.userId === currentUserId)) {
      console.warn('User found in group collaborators but status is not accepted:', {
        userId: currentUserId,
        collaborators: selectedGroupData.collaborators.filter(c => c.userId === currentUserId)
      });
    }
    
    return undefined;
  }, [selectedGroupData, currentUserId, selectedGroup]);
  const canCreateTask = !selectedGroupData || selectedGroup === '@personal' || userRole === 'admin' || userRole === 'owner' || userRole === 'editor';
  const canSeeAssignTo = selectedGroupData && selectedGroup !== '@personal' && (userRole === 'admin' || userRole === 'owner' || userRole === 'editor') && acceptedCollaborators.length > 0;

  // Group handlers are now in LeftSidebar component

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

    // Group filter
    if (selectedGroup) {
      if (selectedGroup === '@personal') {
        filtered = filtered.filter(task => !task.groupTag || task.groupTag === '@personal');
      } else {
        filtered = filtered.filter(task => {
          if (task.groupTag !== selectedGroup) return false;
          const group = groups.find(g => g.tag === selectedGroup);
          return group && hasGroupAccess(group);
        });
      }
    } else {
      // "All Tasks" - show personal tasks AND only group tasks where user is assigned AND has accepted access
      filtered = filtered.filter(task => {
        // Personal tasks always visible
        if (!task.groupTag || task.groupTag === '@personal') {
          return true;
        }
        // For group tasks:
        // 1. User must have accepted access to the group (not just pending)
        const group = groups.find(g => g.tag === task.groupTag);
        if (!group) return false;
        
        const hasAcceptedAccess = group.owner === currentUserId || 
          group.collaborators.some(c => c.userId === currentUserId && c.status === 'accepted');
        
        if (!hasAcceptedAccess) return false;
        
        // 2. User must be assigned to the task
        const isAssigned = task.assignedTo && task.assignedTo.some(id => id?.trim() === currentUserId?.trim());
        return isAssigned;
      });
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'Other') {
        // Show tasks with a category set that is not in the system-defined list
        filtered = filtered.filter((task) => task.category && !SYSTEM_CATEGORIES.includes(task.category));
      } else {
        filtered = filtered.filter((task) => task.category === categoryFilter);
      }
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder = { High: 0, Medium: 1, Low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      // Default sort by due date (keeping original order for now)
      return 0;
    });

    return sorted;
  }, [tasks, searchQuery, priorityFilter, categoryFilter, sortBy, selectedGroup, groups]);

  const pendingTasks = filteredAndSortedTasks.filter((task) => task.status === 'pending');
  const inProgressTasks = filteredAndSortedTasks.filter((task) => task.status === 'in-progress');
  const completedTasks = filteredAndSortedTasks.filter((task) => task.status === 'completed');

  const totalTasks = filteredAndSortedTasks.length; // Use filtered tasks for accurate count
  const overdueTasks = filteredAndSortedTasks.filter((task) => task.isOverdue).length;
  
  // Check if there are no tasks at all
  const hasNoTasks = pendingTasks.length === 0 && inProgressTasks.length === 0 && completedTasks.length === 0;
  
  // Determine if user is a viewer (can't create tasks)
  const isViewer = selectedGroupData && selectedGroup !== '@personal' && userRole === 'viewer';

  return (
    <DndProvider backend={HTML5Backend}>
      <style>{`
        [data-sonner-toast][data-type="success"] {
          border-left: 4px solid rgb(168, 85, 247) !important;
        }
        [data-sonner-toast][data-type="error"] {
          border-left: 4px solid rgb(220, 38, 38) !important;
        }
        [data-sonner-toast] [data-icon] {
          color: rgb(168, 85, 247) !important;
        }
        [data-sonner-toast][data-type="error"] [data-icon] {
          color: rgb(220, 38, 38) !important;
        }
        /* Transparent scrollbars */
        [data-radix-scroll-area-viewport]::-webkit-scrollbar {
          width: 6px;
        }
        [data-radix-scroll-area-viewport]::-webkit-scrollbar-track {
          background: transparent;
        }
        [data-radix-scroll-area-viewport]::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 3px;
        }
        [data-radix-scroll-area-viewport]:hover::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.2);
        }
        .dark [data-radix-scroll-area-viewport]:hover::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
        }
        /* Hide scrollbars for kanban columns */
        .kanban-column-scroll::-webkit-scrollbar {
          display: none;
          width: 0;
        }
        .kanban-column-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <Toaster 
        position="bottom-center" 
        richColors
        expand={true}
        visibleToasts={5}
        toastOptions={{
          duration: 2000,
          style: {
            background: 'white',
            color: '#000',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            zIndex: 99999,
          },
        }}
        theme="light"
      />
      <TooltipProvider>
        <div className="flex">
          {/* Left Sidebar - Desktop Only */}
          <motion.div 
            initial={false}
            animate={{
              width: leftSidebarCollapsed ? 60 : 280,
            }}
            transition={{
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`hidden md:block bg-white dark:bg-card border-r border-gray-200 dark:border-transparent sticky top-[64px] h-[calc(100vh-64px)] overflow-hidden`}
          >
            <motion.div 
              initial={false}
              animate={{
                opacity: 1,
              }}
              transition={{
                duration: 0.2,
                delay: leftSidebarCollapsed ? 0 : 0.1,
              }}
              className={`${leftSidebarCollapsed ? 'p-2' : 'p-4'} h-full flex flex-col overflow-hidden`}
            >
            <LeftSidebar
                selectedGroup={selectedGroup}
                setSelectedGroup={setSelectedGroup}
                accessibleGroups={accessibleGroups}
                groups={groups}
              setGroups={setGroups}
              tasks={allTasks}
                pendingInvitations={pendingInvitations}
                collapsed={leftSidebarCollapsed}
                onToggleCollapse={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
              onRefreshActivities={() => loadActivities()}
              />
            </motion.div>
          </motion.div>

          {/* Center Content */}
          <div className="flex-1 p-3 md:p-6">
            <div className="max-w-[1280px] mx-auto px-4 md:px-8 w-full">
        {/* Page Header */}
        <div className="mb-4 md:mb-8 flex items-center justify-between">
          <div>
              <h1 className="text-[#101828] dark:text-foreground text-[20px] md:text-[24px] leading-[28px] md:leading-[32px] tracking-[0.0703px]">
                {selectedGroup
                  ? accessibleGroups.find(g => g.tag === selectedGroup)?.name || 'Tasks'
                  : 'All Tasks'}
              </h1>
              <p className="text-[#4a5565] dark:text-muted-foreground text-[12px] md:text-[14px] leading-[18px] md:leading-[20px] mt-1">
                {selectedGroupData && acceptedCollaborators.length > 0
                  ? `Shared with ${acceptedCollaborators.length} member${acceptedCollaborators.length !== 1 ? 's' : ''}`
                  : selectedGroup
                  ? `Viewing ${selectedGroup}`
                  : 'Manage your tasks and projects efficiently'}
            </p>
          </div>
            {selectedGroupData && acceptedCollaborators.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex -space-x-2 cursor-help">
                      {acceptedCollaborators.slice(0, 5).map((collab, i) => (
                        <Avatar key={collab.userId} className="h-8 w-8 border-2 border-white dark:border-card">
                          {collab.picture && <AvatarImage src={collab.picture} alt={collab.name} />}
                          <AvatarFallback className={`text-white text-[11px] ${['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500'][i % 5]}`}>
                            {collab.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {acceptedCollaborators.length > 5 && (
                        <div className="h-8 w-8 border-2 border-white dark:border-card rounded-full bg-gray-200 dark:bg-muted flex items-center justify-center">
                          <span className="text-[#4a5565] dark:text-muted-foreground text-[11px] font-semibold">+{acceptedCollaborators.length - 5}</span>
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      {acceptedCollaborators.map(c => (
                        <p key={c.userId} className="text-[11px]">
                          {c.name} ({c.role})
                        </p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-4 md:mb-6">
          <Card className="p-4 md:p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-muted-foreground">Total Tasks</p>
                <p className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-card-foreground mt-1 md:mt-2">{totalTasks}</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-2 md:p-3">
                <ListTodo className="h-5 w-5 md:h-6 md:w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-muted-foreground">In Progress</p>
                <p className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-card-foreground mt-1 md:mt-2">{inProgressTasks.length}</p>
              </div>
              <div className="bg-yellow-100 rounded-lg p-2 md:p-3">
                <Clock className="h-5 w-5 md:h-6 md:w-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-muted-foreground">Completed</p>
                <p className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-card-foreground mt-1 md:mt-2">{completedTasks.length}</p>
              </div>
              <div className="bg-green-100 rounded-lg p-2 md:p-3">
                <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 md:p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-muted-foreground">Overdue</p>
                <p className="text-xl md:text-2xl font-semibold text-red-600 mt-1 md:mt-2">{overdueTasks}</p>
              </div>
              <div className="bg-red-100 rounded-lg p-2 md:p-3">
                <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter and Search Bar */}
          <Card className="p-3 md:p-4 mb-4 md:mb-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3)]">
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-center">
            {/* Search Box */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[140px]">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[155px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {SYSTEM_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDate">Sort by Due Date</SelectItem>
                <SelectItem value="priority">Sort by Priority</SelectItem>
                <SelectItem value="title">Sort by Title</SelectItem>
              </SelectContent>
            </Select>

            {/* New Task Button */}
            {canCreateTask && (
              <Button
                onClick={() => {
                  setIsCollapsing(false); // Reset collapsing state when opening modal
                  setEditingTask(null);
                  setNewTask({
                    title: '',
                    description: '',
                    category: '',
                    priority: 'Medium',
                    status: 'pending',
                    dueDate: '',
                    progress: 20,
                    assignedTo: [],
                  });
                  setIncludeProgress(false);
                  setSkipModalAnimation(false); // Ensure animations are enabled for new task
                  setShowModal(true);
                }}
                className="bg-indigo-500 dark:bg-indigo-700 hover:bg-indigo-600 dark:hover:bg-indigo-800 text-white rounded-[8px] h-[40px] px-4 ml-auto cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            )}
          </div>
        </Card>

        {/* Kanban Board or Empty State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
              className="mb-4"
            >
              <Loader2 className="w-8 h-8 text-indigo-500 dark:text-indigo-400" />
            </motion.div>
            <p className="text-gray-600 dark:text-muted-foreground text-sm font-medium">Loading tasks...</p>
          </div>
        ) : hasNoTasks ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="max-w-md w-full text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-muted flex items-center justify-center">
                  <ListTodo className="w-12 h-12 text-gray-400 dark:text-muted-foreground" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-2">
                {isViewer 
                  ? "No tasks assigned to you yet!" 
                  : "No tasks added yet"}
              </h3>
              <p className="text-gray-600 dark:text-muted-foreground">
                {isViewer 
                  ? "Tasks assigned to you will appear here once they're created by the workspace owner or admins."
                  : "Get started by creating your first task. Use the +New Task button above to add tasks to your workspace."}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile: Tab-based View */}
            <div className="md:hidden">
              <Tabs value={mobileActiveTab} onValueChange={(v) => setMobileActiveTab(v as 'pending' | 'in-progress' | 'completed')}>
                <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-card border border-gray-200 dark:border-transparent h-[44px] rounded-[8px] mb-4">
                  <TabsTrigger 
                    value="pending" 
                    className="data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-accent text-[13px] rounded-[8px] transition-all duration-300"
                  >
                    Pending
                    <Badge variant="secondary" className="ml-1.5 text-[11px] bg-gray-100 dark:bg-muted text-gray-700 dark:text-muted-foreground">
                      {pendingTasks.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="in-progress" 
                    className="data-[state=active]:bg-yellow-50 dark:data-[state=active]:bg-yellow-950/30 text-[13px] rounded-[8px] transition-all duration-300"
                  >
                    Progress
                    <Badge variant="secondary" className="ml-1.5 text-[11px] bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-200">
                      {inProgressTasks.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="completed" 
                    className="data-[state=active]:bg-green-50 dark:data-[state=active]:bg-green-950/30 text-[13px] rounded-[8px] transition-all duration-300"
                  >
                    Done
                    <Badge variant="secondary" className="ml-1.5 text-[11px] bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-200">
                      {completedTasks.length}
                    </Badge>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-0">
                  <motion.div
                    key={`pending-${mobileActiveTab}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={mobileActiveTab === 'pending' ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-transparent shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3)] p-4 min-h-[400px]"
                  >
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-transparent">
                      <h2 className="text-gray-900 dark:text-card-foreground font-semibold text-[14px]">Pending</h2>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-200 rounded-full text-[11px]">
                        {pendingTasks.length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {pendingTasks.length === 0 ? (
                        <div className="flex items-center justify-center h-[200px] border-2 border-dashed border-gray-200 dark:border-transparent rounded-[10px] bg-gray-50 dark:bg-muted/50">
                          <p className="text-center text-gray-600 dark:text-muted-foreground text-[13px]">No pending tasks</p>
                        </div>
                      ) : (
                        pendingTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            group={selectedGroupData || (selectedGroup ? undefined : groups.find(g => g.tag === task.groupTag))}
                            currentUserId={currentUserId}
                            userRole={userRole}
                            onProgressChange={handleProgressChange}
                            onEdit={handleEdit}
                            onDelete={handleDeleteClick}
                            onMove={handleOpenStatusSheet}
                            disableDrag={true}
                          />
                        ))
                      )}
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="in-progress" className="mt-0">
                  <motion.div
                    key={`in-progress-${mobileActiveTab}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={mobileActiveTab === 'in-progress' ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-transparent shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3)] p-4 min-h-[400px]"
                  >
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-transparent">
                      <h2 className="text-gray-900 dark:text-card-foreground font-semibold text-[14px]">In Progress</h2>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-200 rounded-full text-[11px]">
                        {inProgressTasks.length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {inProgressTasks.length === 0 ? (
                        <div className="flex items-center justify-center h-[200px] border-2 border-dashed border-gray-200 dark:border-transparent rounded-[10px] bg-gray-50 dark:bg-muted/50">
                          <p className="text-center text-gray-600 dark:text-muted-foreground text-[13px]">No tasks in progress</p>
                        </div>
                      ) : (
                        inProgressTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            group={selectedGroupData || (selectedGroup ? undefined : groups.find(g => g.tag === task.groupTag))}
                            currentUserId={currentUserId}
                            userRole={userRole}
                            onProgressChange={handleProgressChange}
                            onEdit={handleEdit}
                            onDelete={handleDeleteClick}
                            onMove={handleOpenStatusSheet}
                            disableDrag={true}
                          />
                        ))
                      )}
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="completed" className="mt-0">
                  <motion.div
                    key={`completed-${mobileActiveTab}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={mobileActiveTab === 'completed' ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-transparent shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3)] p-4 min-h-[400px]"
                  >
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-transparent">
                      <h2 className="text-gray-900 dark:text-card-foreground font-semibold text-[14px]">Completed</h2>
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-200 rounded-full text-[11px]">
                        {completedTasks.length}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      {completedTasks.length === 0 ? (
                        <div className="flex items-center justify-center h-[200px] border-2 border-dashed border-gray-200 dark:border-transparent rounded-[10px] bg-gray-50 dark:bg-muted/50">
                          <p className="text-center text-gray-600 dark:text-muted-foreground text-[13px]">No completed tasks</p>
                        </div>
                      ) : (
                        completedTasks.map((task) => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            group={selectedGroupData || (selectedGroup ? undefined : groups.find(g => g.tag === task.groupTag))}
                            currentUserId={currentUserId}
                            userRole={userRole}
                            onProgressChange={handleProgressChange}
                            onEdit={handleEdit}
                            onDelete={handleDeleteClick}
                            onMove={handleOpenStatusSheet}
                            disableDrag={true}
                          />
                        ))
                      )}
                    </div>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Desktop: Kanban Board with Drag & Drop */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                ease: [0.16, 1, 0.3, 1]
              }}
              className="hidden md:grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch"
            >
              <div ref={pendingColumnRef} className="flex flex-col">
                <TaskColumn
                  title="Pending"
                  status="pending"
                  tasks={pendingTasks}
                  group={selectedGroupData || undefined}
                  groups={selectedGroup ? undefined : groups} // Pass groups array in "All Tasks" view
                  currentUserId={currentUserId}
                  userRole={userRole}
                  onTaskDrop={handleTaskDrop}
                  onProgressChange={handleProgressChange}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  newlyAddedTaskId={newlyAddedTaskId}
                  taskListRef={pendingTaskListRef as React.RefObject<HTMLDivElement>}
              />
              </div>
              <div className="flex flex-col">
                <TaskColumn
                  title="In Progress"
                  status="in-progress"
                  tasks={inProgressTasks}
                  group={selectedGroupData || undefined}
                  groups={selectedGroup ? undefined : groups} // Pass groups array in "All Tasks" view
                  currentUserId={currentUserId}
                  userRole={userRole}
                  onTaskDrop={handleTaskDrop}
                  onProgressChange={handleProgressChange}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  newlyAddedTaskId={newlyAddedTaskId}
                />
              </div>
              <div className="flex flex-col">
                <TaskColumn
                  title="Completed"
                  status="completed"
                  tasks={completedTasks}
                  group={selectedGroupData || undefined}
                  groups={selectedGroup ? undefined : groups} // Pass groups array in "All Tasks" view
                  currentUserId={currentUserId}
                  userRole={userRole}
                  onTaskDrop={handleTaskDrop}
                  onProgressChange={handleProgressChange}
                  onEdit={handleEdit}
                  onDelete={handleDeleteClick}
                  newlyAddedTaskId={newlyAddedTaskId}
                />
              </div>
            </motion.div>
          </>
        )}
            </div>
          </div>

          {/* Right Sidebar - Desktop Only */}
          <div 
            className={`hidden lg:block bg-white dark:bg-card border-l border-gray-200 dark:border-transparent sticky top-[64px] h-[calc(100vh-64px)] transition-all duration-300 ${
              rightSidebarCollapsed ? 'w-[48px]' : 'w-[300px]'
            }`}
          >
            {rightSidebarCollapsed ? (
              <div className="flex items-start justify-center pt-4 h-full">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setRightSidebarCollapsed(false)}
                    variant="outline"
                    size="sm"
                    className="p-2 h-[32px] w-[32px] rounded-[6px] border-gray-200 dark:border-transparent hover:bg-gray-100 dark:hover:bg-accent cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Show Activity (Ctrl+I)</p>
                </TooltipContent>
              </Tooltip>
            </div>
            ) : (
              <div className="p-4 h-full flex flex-col overflow-hidden">
                <RightSidebar 
                  activities={activities}
                  onToggleCollapse={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
                  formatTimestamp={formatTimestamp}
                  groups={groups.map(g => ({ tag: g.tag, name: g.name }))}
                />
              </div>
            )}
          </div>
        </div>
      </TooltipProvider>

        {/* Add Task Modal */}
        <Dialog 
          open={showModal} 
          onOpenChange={(open) => {
            // Don't allow closing via backdrop/ESC if we're in skip animation mode
            if (!open && skipModalAnimation) {
              return; // Prevent closing during task creation animation
            }
            setShowModal(open);
            if (!open) {
              // Reset form when modal closes
              setEditingTask(null);
              setNewTask({
                title: '',
                description: '',
                category: '',
                priority: 'Medium',
                status: 'pending',
                dueDate: '',
                progress: 20,
                assignedTo: [],
              });
                  setCategorySelection('');
              setIncludeProgress(false);
              setSkipModalAnimation(false);
            }
          }}
        >
          <DialogContent 
            ref={modalContentRef}
            className={`overflow-hidden sm:max-w-[500px] ${
              skipModalAnimation 
                ? 'duration-0 data-[state=closed]:duration-0' 
                : ''
            }`}
          >
            <motion.div
              initial={skipModalAnimation ? undefined : { opacity: 0, scale: 0.96 }}
              animate={skipModalAnimation ? undefined : { opacity: 1, scale: 1 }}
              exit={skipModalAnimation ? undefined : { opacity: 0, scale: 0.96 }}
              transition={skipModalAnimation ? undefined : {
                duration: 0.2,
                ease: [0.16, 1, 0.3, 1]
              }}
            >
                <DialogHeader>
                  <DialogTitle>{editingTask ? 'Edit Task' : 'Add New Task'}</DialogTitle>
                  <DialogDescription>
                    {editingTask ? 'Update task details below.' : 'Create a new task by filling out the form below.'}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  placeholder="Enter task title"
                  value={newTask.title || ''}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="h-[36px] rounded-[8px] border border-gray-200"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter task description"
                  value={newTask.description || ''}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="h-32 rounded-[8px] border border-gray-200 p-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={categorySelection}
                    onValueChange={(value) => {
                      setCategorySelection(value);
                      // Always store the selected value; 'Other' is stored as the literal 'Other'
                      setNewTask({ ...newTask, category: value });
                    }}
                  >
                    <SelectTrigger id="category" className="h-[36px] rounded-[8px] border border-gray-200">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SYSTEM_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTask.priority || 'Medium'}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value as Task['priority'] })}
                  >
                    <SelectTrigger id="priority" className="h-[36px] rounded-[8px] border border-gray-200">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  placeholder="mm/dd/yyyy"
                  value={newTask.dueDate || ''}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="h-[36px] rounded-[8px] border border-gray-200"
                />
              </div>

              {/* Status field for editing */}
              {editingTask && (
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newTask.status || 'pending'}
                    onValueChange={(value) => setNewTask({ ...newTask, status: value as Task['status'] })}
                  >
                      <SelectTrigger id="status" className="h-[36px] rounded-[8px] border border-gray-200">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Optional Progress */}
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="includeProgress"
                  checked={includeProgress}
                  onCheckedChange={(checked) => {
                    setIncludeProgress(checked as boolean);
                    if (!checked) {
                      setNewTask({ ...newTask, progress: 20 });
                    }
                  }}
                />
                <Label htmlFor="includeProgress" className="text-sm cursor-pointer">
                  Include progress tracking
                </Label>
              </div>

              {includeProgress && (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="progress">Initial Progress</Label>
                    <span className="text-sm text-purple-600">{newTask.progress || 0}%</span>
                  </div>
                  <Slider
                    id="progress"
                    min={0}
                    max={100}
                    step={5}
                    value={[newTask.progress || 0]}
                    onValueChange={(value) => setNewTask({ ...newTask, progress: value[0] })}
                    className="[&_[data-radix-slider-range]]:bg-purple-500 [&_[data-radix-slider-thumb]]:border-purple-500"
                  />
                </div>
              )}

              {/* Assign To field - only for collaborated groups, visible to admin/editor/owner */}
              {canSeeAssignTo && (
                <div className="grid gap-2">
                  <Label htmlFor="assignTo">Assign To</Label>
                  <Select
                    value={(newTask.assignedTo && newTask.assignedTo.length > 0) ? newTask.assignedTo[0] : undefined}
                    onValueChange={(value) => {
                      setNewTask({ 
                        ...newTask, 
                        assignedTo: value ? [value] : [] 
                      });
                    }}
                  >
                    <SelectTrigger id="assignTo" className="h-[36px] rounded-[8px] border border-gray-200">
                      <SelectValue placeholder="Select a team member (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {acceptedCollaborators.map((collab) => (
                        <SelectItem key={collab.userId} value={collab.userId}>
                          {collab.name} ({collab.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button
                onClick={handleAddTask}
                disabled={!newTask.title?.trim()}
                className="w-full bg-indigo-500 dark:bg-indigo-700 hover:bg-indigo-600 dark:hover:bg-indigo-800 text-white mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingTask ? 'Update Task' : 'Add Task'}
              </Button>
                </div>
            </motion.div>
          </DialogContent>
        </Dialog>

        {/* Flying Task Animation */}
        <AnimatePresence>
          {flyingTask && (() => {
            return (
            <motion.div
              initial={{
                position: 'fixed',
                top: flyingTask.fromRect.top + (flyingTask.fromRect.height / 2),
                left: flyingTask.fromRect.left + (flyingTask.fromRect.width / 2) - (flyingTask.toRect.width / 2),
                width: flyingTask.toRect.width,
                opacity: 1,
                scale: 1,
                zIndex: 10000,
              }}
              animate={{
                top: flyingTask.toRect.top,
                left: flyingTask.toRect.left,
                width: flyingTask.toRect.width,
                opacity: [1, 1, 0.7],
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.85,
              }}
              transition={{
                duration: 1.3,
                ease: [0.34, 1.56, 0.64, 1], // Spring-like easing with more bounce
              }}
              className="p-4 rounded-lg border bg-card border-gray-200 dark:border-transparent shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3)] pointer-events-none"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <h4 className="flex-1 text-gray-900">{flyingTask.task.title}</h4>
                <Badge variant="secondary" className={`${
                  flyingTask.task.priority === 'High' ? 'bg-red-100 text-red-800' :
                  flyingTask.task.priority === 'Low' ? 'bg-green-100 text-green-800' :
                  'bg-yellow-100 text-yellow-800'
                } shrink-0`}>
                  {flyingTask.task.priority}
                </Badge>
              </div>
              {flyingTask.task.description && (
                <p className="text-sm text-gray-600 mb-4">{flyingTask.task.description}</p>
              )}
              <div className="flex items-center justify-between">
                {flyingTask.task.category && (
                  <div className="flex items-center gap-2">
                    <Circle className={`h-3 w-3 ${getCategoryColor(flyingTask.task.category)} rounded-full fill-current`} />
                    <span className="text-sm text-gray-600">{flyingTask.task.category}</span>
                  </div>
                )}
                {flyingTask.task.dueDate && (
                  <div className={`flex items-center gap-1.5 text-sm text-gray-600 ${!flyingTask.task.category ? 'ml-auto' : ''}`}>
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{flyingTask.task.dueDate}</span>
                  </div>
                )}
              </div>
            </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Collapsing Preview Card - Rendered outside dialog */}
        <AnimatePresence>
          {isCollapsing && previewTask && pendingColumnRef.current && (() => {
            const previewWidth = pendingColumnRef.current.getBoundingClientRect().width - 32;
            const modalRect = modalContentRef.current?.getBoundingClientRect();
            console.log('🔍 Preview card render width:', previewWidth);
            console.log('🔍 Modal rect:', modalRect);
            
            return (
              <motion.div
                initial={{ 
                  position: 'fixed',
                  top: modalRect ? modalRect.top + (modalRect.height / 2) - 90 : '50%',
                  left: modalRect ? modalRect.left + (modalRect.width / 2) - (previewWidth / 2) : '50%',
                  width: previewWidth,
                  opacity: 1,
                  scale: 1,
                  zIndex: 10000,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  duration: 0.45,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                className="p-4 rounded-lg border bg-card border-gray-200 dark:border-transparent shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3)]"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="flex-1 text-gray-900">{previewTask.title}</h4>
                  <Badge variant="secondary" className={`${
                    previewTask.priority === 'High' ? 'bg-red-100 text-red-800' :
                    previewTask.priority === 'Low' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  } shrink-0`}>
                    {previewTask.priority}
                  </Badge>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  {previewTask.description}
                </p>

                <div className="flex items-center justify-between">
                  {previewTask.category?.trim() && (
                    <div className="flex items-center gap-2">
                      <Circle className={`h-3 w-3 ${getCategoryColor(previewTask.category)} rounded-full fill-current`} />
                      <span className="text-sm text-gray-600">{previewTask.category}</span>
                    </div>
                  )}
                  {previewTask.dueDate && (
                    <div className={`flex items-center gap-1.5 text-sm text-gray-600 ${!previewTask.category?.trim() ? 'ml-auto' : ''}`}>
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{previewTask.dueDate}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Delete Confirmation Dialog */}
        <AlertDialog 
          open={deleteDialogOpen} 
          onOpenChange={(open) => {
            console.log('🔍 AlertDialog onOpenChange called with:', open);
            setDeleteDialogOpen(open);
            if (!open) {
              setTaskToDelete(null);
            }
          }}
        >
          <AlertDialogContent 
            className="sm:max-w-[425px] relative m-0" 
            style={{ margin: 0 }}
            onOverlayClick={() => {
              setDeleteDialogOpen(false);
              setTaskToDelete(null);
            }}
          >
            <AnimatePresence>
              {deleteDialogOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.88, y: 10 }}
                  transition={{
                    duration: 0.25,
                    ease: [0.34, 1.56, 0.64, 1]
                  }}
                >
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this task permanently? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.1 }}>
                      <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.1 }}>
                      <AlertDialogAction
                        onClick={handleDeleteConfirm}
                        className="bg-red-600 hover:bg-red-700 text-white focus:ring-red-600"
                      >
                        Delete
                      </AlertDialogAction>
                    </motion.div>
                  </AlertDialogFooter>
                </motion.div>
              )}
            </AnimatePresence>
          </AlertDialogContent>
        </AlertDialog>

        {/* Workspace modals are now in LeftSidebar component */}

        {/* Mobile: Status Change Sheet */}
        <Sheet open={showStatusSheet} onOpenChange={setShowStatusSheet}>
          <SheetContent side="bottom" className="h-auto rounded-t-[16px] pb-safe border-t-0">
            <AnimatePresence>
              {showStatusSheet && taskForStatusChange && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  <SheetHeader>
                    <SheetTitle>Change Status</SheetTitle>
                    <SheetDescription>Select the new status for this task</SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-3 py-6">
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05, duration: 0.2 }}
                    >
                      <Button
                        onClick={() => handleMobileStatusChange(taskForStatusChange, 'pending')}
                        variant="outline"
                        className="w-full justify-start gap-3 h-[48px] rounded-[10px] transition-all duration-200"
                        disabled={taskForStatusChange.status === 'pending'}
                      >
                        <Circle className="h-4 w-4 fill-gray-400 text-gray-400" />
                        <span>Pending</span>
                        {taskForStatusChange.status === 'pending' && (
                          <Badge className="ml-auto text-[10px] bg-gray-100 dark:bg-muted text-gray-700 dark:text-muted-foreground">
                            Current
                          </Badge>
                        )}
                      </Button>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1, duration: 0.2 }}
                    >
                      <Button
                        onClick={() => handleMobileStatusChange(taskForStatusChange, 'in-progress')}
                        variant="outline"
                        className="w-full justify-start gap-3 h-[48px] rounded-[10px] transition-all duration-200"
                        disabled={taskForStatusChange.status === 'in-progress'}
                      >
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span>In Progress</span>
                        {taskForStatusChange.status === 'in-progress' && (
                          <Badge className="ml-auto text-[10px] bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-200">
                            Current
                          </Badge>
                        )}
                      </Button>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15, duration: 0.2 }}
                    >
                      <Button
                        onClick={() => handleMobileStatusChange(taskForStatusChange, 'completed')}
                        variant="outline"
                        className="w-full justify-start gap-3 h-[48px] rounded-[10px] transition-all duration-200"
                        disabled={taskForStatusChange.status === 'completed'}
                      >
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>Completed</span>
                        {taskForStatusChange.status === 'completed' && (
                          <Badge className="ml-auto text-[10px] bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-200">
                            Current
                          </Badge>
                        )}
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </SheetContent>
        </Sheet>

        {/* Mobile: Left Sidebar (Workspaces) */}
        <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
          <SheetContent 
            side="left" 
            className="w-[280px] p-0 !border-0 !shadow-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left data-[state=open]:duration-400 data-[state=closed]:duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          >
            <AnimatePresence mode="wait">
              {showMobileSidebar && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{
                    duration: 0.3,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.1,
                  }}
                  className="h-full flex flex-col overflow-hidden"
                >
                  <LeftSidebar
                    selectedGroup={selectedGroup}
                    setSelectedGroup={setSelectedGroup}
                    accessibleGroups={accessibleGroups}
                    groups={groups}
                    setGroups={setGroups}
                    tasks={allTasks}
                    pendingInvitations={pendingInvitations}
                    collapsed={false}
                    onToggleCollapse={() => setShowMobileSidebar(false)}
                    onRefreshActivities={() => loadActivities()}
                    isMobile={true}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </SheetContent>
        </Sheet>

        {/* Mobile: Right Sidebar (Activity) */}
        <Sheet open={showMobileActivity} onOpenChange={setShowMobileActivity}>
          <SheetContent 
            side="right" 
            className="w-[300px] p-0 !border-0 !shadow-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right data-[state=open]:duration-400 data-[state=closed]:duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          >
            <AnimatePresence mode="wait">
              {showMobileActivity && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{
                    duration: 0.3,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.1,
                  }}
                  className="p-4 h-full flex flex-col overflow-hidden"
                >
                <RightSidebar 
                  activities={activities}
                  onToggleCollapse={() => setShowMobileActivity(false)}
                  formatTimestamp={formatTimestamp}
                  groups={groups.map(g => ({ tag: g.tag, name: g.name }))}
                  isMobile={true}
                />
                </motion.div>
              )}
            </AnimatePresence>
          </SheetContent>
        </Sheet>
    </DndProvider>
  );
}

