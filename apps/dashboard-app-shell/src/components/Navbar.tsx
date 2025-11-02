import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, useLocation } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { LogOut, Settings, User } from "lucide-react";
import { ProfileModal } from "./ProfileModal";
import { SettingsModal } from "./SettingsModal";
import { userApi, UserProfile, initializeUserApi, isUserApiReady } from "../services/userApi";

// API base URL - injected by webpack DefinePlugin at build time
declare const process: {
  env: {
    API_BASE_URL?: string;
  };
};

type NavbarProps = {
  activeTab?: "task" | "time" | "analytics";
  onTabChange?: (tab: "task" | "time" | "analytics") => void;
};

export const Navbar = ({
  activeTab = "task",
  onTabChange,
}: NavbarProps) => {
  const { isAuthenticated, user: auth0User, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Initialize userApi with token getter (only once)
  useEffect(() => {
    if (isAuthenticated) {
      initializeUserApi(async () => {
        try {
          return await getAccessTokenSilently();
        } catch (error) {
          console.error("Failed to get access token:", error);
          return undefined;
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Load user profile when authenticated and API is ready
  // Use a ref to track if we've already loaded to prevent multiple calls
  const profileLoadedRef = React.useRef(false);
  
  useEffect(() => {
    if (isAuthenticated && isUserApiReady() && !profileLoadedRef.current) {
      profileLoadedRef.current = true;
      loadUserProfile();
    }
    // Reset when user logs out
    if (!isAuthenticated) {
      profileLoadedRef.current = false;
      setUserProfile(null);
    }
  }, [isAuthenticated]);

  const loadUserProfile = async () => {
    try {
      const profile = await userApi.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error("Failed to load user profile:", error);
    }
  };

  const handleProfileUpdate = () => {
    // Reset the flag so we can reload
    profileLoadedRef.current = false;
    loadUserProfile();
  };

  const tabs = [
    { id: "task", label: "Task Manager", path: "/task-manager" },
    { id: "time", label: "Time Tracker", path: "/time-tracker" },
    { id: "analytics", label: "Analytics", path: "/analytics" },
  ];

  const handleTabClick = (tabId: "task" | "time" | "analytics") => {
    if (onTabChange) onTabChange(tabId);
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      navigate(tab.path);
    }
  };

  // Determine active tab from pathname
  const currentPath = location.pathname || "/task-manager";
  const activeTabFromPath =
    tabs.find((t) => currentPath.includes(t.path.replace("/", "")))?.id || activeTab || "task";

  // Handle logout: call backend logout endpoint, then Auth0 logout
  const handleLogout = async () => {
    try {
      // Get API base URL (defaults to localhost:4000/api)
      const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000/api';
      
      // Get access token for backend API call
      const token = await getAccessTokenSilently();
      
      // Call backend logout endpoint to set isOnline to false
      if (token) {
        try {
          await fetch(`${API_BASE_URL}/users/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          // Log error but don't block logout - Auth0 logout should still happen
          console.error('Failed to call backend logout endpoint:', error);
        }
      }
    } catch (error) {
      // Log error but don't block logout - Auth0 logout should still happen
      console.error('Failed to get access token for logout:', error);
    }

    // Always call Auth0 logout regardless of backend call success
    logout({
      logoutParams: { returnTo: window.location.origin },
    });
  };

  return (
    <nav className="w-full h-16 border-b border-gray-200 bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-[1280px] mx-auto px-8 h-full flex items-center justify-between">
        {/* Left side: logo + tabs */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.15901 1.0445C4.42971 1.28786 4.45159 1.70075 4.20823 1.97145L2.23948 4.15895C2.11917 4.29294 1.94963 4.37223 1.76917 4.37497C1.5887 4.3777 1.41643 4.30934 1.28791 4.18356L0.191431 3.08981C-0.0628662 2.83278 -0.0628662 2.41716 0.191431 2.16013C0.445728 1.90309 0.864087 1.90309 1.11838 2.16013L1.72268 2.76442L3.22932 1.09098C3.47268 0.820281 3.88557 0.798406 4.15627 1.04177L4.15901 1.0445ZM4.15901 5.4195C4.42971 5.66286 4.45159 6.07575 4.20823 6.34645L2.23948 8.53395C2.11917 8.66794 1.94963 8.74723 1.76917 8.74997C1.5887 8.7527 1.41643 8.68434 1.28791 8.55856L0.191431 7.46481C-0.0656006 7.20778 -0.0656006 6.79216 0.191431 6.53786C0.448462 6.28356 0.864087 6.28083 1.11838 6.53786L1.72268 7.14216L3.22932 5.46872C3.47268 5.19802 3.88557 5.17614 4.15627 5.4195H4.15901ZM6.12502 2.62497C6.12502 2.14098 6.51604 1.74997 7.00002 1.74997H13.125C13.609 1.74997 14 2.14098 14 2.62497C14 3.10895 13.609 3.49997 13.125 3.49997H7.00002C6.51604 3.49997 6.12502 3.10895 6.12502 2.62497ZM6.12502 6.99997C6.12502 6.51598 6.51604 6.12497 7.00002 6.12497H13.125C13.609 6.12497 14 6.51598 14 6.99997C14 7.48395 13.609 7.87497 13.125 7.87497H7.00002C6.51604 7.87497 6.12502 7.48395 6.12502 6.99997ZM4.37502 11.375C4.37502 10.891 4.76604 10.5 5.25002 10.5H13.125C13.609 10.5 14 10.891 14 11.375C14 11.859 13.609 12.25 13.125 12.25H5.25002C4.76604 12.25 4.37502 11.859 4.37502 11.375ZM1.31252 10.0625C1.66062 10.0625 1.99446 10.2007 2.2406 10.4469C2.48674 10.693 2.62502 11.0269 2.62502 11.375C2.62502 11.7231 2.48674 12.0569 2.2406 12.303C1.99446 12.5492 1.66062 12.6875 1.31252 12.6875C0.964428 12.6875 0.630588 12.5492 0.384447 12.303C0.138305 12.0569 0 11.7231 0 11.375C0 11.0269 0.138305 10.693 0.384447 10.4469C0.630588 10.2007 0.964428 10.0625 1.31252 10.0625Z"
                  fill="white"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">Efficio</span>
          </div>

          {/* Tabs */}
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              {tabs.map((tab) => {
                const isActive = activeTabFromPath === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id as any)}
                    className={`px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors duration-200 ${
                      isActive
                        ? "bg-indigo-500 text-white border border-indigo-500"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right side */}
        {!isAuthenticated ? (
          <button
            onClick={() => loginWithRedirect()}
            className="bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium h-9 px-6 rounded-md transition-all duration-200 cursor-pointer"
          >
            Log In
          </button>
        ) : (
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center gap-2 rounded-md px-2 py-1 cursor-pointer hover:bg-indigo-50 transition-all duration-150 focus:outline-none">
                {(userProfile?.customPicture || auth0User?.picture) && (
                  <img
                    src={userProfile?.customPicture || auth0User?.picture}
                    alt="User Profile"
                    className="w-8 h-8 rounded-full border border-transparent"
                  />
                )}
                <span className="text-gray-700 font-medium hover:text-indigo-600 transition-colors">
                  {(userProfile?.name || auth0User?.name)?.split(" ")[0]}
                </span>
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-[60] min-w-[160px] bg-white border border-gray-200 rounded-lg shadow-lg p-1"
            >
              <DropdownMenu.Item
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer rounded-md transition-all"
              >
                <User size={16} /> Profile
              </DropdownMenu.Item>
              
              <DropdownMenu.Item
                onClick={() => setShowSettingsModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer rounded-md transition-all"
              >
                <Settings size={16} /> Settings
              </DropdownMenu.Item>

              <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />

              <DropdownMenu.Item
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer rounded-md transition-all"
              >
                <LogOut size={16} /> Log Out
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        )}
      </div>

      {/* Modals */}
      <ProfileModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        initialUser={userProfile || undefined}
        onUpdate={handleProfileUpdate}
      />
      <SettingsModal
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
        initialUser={userProfile || undefined}
        onUpdate={handleProfileUpdate}
        onLogout={handleLogout}
      />
    </nav>
  );
};
