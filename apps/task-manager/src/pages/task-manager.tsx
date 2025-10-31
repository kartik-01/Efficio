import { useState, useMemo, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TaskColumn } from '../components/TaskColumn';
import { Task } from '../components/TaskCard';
import { Card } from '@efficio/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@efficio/ui';
import { Input } from '@efficio/ui';
import { Button } from '@efficio/ui';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@efficio/ui';
import { Label } from '@efficio/ui';
import { Textarea } from '@efficio/ui';
import { Checkbox } from '@efficio/ui';
import { Slider } from '@efficio/ui';
import { ListTodo, Clock, TrendingUp, AlertCircle, Search, Plus, Calendar, Circle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@efficio/ui';



const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Review quarterly reports',
    description: 'Complete review of Q3 financial reports and prepare summary',
    category: 'Work',
    priority: 'High',
    status: 'pending',
    dueDate: 'Due Today',
    isOverdue: true,
  },
  {
    id: '2',
    title: 'Buy groceries',
    description: 'Weekly grocery shopping for household items',
    category: 'Shopping',
    priority: 'Medium',
    status: 'pending',
    dueDate: 'Tomorrow',
  },
  {
    id: '3',
    title: 'Client presentation',
    description: 'Prepare slides for upcoming client meeting',
    category: 'Work',
    priority: 'High',
    status: 'pending',
    dueDate: 'Overdue',
    isOverdue: true,
  },
  {
    id: '4',
    title: 'Website redesign',
    description: 'Redesign company website with modern UI/UX',
    category: 'Work',
    priority: 'Medium',
    status: 'in-progress',
    dueDate: 'Dec 15',
    progress: 65,
  },
  {
    id: '5',
    title: 'Exercise routine',
    description: '30-minute workout session',
    category: 'Personal',
    priority: 'Low',
    status: 'in-progress',
    dueDate: 'Daily',
    progress: 40,
  },
  {
    id: '6',
    title: 'Team meeting notes',
    description: 'Document key points from weekly team meeting',
    category: 'Work',
    priority: 'Medium',
    status: 'completed',
    dueDate: 'Completed',
  },
  {
    id: '7',
    title: 'Book dentist appointment',
    description: 'Schedule routine dental checkup',
    category: 'Personal',
    priority: 'Low',
    status: 'completed',
    dueDate: 'Completed',
  },
  {
    id: '8',
    title: 'Update portfolio',
    description: 'Add recent projects to portfolio website',
    category: 'Work',
    priority: 'Medium',
    status: 'completed',
    dueDate: 'Completed',
  },
];

const getCategoryColor = (category: string) => {
  const colors: { [key: string]: string } = {
    Work: 'bg-blue-500',
    Personal: 'bg-green-500',
    Shopping: 'bg-purple-500',
  };
  return colors[category] || 'bg-gray-500';
};

