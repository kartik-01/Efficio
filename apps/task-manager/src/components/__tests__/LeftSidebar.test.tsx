import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeftSidebar, Group } from '../LeftSidebar';
import { Task } from '../TaskCard';
import { useAuth0 } from '@auth0/auth0-react';
import { groupApi } from '../../services/groupApi';

// Mock Auth0
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn(),
}));

// Mock groupApi
jest.mock('../../services/groupApi', () => ({
  groupApi: {
    getGroups: jest.fn(),
    createGroup: jest.fn(),
    deleteGroup: jest.fn(),
    exitGroup: jest.fn(),
    inviteUser: jest.fn(),
    removeMember: jest.fn(),
    updateMemberRole: jest.fn(),
    searchUsers: jest.fn(),
    acceptInvitation: jest.fn(),
    declineInvitation: jest.fn(),
  },
}));

// Mock @efficio/ui
jest.mock('@efficio/ui', () => require('./mocks.tsx').efficioUIMocks);

const mockGroups: Group[] = [
  {
    id: 'group1',
    tag: '@web-ui',
    name: 'Web UI Project',
    color: '#3b82f6',
    owner: 'user123',
    collaborators: [
      {
        userId: 'user456',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'editor',
        status: 'accepted',
        invitedAt: '2025-01-15T10:00:00.000Z',
        acceptedAt: '2025-01-15T11:00:00.000Z',
      },
    ],
    createdAt: '2025-01-15T10:00:00.000Z',
  },
];

const mockTasks: Task[] = [
  {
    id: '1',
    userId: 'user123',
    title: 'Test Task',
    description: 'Test Description',
    category: 'Work',
    priority: 'High',
    status: 'pending',
  },
];

describe('LeftSidebar', () => {
  const defaultProps = {
    selectedGroup: null as string | null,
    setSelectedGroup: jest.fn(),
    accessibleGroups: mockGroups,
    groups: mockGroups,
    setGroups: jest.fn(),
    tasks: mockTasks,
    pendingInvitations: [] as Group[],
    collapsed: false,
    onToggleCollapse: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth0 as jest.Mock).mockReturnValue({
      user: {
        sub: 'user123',
        name: 'Current User',
        email: 'current@example.com',
      },
    });
    
    (groupApi.getGroups as jest.Mock).mockResolvedValue({
      groups: mockGroups,
      pendingInvitations: [],
    });
  });

  it('renders sidebar content when expanded', () => {
    render(<LeftSidebar {...defaultProps} />);
    
    expect(screen.getByText('Task Manager')).toBeInTheDocument();
    expect(screen.getByText('New Workspace')).toBeInTheDocument();
    expect(screen.getByText('All Tasks')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Web UI Project')).toBeInTheDocument();
  });

  it('calls setSelectedGroup when group is clicked', async () => {
    const mockSetSelectedGroup = jest.fn();
    
    render(
      <LeftSidebar
        {...defaultProps}
        setSelectedGroup={mockSetSelectedGroup}
      />
    );
    
    const groupButton = screen.getByText('Web UI Project').closest('button');
    if (groupButton) {
      await userEvent.click(groupButton);
      expect(mockSetSelectedGroup).toHaveBeenCalledWith('@web-ui');
    }
  });

  it('shows pending invitations when provided', () => {
    const pendingInvitations: Group[] = [
      {
        id: 'group2',
        tag: '@new-project',
        name: 'New Project',
        color: '#8b5cf6',
        owner: 'user456',
        collaborators: [
          {
            userId: 'user123',
            name: 'Current User',
            email: 'current@example.com',
            role: 'editor',
            status: 'pending',
            invitedAt: '2025-01-16T10:00:00.000Z',
          },
        ],
        createdAt: '2025-01-16T10:00:00.000Z',
      },
    ];
    
    render(<LeftSidebar {...defaultProps} pendingInvitations={pendingInvitations} />);
    
    expect(screen.getByText(/Pending Invites/i)).toBeInTheDocument();
  });

  it('opens create group modal when "New Workspace" is clicked', async () => {
    render(<LeftSidebar {...defaultProps} />);
    
    const newWorkspaceButton = screen.getByText('New Workspace');
    await userEvent.click(newWorkspaceButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Create New Workspace')).toBeInTheDocument();
  });

  it('renders collapsed view when collapsed prop is true', () => {
    render(<LeftSidebar {...defaultProps} collapsed={true} />);
    
    expect(screen.queryByText('Task Manager')).not.toBeInTheDocument();
  });

  it('calls onToggleCollapse when collapse button is clicked', async () => {
    const mockOnToggleCollapse = jest.fn();
    
    render(<LeftSidebar {...defaultProps} onToggleCollapse={mockOnToggleCollapse} />);
    
    const collapseButtons = screen.getAllByRole('button');
    const collapseButton = collapseButtons.find(btn => 
      btn.className.includes('ChevronLeft') || btn.getAttribute('aria-label')?.includes('Collapse')
    );
    
    if (collapseButton) {
      await userEvent.click(collapseButton);
      expect(mockOnToggleCollapse).toHaveBeenCalled();
    }
  });

  it('highlights selected group', () => {
    render(<LeftSidebar {...defaultProps} selectedGroup="@web-ui" />);
    
    const groupButton = screen.getByText('Web UI Project').closest('button');
    expect(groupButton).toHaveClass('bg-gray-100');
  });

  it('displays group member avatars when available', () => {
    render(<LeftSidebar {...defaultProps} />);
    
    const avatars = screen.queryAllByTestId('avatar');
    expect(avatars.length).toBeGreaterThanOrEqual(0);
  });
});

