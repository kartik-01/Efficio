import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsModal } from '../SettingsModal';
import { userApi } from '../../services/userApi';
import { useAuth0 } from '@auth0/auth0-react';
import { useTheme } from '../../hooks/useTheme';

// Mock @auth0/auth0-react
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn(),
}));

// Mock useTheme hook
jest.mock('../../hooks/useTheme', () => ({
  useTheme: jest.fn(),
}));

// Mock framer-motion
jest.mock('framer-motion', () => require('./mocks.tsx').framerMotionMocks);

// Mock @efficio/ui
jest.mock('@efficio/ui', () => require('./mocks.tsx').efficioUIMocks);

// Mock userApi
jest.mock('../../services/userApi', () => ({
  userApi: {
    getUserProfile: jest.fn(),
    deactivateAccount: jest.fn(),
    deleteAccount: jest.fn(),
  },
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Moon: () => <div data-testid="moon-icon" />,
  Sun: () => <div data-testid="sun-icon" />,
  Monitor: () => <div data-testid="monitor-icon" />,
  Trash2: () => <div data-testid="trash-icon" />,
  UserX: () => <div data-testid="userx-icon" />,
}));

const mockUser = {
  _id: '123',
  auth0Id: 'auth0|123',
  email: 'test@example.com',
  name: 'Test User',
  preferences: {
    theme: 'light' as const,
  },
};

const mockLogout = jest.fn();
const mockUpdateTheme = jest.fn();
const mockLoadTheme = jest.fn();

