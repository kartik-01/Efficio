import { API_BASE_URL, getHeaders, handleResponse, initializeApi, isApiReady } from '@efficio/api';

// Backward compatibility: Re-export shared functions with group-specific names
export const initializeGroupApi = initializeApi;
export const isGroupApiReady = isApiReady;

export interface GroupCollaborator {
  userId: string;
  name: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: string;
  acceptedAt?: string;
  picture?: string | null; // Profile picture (customPicture or picture from User)
}

export interface Group {
  _id?: string;
  id?: string;
  tag: string;
  name: string;
  color: string;
  owner: string;
  ownerPicture?: string | null; // Owner's profile picture
  collaborators: GroupCollaborator[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateGroupData {
  name: string;
  tag: string;
  color?: string;
  collaborators?: Array<{
    userId: string;
    name: string;
    email: string;
    role?: 'viewer' | 'editor' | 'admin';
  }>;
}

export interface UpdateGroupData {
  name?: string;
  tag?: string;
  color?: string;
}

export interface InviteUserData {
  userId: string;
  name: string;
  email: string;
  role?: 'viewer' | 'editor' | 'admin';
}

export interface PendingInvitation {
  groupId: string;
  groupName: string;
  groupTag: string;
  role: 'viewer' | 'editor' | 'admin';
  invitedAt: string;
  owner: {
    userId: string;
    name?: string;
    email?: string;
  };
}

export const groupApi = {
  // Get all groups and pending invitations
  async getGroups(): Promise<{ groups: Group[]; pendingInvitations: PendingInvitation[] }> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/groups`, {
      headers,
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch groups');
    }
    
    // Map _id to id for frontend compatibility
    const groups = result.data.groups.map((group: Group) => ({
      ...group,
      id: group._id || group.id,
    }));
    
    return {
      groups,
      pendingInvitations: result.data.pendingInvitations || [],
    };
  },

  // Get single group by ID
  async getGroupById(id: string): Promise<Group> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
      headers,
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch group');
    }
    
    return {
      ...result.data,
      id: result.data._id || result.data.id,
    };
  },

  // Create new group/workspace
  async createGroup(data: CreateGroupData): Promise<Group> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/groups`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to create group');
    }
    
    return {
      ...result.data,
      id: result.data._id || result.data.id,
    };
  },

  // Update group
  async updateGroup(id: string, data: UpdateGroupData): Promise<Group> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update group');
    }
    
    return {
      ...result.data,
      id: result.data._id || result.data.id,
    };
  },

  // Delete group
  async deleteGroup(id: string): Promise<void> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/groups/${id}`, {
      method: 'DELETE',
      headers,
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete group');
    }
  },

  // Invite user to group
  async inviteUser(groupId: string, data: InviteUserData): Promise<Group> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/invite`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to invite user');
    }
    
    return {
      ...result.data,
      id: result.data._id || result.data.id,
    };
  },

  // Accept group invitation
  async acceptInvitation(groupId: string): Promise<Group> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/accept`, {
      method: 'POST',
      headers,
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to accept invitation');
    }
    
    return {
      ...result.data,
      id: result.data._id || result.data.id,
    };
  },

  // Decline group invitation
  async declineInvitation(groupId: string): Promise<void> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/decline`, {
      method: 'POST',
      headers,
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to decline invitation');
    }
  },

  // Update member role
  async updateMemberRole(groupId: string, userId: string, role: 'viewer' | 'editor' | 'admin'): Promise<Group> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members/${userId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ role }),
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to update member role');
    }
    
    return {
      ...result.data,
      id: result.data._id || result.data.id,
    };
  },

  // Remove member from group
  async removeMember(groupId: string, userId: string): Promise<Group> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
      headers,
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to remove member');
    }
    
    return {
      ...result.data,
      id: result.data._id || result.data.id,
    };
  },

  // Get group members
  async getGroupMembers(groupId: string): Promise<GroupCollaborator[]> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members`, {
      headers,
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch group members');
    }
    
    return result.data;
  },

  // Search users by name or email
  async searchUsers(query: string): Promise<Array<{ userId: string; name: string; email: string; picture?: string | null }>> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/users/search?q=${encodeURIComponent(query)}`, {
      headers,
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to search users');
    }
    
    return result.data;
  },

  // Get pending invitations
  async getPendingInvitations(): Promise<PendingInvitation[]> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/users/invitations`, {
      headers,
    });
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch invitations');
    }
    
    return result.data;
  },

  // Exit group (leave group as a member)
  async exitGroup(groupId: string): Promise<void> {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/exit`, {
      method: 'POST',
      headers,
    });
    
    if (!response.ok) {
      // Try to parse JSON, but handle HTML error pages
      let errorMessage = `Failed to exit group: ${response.status} ${response.statusText}`;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const result = await response.json();
          errorMessage = result.message || errorMessage;
        } catch {
          // If JSON parsing fails, use default message
        }
      }
      
      throw new Error(errorMessage);
    }
    
    // Try to parse JSON if available, but don't fail if there's no body
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        const result = await response.json();
        return result;
      } catch {
        // If no JSON body, that's fine
      }
    }
  },
};

