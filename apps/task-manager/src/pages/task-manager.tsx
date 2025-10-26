import { useState, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TaskColumn } from './TaskColumn';
import { Task } from './TaskCard';
import { Card } from '@efficio/ui/src/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@efficio/ui/src/components/ui/select';
import { Input } from '@efficio/ui/src/components/ui/input';
import { Button } from '@efficio/ui/src/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@efficio/ui/src/components/ui/dialog';
import { Label } from '@efficio/ui/src/components/ui/label';
import { Textarea } from '@efficio/ui/src/components/ui/textarea';
import { Checkbox } from '@efficio/ui/src/components/ui/checkbox';
import { Slider } from '@efficio/ui/src/components/ui/slider';
import { ListTodo, Clock, TrendingUp, AlertCircle, Search, Plus } from 'lucide-react';

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
    
    const taskToAdd: Task = {
      id: Date.now().toString(),
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
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="font-bold text-[24px] leading-[32px] text-gray-900">Task Manager</p>
            <p className="font-normal text-[16px] leading-[24px] text-gray-600 mt-1">
              Manage your tasks and projects efficiently
            </p>
          </div>
          <Button
            onClick={() => setShowModal(true)}
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
          <TaskColumn
            title="Pending"
            status="pending"
            tasks={pendingTasks}
            onTaskDrop={handleTaskDrop}
            onProgressChange={handleProgressChange}
          />
          <TaskColumn
            title="In Progress"
            status="in-progress"
            tasks={inProgressTasks}
            onTaskDrop={handleTaskDrop}
            onProgressChange={handleProgressChange}
          />
          <TaskColumn
            title="Completed"
            status="completed"
            tasks={completedTasks}
            onTaskDrop={handleTaskDrop}
            onProgressChange={handleProgressChange}
          />
        </div>

        {/* Add Task Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[500px] bg-white">
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
                    className="[&_[data-slot=slider-range]]:bg-indigo-500 [&_[data-slot=slider-thumb]]:border-indigo-500"
                  />
                </div>
              )}

              <Button
                onClick={handleAddTask}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white mt-2"
              >
                Add Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}
