import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@efficio/ui';
import { Badge, ScrollArea, Separator, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Input, Label, Switch, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Avatar, AvatarFallback, Card } from '@efficio/ui';
import { Bell, ChevronLeft, ChevronRight, Plus, Settings, Users, Search, X } from 'lucide-react';
import { Task } from './TaskCard';

export interface GroupCollaborator {
  userId: string;
  name: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: string;
  acceptedAt?: string;
}

export interface Group {
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

// Mock users for collaborator search
const mockUsers = [
  { userId: 'user456', name: 'Sarah Chen', email: 'sarah@example.com' },
  { userId: 'user789', name: 'Mike Johnson', email: 'mike@example.com' },
  { userId: 'user101', name: 'Emma Davis', email: 'emma@example.com' },
  { userId: 'user102', name: 'John Smith', email: 'john@example.com' },
];

interface LeftSidebarProps {
  selectedGroup: string | null;
  setSelectedGroup: (group: string | null) => void;
  accessibleGroups: Group[];
  groups: Group[];
  setGroups: (groups: Group[] | ((prev: Group[]) => Group[])) => void;
  tasks: Task[];
  pendingInvitations: Group[];
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function LeftSidebar({
  selectedGroup,
  setSelectedGroup,
  accessibleGroups,
  groups,
  setGroups,
  tasks,
  pendingInvitations,
  collapsed = false,
  onToggleCollapse,
}: LeftSidebarProps) {
  // Modal states
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showManageGroupModal, setShowManageGroupModal] = useState(false);
  const [showPendingInvitations, setShowPendingInvitations] = useState(false);
  
  // Group management states
  const [selectedGroupForManagement, setSelectedGroupForManagement] = useState<Group | null>(null);
  const [editingCollaborators, setEditingCollaborators] = useState<GroupCollaborator[]>([]);
  const [collaboratorSearch, setCollaboratorSearch] = useState('');
  
  // New group form states
  const [newGroup, setNewGroup] = useState({ name: '', tag: '' });
  const [newGroupCollaborators, setNewGroupCollaborators] = useState<GroupCollaborator[]>([]);
  const [newGroupMemberSearch, setNewGroupMemberSearch] = useState('');
  const [showAddMembers, setShowAddMembers] = useState(false);

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
      collaborators: newGroupCollaborators,
      createdAt: new Date().toISOString(),
    };

    setGroups([...groups, group]);
    setShowCreateGroupModal(false);
    setNewGroup({ name: '', tag: '' });
    setNewGroupCollaborators([]);
    setNewGroupMemberSearch('');
    setShowAddMembers(false);
    toast.success(`Workspace "${newGroup.name}" created!`);
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

  const handleAddNewGroupMember = (user: typeof mockUsers[0]) => {
    const newCollaborator: GroupCollaborator = {
      ...user,
      role: 'editor',
      status: 'pending',
      invitedAt: new Date().toISOString(),
    };
    setNewGroupCollaborators([...newGroupCollaborators, newCollaborator]);
    setNewGroupMemberSearch('');
    toast.success(`Added ${user.name}`);
  };

  const handleRemoveNewGroupMember = (userId: string) => {
    setNewGroupCollaborators(newGroupCollaborators.filter(c => c.userId !== userId));
  };

  const handleNewGroupRoleChange = (userId: string, role: 'viewer' | 'editor' | 'admin') => {
    setNewGroupCollaborators(newGroupCollaborators.map(c => c.userId === userId ? { ...c, role } : c));
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

  const newGroupSearchResults = mockUsers.filter(
    u =>
      (u.name.toLowerCase().includes(newGroupMemberSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(newGroupMemberSearch.toLowerCase())) &&
      !newGroupCollaborators.find(c => c.userId === u.userId)
  );

  return (
    <>
      {collapsed ? (
        // Collapsed view - Icon only
        <div className="space-y-3 flex flex-col items-center h-full overflow-hidden">
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
              <p>New Workspace</p>
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

          <ScrollArea className="flex-1 min-h-0 w-full overflow-hidden">
            <div className="space-y-2 flex flex-col items-center pb-4">
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
      ) : (
        // Expanded view - Full layout
        <div className="flex flex-col h-full space-y-4 overflow-hidden">
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
            New Workspace
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

            <ScrollArea className="flex-1 min-h-0 overflow-hidden">
              <div className="space-y-1 pr-2 pb-4">
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
                              className="text-gray-400 dark:text-muted-foreground hover:text-gray-600 dark:hover:text-foreground p-0.5 transition-colors"
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
      )}

      {/* Create Workspace Modal */}
      <Dialog 
        open={showCreateGroupModal} 
        onOpenChange={(open) => {
          setShowCreateGroupModal(open);
          if (!open) {
            // Reset form when modal closes
            setNewGroup({ name: '', tag: '' });
            setNewGroupCollaborators([]);
            setNewGroupMemberSearch('');
            setShowAddMembers(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Create another personal or shared workspace
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

            {/* Add Members Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="add-members-toggle">Add Members</Label>
              <Switch
                id="add-members-toggle"
                checked={showAddMembers}
                onCheckedChange={setShowAddMembers}
              />
            </div>

            {/* Add Member Section - Only show when toggle is on */}
            {showAddMembers && (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={newGroupMemberSearch}
                    onChange={(e) => setNewGroupMemberSearch(e.target.value)}
                    className="pl-9 h-[36px] rounded-[8px]"
                  />
                </div>
                {newGroupMemberSearch && (
                  <div className="border border-gray-200 dark:border-transparent rounded-[8px] p-2 max-h-[200px] overflow-y-auto bg-card">
                    {newGroupSearchResults.length === 0 ? (
                      <p className="text-center text-[#4a5565] dark:text-muted-foreground text-[12px] py-4">No users found</p>
                    ) : (
                      newGroupSearchResults.map((user) => (
                        <button
                          key={user.userId}
                          onClick={() => handleAddNewGroupMember(user)}
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
            )}

            {/* Members List */}
            {newGroupCollaborators.length > 0 && (
              <div className="space-y-3">
                <Label>Members</Label>
                <div className="space-y-2">
                  {newGroupCollaborators.map((collab) => (
                    <div key={collab.userId} className="flex items-center justify-between p-3 border border-gray-200 dark:border-transparent rounded-[8px] bg-card">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-500 text-white text-[11px]">
                            {collab.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-[#101828] dark:text-foreground text-[13px] font-medium truncate">{collab.name}</p>
                          <p className="text-[#4a5565] dark:text-muted-foreground text-[11px] truncate">{collab.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Select value={collab.role} onValueChange={(value: any) => handleNewGroupRoleChange(collab.userId, value)}>
                          <SelectTrigger className="w-[90px] h-[30px] text-[12px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="editor">Editor</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <button onClick={() => handleRemoveNewGroupMember(collab.userId)} className="text-gray-400 dark:text-muted-foreground hover:text-red-500 dark:hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowCreateGroupModal(false)} className="h-[36px] rounded-[8px]">
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} className="bg-indigo-500 dark:bg-indigo-700 hover:bg-indigo-600 dark:hover:bg-indigo-800 h-[36px] rounded-[8px]">
              Create Workspace
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
    </>
  );
}

