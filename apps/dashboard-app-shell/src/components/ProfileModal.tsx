import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
  Input,
  Label,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@efficio/ui";
import { motion, AnimatePresence } from "framer-motion";
import { userApi, UserProfile } from "../services/userApi";
import { Camera, Save, X } from "lucide-react";

interface ProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUser?: UserProfile;
  onUpdate?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  open,
  onOpenChange,
  initialUser,
  onUpdate,
}) => {
  const [user, setUser] = useState<UserProfile | null>(initialUser || null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      if (initialUser) {
        setUser(initialUser);
        setEditedName(initialUser.name || "");
      } else {
        loadUserProfile();
      }
    }
  }, [open, initialUser]);

  const loadUserProfile = async () => {
    setIsLoading(true);
    try {
      const profile = await userApi.getUserProfile();
      setUser(profile);
      setEditedName(profile.name || "");
    } catch (error) {
      console.error("Failed to load user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName === user?.name) {
      setIsEditingName(false);
      return;
    }

    setIsSaving(true);
    try {
      const updated = await userApi.updateUserName(editedName.trim());
      setUser(updated);
      setIsEditingName(false);
      onUpdate?.();
    } catch (error) {
      console.error("Failed to update name:", error);
      alert("Failed to update name. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEditName = () => {
    setEditedName(user?.name || "");
    setIsEditingName(false);
  };

  // Helper function to compress/resize image
  const compressImage = (file: File, maxWidth = 400, maxHeight = 400, quality = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          // Create canvas and draw resized image
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          
          if (!ctx) {
            reject(new Error("Could not get canvas context"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to base64 with compression
          const base64String = canvas.toDataURL("image/jpeg", quality);
          resolve(base64String);
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 10MB before compression)
    if (file.size > 10 * 1024 * 1024) {
      alert("Image size should be less than 10MB");
      return;
    }

    setIsSaving(true);
    try {
      // Compress and resize image before uploading
      const compressedBase64 = await compressImage(file, 400, 400, 0.8);
      
      await userApi.uploadProfilePicture(compressedBase64);
      await loadUserProfile(); // Reload to get updated profile
      onUpdate?.();
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
      alert("Failed to upload profile picture. Please try again.");
    } finally {
      setIsSaving(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getProfilePicture = () => {
    if (user?.customPicture) {
      return user.customPicture;
    }
    return user?.picture;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!user && !isLoading) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogContent className="sm:max-w-[500px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.88, y: 10 }}
              transition={{
                duration: 0.25,
                ease: [0.34, 1.56, 0.64, 1]
              }}
            >
              <DialogHeader>
                <DialogTitle>Profile</DialogTitle>
                <DialogDescription>
                  Manage your profile information and settings
                </DialogDescription>
              </DialogHeader>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-gray-500">Loading profile...</p>
                </div>
              ) : (
                <div className="space-y-6 py-4">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        {getProfilePicture() && (
                          <AvatarImage src={getProfilePicture()} alt={user?.name || "Profile"} />
                        )}
                        <AvatarFallback className="text-2xl">
                          {user?.name?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <Button
                        size="icon"
                        variant="outline"
                        className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isSaving}
                      >
                        <Camera className="h-4 w-4" />
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <p className="text-xs text-gray-500 text-center max-w-xs">
                      Click the camera icon to upload a new profile picture
                    </p>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    {isEditingName ? (
                      <div className="flex gap-2">
                        <Input
                          id="name"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          disabled={isSaving}
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={handleSaveName}
                          disabled={isSaving || !editedName.trim()}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={handleCancelEditName}
                          disabled={isSaving}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{user?.name || "Not set"}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingName(true)}
                        >
                          Edit
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <p className="text-sm text-gray-600">{user?.email || "Not available"}</p>
                  </div>

                  {/* Account Info */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Last Login</span>
                      <span className="text-sm font-medium">
                        {formatDate(user?.lastLogin)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Member Since</span>
                      <span className="text-sm font-medium">
                        {formatDate(user?.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
};
