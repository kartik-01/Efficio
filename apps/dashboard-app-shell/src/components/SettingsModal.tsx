import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Label,
  RadioGroup,
  RadioGroupItem,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@efficio/ui";
import { userApi, UserProfile } from "../services/userApi";
import { useAuth0 } from "@auth0/auth0-react";
import { useTheme } from "../hooks/useTheme";
import { Moon, Sun, Monitor, Trash2, UserX } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUser?: UserProfile;
  onUpdate?: () => void;
  onLogout?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onOpenChange,
  initialUser,
  onUpdate,
  onLogout,
}) => {
  const { logout } = useAuth0();
  const { theme, updateTheme, loadTheme } = useTheme();
  const [user, setUser] = useState<UserProfile | null>(initialUser || null);
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | "auto">(theme);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (open) {
      if (initialUser) {
        setUser(initialUser);
        setSelectedTheme((initialUser.preferences?.theme as "light" | "dark" | "auto") || theme);
      } else {
        loadUserProfile();
      }
    }
  }, [open, initialUser, theme]);

  useEffect(() => {
    setSelectedTheme(theme);
  }, [theme]);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      const profile = await userApi.getUserProfile();
      setUser(profile);
      setSelectedTheme((profile.preferences?.theme as "light" | "dark" | "auto") || "light");
    } catch (error) {
      console.error("Failed to load user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = async (newTheme: "light" | "dark" | "auto") => {
    setSelectedTheme(newTheme);
    setIsSaving(true);
    try {
      await updateTheme(newTheme);
      await loadTheme(); // Reload to get updated profile
      onUpdate?.();
    } catch (error) {
      console.error("Failed to update theme:", error);
      alert("Failed to update theme. Please try again.");
      // Revert on error
      setSelectedTheme(theme);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivateAccount = async () => {
    setIsDeactivating(true);
    try {
      await userApi.deactivateAccount();
      setShowDeactivateDialog(false);
      onOpenChange(false);
      // Logout after deactivation
      if (onLogout) {
        onLogout();
      } else {
        logout({ logoutParams: { returnTo: window.location.origin } });
      }
    } catch (error) {
      console.error("Failed to deactivate account:", error);
      alert("Failed to deactivate account. Please try again.");
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await userApi.deleteAccount();
      setShowDeleteDialog(false);
      onOpenChange(false);
      // Logout after deletion
      if (onLogout) {
        onLogout();
      } else {
        logout({ logoutParams: { returnTo: window.location.origin } });
      }
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!user && !isLoading) {
    return null;
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Manage your preferences and account settings
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-gray-500">Loading settings...</p>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              {/* Theme Selection */}
              <div className="space-y-3">
                <Label>Theme</Label>
                <RadioGroup
                  value={selectedTheme}
                  onValueChange={(value) => handleThemeChange(value as "light" | "dark" | "auto")}
                  disabled={isSaving}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="light" id="theme-light" />
                    <Label htmlFor="theme-light" className="flex items-center gap-2 cursor-pointer font-normal">
                      <Sun className="h-4 w-4" />
                      Light
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="dark" id="theme-dark" />
                    <Label htmlFor="theme-dark" className="flex items-center gap-2 cursor-pointer font-normal">
                      <Moon className="h-4 w-4" />
                      Dark
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="auto" id="theme-auto" />
                    <Label htmlFor="theme-auto" className="flex items-center gap-2 cursor-pointer font-normal">
                      <Monitor className="h-4 w-4" />
                      Auto (follows system time)
                    </Label>
                  </div>
                </RadioGroup>
                {selectedTheme === "auto" && (
                  <p className="text-xs text-gray-500">
                    Auto mode switches between light (6 AM - 8 PM) and dark (8 PM - 6 AM) based on time of day.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t space-y-3">
                <Label className="text-red-600">Danger Zone</Label>
                
                {/* Deactivate Account */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Deactivate your account. Your data will be preserved, but you won't be able to access it until you reactivate.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeactivateDialog(true)}
                    className="w-full justify-start"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Deactivate Account
                  </Button>
                </div>

                {/* Delete Account */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    className="w-full justify-start"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Deactivate Account Confirmation Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate your account? Your data will be preserved, but you will be logged out and unable to access your account until you reactivate it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateAccount}
              disabled={isDeactivating}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeactivating ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account Permanently</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p className="font-semibold text-red-600">
                WARNING: This action cannot be undone!
              </p>
              <p>
                This will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Your account and profile</li>
                <li>All your individual tasks</li>
                <li>All associated data</li>
              </ul>
              <p className="mt-2">
                Type <strong>DELETE</strong> to confirm:
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