export function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('dueDate');
  const [showModal, setShowModal] = useState(false);
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
  const [previewTask, setPreviewTask] = useState<Partial<Task> | null>(null); // Task data for the collapsing preview
  const [targetCardWidth, setTargetCardWidth] = useState<number>(320); // Target width for the card
  const [flyingTask, setFlyingTask] = useState<{ task: Partial<Task>; fromRect: DOMRect; toRect: DOMRect } | null>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  const pendingColumnRef = useRef<HTMLDivElement>(null);
  const pendingTaskListRef = useRef<HTMLDivElement>(null);

  const handleTaskDrop = (taskId: string, newStatus: 'pending' | 'in-progress' | 'completed') => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );
  };

  const handleProgressChange = (taskId: string, progress: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, progress } : task
      )
    );
  };

  const capitalizeWords = (str: string) => {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleAddTask = () => {
    if (!newTask.title?.trim()) return;
    
    // Fallback: if refs aren't available, add task without animation
    if (!modalContentRef.current || !pendingColumnRef.current) {
      const taskId = Date.now().toString();
      const taskToAdd: Task = {
        id: taskId,
        title: newTask.title,
        description: newTask.description || '',
        category: newTask.category?.trim() ? capitalizeWords(newTask.category) : '',
        priority: (newTask.priority || 'Medium') as 'High' | 'Medium' | 'Low',
        status: 'pending',
        dueDate: newTask.dueDate || '',
        progress: includeProgress ? (newTask.progress || 0) : undefined,
      };
      
      setTasks((prevTasks) => [...prevTasks, taskToAdd]);
      setShowModal(false);
      setNewTask({
        title: '',
        description: '',
        category: '',
        priority: 'Medium',
        dueDate: '',
        progress: 20,
      });
      setIncludeProgress(false);
      return;
    }
    
    const taskId = Date.now().toString();
    const taskToAdd: Task = {
      id: taskId,
      title: newTask.title,
      description: newTask.description || '',
      category: newTask.category?.trim() ? capitalizeWords(newTask.category) : '',
      priority: (newTask.priority || 'Medium') as 'High' | 'Medium' | 'Low',
      status: 'pending',
      dueDate: newTask.dueDate || '',
      progress: includeProgress ? (newTask.progress || 0) : undefined,
    };

    // Get positions BEFORE starting animation
    const fromRect = modalContentRef.current.getBoundingClientRect();
    const columnRect = pendingColumnRef.current.getBoundingClientRect();
    
    // Calculate target card width (column width minus padding)
    const cardWidth = columnRect.width - 32;
    console.log('🎯 Card width calculated in handleAddTask:', cardWidth);
    console.log('🎯 Column rect width:', columnRect.width);
    setTargetCardWidth(cardWidth);
    
    // Set the preview task data directly (not using state which is async)
    setPreviewTask(taskToAdd);
    
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

    // Close the modal immediately and start animation
    setShowModal(false);
    setIsCollapsing(true);
    
    // Small delay to allow Dialog to start closing, then start collapse animation
    setTimeout(() => {
      // After collapse animation, start flying
      setTimeout(() => {
        // Clear the preview and start flying animation
        setPreviewTask(null);
        setFlyingTask({ task: taskToAdd, fromRect, toRect });
        
        // Add task to list after flying animation completes
        setTimeout(() => {
          setFlyingTask(null);
          setTasks((prevTasks) => [...prevTasks, taskToAdd]);
          setNewlyAddedTaskId(taskId);
          setIsCollapsing(false); // Reset collapsing state
          
          // Reset the newly added flag after animation completes
          setTimeout(() => {
            setNewlyAddedTaskId(null);
          }, 600);
        }, 1300); // Total flight duration - 1.3s for smoother, slower travel
      }, 450); // Collapse duration - 0.45s for fairly quick (7/10)
    }, 10); // Small delay to render updated state first

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div ref={pendingColumnRef}>
            <TaskColumn
              title="Pending"
              status="pending"
              tasks={pendingTasks}
              onTaskDrop={handleTaskDrop}
              onProgressChange={handleProgressChange}
              newlyAddedTaskId={newlyAddedTaskId}
              taskListRef={pendingTaskListRef}
            />
          </div>
          <TaskColumn
            title="In Progress"
            status="in-progress"
            tasks={inProgressTasks}
            onTaskDrop={handleTaskDrop}
            onProgressChange={handleProgressChange}
            newlyAddedTaskId={newlyAddedTaskId}
          />
          <TaskColumn
            title="Completed"
            status="completed"
            tasks={completedTasks}
            onTaskDrop={handleTaskDrop}
            onProgressChange={handleProgressChange}
            newlyAddedTaskId={newlyAddedTaskId}
          />
        </div>

        {/* Add Task Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent 
            ref={modalContentRef}
            className="overflow-hidden bg-white sm:max-w-[500px]"
          >
            <>
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                  <DialogDescription>
                    Create a new task by filling out the form below.
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
                    <span className="text-sm text-indigo-600">{newTask.progress || 0}%</span>
                  </div>
                  <Slider
                    id="progress"
                    min={0}
                    max={100}
                    step={5}
                    value={[newTask.progress || 0]}
                    onValueChange={(value) => setNewTask({ ...newTask, progress: value[0] })}
                    className="[&_[data-radix-slider-range]]:bg-indigo-500 [&_[data-radix-slider-thumb]]:border-indigo-500"
                  />
                </div>
              )}

              <Button
                onClick={handleAddTask}
                disabled={!newTask.title?.trim()}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Task
              </Button>
                </div>
              </>
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
                zIndex: 9999,
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
                  zIndex: 9999,
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
      </div>
    </DndProvider>
  );
}

