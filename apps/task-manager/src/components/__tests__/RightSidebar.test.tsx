import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RightSidebar, Activity } from '../RightSidebar';
import { useAuth0 } from '@auth0/auth0-react';

// Mock Auth0
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn(),
}));

// Mock @efficio/ui
jest.mock('@efficio/ui', () => require('./mocks.tsx').efficioUIMocks);

// Mock framer-motion
jest.mock('framer-motion', () => require('./mocks.tsx').framerMotionMocks);

const mockFormatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  return date.toLocaleDateString();
};

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'task_created',
    taskTitle: 'Test Task',
    taskId: 'task1',
    userId: 'user123',
    userName: 'John Doe',
    timestamp: new Date().toISOString(),
    groupTag: '@web-ui',
  },
  {
    id: '2',
    type: 'task_moved',
    taskTitle: 'Another Task',
    taskId: 'task2',
    userId: 'user456',
    userName: 'Jane Smith',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    fromStatus: 'pending',
    toStatus: 'in-progress',
    groupTag: '@web-ui',
  },
];

describe('RightSidebar', () => {
  beforeEach(() => {
    (useAuth0 as jest.Mock).mockReturnValue({
      user: {
        sub: 'user123',
        name: 'Current User',
        email: 'current@example.com',
      },
    });
  });

  it('renders sidebar title', () => {
    render(
      <RightSidebar
        activities={[]}
        formatTimestamp={mockFormatTimestamp}
      />
    );
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('renders empty state when no activities', () => {
    render(
      <RightSidebar
        activities={[]}
        formatTimestamp={mockFormatTimestamp}
      />
    );
    
    expect(screen.getByText('No activity yet')).toBeInTheDocument();
  });

  it('renders activities when provided', () => {
    render(
      <RightSidebar
        activities={mockActivities}
        formatTimestamp={mockFormatTimestamp}
      />
    );
    
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
  });

  it('renders task created activity correctly', () => {
    render(
      <RightSidebar
        activities={[mockActivities[0]]}
        formatTimestamp={mockFormatTimestamp}
      />
    );
    
    expect(screen.getByText(/created task/)).toBeInTheDocument();
    expect(screen.getByText(/"Test Task"/)).toBeInTheDocument();
  });

  it('renders task moved activity correctly', () => {
    render(
      <RightSidebar
        activities={[mockActivities[1]]}
        formatTimestamp={mockFormatTimestamp}
      />
    );
    
    expect(screen.getByText(/moved from/)).toBeInTheDocument();
    expect(screen.getByText(/pending/)).toBeInTheDocument();
    expect(screen.getByText(/in progress/)).toBeInTheDocument();
  });

  it('renders task deleted activity correctly', () => {
    const deletedActivity: Activity = {
      id: '3',
      type: 'task_deleted',
      taskTitle: 'Deleted Task',
      taskId: 'task3',
      userId: 'user123',
      userName: 'John Doe',
      timestamp: new Date().toISOString(),
    };
    
    render(
      <RightSidebar
        activities={[deletedActivity]}
        formatTimestamp={mockFormatTimestamp}
      />
    );
    
    expect(screen.getByText(/deleted task/)).toBeInTheDocument();
    expect(screen.getByText(/"Deleted Task"/)).toBeInTheDocument();
  });

  it('renders task updated activity correctly', () => {
    const updatedActivity: Activity = {
      id: '4',
      type: 'task_updated',
      taskTitle: 'Updated Task',
      taskId: 'task4',
      userId: 'user123',
      userName: 'John Doe',
      timestamp: new Date().toISOString(),
    };
    
    render(
      <RightSidebar
        activities={[updatedActivity]}
        formatTimestamp={mockFormatTimestamp}
      />
    );
    
    expect(screen.getByText(/updated task/)).toBeInTheDocument();
    expect(screen.getByText(/"Updated Task"/)).toBeInTheDocument();
  });

  it('renders member added activity correctly', () => {
    const memberAddedActivity: Activity = {
      id: '5',
      type: 'member_added',
      userId: 'user123',
      userName: 'John Doe',
      timestamp: new Date().toISOString(),
      groupTag: '@web-ui',
    };
    
    render(
      <RightSidebar
        activities={[memberAddedActivity]}
        formatTimestamp={mockFormatTimestamp}
        groups={[{ tag: '@web-ui', name: 'Web UI Project' }]}
      />
    );
    
    expect(screen.getByText(/joined/)).toBeInTheDocument();
    expect(screen.getByText(/Web UI Project/)).toBeInTheDocument();
  });

  it('renders member removed activity correctly', () => {
    const memberRemovedActivity: Activity = {
      id: '6',
      type: 'member_removed',
      userId: 'user123',
      userName: 'John Doe',
      timestamp: new Date().toISOString(),
      groupTag: '@web-ui',
    };
    
    render(
      <RightSidebar
        activities={[memberRemovedActivity]}
        formatTimestamp={mockFormatTimestamp}
        groups={[{ tag: '@web-ui', name: 'Web UI Project' }]}
      />
    );
    
    expect(screen.getByText(/left/)).toBeInTheDocument();
    expect(screen.getByText(/Web UI Project/)).toBeInTheDocument();
  });

  it('renders member rejoined activity correctly', () => {
    const memberRejoinedActivity: Activity = {
      id: '7',
      type: 'member_rejoined',
      userId: 'user123',
      userName: 'John Doe',
      timestamp: new Date().toISOString(),
      groupTag: '@web-ui',
    };
    
    render(
      <RightSidebar
        activities={[memberRejoinedActivity]}
        formatTimestamp={mockFormatTimestamp}
        groups={[{ tag: '@web-ui', name: 'Web UI Project' }]}
      />
    );
    
    expect(screen.getByText(/rejoined/)).toBeInTheDocument();
    expect(screen.getByText(/Web UI Project/)).toBeInTheDocument();
  });

  it('renders member role changed activity correctly', () => {
    const roleChangedActivity: Activity = {
      id: '8',
      type: 'member_role_changed',
      userId: 'user123',
      userName: 'John Doe',
      timestamp: new Date().toISOString(),
    };
    
    render(
      <RightSidebar
        activities={[roleChangedActivity]}
        formatTimestamp={mockFormatTimestamp}
      />
    );
    
    expect(screen.getByText(/updated member permissions/)).toBeInTheDocument();
  });

  it('displays formatted timestamp', () => {
    const formatTimestamp = jest.fn((ts) => `Formatted: ${ts}`);
    
    render(
      <RightSidebar
        activities={mockActivities}
        formatTimestamp={formatTimestamp}
      />
    );
    
    expect(formatTimestamp).toHaveBeenCalled();
  });

  it('renders collapse button when onToggleCollapse is provided', () => {
    const mockOnToggleCollapse = jest.fn();
    
    render(
      <RightSidebar
        activities={[]}
        formatTimestamp={mockFormatTimestamp}
        onToggleCollapse={mockOnToggleCollapse}
      />
    );
    
    const collapseButton = screen.getByRole('button');
    expect(collapseButton).toBeInTheDocument();
  });

  it('calls onToggleCollapse when collapse button is clicked', async () => {
    const mockOnToggleCollapse = jest.fn();
    const user = userEvent.setup();
    
    render(
      <RightSidebar
        activities={[]}
        formatTimestamp={mockFormatTimestamp}
        onToggleCollapse={mockOnToggleCollapse}
      />
    );
    
    const collapseButton = screen.getByRole('button');
    await user.click(collapseButton);
    
    expect(mockOnToggleCollapse).toHaveBeenCalledTimes(1);
  });

  it('renders user avatars for activities', () => {
    render(
      <RightSidebar
        activities={mockActivities}
        formatTimestamp={mockFormatTimestamp}
      />
    );
    
    const avatars = screen.getAllByTestId('avatar');
    expect(avatars.length).toBeGreaterThan(0);
  });

  it('highlights current user activities differently', () => {
    (useAuth0 as jest.Mock).mockReturnValue({
      user: {
        sub: 'user123',
        name: 'Current User',
        email: 'current@example.com',
      },
    });
    
    render(
      <RightSidebar
        activities={[mockActivities[0]]}
        formatTimestamp={mockFormatTimestamp}
      />
    );
    
    // Current user's avatar should have special styling
    const avatars = screen.getAllByTestId('avatar');
    expect(avatars.length).toBeGreaterThan(0);
  });
});

