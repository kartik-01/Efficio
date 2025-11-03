import { groupApi, initializeGroupApi, isGroupApiReady } from '../groupApi';
import { setupApiTest } from './testHelpers';

// Mock fetch globally
global.fetch = jest.fn();

const mockTokenGetter = setupApiTest(initializeGroupApi);

describe('groupApi', () => {

  describe('initialization', () => {
    it('initializes with token getter', () => {
      expect(isGroupApiReady()).toBe(true);
    });

    it('returns false when not initialized', () => {
      jest.resetModules();
      const { isGroupApiReady: checkReady } = require('../groupApi');
      expect(checkReady()).toBe(false);
    });
  });

  describe('getGroups', () => {
    it('fetches groups and pending invitations successfully', async () => {
      const mockData = {
        groups: [
          { _id: '1', tag: '@web-ui', name: 'Web UI Project', owner: 'user123', collaborators: [], createdAt: '2025-01-15' },
          { _id: '2', tag: '@mobile', name: 'Mobile App', owner: 'user456', collaborators: [], createdAt: '2025-01-16' },
        ],
        pendingInvitations: [
          {
            groupId: '3',
            groupName: 'New Project',
            groupTag: '@new',
            role: 'editor',
            invitedAt: '2025-01-17',
            owner: { userId: 'user789', name: 'Owner', email: 'owner@example.com' },
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData }),
      });

      const result = await groupApi.getGroups();

      expect(result.groups).toHaveLength(2);
      expect(result.groups[0].id).toBe('1');
      expect(result.groups[1].id).toBe('2');
      expect(result.pendingInvitations).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/groups',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token',
          }),
        })
      );
    });

    it('throws error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Server error' }),
      });

      await expect(groupApi.getGroups()).rejects.toThrow('Server error');
    });
  });

  describe('getGroupById', () => {
    it('fetches a single group by ID', async () => {
      const mockGroup = {
        _id: '1',
        tag: '@web-ui',
        name: 'Web UI Project',
        owner: 'user123',
        collaborators: [],
        createdAt: '2025-01-15',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockGroup }),
      });

      const result = await groupApi.getGroupById('1');

      expect(result.id).toBe('1');
      expect(result.tag).toBe('@web-ui');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/groups/1',
        expect.any(Object)
      );
    });

    it('throws error when group not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Group not found' }),
      });

      await expect(groupApi.getGroupById('999')).rejects.toThrow('Group not found');
    });
  });

  describe('createGroup', () => {
    it('creates a new group successfully', async () => {
      const newGroup = {
        name: 'New Project',
        tag: '@new-project',
        color: '#3b82f6',
      };

      const mockCreatedGroup = {
        _id: '1',
        ...newGroup,
        owner: 'user123',
        collaborators: [],
        createdAt: '2025-01-15',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCreatedGroup }),
      });

      const result = await groupApi.createGroup(newGroup);

      expect(result.id).toBe('1');
      expect(result.name).toBe('New Project');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/groups',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(newGroup),
        })
      );
    });

    it('creates group with collaborators', async () => {
      const newGroup = {
        name: 'Team Project',
        tag: '@team',
        collaborators: [
          { userId: 'user456', name: 'John', email: 'john@example.com', role: 'editor' as const },
        ],
      };

      const mockCreatedGroup = {
        _id: '1',
        ...newGroup,
        owner: 'user123',
        createdAt: '2025-01-15',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCreatedGroup }),
      });

      const result = await groupApi.createGroup(newGroup);

      expect(result.collaborators).toHaveLength(1);
    });

    it('throws error when creation fails', async () => {
      const newGroup = { name: 'New Project', tag: '@new' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Validation error' }),
      });

      await expect(groupApi.createGroup(newGroup)).rejects.toThrow('Validation error');
    });
  });

  describe('updateGroup', () => {
    it('updates a group successfully', async () => {
      const updateData = { name: 'Updated Project' };
      const mockUpdatedGroup = {
        _id: '1',
        tag: '@web-ui',
        name: 'Updated Project',
        owner: 'user123',
        collaborators: [],
        createdAt: '2025-01-15',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUpdatedGroup }),
      });

      const result = await groupApi.updateGroup('1', updateData);

      expect(result.name).toBe('Updated Project');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/groups/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateData),
        })
      );
    });

    it('throws error when update fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Update failed' }),
      });

      await expect(groupApi.updateGroup('1', { name: 'Updated' })).rejects.toThrow('Update failed');
    });
  });

  describe('deleteGroup', () => {
    it('deletes a group successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await groupApi.deleteGroup('1');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/groups/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('throws error when deletion fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Delete failed' }),
      });

      await expect(groupApi.deleteGroup('1')).rejects.toThrow('Delete failed');
    });
  });

  describe('inviteUser', () => {
    it('invites a user to a group successfully', async () => {
      const inviteData = {
        userId: 'user456',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'editor' as const,
      };

      const mockUpdatedGroup = {
        _id: '1',
        tag: '@web-ui',
        name: 'Web UI Project',
        owner: 'user123',
        collaborators: [
          { userId: 'user456', name: 'John Doe', email: 'john@example.com', role: 'editor', status: 'pending', invitedAt: '2025-01-15' },
        ],
        createdAt: '2025-01-15',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUpdatedGroup }),
      });

      const result = await groupApi.inviteUser('1', inviteData);

      expect(result.collaborators).toHaveLength(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/groups/1/invite',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(inviteData),
        })
      );
    });

    it('throws error when invitation fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Invitation failed' }),
      });

      await expect(
        groupApi.inviteUser('1', {
          userId: 'user456',
          name: 'John',
          email: 'john@example.com',
        })
      ).rejects.toThrow('Invitation failed');
    });
  });

  describe('acceptInvitation', () => {
    it('accepts an invitation successfully', async () => {
      const mockUpdatedGroup = {
        _id: '1',
        tag: '@web-ui',
        name: 'Web UI Project',
        owner: 'user123',
        collaborators: [
          { userId: 'user456', name: 'John Doe', email: 'john@example.com', role: 'editor', status: 'accepted', invitedAt: '2025-01-15', acceptedAt: '2025-01-16' },
        ],
        createdAt: '2025-01-15',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUpdatedGroup }),
      });

      const result = await groupApi.acceptInvitation('1');

      expect(result.id).toBe('1');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/groups/1/accept',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('throws error when acceptance fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Accept failed' }),
      });

      await expect(groupApi.acceptInvitation('1')).rejects.toThrow('Accept failed');
    });
  });

  describe('declineInvitation', () => {
    it('declines an invitation successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await groupApi.declineInvitation('1');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/groups/1/decline',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('throws error when decline fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Decline failed' }),
      });

      await expect(groupApi.declineInvitation('1')).rejects.toThrow('Decline failed');
    });
  });

  describe('updateMemberRole', () => {
    it('updates member role successfully', async () => {
      const mockUpdatedGroup = {
        _id: '1',
        tag: '@web-ui',
        name: 'Web UI Project',
        owner: 'user123',
        collaborators: [
          { userId: 'user456', name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'accepted', invitedAt: '2025-01-15' },
        ],
        createdAt: '2025-01-15',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUpdatedGroup }),
      });

      const result = await groupApi.updateMemberRole('1', 'user456', 'admin');

      expect(result.collaborators[0].role).toBe('admin');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/groups/1/members/user456',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ role: 'admin' }),
        })
      );
    });

    it('throws error when update fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Update failed' }),
      });

      await expect(groupApi.updateMemberRole('1', 'user456', 'admin')).rejects.toThrow('Update failed');
    });
  });

  describe('removeMember', () => {
    it('removes a member successfully', async () => {
      const mockUpdatedGroup = {
        _id: '1',
        tag: '@web-ui',
        name: 'Web UI Project',
        owner: 'user123',
        collaborators: [],
        createdAt: '2025-01-15',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUpdatedGroup }),
      });

      const result = await groupApi.removeMember('1', 'user456');

      expect(result.collaborators).toHaveLength(0);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/groups/1/members/user456',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('throws error when removal fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Remove failed' }),
      });

      await expect(groupApi.removeMember('1', 'user456')).rejects.toThrow('Remove failed');
    });
  });

  describe('getGroupMembers', () => {
    it('fetches group members successfully', async () => {
      const mockMembers = [
        {
          userId: 'user456',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'editor' as const,
          status: 'accepted' as const,
          invitedAt: '2025-01-15',
          acceptedAt: '2025-01-16',
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockMembers }),
      });

      const result = await groupApi.getGroupMembers('1');

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user456');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/groups/1/members',
        expect.any(Object)
      );
    });

    it('throws error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Failed to fetch members' }),
      });

      await expect(groupApi.getGroupMembers('1')).rejects.toThrow('Failed to fetch members');
    });
  });

  describe('searchUsers', () => {
    it('searches users successfully', async () => {
      const mockUsers = [
        { userId: 'user456', name: 'John Doe', email: 'john@example.com', picture: 'https://example.com/pic.jpg' },
        { userId: 'user789', name: 'Jane Smith', email: 'jane@example.com' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUsers }),
      });

      const result = await groupApi.searchUsers('john');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('John Doe');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/users/search?q=john',
        expect.any(Object)
      );
    });

    it('throws error when search fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Search failed' }),
      });

      await expect(groupApi.searchUsers('john')).rejects.toThrow('Search failed');
    });
  });

  describe('getPendingInvitations', () => {
    it('fetches pending invitations successfully', async () => {
      const mockInvitations = [
        {
          groupId: '1',
          groupName: 'Web UI Project',
          groupTag: '@web-ui',
          role: 'editor' as const,
          invitedAt: '2025-01-15',
          owner: { userId: 'user123', name: 'Owner', email: 'owner@example.com' },
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockInvitations }),
      });

      const result = await groupApi.getPendingInvitations();

      expect(result).toHaveLength(1);
      expect(result[0].groupTag).toBe('@web-ui');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/users/invitations',
        expect.any(Object)
      );
    });

    it('throws error when fetch fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Failed to fetch invitations' }),
      });

      await expect(groupApi.getPendingInvitations()).rejects.toThrow('Failed to fetch invitations');
    });
  });

  describe('exitGroup', () => {
    it('exits a group successfully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      });

      await groupApi.exitGroup('1');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:4000/api/groups/1/exit',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('handles non-JSON response gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: new Headers({ 'content-type': 'text/html' }),
      });

      await expect(groupApi.exitGroup('1')).resolves.not.toThrow();
    });

    it('throws error when exit fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ message: 'Cannot exit group' }),
      });

      await expect(groupApi.exitGroup('1')).rejects.toThrow('Cannot exit group');
    });

    it('handles HTML error pages', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers({ 'content-type': 'text/html' }),
      });

      await expect(groupApi.exitGroup('1')).rejects.toThrow('Failed to exit group: 500 Internal Server Error');
    });
  });

  describe('error handling', () => {
    it('handles missing token gracefully', async () => {
      const tokenGetterWithoutToken = jest.fn().mockResolvedValue(undefined);
      initializeGroupApi(tokenGetterWithoutToken);

      await expect(groupApi.getGroups()).rejects.toThrow('Failed to retrieve access token');
    });

    it('handles network errors', async () => {
      // Re-initialize with valid token getter for this test
      initializeGroupApi(mockTokenGetter);
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(groupApi.getGroups()).rejects.toThrow('Network error');
    });

    it('maps _id to id correctly', async () => {
      // Re-initialize with valid token getter for this test
      initializeGroupApi(mockTokenGetter);
      
      const mockGroup = {
        _id: 'abc123',
        tag: '@web-ui',
        name: 'Web UI Project',
        owner: 'user123',
        collaborators: [],
        createdAt: '2025-01-15',
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { groups: [mockGroup], pendingInvitations: [] } }),
      });

      const result = await groupApi.getGroups();

      expect(result.groups[0].id).toBe('abc123');
      // Note: Groups spread all properties, so _id might still be present
      // The important thing is that id is set correctly
      expect(result.groups[0]).toHaveProperty('id');
    });
  });
});

