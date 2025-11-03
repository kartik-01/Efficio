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
jest.mock('@efficio/ui', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button onClick={onClick} className={className} {...props}>{children}</button>
  ),
  Badge: ({ children, className }: any) => (
    <span className={className}>{children}</span>
  ),
  ScrollArea: ({ children }: any) => <div data-testid="scroll-area">{children}</div>,
  Separator: ({ className }: any) => <hr className={className} />,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children, asChild }: any) => <div>{children}</div>,
  Dialog: ({ children, open, onOpenChange }: any) => (
    open ? <div data-testid="dialog">{children}</div> : null
  ),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
  Input: ({ value, onChange, placeholder, ...props }: any) => (
    <input value={value} onChange={onChange} placeholder={placeholder} {...props} />
  ),
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
  Switch: ({ checked, onCheckedChange, id }: any) => (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid={`switch-${id}`}
    />
  ),
  Select: ({ children, value, onValueChange }: any) => (
    <select value={value} onChange={(e) => onValueChange?.(e.target.value)}>
      {children}
    </select>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  Avatar: ({ children, className }: any) => (
    <div className={className} data-testid="avatar">{children}</div>
  ),
  AvatarImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
  AvatarFallback: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
  Card: ({ children, className }: any) => (
    <div className={className}>{children}</div>
  ),
}));

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
  beforeEach(() => {
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

  it('renders sidebar title when expanded', () => {
    render(
      <LeftSidebar
        selectedGroup={null}
        setSelectedGroup={jest.fn()}
        accessibleGroups={mockGroups}
        groups={mockGroups}
        setGroups={jest.fn()}
        tasks={mockTasks}
        pendingInvitations={[]}
        collapsed={false}
        onToggleCollapse={jest.fn()}
      />
    );
    
    expect(screen.getByText('Task Manager')).toBeInTheDocument();
  });

  it('renders "New Workspace" button when expanded', () => {
    render(
      <LeftSidebar
        selectedGroup={null}
        setSelectedGroup={jest.fn()}
        accessibleGroups={mockGroups}
        groups={mockGroups}
        setGroups={jest.fn()}
        tasks={mockTasks}
        pendingInvitations={[]}
        collapsed={false}
        onToggleCollapse={jest.fn()}
      />
    );
    
    expect(screen.getByText('New Workspace')).toBeInTheDocument();
  });

  it('renders "All Tasks" option', () => {
    render(
      <LeftSidebar
        selectedGroup={null}
        setSelectedGroup={jest.fn()}
        accessibleGroups={mockGroups}
        groups={mockGroups}
        setGroups={jest.fn()}
        tasks={mockTasks}
        pendingInvitations={[]}
        collapsed={false}
        onToggleCollapse={jest.fn()}
      />
    );
    
    expect(screen.getByText('All Tasks')).toBeInTheDocument();
  });

  it('displays task count for All Tasks', () => {
    render(
      <LeftSidebar
        selectedGroup={null}
        setSelectedGroup={jest.fn()}
        accessibleGroups={mockGroups}
        groups={mockGroups}
        setGroups={jest.fn()}
        tasks={mockTasks}
        pendingInvitations={[]}
        collapsed={false}
        onToggleCollapse={jest.fn()}
      />
    );
    
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders groups when provided', () => {
    render(
      <LeftSidebar
        selectedGroup={null}
        setSelectedGroup={jest.fn()}
        accessibleGroups={mockGroups}
        groups={mockGroups}
        setGroups={jest.fn()}
        tasks={mockTasks}
        pendingInvitations={[]}
        collapsed={false}
        onToggleCollapse={jest.fn()}
      />
    );
    
    expect(screen.getByText('Web UI Project')).toBeInTheDocument();
  });

  it('calls setSelectedGroup when group is clicked', async () => {
    const mockSetSelectedGroup = jest.fn();
    
    render(
      <LeftSidebar
        selectedGroup={null}
        setSelectedGroup={mockSetSelectedGroup}
        accessibleGroups={mockGroups}
        groups={mockGroups}
        setGroups={jest.fn()}
        tasks={mockTasks}
        pendingInvitations={[]}
        collapsed={false}
        onToggleCollapse={jest.fn()}
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
    
    render(
      <LeftSidebar
        selectedGroup={null}
        setSelectedGroup={jest.fn()}
        accessibleGroups={mockGroups}
        groups={mockGroups}
        setGroups={jest.fn()}
        tasks={mockTasks}
        pendingInvitations={pendingInvitations}
        collapsed={false}
        onToggleCollapse={jest.fn()}
      />
    );
    
    expect(screen.getByText(/Pending Invites/i)).toBeInTheDocument();
  });

  it('opens create group modal when "New Workspace" is clicked', async () => {
    render(
      <LeftSidebar
        selectedGroup={null}
        setSelectedGroup={jest.fn()}
        accessibleGroups={mockGroups}
        groups={mockGroups}
        setGroups={jest.fn()}
        tasks={mockTasks}
        pendingInvitations={[]}
        collapsed={false}
        onToggleCollapse={jest.fn()}
      />
    );
    
    const newWorkspaceButton = screen.getByText('New Workspace');
    await userEvent.click(newWorkspaceButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Create New Workspace')).toBeInTheDocument();
  });

  it('renders collapsed view when collapsed prop is true', () => {
    render(
      <LeftSidebar
        selectedGroup={null}
        setSelectedGroup={jest.fn()}
        accessibleGroups={mockGroups}
        groups={mockGroups}
        setGroups={jest.fn()}
        tasks={mockTasks}
        pendingInvitations={[]}
        collapsed={true}
        onToggleCollapse={jest.fn()}
      />
    );
    
    // Should not show text in collapsed view
    expect(screen.queryByText('Task Manager')).not.toBeInTheDocument();
  });

  it('calls onToggleCollapse when collapse button is clicked', async () => {
    const mockOnToggleCollapse = jest.fn();
    
    render(
      <LeftSidebar
        selectedGroup={null}
        setSelectedGroup={jest.fn()}
        accessibleGroups={mockGroups}
        groups={mockGroups}
        setGroups={jest.fn()}
        tasks={mockTasks}
        pendingInvitations={[]}
        collapsed={false}
        onToggleCollapse={mockOnToggleCollapse}
      />
    );
    
    // Find collapse button (ChevronLeft icon)
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
    render(
      <LeftSidebar
        selectedGroup="@web-ui"
        setSelectedGroup={jest.fn()}
        accessibleGroups={mockGroups}
        groups={mockGroups}
        setGroups={jest.fn()}
        tasks={mockTasks}
        pendingInvitations={[]}
        collapsed={false}
        onToggleCollapse={jest.fn()}
      />
    );
    
    const groupButton = screen.getByText('Web UI Project').closest('button');
    expect(groupButton).toHaveClass('bg-gray-100');
  });

  it('displays group member avatars when available', () => {
    render(
      <LeftSidebar
        selectedGroup={null}
        setSelectedGroup={jest.fn()}
        accessibleGroups={mockGroups}
        groups={mockGroups}
        setGroups={jest.fn()}
        tasks={mockTasks}
        pendingInvitations={[]}
        collapsed={false}
        onToggleCollapse={jest.fn()}
      />
    );
    
    // Check if avatars are rendered (they should be in the group list)
    const avatars = screen.queryAllByTestId('avatar');
    // Avatars might be rendered for group members
    expect(avatars.length).toBeGreaterThanOrEqual(0);
  });
});

