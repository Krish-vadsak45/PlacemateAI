"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  Clock,
  Briefcase,
  Sparkles,
  CheckCircle2,
  Users,
  CheckCheck,
  Trash2,
  ExternalLink,
  ChevronRight,
  Inbox,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, NotificationItem, NotificationType } from "@/context/NotificationContext";

export default function NotificationBell() {
  const router = useRouter();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAllNotifications } =
    useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const recentNotifications = notifications.slice(0, 5);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "DEADLINE_URGENT":
        return (
          <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
            <Clock className="h-4 w-4" />
          </div>
        );
      case "HIGH_MATCH":
        return (
          <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
        );
      case "NEW_DRIVE":
        return (
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
            <Briefcase className="h-4 w-4" />
          </div>
        );
      case "STATUS_CHANGE":
        return (
          <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        );
      case "SHARED_ACCESS":
        return (
          <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
            <Users className="h-4 w-4" />
          </div>
        );
      default:
        return (
          <div className="h-8 w-8 rounded-lg bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 flex items-center justify-center shrink-0 border border-zinc-500/20">
            <Bell className="h-4 w-4" />
          </div>
        );
    }
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const handleItemClick = (notification: NotificationItem) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    setIsOpen(false);
    if (notification.link) {
      router.push(notification.link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen((prev) => !prev)}
        className="h-8 w-8 p-0 rounded-xl relative hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
        title="In-App Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-600 text-white text-[9px] font-extrabold shadow-sm animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl p-0 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
          {/* Header */}
          <div className="p-3.5 border-b border-border/60 flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-500/20">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground rounded-lg gap-1 font-medium cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3 w-3" />
                  <span>Mark all read</span>
                </Button>
              )}
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-border/40">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-2">
                <div className="h-10 w-10 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
                  <Inbox className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-foreground">No notifications yet</p>
                <p className="text-[11px] text-muted-foreground max-w-[200px] mx-auto leading-relaxed">
                  You will receive real-time alerts when new drives arrive or deadlines approach.
                </p>
              </div>
            ) : (
              recentNotifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleItemClick(n)}
                  className={`p-3 transition-colors flex items-start gap-3 cursor-pointer group ${
                    n.read
                      ? "hover:bg-muted/40 opacity-80"
                      : "bg-primary/5 hover:bg-primary/10 border-l-2 border-primary"
                  }`}
                >
                  {getNotificationIcon(n.type)}

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs truncate ${
                          n.read ? "font-medium text-foreground" : "font-bold text-foreground"
                        }`}
                      >
                        {n.title}
                      </h4>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatTimestamp(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>

                  {!n.read && (
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-border/60 bg-muted/20 flex items-center justify-between text-xs">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-primary hover:underline font-semibold text-[11px] flex items-center gap-1 px-2 py-1"
            >
              <span>View full notification hub</span>
              <ChevronRight className="h-3 w-3" />
            </Link>

            {notifications.some((n) => n.read) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => clearAllNotifications(true)}
                className="h-6 px-2 text-[10px] text-muted-foreground hover:text-rose-600 rounded-lg font-medium cursor-pointer"
              >
                Clear read
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

