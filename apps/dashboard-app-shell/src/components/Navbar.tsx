import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, useLocation } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Settings, User, Menu, Bell, History, X } from "lucide-react";
import { ProfileModal } from "./ProfileModal";
import { SettingsModal } from "./SettingsModal";
import { userApi, UserProfile, initializeUserApi, isUserApiReady } from "../services/userApi";
import { notificationApi, initializeNotificationApi, isNotificationApiReady, NotificationsResponse } from "../services/notificationApi";
import { Badge, ScrollArea } from "@efficio/ui";

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
  const [notifications, setNotifications] = useState<NotificationsResponse | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownPreviouslyOpenRef = React.useRef(false);
  const eventSourceRef = React.useRef<EventSource | null>(null);
  const unreadCount = notifications?.totalUnreadCount ?? 0;
  const invitationNotifications = React.useMemo(
    () => (notifications?.notifications || []).filter((n) => n.type === "invitation"),
    [notifications]
  );
  const taskNotifications = React.useMemo(
    () => (notifications?.notifications || []).filter((n) => n.type === "task_assigned"),
    [notifications]
  );
  const hasNotifications = invitationNotifications.length > 0 || taskNotifications.length > 0;
  
  // Initialize notificationApi with token getter (only once)
  useEffect(() => {
    if (isAuthenticated) {
      initializeNotificationApi(async () => {
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

  const loadNotifications = React.useCallback(async () => {
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
      // Set empty notifications object on error so icon still appears and shows "No notifications"
      setNotifications({
        notifications: [],
        pendingInvitationsCount: 0,
        taskAssignmentsCount: 0,
        totalUnreadCount: 0,
      });
    }
  }, []);

  const handleClearNotification = React.useCallback(
    async (notificationId: string) => {
      if (!notificationId || !isNotificationApiReady()) {
        return;
      }
      try {
        await notificationApi.deleteNotification(notificationId);
        await loadNotifications();
      } catch (error) {
        console.error("Failed to clear notification:", error);
      }
    },
    [loadNotifications]
  );

  const handleClearTaskNotifications = React.useCallback(async () => {
    if (!isNotificationApiReady()) {
      return;
    }
    try {
      await notificationApi.clearTaskNotifications();
      await loadNotifications();
    } catch (error) {
      console.error("Failed to clear task notifications:", error);
    }
  }, [loadNotifications]);

  // Load notifications when authenticated and API is ready
  useEffect(() => {
    if (isAuthenticated && isNotificationApiReady()) {
      loadNotifications();

      // Manual refresh hook for other parts of the app (e.g., invitation dialogs)
      const handleRefresh = () => {
        loadNotifications();
      };
      window.addEventListener('refreshNotifications', handleRefresh);

      return () => {
        window.removeEventListener('refreshNotifications', handleRefresh);
      };
    }
    // Reset when user logs out
    if (!isAuthenticated) {
      setNotifications(null);
      dropdownPreviouslyOpenRef.current = false;
      setShowNotifications(false);
    }
  }, [isAuthenticated, loadNotifications]);

  useEffect(() => {
    if (!isAuthenticated || !isNotificationApiReady()) {
      dropdownPreviouslyOpenRef.current = false;
      return;
    }

    if (showNotifications && !dropdownPreviouslyOpenRef.current && unreadCount > 0) {
      const acknowledgedAt = new Date().toISOString();
      notificationApi
        .markAllAsRead()
        .catch((error) => console.error("Failed to acknowledge notifications:", error));
      setNotifications((prev) => {
        if (!prev) return prev;
        const updatedNotifications = prev.notifications.map((notif) =>
          notif.acknowledgedAt ? notif : { ...notif, acknowledgedAt }
        );
        return {
          ...prev,
          notifications: updatedNotifications,
          pendingInvitationsCount: 0,
          taskAssignmentsCount: 0,
          totalUnreadCount: 0,
        };
      });
    }

    dropdownPreviouslyOpenRef.current = showNotifications;
  }, [showNotifications, isAuthenticated, unreadCount, isNotificationApiReady]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    if (!isAuthenticated || !isNotificationApiReady()) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    let disposed = false;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;

    const connect = async () => {
      try {
        if (disposed || eventSourceRef.current) {
          return;
        }

        const token = await getAccessTokenSilently();
        if (!token || disposed) return;

        const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000/api";
        const url = new URL(`${API_BASE_URL.replace(/\/$/, "")}/events/stream`);
        url.searchParams.set("token", token);

        const source = new EventSource(url.toString());
        eventSourceRef.current = source;

        const handleUpdate = () => {
          loadNotifications();
        };

        source.addEventListener("notification", handleUpdate);
        source.addEventListener("notification_removed", handleUpdate);

        source.onerror = () => {
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          if (!disposed) {
            retryTimeout = setTimeout(connect, 5000);
          }
        };
      } catch (error) {
        console.error("Failed to connect to notification stream:", error);
        if (!disposed) {
          retryTimeout = setTimeout(connect, 5000);
        }
      }
    };

    connect();

    return () => {
      disposed = true;
      if (retryTimeout) clearTimeout(retryTimeout);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [isAuthenticated, isNotificationApiReady, getAccessTokenSilently, loadNotifications]);

  // Initialize notifications to empty state so icon appears immediately
  useEffect(() => {
    if (isAuthenticated && isNotificationApiReady() && notifications === null) {
      setNotifications({
        notifications: [],
        pendingInvitationsCount: 0,
        taskAssignmentsCount: 0,
        totalUnreadCount: 0,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <nav className="w-full h-16 border-b border-gray-200 dark:border-transparent bg-background dark:bg-card shadow-sm sticky top-0 z-50">
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 h-full flex items-center justify-between">
        {/* Left side: mobile menu + logo + tabs */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* Mobile Menu Button - Only show in task manager on mobile */}
          {isAuthenticated && location.pathname.includes('task-manager') && (
            <button 
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-accent rounded-md transition-colors cursor-pointer"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('toggleMobileSidebar'));
              }}
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5 text-gray-600 dark:text-muted-foreground" />
            </button>
          )}
          
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
            <span className="text-lg font-bold text-gray-900 dark:text-foreground">Efficio</span>
          </div>

          {/* Tabs - Hidden on mobile for task manager */}
          {isAuthenticated && (
            <div className={`${location.pathname.includes('task-manager') ? 'hidden md:flex' : 'flex'} items-center gap-4`}>
              {tabs.map((tab) => {
                const isActive = activeTabFromPath === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id as any)}
                    className={`px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-colors duration-200 ${
                      isActive
                        ? "bg-indigo-500 dark:bg-indigo-700 text-white border border-indigo-500 dark:border-indigo-700"
                        : "text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-foreground hover:bg-gray-100 dark:hover:bg-accent"
                    }`}
                    aria-label={`Navigate to ${tab.label}`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right side: notifications + user */}
        {!isAuthenticated ? (
          <button
            onClick={() => loginWithRedirect()}
            className="bg-indigo-500 dark:bg-indigo-700 hover:bg-indigo-600 dark:hover:bg-indigo-800 text-white text-sm font-medium h-9 px-6 rounded-md transition-all duration-200 cursor-pointer"
          >
            Log In
          </button>
        ) : (
          <div className="flex items-center gap-1">
            {/* Mobile Activity Button - Only show in task manager on mobile */}
            {location.pathname.includes('task-manager') && (
              <button 
                className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-accent rounded-md transition-colors cursor-pointer"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('toggleMobileActivity'));
                }}
                aria-label="Toggle activity panel"
              >
                <History className="h-5 w-5 text-gray-600 dark:text-muted-foreground" />
              </button>
            )}
            
            {/* Notifications - Only show in task manager, always visible */}
            {location.pathname.includes('task-manager') && isNotificationApiReady() && (
              <DropdownMenu.Root open={showNotifications} onOpenChange={setShowNotifications}>
                <DropdownMenu.Trigger asChild>
                  <motion.button
                    className="relative p-2 hover:bg-gray-100 dark:hover:bg-accent rounded-md transition-colors cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                    aria-haspopup="menu"
                    aria-expanded={showNotifications}
                  >
                    <Bell className="h-5 w-5 text-gray-600 dark:text-muted-foreground" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="secondary" 
                        className="absolute -top-1 -right-1 text-[10px] bg-red-500 text-white px-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full border-2 border-white dark:border-card"
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </motion.button>
                </DropdownMenu.Trigger>

                <AnimatePresence>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="z-[60] w-[380px] max-h-[500px] bg-white dark:bg-popover border border-gray-200 dark:border-transparent rounded-lg shadow-lg dark:shadow-[0_4px_12px_0_rgba(0,0,0,0.4)] p-0 overflow-hidden"
                    asChild
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={{
                        duration: 0.15,
                        ease: [0.16, 1, 0.3, 1]
                      }}
                    >
                      <div className="flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 dark:border-transparent">
                          <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">Notifications</h2>
                        </div>
                        
                        {/* Content */}
                        <ScrollArea className="max-h-[400px]">
                          <div className="p-4">
                            {!notifications || !hasNotifications ? (
                              <div className="flex flex-col items-center justify-center text-center py-12">
                                <Bell className="h-12 w-12 text-gray-300 dark:text-muted-foreground mb-4" />
                                <p className="text-gray-600 dark:text-muted-foreground text-sm">No notifications</p>
                                <p className="text-gray-500 dark:text-muted-foreground text-xs mt-2">
                                  You're all caught up!
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {/* Pending Invitations */}
                                {invitationNotifications.length > 0 && (
                                  <div className="space-y-3">
                                    <h3 className="text-xs font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wide">Pending Invitations</h3>
                                    <AnimatePresence initial={false}>
                                      {invitationNotifications.map(notification => (
                                        <DropdownMenu.Item
                                          key={notification.id}
                                          className="p-0 m-0 cursor-pointer"
                                          asChild
                                          onSelect={(e) => {
                                            e.preventDefault();
                                            setShowNotifications(false);
                                            window.dispatchEvent(new CustomEvent('openPendingInvitations'));
                                            loadNotifications();
                                          }}
                                        >
                                          <motion.div
                                            className="relative p-4 pr-12 bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/30 rounded-xl hover:bg-yellow-100 dark:hover:bg-yellow-950/50 transition-colors shadow-sm"
                                            whileHover={{ x: 2 }}
                                            whileTap={{ scale: 0.98 }}
                                            layout
                                            exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                                          >
                                            <button
                                              type="button"
                                              aria-label="Clear notification"
                                              className="absolute top-3 right-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-yellow-200 bg-white text-yellow-600 hover:bg-yellow-100 dark:bg-yellow-900/50 dark:border-yellow-800/60 dark:text-yellow-200"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleClearNotification(notification.id);
                                              }}
                                            >
                                              <X className="h-3.5 w-3.5" strokeWidth={2} />
                                            </button>
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-foreground">
                                                  {notification.groupName}
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">
                                                  Group invitation pending
                                                </p>
                                              </div>
                                              {!notification.acknowledgedAt && (
                                                <Badge className="bg-yellow-500 text-white text-[10px] ml-2">
                                                  New
                                                </Badge>
                                              )}
                                            </div>
                                          </motion.div>
                                        </DropdownMenu.Item>
                                      ))}
                                    </AnimatePresence>
                                  </div>
                                )}
                                
                                {/* Task Assignments */}
                                {taskNotifications.length > 0 && (
                                  <div className="space-y-3">
                                    {invitationNotifications.length > 0 && (
                                      <div className="pt-2 border-t border-gray-200 dark:border-transparent" />
                                    )}
                                      <div className="flex items-center justify-between gap-3">
                                      <h3 className="text-xs font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wide">
                                        Task Assignments
                                      </h3>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleClearTaskNotifications();
                                        }}
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"
                                      >
                                        Clear all
                                      </button>
                                    </div>
                                    <AnimatePresence initial={false}>
                                      {taskNotifications.map((notification, index) => (
                                        <DropdownMenu.Item
                                          key={notification.id}
                                          className={`p-0 m-0 cursor-pointer ${index > 0 ? 'mt-2' : ''}`}
                                          asChild
                                          onSelect={(e) => {
                                            e.preventDefault();
                                            setShowNotifications(false);
                                            handleClearNotification(notification.id);
                                            if (notification.groupTag) {
                                              window.dispatchEvent(new CustomEvent('navigateToGroup', { 
                                                detail: { groupTag: notification.groupTag, taskId: notification.taskId } 
                                              }));
                                            }
                                            loadNotifications();
                                          }}
                                        >
                                          <motion.div
                                            className="relative p-4 pr-12 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/30 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors shadow-sm"
                                            whileHover={{ x: 2 }}
                                            whileTap={{ scale: 0.98 }}
                                            layout
                                            exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                                          >
                                            <button
                                              type="button"
                                              aria-label="Clear notification"
                                              className="absolute top-3 right-3 inline-flex h-6 w-6 items-center justify-center rounded-full border border-blue-200 bg-white text-blue-600 hover:bg-blue-100 dark:bg-blue-900/50 dark:border-blue-800/60 dark:text-blue-200"
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleClearNotification(notification.id);
                                              }}
                                            >
                                              <X className="h-3.5 w-3.5" strokeWidth={2} />
                                            </button>
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-foreground">
                                                  {notification.taskTitle}
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-muted-foreground mt-1">
                                                  Assigned to you in {notification.groupTag}
                                                </p>
                                              </div>
                                              {!notification.acknowledgedAt && (
                                                <Badge className="bg-blue-500 text-white text-[10px] ml-2">
                                                  New
                                                </Badge>
                                              )}
                                            </div>
                                          </motion.div>
                                        </DropdownMenu.Item>
                                      ))}
                                    </AnimatePresence>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                      </div>
                    </motion.div>
                  </DropdownMenu.Content>
                </AnimatePresence>
              </DropdownMenu.Root>
            )}
            
            <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <motion.button
                className="flex items-center gap-2 rounded-md px-2 py-1 cursor-pointer hover:bg-indigo-50 dark:hover:bg-accent focus:outline-none"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                {(userProfile?.customPicture || auth0User?.picture) && (
                  <img
                    src={userProfile?.customPicture || auth0User?.picture}
                    alt="User Profile"
                    className="w-8 h-8 rounded-full border border-transparent"
                  />
                )}
                <span className="text-gray-700 dark:text-foreground font-medium hover:text-indigo-600 dark:hover:text-indigo-500 transition-colors">
                  {(userProfile?.name || auth0User?.name)?.split(" ")[0]}
                </span>
              </motion.button>
            </DropdownMenu.Trigger>

            <AnimatePresence>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-[60] min-w-[160px] bg-white dark:bg-popover border border-gray-200 dark:border-transparent rounded-lg shadow-lg dark:shadow-[0_4px_12px_0_rgba(0,0,0,0.4)] p-1"
                asChild
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{
                    duration: 0.15,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                >
                  <div className="flex flex-col gap-1">
                    <DropdownMenu.Item
                      onClick={() => setShowProfileModal(true)}
                      className="p-0 m-0"
                      asChild
                    >
                      <motion.button
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-popover-foreground hover:bg-indigo-50 dark:hover:bg-accent hover:text-indigo-700 dark:hover:text-indigo-400 cursor-pointer rounded-md transition-colors w-full text-left"
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.1 }}
                      >
                        <User size={16} /> Profile
                      </motion.button>
                    </DropdownMenu.Item>
                    
                    <DropdownMenu.Item
                      onClick={() => setShowSettingsModal(true)}
                      className="p-0 m-0"
                      asChild
                    >
                      <motion.button
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-popover-foreground hover:bg-indigo-50 dark:hover:bg-accent hover:text-indigo-700 dark:hover:text-indigo-400 cursor-pointer rounded-md transition-colors w-full text-left"
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.1 }}
                      >
                        <Settings size={16} /> Settings
                      </motion.button>
                    </DropdownMenu.Item>

                    <DropdownMenu.Separator className="my-1 h-px bg-gray-200 dark:bg-muted" />

                    <DropdownMenu.Item
                      onClick={handleLogout}
                      className="p-0 m-0"
                      asChild
                    >
                      <motion.button
                        className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer rounded-md transition-colors w-full text-left"
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.1 }}
                      >
                        <LogOut size={16} /> Log Out
                      </motion.button>
                    </DropdownMenu.Item>
                  </div>
                </motion.div>
              </DropdownMenu.Content>
            </AnimatePresence>
          </DropdownMenu.Root>
          </div>
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
