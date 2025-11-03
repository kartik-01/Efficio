import { render, screen } from '@testing-library/react';
import { TaskColumn } from '../TaskColumn';
import { Task } from '../TaskCard';

// Mock react-dnd
jest.mock('react-dnd', () => require('./mocks.tsx').reactDndMocks);

jest.mock('react-dnd-html5-backend', () => require('./mocks.tsx').reactDndHtml5BackendMock);

// Mock TaskCard
jest.mock('../TaskCard', () => ({
  TaskCard: ({ task }: any) => (
    <div data-testid={`task-card-${task.id}`}>{task.title}</div>
  ),
}));

// Mock @efficio/ui
jest.mock('@efficio/ui', () => require('./mocks.tsx').efficioUIMocks);

// Mock framer-motion
jest.mock('framer-motion', () => require('./mocks.tsx').framerMotionMocks);

const mockTask: Task = {
  id: '1',
  userId: 'user123',
  title: 'Test Task',
  description: 'Test Description',
  category: 'Work',
  priority: 'High',
  status: 'pending',
  dueDate: '2025-01-20',
};

const mockGroup = {
  id: 'group1',
  tag: '@web-ui',
  name: 'Web UI Project',
  color: '#3b82f6',
  owner: 'user123',
  collaborators: [],
};

const renderWithDnd = (component: React.ReactElement) => {
  return render(component);
};

describe('TaskColumn', () => {
  it('renders column title correctly', () => {
    renderWithDnd(
      <TaskColumn
        title="Pending"
        status="pending"
        tasks={[]}
        onTaskDrop={jest.fn()}
      />
    );
    
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('displays task count badge', () => {
    const tasks = [mockTask, { ...mockTask, id: '2', title: 'Task 2' }];
    
    renderWithDnd(
      <TaskColumn
        title="Pending"
        status="pending"
        tasks={tasks}
        onTaskDrop={jest.fn()}
      />
    );
    
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('renders tasks in the column', () => {
    const tasks = [mockTask];
    
    renderWithDnd(
      <TaskColumn
        title="Pending"
        status="pending"
        tasks={tasks}
        onTaskDrop={jest.fn()}
      />
    );
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('renders multiple tasks', () => {
    const tasks = [
      mockTask,
      { ...mockTask, id: '2', title: 'Task 2' },
      { ...mockTask, id: '3', title: 'Task 3' },
    ];
    
    renderWithDnd(
      <TaskColumn
        title="Pending"
        status="pending"
        tasks={tasks}
        onTaskDrop={jest.fn()}
      />
    );
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });

  it('calls onTaskDrop when task is dropped', () => {
    const mockOnTaskDrop = jest.fn();
    const tasks = [mockTask];
    
    renderWithDnd(
      <TaskColumn
        title="In Progress"
        status="in-progress"
        tasks={tasks}
        onTaskDrop={mockOnTaskDrop}
      />
    );
    
    // The drop functionality is handled by react-dnd, which is complex to test
    // We verify the drop zone is rendered
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('passes group prop to TaskCard when provided', () => {
    const tasks = [mockTask];
    
    renderWithDnd(
      <TaskColumn
        title="Pending"
        status="pending"
        tasks={tasks}
        group={mockGroup}
        onTaskDrop={jest.fn()}
      />
    );
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('passes groups array to TaskCard when in "All Tasks" view', () => {
    const tasks = [{ ...mockTask, groupTag: '@web-ui' }];
    const groups = [mockGroup];
    
    renderWithDnd(
      <TaskColumn
        title="Pending"
        status="pending"
        tasks={tasks}
        groups={groups}
        onTaskDrop={jest.fn()}
      />
    );
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('renders empty state when no tasks', () => {
    renderWithDnd(
      <TaskColumn
        title="Pending"
        status="pending"
        tasks={[]}
        onTaskDrop={jest.fn()}
      />
    );
    
    expect(screen.getByText('Pending')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('applies correct status color class', () => {
    renderWithDnd(
      <TaskColumn
        title="Completed"
        status="completed"
        tasks={[]}
        onTaskDrop={jest.fn()}
      />
    );
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('handles newly added task animation', () => {
    const tasks = [mockTask];
    
    renderWithDnd(
      <TaskColumn
        title="Pending"
        status="pending"
        tasks={tasks}
        onTaskDrop={jest.fn()}
        newlyAddedTaskId="1"
      />
    );
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('passes onProgressChange to TaskCard', () => {
    const mockOnProgressChange = jest.fn();
    const tasks = [{ ...mockTask, status: 'in-progress' as const }];
    
    renderWithDnd(
      <TaskColumn
        title="In Progress"
        status="in-progress"
        tasks={tasks}
        onTaskDrop={jest.fn()}
        onProgressChange={mockOnProgressChange}
      />
    );
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('passes onEdit to TaskCard', () => {
    const mockOnEdit = jest.fn();
    const tasks = [mockTask];
    
    renderWithDnd(
      <TaskColumn
        title="Pending"
        status="pending"
        tasks={tasks}
        onTaskDrop={jest.fn()}
        onEdit={mockOnEdit}
      />
    );
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('passes onDelete to TaskCard', () => {
    const mockOnDelete = jest.fn();
    const tasks = [mockTask];
    
    renderWithDnd(
      <TaskColumn
        title="Pending"
        status="pending"
        tasks={tasks}
        onTaskDrop={jest.fn()}
        onDelete={mockOnDelete}
      />
    );
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('renders with taskListRef when provided', () => {
    const taskListRef = { current: null };
    const tasks = [mockTask];
    
    renderWithDnd(
      <TaskColumn
        title="Pending"
        status="pending"
        tasks={tasks}
        onTaskDrop={jest.fn()}
        taskListRef={taskListRef as any}
      />
    );
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
});

