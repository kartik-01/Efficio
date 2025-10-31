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
import { ListTodo, Clock, TrendingUp, AlertCircle, Search, Plus, Calendar, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@efficio/ui';
import { taskApi } from '../services/taskApi';

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

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
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
      // Optimistically update UI
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      
      // Update via API
      await taskApi.updateTaskStatus(taskId, newStatus);
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
    console.log('🗑️ Delete clicked for task:', taskId);
    setTaskToDelete(taskId);
    setDeleteDialogOpen(true);
    console.log('🗑️ Delete dialog state set to true');
    // Force a re-render check
    setTimeout(() => {
      console.log('🗑️ State check after timeout - deleteDialogOpen should be true');
    }, 100);
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
      await taskApi.deleteTask(taskIdToDelete);
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskIdToDelete));
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

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;

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
      <div className="py-6 min-h-[calc(100vh-4rem)]">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="font-bold text-[24px] leading-[32px] text-gray-900">Task Manager</p>
            <p className="font-normal text-[16px] leading-[24px] text-gray-600 mt-1">
              Manage your tasks and projects efficiently
            </p>
          </div>
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
            className="bg-indigo-500 hover:bg-indigo-600 text-white rounded-[8px] h-[40px] px-4"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="p-6 border-gray-200 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">{totalTasks}</p>
              </div>
              <div className="bg-blue-100 rounded-lg p-3">
                <ListTodo className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-gray-200 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">{inProgressTasks.length}</p>
              </div>
              <div className="bg-yellow-100 rounded-lg p-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-gray-200 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-semibold text-gray-900 mt-2">{completedTasks.length}</p>
              </div>
              <div className="bg-green-100 rounded-lg p-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-gray-200 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-semibold text-red-600 mt-2">{overdueTasks}</p>
              </div>
              <div className="bg-red-100 rounded-lg p-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter and Search Bar */}
        <Card className="p-4 mb-6 border-gray-200 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Box */}
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white border-gray-300"
              />
            </div>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[140px] bg-white border-gray-300">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[155px] bg-white border-gray-300">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Work">Work</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Shopping">Shopping</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px] bg-white border-gray-300">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-white">
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
            <p className="text-gray-600">Loading tasks...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div ref={pendingColumnRef}>
              <TaskColumn
                title="Pending"
                status="pending"
                tasks={pendingTasks}
                onTaskDrop={handleTaskDrop}
                onProgressChange={handleProgressChange}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                newlyAddedTaskId={newlyAddedTaskId}
                taskListRef={pendingTaskListRef as React.RefObject<HTMLDivElement>}
            />
            </div>
            <TaskColumn
              title="In Progress"
              status="in-progress"
              tasks={inProgressTasks}
              onTaskDrop={handleTaskDrop}
              onProgressChange={handleProgressChange}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              newlyAddedTaskId={newlyAddedTaskId}
            />
            <TaskColumn
              title="Completed"
              status="completed"
              tasks={completedTasks}
              onTaskDrop={handleTaskDrop}
              onProgressChange={handleProgressChange}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
              newlyAddedTaskId={newlyAddedTaskId}
            />
          </div>
        )}

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
            className={`overflow-hidden bg-white sm:max-w-[500px] ${
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
                  className="bg-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter task description"
                  value={newTask.description || ''}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  className="bg-white h-32"
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
                    className="bg-white"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTask.priority || 'Medium'}
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value as Task['priority'] })}
                  >
                    <SelectTrigger id="priority" className="bg-white">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
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
                  className="bg-white"
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
                    <SelectTrigger id="status" className="bg-white">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
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
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
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
            console.log('✈️ Flying card width (toRect.width):', flyingTask.toRect.width);
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
              className="p-4 rounded-lg border bg-white border-gray-200 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] pointer-events-none"
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
                className="p-4 rounded-lg border bg-white border-gray-200 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
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
            className="bg-white sm:max-w-[425px] relative m-0" 
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
      </div>
    </DndProvider>
  );
}

