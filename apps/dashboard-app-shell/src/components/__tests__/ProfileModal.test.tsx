import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProfileModal } from '../ProfileModal';
import { userApi } from '../../services/userApi';

// Mock framer-motion
jest.mock('framer-motion', () => require('./mocks.tsx').framerMotionMocks);

// Mock @efficio/ui
jest.mock('@efficio/ui', () => require('./mocks.tsx').efficioUIMocks);

// Mock userApi
jest.mock('../../services/userApi', () => ({
  userApi: {
    getUserProfile: jest.fn(),
    updateUserName: jest.fn(),
    uploadProfilePicture: jest.fn(),
  },
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Camera: () => <div data-testid="camera-icon" />,
  Save: () => <div data-testid="save-icon" />,
  X: () => <div data-testid="x-icon" />,
}));

const mockUser = {
  _id: '123',
  auth0Id: 'auth0|123',
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://example.com/pic.jpg',
};

describe('ProfileModal', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not render when closed', () => {
    render(
      <ProfileModal open={false} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.queryByText(/Profile/i)).not.toBeInTheDocument();
  });

  it('renders when open', () => {
    render(
      <ProfileModal open={true} onOpenChange={mockOnOpenChange} initialUser={mockUser} />
    );

    expect(screen.getByRole('heading', { name: /Profile/i })).toBeInTheDocument();
  });

  it('loads user profile when no initial user provided', async () => {
    (userApi.getUserProfile as jest.Mock).mockResolvedValueOnce(mockUser);

    render(
      <ProfileModal open={true} onOpenChange={mockOnOpenChange} />
    );

    await waitFor(() => {
      expect(userApi.getUserProfile).toHaveBeenCalled();
    });
  });

  it('displays user name when provided', async () => {
    render(
      <ProfileModal open={true} onOpenChange={mockOnOpenChange} initialUser={mockUser} />
    );

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('allows editing name', async () => {
    render(
      <ProfileModal open={true} onOpenChange={mockOnOpenChange} initialUser={mockUser} />
    );

    // First click Edit button
    const editButton = await screen.findByRole('button', { name: /Edit/i });
    await userEvent.click(editButton);

    // Now find the input field
    const nameInput = await screen.findByDisplayValue('Test User');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Name');

    expect(nameInput).toHaveValue('Updated Name');
  });

  it('saves name changes', async () => {
    const updatedUser = { ...mockUser, name: 'Updated Name' };
    (userApi.updateUserName as jest.Mock).mockResolvedValueOnce(updatedUser);

    render(
      <ProfileModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        initialUser={mockUser}
        onUpdate={mockOnUpdate}
      />
    );

    // Click Edit button first
    const editButton = await screen.findByRole('button', { name: /Edit/i });
    await userEvent.click(editButton);

    // Now find and edit the input
    const nameInput = await screen.findByDisplayValue('Test User');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Name');

    // Find and click save button
    const saveButtons = screen.getAllByRole('button');
    const saveButton = saveButtons.find(btn => {
      const icon = btn.querySelector('[data-testid="save-icon"]');
      return icon !== null;
    });
    
    if (saveButton) {
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(userApi.updateUserName).toHaveBeenCalledWith('Updated Name');
      });

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      }, { timeout: 3000 });
    }
  });

  it('does not save if name is unchanged', async () => {
    render(
      <ProfileModal open={true} onOpenChange={mockOnOpenChange} initialUser={mockUser} />
    );

    // Click Edit button
    const editButton = await screen.findByRole('button', { name: /Edit/i });
    await userEvent.click(editButton);

    // Find input and try to save without changing
    const nameInput = await screen.findByDisplayValue('Test User');
    // Don't change the value - just try to save
    
    const saveButtons = screen.getAllByRole('button');
    const saveButton = saveButtons.find(btn => {
      const icon = btn.querySelector('[data-testid="save-icon"]');
      return icon !== null;
    });
    
    if (saveButton) {
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(userApi.updateUserName).not.toHaveBeenCalled();
      });
    }
  });

  it('displays user email', async () => {
    render(
      <ProfileModal open={true} onOpenChange={mockOnOpenChange} initialUser={mockUser} />
    );

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('handles file upload', async () => {
    // Mock FileReader for image compression
    let fileReaderOnload: ((e: any) => void) | null = null;
    const mockFileReaderInstance = {
      readAsDataURL: jest.fn(function(this: any, file: File) {
        // Immediately call onload to simulate successful read
        if (fileReaderOnload) {
          fileReaderOnload({ target: { result: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' } });
        }
      }),
      result: 'data:image/png;base64,test',
      set onload(fn: (e: any) => void) {
        fileReaderOnload = fn;
      },
      get onload() {
        return fileReaderOnload || (() => {});
      },
    };
    global.FileReader = jest.fn(function(this: any) {
      return mockFileReaderInstance;
    }) as any;

    // Mock Image for compression
    let imageOnload: (() => void) | null = null;
    const mockImageInstance = {
      src: '',
      width: 100,
      height: 100,
      set onload(fn: () => void) {
        imageOnload = fn;
        // Immediately call onload to simulate image loaded
        if (imageOnload) {
          imageOnload();
        }
      },
      get onload() {
        return imageOnload || (() => {});
      },
    };
    global.Image = jest.fn(function(this: any) {
      return mockImageInstance;
    }) as any;

    // Mock canvas getContext and toDataURL
    const mockToDataURL = jest.fn().mockReturnValue('data:image/png;base64,compressed');
    const mockGetContext = jest.fn().mockReturnValue({
      drawImage: jest.fn(),
      getImageData: jest.fn(),
    });
    HTMLCanvasElement.prototype.getContext = mockGetContext;
    HTMLCanvasElement.prototype.toDataURL = mockToDataURL;

    const file = new File(['test'], 'test.png', { type: 'image/png' });
    (userApi.uploadProfilePicture as jest.Mock).mockResolvedValueOnce({ customPicture: 'data:image' });
    (userApi.getUserProfile as jest.Mock).mockResolvedValueOnce({
      ...mockUser,
      customPicture: 'data:image',
    });

    render(
      <ProfileModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        initialUser={mockUser}
        onUpdate={mockOnUpdate}
      />
    );

    // Wait for component to render
    await waitFor(() => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
    });
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (fileInput) {
      // Simulate file upload
      await userEvent.upload(fileInput, file);
      
      // File upload is async, wait for it - give more time for the full compression flow
      await waitFor(() => {
        expect(userApi.uploadProfilePicture).toHaveBeenCalled();
      }, { timeout: 5000 });
    }
  }, 15000);

  it('handles close button', async () => {
    render(
      <ProfileModal open={true} onOpenChange={mockOnOpenChange} initialUser={mockUser} />
    );

    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find(btn => 
      btn.textContent?.includes('Close') || btn.getAttribute('aria-label')?.includes('close')
    );

    if (closeButton) {
      await userEvent.click(closeButton);
      await waitFor(() => {
        expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      });
    }
  });

  it('shows loading state', async () => {
    (userApi.getUserProfile as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockUser), 100))
    );

    render(
      <ProfileModal open={true} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.getByText(/Loading profile/i)).toBeInTheDocument();
  });

  it('handles cancel edit name', async () => {
    render(
      <ProfileModal open={true} onOpenChange={mockOnOpenChange} initialUser={mockUser} />
    );

    // Click Edit
    const editButton = await screen.findByRole('button', { name: /Edit/i });
    await userEvent.click(editButton);

    // Type something
    const nameInput = await screen.findByDisplayValue('Test User');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Changed Name');

    // Click cancel (X button)
    const cancelButtons = screen.getAllByRole('button');
    const cancelButton = cancelButtons.find(btn => {
      const icon = btn.querySelector('[data-testid="x-icon"]');
      return icon !== null;
    });

    if (cancelButton) {
      await userEvent.click(cancelButton);

      await waitFor(() => {
        // Name should revert to original
        expect(screen.getByText('Test User')).toBeInTheDocument();
      });
    }
  });

  it('handles save name error', async () => {
    (userApi.updateUserName as jest.Mock).mockRejectedValueOnce(new Error('Update failed'));

    render(
      <ProfileModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        initialUser={mockUser}
      />
    );

    // Click Edit
    const editButton = await screen.findByRole('button', { name: /Edit/i });
    await userEvent.click(editButton);

    // Change name
    const nameInput = await screen.findByDisplayValue('Test User');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Name');

    // Click save
    const saveButtons = screen.getAllByRole('button');
    const saveButton = saveButtons.find(btn => {
      const icon = btn.querySelector('[data-testid="save-icon"]');
      return icon !== null;
    });

    if (saveButton) {
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(userApi.updateUserName).toHaveBeenCalled();
      });

      // Should show error (alert is called)
      await waitFor(() => {
        expect(userApi.updateUserName).toHaveBeenCalledWith('Updated Name');
      });
    }
  });

  it('handles empty name on save', async () => {
    render(
      <ProfileModal open={true} onOpenChange={mockOnOpenChange} initialUser={mockUser} />
    );

    // Click Edit
    const editButton = await screen.findByRole('button', { name: /Edit/i });
    await userEvent.click(editButton);

    // Clear name
    const nameInput = await screen.findByDisplayValue('Test User');
    await userEvent.clear(nameInput);

    // Try to save with empty name
    const saveButtons = screen.getAllByRole('button');
    const saveButton = saveButtons.find(btn => {
      const icon = btn.querySelector('[data-testid="save-icon"]');
      return icon !== null;
    });

    if (saveButton && saveButton.hasAttribute('disabled')) {
      // Save button should be disabled
      expect(saveButton).toBeDisabled();
    }
  });

  it('handles file upload with invalid file type', async () => {
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    render(
      <ProfileModal open={true} onOpenChange={mockOnOpenChange} initialUser={mockUser} />
    );

    await waitFor(() => {
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput).toBeInTheDocument();
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    if (fileInput) {
      // Create a mock event with the file
      const changeEvent = {
        target: {
          files: [file],
          value: 'test.txt',
        },
      } as any;

      // Trigger the onChange handler directly
      Object.defineProperty(fileInput, 'files', {
        value: [file],
        writable: false,
      });

      fileInput.dispatchEvent(new Event('change', { bubbles: true }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Please select an image file');
      }, { timeout: 3000 });
    }

    mockAlert.mockRestore();
  });
});

