import { useState, useMemo, useRef, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast, Toaster } from 'sonner';
import { TaskColumn } from '../components/TaskColumn';
import { Task } from '../components/TaskCard';
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
import { ListTodo, Clock, TrendingUp, AlertCircle, Search, Plus, Calendar, Circle, Users, Settings, Bell, X, CheckCircle2, History, User as UserIcon, ArrowRight, Menu, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge, ScrollArea, Separator, Avatar, AvatarFallback, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@efficio/ui';
import { taskApi } from '../services/taskApi';

// Types for Collaboration
interface GroupCollaborator {
  userId: string;
  name: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: string;
  acceptedAt?: string;
}

interface Group {
  id: string;
  tag: string;
  name: string;
  color: string;
  owner: string;
  collaborators: GroupCollaborator[];
  createdAt: string;
}

// Mock current user ID (will be replaced with actual auth later)
const CURRENT_USER_ID = 'user123';

// Mock groups data (temporarily hardcoded)
const GROUP_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4'];

const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    Work: 'bg-blue-500',
    Personal: 'bg-green-500',
    Shopping: 'bg-purple-500',
  };
  return colors[category] || 'bg-gray-500';
};

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
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

  // Collaboration state
  const [groups, setGroups] = useState<Group[]>([
    {
      id: 'group1',
      tag: '@web-ui',
      name: 'Web UI Project',
      color: '#3b82f6',
      owner: CURRENT_USER_ID,
      collaborators: [
        { userId: 'user456', name: 'Sarah Chen', email: 'sarah@example.com', role: 'editor', status: 'accepted', invitedAt: '2025-01-15T10:00:00.000Z', acceptedAt: '2025-01-15T11:00:00.000Z' },
        { userId: 'user789', name: 'Mike Johnson', email: 'mike@example.com', role: 'editor', status: 'accepted', invitedAt: '2025-01-15T10:00:00.000Z', acceptedAt: '2025-01-15T12:00:00.000Z' },
      ],
      createdAt: '2025-01-15T10:00:00.000Z',
    },
  ]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showManageGroupModal, setShowManageGroupModal] = useState(false);
  const [showPendingInvitations, setShowPendingInvitations] = useState(false);
  const [selectedGroupForManagement, setSelectedGroupForManagement] = useState<Group | null>(null);
  const [editingCollaborators, setEditingCollaborators] = useState<GroupCollaborator[]>([]);
  const [collaboratorSearch, setCollaboratorSearch] = useState('');
  const [newGroup, setNewGroup] = useState({ name: '', tag: '' });
  
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

  // Mock users for collaborator search
  const mockUsers = [
    { userId: 'user456', name: 'Sarah Chen', email: 'sarah@example.com' },
    { userId: 'user789', name: 'Mike Johnson', email: 'mike@example.com' },
    { userId: 'user101', name: 'Emma Davis', email: 'emma@example.com' },
    { userId: 'user102', name: 'John Smith', email: 'john@example.com' },
  ];

  // Activity tracking
  interface Activity {
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

  const [activities, setActivities] = useState<Activity[]>([
    {
      id: '1',
      type: 'task_created',
      taskTitle: 'Build Authentication Module',
      taskId: '1',
      userId: CURRENT_USER_ID,
      userName: 'You',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      groupTag: '@web-ui',
    },
    {
      id: '2',
      type: 'task_moved',
      taskTitle: 'Build Authentication Module',
      taskId: '1',
      userId: 'user456',
      userName: 'Sarah Chen',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      fromStatus: 'pending',
      toStatus: 'in-progress',
      groupTag: '@web-ui',
    },
  ]);

  const addActivity = (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 50)); // Keep last 50 activities
  };

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

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);
  
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

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const fetchedTasks = await taskApi.getTasks();
      // Ensure all tasks have id property (map _id to id if needed)
      setTasks(fetchedTasks.map(task => ({ ...task, id: task.id || (task as any)._id || '' })));
    } catch (error) {
      toast.error('Failed to Fetch Tasks', {
        description: error instanceof Error ? error.message : 'An unknown error occurred while loading tasks.',
        duration: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

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
        
        // Add activity
        addActivity({
          type: 'task_moved',
          taskTitle: task.title,
          taskId: task.id,
          userId: CURRENT_USER_ID,
          userName: 'You',
          fromStatus: task.status,
          toStatus: newStatus,
          groupTag: task.groupTag,
        });
      
      // Update via API
      await taskApi.updateTaskStatus(taskId, newStatus);
      }
    } catch (error) {
      // Revert on error
      fetchTasks();
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
      
      // Update via API
      await taskApi.updateTaskProgress(taskId, progress);
    } catch (error) {
      // Revert on error
      fetchTasks();
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate || '',
      progress: task.progress || 20,
    });
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
      
      // Add activity
      if (taskToDeleteObj) {
        addActivity({
          type: 'task_deleted',
          taskTitle: taskToDeleteObj.title,
          taskId: taskToDeleteObj.id,
          userId: CURRENT_USER_ID,
          userName: 'You',
          groupTag: taskToDeleteObj.groupTag,
        });
      }
      
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

    const taskData = {
      title: newTask.title,
      description: newTask.description || '',
      category: newTask.category?.trim() ? capitalizeWords(newTask.category) : '',
      priority: (newTask.priority || 'Medium') as 'High' | 'Medium' | 'Low',
      status: editingTask ? (newTask.status || 'pending') : 'pending',
      dueDate: newTask.dueDate || '',
      progress: includeProgress ? (newTask.progress || 0) : undefined,
      groupTag: selectedGroup || '@personal', // Add groupTag to task
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
        console.log('🍞 Toast: Task Updated');
        toast.success('Task Updated', {
          description: 'Your task has been successfully updated.',
          duration: 2000,
        });
        console.log('🍞 Toast called for Task Updated');
      } else {
        // Create new task
        savedTask = await taskApi.createTask(taskData);
        
        // Fallback: if refs aren't available, add task without animation
        if (!modalContentRef.current || !pendingColumnRef.current) {
          const newTask: Task = { ...savedTask, id: savedTask.id || savedTask._id || '' };
          setTasks((prevTasks) => [...prevTasks, newTask]);
          console.log('🍞 Toast: Task Added (fallback path)');
          toast.success('Task Added', {
            description: 'Your new task has been successfully added to the list.',
            duration: 2000,
          });
          console.log('🍞 Toast called for Task Added (fallback path)');
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
          
          // Add activity
          addActivity({
            type: 'task_created',
            taskTitle: savedTask.title || newTask.title || '',
            taskId: savedTask.id || savedTask._id || '',
            userId: CURRENT_USER_ID,
            userName: 'You',
            groupTag: selectedGroup || '@personal',
          });
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
    if (group.owner === CURRENT_USER_ID) return true;
    return group.collaborators.some(c => c.userId === CURRENT_USER_ID && c.status === 'accepted');
  };

  const accessibleGroups = [
    { id: 'personal', tag: '@personal', name: 'Personal', color: '#9ca3af', owner: CURRENT_USER_ID, collaborators: [], createdAt: '' },
    ...groups.filter(hasGroupAccess),
  ];

  const pendingInvitations = groups.filter(group =>
    group.collaborators.some(c => c.userId === CURRENT_USER_ID && c.status === 'pending')
  );

  const selectedGroupData = selectedGroup ? groups.find(g => g.tag === selectedGroup) : null;
  const acceptedCollaborators = selectedGroupData?.collaborators.filter(c => c.status === 'accepted') || [];

  // Group handlers
  const handleCreateGroup = () => {
    if (!newGroup.name || !newGroup.tag) {
      toast.error('Please enter group name and tag');
      return;
    }

    const tag = newGroup.tag.startsWith('@') ? newGroup.tag : `@${newGroup.tag}`;

    if (groups.find(g => g.tag === tag)) {
      toast.error('A group with this tag already exists');
      return;
    }

    const group: Group = {
      id: Date.now().toString(),
      tag,
      name: newGroup.name,
      color: GROUP_COLORS[groups.length % GROUP_COLORS.length],
      owner: CURRENT_USER_ID,
      collaborators: [],
      createdAt: new Date().toISOString(),
    };

    setGroups([...groups, group]);
    setShowCreateGroupModal(false);
    setNewGroup({ name: '', tag: '' });
    toast.success(`Group "${newGroup.name}" created!`);
  };

  const handleOpenManageGroup = (group: Group) => {
    setSelectedGroupForManagement(group);
    setEditingCollaborators([...group.collaborators]);
    setShowManageGroupModal(true);
  };

  const handleSaveGroupCollaborators = () => {
    if (selectedGroupForManagement) {
      setGroups(groups.map(g =>
        g.id === selectedGroupForManagement.id
          ? { ...g, collaborators: editingCollaborators }
          : g
      ));
      setShowManageGroupModal(false);
      setSelectedGroupForManagement(null);
      toast.success('Collaborators updated');
    }
  };

  const handleAddCollaborator = (user: typeof mockUsers[0]) => {
    const newCollaborator: GroupCollaborator = {
      ...user,
      role: 'editor',
      status: 'pending',
      invitedAt: new Date().toISOString(),
    };
    setEditingCollaborators([...editingCollaborators, newCollaborator]);
    setCollaboratorSearch('');
    toast.success(`Invitation sent to ${user.name}`);
  };

  const handleRemoveCollaborator = (userId: string) => {
    setEditingCollaborators(editingCollaborators.filter(c => c.userId !== userId));
  };

  const handleRoleChange = (userId: string, role: 'viewer' | 'editor' | 'admin') => {
    setEditingCollaborators(editingCollaborators.map(c => c.userId === userId ? { ...c, role } : c));
  };

  const handleAcceptInvitation = (groupId: string) => {
    setGroups(groups.map(g =>
      g.id === groupId
        ? {
            ...g,
            collaborators: g.collaborators.map(c =>
              c.userId === CURRENT_USER_ID && c.status === 'pending'
                ? { ...c, status: 'accepted', acceptedAt: new Date().toISOString() }
                : c
            ),
          }
        : g
    ));
    toast.success('Invitation accepted!');
  };

  const handleDeclineInvitation = (groupId: string) => {
    setGroups(groups.map(g =>
      g.id === groupId
        ? {
            ...g,
            collaborators: g.collaborators.filter(c => !(c.userId === CURRENT_USER_ID && c.status === 'pending')),
          }
        : g
    ));
    toast.success('Invitation declined');
  };

  const searchResults = mockUsers.filter(
    u =>
      (u.name.toLowerCase().includes(collaboratorSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(collaboratorSearch.toLowerCase())) &&
      !editingCollaborators.find(c => c.userId === u.userId)
  );

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
      // "All Tasks" - show all accessible tasks
      filtered = filtered.filter(task => {
        if (!task.groupTag || task.groupTag === '@personal') {
          return true; // Personal tasks always visible
        }
        const group = groups.find(g => g.tag === task.groupTag);
        return group && hasGroupAccess(group);
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
      filtered = filtered.filter((task) => task.category === categoryFilter);
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
  }, [tasks, searchQuery, priorityFilter, categoryFilter, sortBy]);

  const pendingTasks = filteredAndSortedTasks.filter((task) => task.status === 'pending');
  const inProgressTasks = filteredAndSortedTasks.filter((task) => task.status === 'in-progress');
  const completedTasks = filteredAndSortedTasks.filter((task) => task.status === 'completed');

  const totalTasks = tasks.length;
  const overdueTasks = tasks.filter((task) => task.isOverdue).length;

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
          <div 
            className={`hidden md:block bg-white dark:bg-card border-r border-gray-200 dark:border-transparent sticky top-[64px] h-[calc(100vh-64px)] transition-all duration-300 ${
              leftSidebarCollapsed ? 'w-[60px]' : 'w-[280px]'
            }`}
          >
            <div className={leftSidebarCollapsed ? 'p-2' : 'p-4'}>
              <LeftSidebarContent
                selectedGroup={selectedGroup}
                setSelectedGroup={setSelectedGroup}
                accessibleGroups={accessibleGroups}
                groups={groups}
                tasks={tasks}
                filteredTasks={filteredAndSortedTasks}
                pendingInvitations={pendingInvitations}
                setShowCreateGroupModal={setShowCreateGroupModal}
                setShowPendingInvitations={setShowPendingInvitations}
                handleOpenManageGroup={handleOpenManageGroup}
                collapsed={leftSidebarCollapsed}
                onToggleCollapse={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
              />
            </div>
          </div>

          {/* Center Content */}
          <div className="flex-1 p-3 md:p-6 overflow-x-hidden">
            <div className="max-w-[1280px] mx-auto px-8 w-full">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
              <h1 className="text-[#101828] dark:text-foreground text-[24px] leading-[32px] tracking-[0.0703px]">
                {selectedGroup
                  ? accessibleGroups.find(g => g.tag === selectedGroup)?.name || 'Tasks'
                  : 'All Tasks'}
              </h1>
              <p className="text-[#4a5565] dark:text-muted-foreground text-[14px] leading-[20px] mt-1">
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
              });
              setIncludeProgress(false);
              setSkipModalAnimation(false); // Ensure animations are enabled for new task
              setShowModal(true);
            }}
              className="bg-indigo-500 dark:bg-indigo-700 hover:bg-indigo-600 dark:hover:bg-indigo-800 text-white rounded-[8px] h-[40px] px-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-card-foreground mt-2">{totalTasks}</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <ListTodo className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-card-foreground mt-2">{inProgressTasks.length}</p>
              </div>
              <div className="bg-yellow-100 rounded-lg p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">Completed</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-card-foreground mt-2">{completedTasks.length}</p>
              </div>
              <div className="bg-green-100 rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">Overdue</p>
                <p className="text-2xl font-semibold text-red-600 mt-2">{overdueTasks}</p>
              </div>
              <div className="bg-red-100 rounded-lg p-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter and Search Bar */}
          <Card className="p-4 mb-6 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] dark:shadow-[0_1px_3px_0_rgba(0,0,0,0.3)]">
          <div className="flex flex-col md:flex-row gap-4 items-center">
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
                <SelectItem value="Work">Work</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Shopping">Shopping</SelectItem>
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
          </div>
        </Card>

        {/* Kanban Board */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600 dark:text-muted-foreground">Loading tasks...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div ref={pendingColumnRef} className="flex flex-col">
              <TaskColumn
                title="Pending"
                status="pending"
                tasks={pendingTasks}
                group={selectedGroupData || undefined}
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
              onTaskDrop={handleTaskDrop}
              onProgressChange={handleProgressChange}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              newlyAddedTaskId={newlyAddedTaskId}
              />
            </div>
          </div>
        )}
            </div>
          </div>

          {/* Right Sidebar - Desktop Only */}
          {!rightSidebarCollapsed && (
            <div className="hidden lg:block w-[300px] bg-white dark:bg-card border-l border-gray-200 dark:border-transparent sticky top-[64px] h-[calc(100vh-64px)] transition-all duration-300">
              <div className="p-4">
                <RightSidebarContent 
                  activities={activities}
                  onToggleCollapse={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
                  formatTimestamp={formatTimestamp}
                />
              </div>
            </div>
          )}

          {/* Right Sidebar Collapsed - Show Expand Button */}
          {rightSidebarCollapsed && (
            <div className="hidden lg:flex w-[48px] bg-white dark:bg-card border-l border-gray-200 dark:border-transparent sticky top-[64px] h-[calc(100vh-64px)] items-start justify-center pt-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setRightSidebarCollapsed(false)}
                    variant="outline"
                    size="sm"
                    className="p-2 h-[32px] w-[32px] rounded-[6px] border-gray-200 dark:border-transparent hover:bg-gray-100 dark:hover:bg-accent"
                  >
                    <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">
                  <p>Show Activity (Ctrl+I)</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
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
              });
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
                  className=""
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter task description"
                  value={newTask.description || ''}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="h-32"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., Work, Personal"
                    value={newTask.category || ''}
                    onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                    className=""
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTask.priority || 'Medium'}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value as Task['priority'] })}
                  >
                    <SelectTrigger id="priority" className="">
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
                  className=""
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
                    <SelectTrigger id="status" className="">
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

        {/* Create Group Modal */}
        <Dialog open={showCreateGroupModal} onOpenChange={setShowCreateGroupModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Create a shared project workspace
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Group Name</Label>
                <Input
                  placeholder="e.g., Web UI Project"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  className="h-[36px] rounded-[8px]"
                />
      </div>
              <div className="space-y-2">
                <Label>Group Tag</Label>
                <Input
                  placeholder="e.g., web-ui or @web-ui"
                  value={newGroup.tag}
                  onChange={(e) => setNewGroup({ ...newGroup, tag: e.target.value })}
                  className="h-[36px] rounded-[8px]"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateGroupModal(false)} className="h-[36px] rounded-[8px]">
                Cancel
              </Button>
              <Button onClick={handleCreateGroup} className="bg-indigo-500 dark:bg-indigo-700 hover:bg-indigo-600 dark:hover:bg-indigo-800 h-[36px] rounded-[8px]">
                Create Group
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manage Group Modal */}
        <Dialog open={showManageGroupModal} onOpenChange={setShowManageGroupModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Manage Group Members</DialogTitle>
              <DialogDescription>
                {selectedGroupForManagement?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {editingCollaborators.length > 0 && (
                <div className="space-y-3">
                  <Label>Members</Label>
                  {editingCollaborators.map((collab) => (
                    <div key={collab.userId} className="flex items-center justify-between p-3 border border-gray-200 dark:border-transparent rounded-[8px] bg-card">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-500 text-white text-[11px]">
                            {collab.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[#101828] dark:text-foreground text-[13px] font-medium truncate">{collab.name}</p>
                            {collab.status === 'pending' && (
                              <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-[10px] px-1.5 py-0">
                                Pending
                              </Badge>
                            )}
                          </div>
                          <p className="text-[#4a5565] dark:text-muted-foreground text-[11px] truncate">{collab.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Select value={collab.role} onValueChange={(value: any) => handleRoleChange(collab.userId, value)}>
                          <SelectTrigger className="w-[90px] h-[30px] text-[12px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <button onClick={() => handleRemoveCollaborator(collab.userId)} className="text-gray-400 dark:text-muted-foreground hover:text-red-500 dark:hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                <Label>Add Member</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={collaboratorSearch}
                    onChange={(e) => setCollaboratorSearch(e.target.value)}
                    className="pl-9 h-[36px] rounded-[8px]"
                  />
                </div>
                {collaboratorSearch && (
                  <div className="border border-gray-200 dark:border-transparent rounded-[8px] p-2 max-h-[200px] overflow-y-auto bg-card">
                    {searchResults.length === 0 ? (
                      <p className="text-center text-[#4a5565] dark:text-muted-foreground text-[12px] py-4">No users found</p>
                    ) : (
                      searchResults.map((user) => (
                        <button
                          key={user.userId}
                          onClick={() => handleAddCollaborator(user)}
                          className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-accent rounded-[6px] transition-colors"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-purple-500 text-white text-[11px]">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left flex-1">
                            <p className="text-[#101828] dark:text-foreground text-[13px] font-medium">{user.name}</p>
                            <p className="text-[#4a5565] dark:text-muted-foreground text-[11px]">{user.email}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowManageGroupModal(false)} className="h-[36px] rounded-[8px]">
                Cancel
              </Button>
              <Button onClick={handleSaveGroupCollaborators} className="bg-indigo-500 dark:bg-indigo-700 hover:bg-indigo-600 dark:hover:bg-indigo-800 h-[36px] rounded-[8px]">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Pending Invitations Dialog */}
        <Dialog open={showPendingInvitations} onOpenChange={setShowPendingInvitations}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Pending Invitations</DialogTitle>
              <DialogDescription>
                You have {pendingInvitations.length} group invitation{pendingInvitations.length !== 1 ? 's' : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-4">
              {pendingInvitations.map((group) => {
                const myInvite = group.collaborators.find(
                  c => c.userId === CURRENT_USER_ID && c.status === 'pending'
                );
                return (
                  <Card key={group.id} className="p-4 border-gray-200 dark:border-transparent">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                          <h4 className="text-[#101828] dark:text-foreground text-[15px] font-semibold">{group.name}</h4>
                        </div>
                        <p className="text-[#4a5565] dark:text-muted-foreground text-[12px] mb-2">
                          Invited by {group.owner === CURRENT_USER_ID ? 'You' : 'someone'}
                        </p>
                        <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px]">
                          Role: {myInvite?.role}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            handleAcceptInvitation(group.id);
                            if (pendingInvitations.length === 1) {
                              setShowPendingInvitations(false);
                            }
                          }}
                          className="bg-indigo-500 dark:bg-indigo-700 hover:bg-indigo-600 dark:hover:bg-indigo-800 h-[30px] text-[12px]"
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            handleDeclineInvitation(group.id);
                            if (pendingInvitations.length === 1) {
                              setShowPendingInvitations(false);
                            }
                          }}
                          className="h-[30px] text-[12px]"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
    </DndProvider>
  );
}

// Left Sidebar Content Component
function LeftSidebarContent({
  selectedGroup,
  setSelectedGroup,
  accessibleGroups,
  groups,
  tasks,
  filteredTasks,
  pendingInvitations,
  setShowCreateGroupModal,
  setShowPendingInvitations,
  handleOpenManageGroup,
  collapsed = false,
  onToggleCollapse,
}: any) {
  if (collapsed) {
    // Collapsed view - Icon only
    return (
      <div className="space-y-3 flex flex-col items-center h-full">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onToggleCollapse}
              variant="outline"
              size="sm"
              className="w-[44px] h-[36px] p-0 rounded-[8px] border-gray-200 dark:border-transparent hover:bg-gray-100 dark:hover:bg-accent"
            >
              <ChevronRight className="h-4 w-4 text-gray-600 dark:text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Expand Sidebar (Ctrl+B)</p>
          </TooltipContent>
        </Tooltip>

        <Separator className="bg-gray-200 dark:bg-muted w-full" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setShowCreateGroupModal(true)}
              variant="outline"
              size="sm"
              className="w-[44px] h-[44px] p-0 rounded-[10px] border-gray-200 dark:border-transparent"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>New Group</p>
          </TooltipContent>
        </Tooltip>

        <Separator className="bg-gray-200 dark:bg-muted w-full" />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setSelectedGroup(null)}
              className={`relative w-[44px] h-[44px] rounded-[10px] flex items-center justify-center transition-colors ${
                selectedGroup === null
                  ? 'bg-gray-100 dark:bg-accent'
                  : 'hover:bg-gray-50 dark:hover:bg-accent/50'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-gray-400 dark:bg-muted-foreground" />
              <Badge 
                variant="secondary" 
                className="absolute -top-1 -right-1 text-[9px] bg-blue-500 dark:bg-blue-600 text-white px-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full"
              >
                {tasks.length}
              </Badge>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>All Tasks ({tasks.length})</p>
          </TooltipContent>
        </Tooltip>

        <ScrollArea className="h-[calc(100vh-250px)] w-full">
          <div className="space-y-2 flex flex-col items-center">
            {accessibleGroups.map((group: Group) => {
              const taskCount = tasks.filter((t: Task) => t.groupTag === group.tag || (!t.groupTag && group.tag === '@personal')).length;
              const acceptedCount = group.collaborators.filter((c: GroupCollaborator) => c.status === 'accepted').length;

              return (
                <Tooltip key={group.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setSelectedGroup(group.tag)}
                      className={`relative w-[44px] h-[44px] rounded-[10px] flex items-center justify-center transition-colors ${
                        selectedGroup === group.tag
                          ? 'bg-gray-100 dark:bg-accent'
                          : 'hover:bg-gray-50 dark:hover:bg-accent/50'
                      }`}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      {taskCount > 0 && (
                        <Badge 
                          variant="secondary" 
                          className="absolute -top-1 -right-1 text-[9px] bg-gray-700 dark:bg-gray-600 text-white px-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full"
                        >
                          {taskCount}
                        </Badge>
                      )}
                      {acceptedCount > 0 && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white dark:border-card flex items-center justify-center">
                          <Users className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <div>
                      <p className="font-semibold">{group.name}</p>
                      <p className="text-[11px] text-gray-400 dark:text-muted-foreground">{taskCount} task{taskCount !== 1 ? 's' : ''}</p>
                      {acceptedCount > 0 && (
                        <p className="text-[11px] text-emerald-400">{acceptedCount} member{acceptedCount !== 1 ? 's' : ''}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Expanded view - Full layout
  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <h2 className="text-[#101828] dark:text-foreground text-[15px] font-semibold">Task Manager</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={onToggleCollapse}
              variant="outline"
              size="sm"
              className="p-2 h-[32px] w-[32px] rounded-[6px] border-gray-200 dark:border-transparent hover:bg-gray-100 dark:hover:bg-accent"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Collapse Sidebar (Ctrl+B)</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <Button
        onClick={() => setShowCreateGroupModal(true)}
        variant="outline"
        className="w-full gap-2 h-[36px] rounded-[8px] border-gray-200 dark:border-transparent justify-start flex-shrink-0"
      >
        <Plus className="h-4 w-4" />
        New Group
      </Button>

      <Separator className="bg-gray-200 dark:bg-muted flex-shrink-0" />

      {pendingInvitations.length > 0 && (
        <>
          <div className="space-y-2 flex-shrink-0">
            <button
              onClick={() => setShowPendingInvitations(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/30 hover:bg-yellow-100 dark:hover:bg-yellow-950/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <span className="text-[14px] text-yellow-800 dark:text-yellow-200 font-medium">Pending Invites</span>
              </div>
              <Badge className="bg-yellow-500 dark:bg-yellow-600 text-white text-[11px]">
                {pendingInvitations.length}
              </Badge>
            </button>
          </div>
          <Separator className="bg-gray-200 dark:bg-muted flex-shrink-0" />
        </>
      )}

      <div className="space-y-1 flex flex-col flex-1 min-h-0">
        <p className="text-[#4a5565] dark:text-muted-foreground text-[11px] uppercase tracking-wider font-semibold px-2 mb-2 flex-shrink-0">
          WORKSPACES
        </p>
        
        <button
          onClick={() => setSelectedGroup(null)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] transition-colors flex-shrink-0 ${
            selectedGroup === null
              ? 'bg-gray-100 dark:bg-accent text-[#101828] dark:text-foreground'
              : 'text-[#4a5565] dark:text-muted-foreground hover:bg-gray-50 dark:hover:bg-accent/50'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-muted-foreground" />
            <span className="text-[13px]">All Tasks</span>
          </div>
          <Badge variant="secondary" className="text-[11px] bg-gray-100 dark:bg-muted text-gray-700 dark:text-muted-foreground">
            {tasks.length}
          </Badge>
        </button>

        <ScrollArea className="flex-1 min-h-0">
          <div className="space-y-1 pr-2">
            {accessibleGroups.map((group: Group) => {
              const isPersonal = group.tag === '@personal';
              const taskCount = tasks.filter((t: Task) => t.groupTag === group.tag || (!t.groupTag && group.tag === '@personal')).length;
              const acceptedCount = group.collaborators.filter((c: GroupCollaborator) => c.status === 'accepted').length;

              return (
                <div key={group.id} className="group relative">
                  <button
                    onClick={() => setSelectedGroup(group.tag)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-[8px] transition-colors ${
                      selectedGroup === group.tag
                        ? 'bg-gray-100 dark:bg-accent text-[#101828] dark:text-foreground'
                        : 'text-[#4a5565] dark:text-muted-foreground hover:bg-gray-50 dark:hover:bg-accent/50'
                    }`}
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: group.color }}
                    />
                    <span className="text-[13px] truncate flex-1 text-left min-w-0">{group.name}</span>
                    <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                      {!isPersonal && acceptedCount > 0 && (
                        <div className="flex -space-x-1">
                          {group.collaborators
                            .filter((c: GroupCollaborator) => c.status === 'accepted')
                            .slice(0, 2)
                            .map((c: GroupCollaborator, i: number) => (
                              <div
                                key={c.userId}
                                className="w-4 h-4 rounded-full border border-white dark:border-card flex items-center justify-center text-white text-[8px] font-medium"
                                style={{ backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981'][i % 3] }}
                              >
                                {c.name[0]}
                              </div>
                            ))}
                        </div>
                      )}
                      <Badge variant="secondary" className="text-[10px] bg-gray-100 dark:bg-muted text-gray-700 dark:text-muted-foreground px-1.5 h-5">
                        {taskCount}
                      </Badge>
                      {!isPersonal && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenManageGroup(group);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 dark:text-muted-foreground hover:text-gray-600 dark:hover:text-foreground p-0.5"
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

// Right Sidebar Content Component
interface Activity {
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

function RightSidebarContent({ activities, onToggleCollapse, formatTimestamp }: { activities: Activity[], onToggleCollapse?: () => void, formatTimestamp: (timestamp: string) => string }) {
  return (
    <div className="flex flex-col h-full space-y-4">
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
      
      <ScrollArea className="flex-1 min-h-0">
        <div className="space-y-3 pr-2">
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