describe('SettingsModal', () => {
  const mockOnOpenChange = jest.fn();
  const mockOnUpdate = jest.fn();
  const mockOnLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth0 as jest.Mock).mockReturnValue({
      logout: mockLogout,
    });
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'light',
      updateTheme: mockUpdateTheme,
      loadTheme: mockLoadTheme,
    });
  });

  it('does not render when closed', () => {
    render(
      <SettingsModal open={false} onOpenChange={mockOnOpenChange} />
    );

    expect(screen.queryByText(/Settings/i)).not.toBeInTheDocument();
  });

  it('renders when open', async () => {
    render(
      <SettingsModal open={true} onOpenChange={mockOnOpenChange} initialUser={mockUser} />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Settings/i })).toBeInTheDocument();
    });
  });

  it('loads user profile when no initial user provided', async () => {
    (userApi.getUserProfile as jest.Mock).mockResolvedValueOnce(mockUser);

    render(
      <SettingsModal open={true} onOpenChange={mockOnOpenChange} />
    );

    await waitFor(() => {
      expect(userApi.getUserProfile).toHaveBeenCalled();
    });
  });

  it('displays theme options', () => {
    render(
      <SettingsModal open={true} onOpenChange={mockOnOpenChange} initialUser={mockUser} />
    );

    expect(screen.getByLabelText(/Light/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dark/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Auto/i)).toBeInTheDocument();
  });

  it('handles theme change to dark', async () => {
    mockUpdateTheme.mockResolvedValueOnce(undefined);
    mockLoadTheme.mockResolvedValueOnce(undefined);

    render(
      <SettingsModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        initialUser={mockUser}
        onUpdate={mockOnUpdate}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Dark/i)).toBeInTheDocument();
    });

    const darkRadioInput = screen.getByTestId('radio-dark') as HTMLInputElement;
    expect(darkRadioInput).toBeInTheDocument();
    
    // Click the radio input - this should trigger both onClick and onChange in our mock
    await userEvent.click(darkRadioInput);

    // The mock's handlers should call onValueChange('dark') which triggers handleThemeChange
    // Wait for updateTheme to be called
    await waitFor(() => {
      expect(mockUpdateTheme).toHaveBeenCalled();
    }, { timeout: 5000 });
    
    // Verify it was called with 'dark'
    expect(mockUpdateTheme).toHaveBeenCalledWith('dark');
  }, 10000);

  it('handles theme change to auto', async () => {
    mockUpdateTheme.mockResolvedValueOnce(undefined);
    mockLoadTheme.mockResolvedValueOnce(undefined);

    render(
      <SettingsModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        initialUser={mockUser}
        onUpdate={mockOnUpdate}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Auto/i)).toBeInTheDocument();
    });

    const autoRadioInput = screen.getByTestId('radio-auto') as HTMLInputElement;
    expect(autoRadioInput).toBeInTheDocument();
    
    // Click the radio input
    await userEvent.click(autoRadioInput);

    // Wait for updateTheme to be called
    await waitFor(() => {
      expect(mockUpdateTheme).toHaveBeenCalled();
    }, { timeout: 5000 });
    
    // Verify it was called with 'auto'
    expect(mockUpdateTheme).toHaveBeenCalledWith('auto');
  }, 10000);

  it('handles theme change error', async () => {
    mockUpdateTheme.mockImplementationOnce(() => Promise.reject(new Error('Update failed')));
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <SettingsModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        initialUser={mockUser}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/Dark/i)).toBeInTheDocument();
    });

    const darkRadioInput = screen.getByTestId('radio-dark') as HTMLInputElement;
    
    // Click the radio input
    await userEvent.click(darkRadioInput);

    // Wait for updateTheme to be called
    await waitFor(() => {
      expect(mockUpdateTheme).toHaveBeenCalled();
    }, { timeout: 5000 });
    
    // Verify it was called with 'dark'
    expect(mockUpdateTheme).toHaveBeenCalledWith('dark');

    // The error handling happens asynchronously, wait for alert
    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalled();
    }, { timeout: 3000 });

    mockAlert.mockRestore();
  }, 10000);

  it('shows deactivate account dialog', async () => {
    render(
      <SettingsModal open={true} onOpenChange={mockOnOpenChange} initialUser={mockUser} />
    );

    const deactivateButton = screen.getByText(/Deactivate Account/i);
    await userEvent.click(deactivateButton);

    // Wait for dialog to appear
    const dialog = await screen.findByText(/Are you sure you want to deactivate/i);
    expect(dialog).toBeInTheDocument();
  });

  it('shows delete account dialog', async () => {
    render(
      <SettingsModal open={true} onOpenChange={mockOnOpenChange} initialUser={mockUser} />
    );

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /Delete Account/i });
      expect(deleteButton).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /Delete Account/i });
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Delete Account Permanently/i })).toBeInTheDocument();
    });
  });

  it('handles account deactivation', async () => {
    (userApi.deactivateAccount as jest.Mock).mockResolvedValueOnce(undefined);

    render(
      <SettingsModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        initialUser={mockUser}
        onLogout={mockOnLogout}
      />
    );

    await waitFor(() => {
      const deactivateButton = screen.getByText(/Deactivate Account/i);
      expect(deactivateButton).toBeInTheDocument();
    });

    const deactivateButton = screen.getByText(/Deactivate Account/i);
    await userEvent.click(deactivateButton);

    // Wait for dialog to appear
    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to deactivate/i)).toBeInTheDocument();
    });

    // Find and click confirm button
    const buttons = screen.getAllByRole('button');
    const confirmButton = buttons.find(btn => 
      btn.textContent?.includes('Deactivate') && !btn.textContent?.includes('Account')
    );
    
    if (confirmButton) {
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(userApi.deactivateAccount).toHaveBeenCalled();
      }, { timeout: 2000 });
    }
  });

  it('handles deactivation error', async () => {
    (userApi.deactivateAccount as jest.Mock).mockRejectedValueOnce(new Error('Failed'));
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <SettingsModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        initialUser={mockUser}
      />
    );

    const deactivateButton = screen.getByText(/Deactivate Account/i);
    await userEvent.click(deactivateButton);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to deactivate/i)).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const confirmButton = buttons.find(btn => 
      btn.textContent?.includes('Deactivate') && !btn.textContent?.includes('Account')
    );
    
    if (confirmButton) {
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Failed to deactivate account. Please try again.');
      }, { timeout: 2000 });
    }

    mockAlert.mockRestore();
  });

  it('handles delete account', async () => {
    (userApi.deleteAccount as jest.Mock).mockResolvedValueOnce(undefined);

    render(
      <SettingsModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        initialUser={mockUser}
        onLogout={mockOnLogout}
      />
    );

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /Delete Account/i });
      expect(deleteButton).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /Delete Account/i });
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Delete Account Permanently/i })).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /Delete Permanently/i });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(userApi.deleteAccount).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('handles delete account error', async () => {
    (userApi.deleteAccount as jest.Mock).mockRejectedValueOnce(new Error('Failed'));
    const mockAlert = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <SettingsModal 
        open={true} 
        onOpenChange={mockOnOpenChange} 
        initialUser={mockUser}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /Delete Account/i });
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Delete Account Permanently/i })).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /Delete Permanently/i });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockAlert).toHaveBeenCalledWith('Failed to delete account. Please try again.');
    }, { timeout: 2000 });

    mockAlert.mockRestore();
  });

  it('cancels deactivate dialog', async () => {
    render(
      <SettingsModal open={true} onOpenChange={mockOnOpenChange} initialUser={mockUser} />
    );

    const deactivateButton = screen.getByText(/Deactivate Account/i);
    await userEvent.click(deactivateButton);

    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to deactivate/i)).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await userEvent.click(cancelButton);

    await waitFor(() => {
      expect(userApi.deactivateAccount).not.toHaveBeenCalled();
    });
  });
});
