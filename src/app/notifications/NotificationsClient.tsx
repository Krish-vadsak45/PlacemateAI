"use client";

import React, { useState, useMemo } from "react";
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
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  Mail,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotifications, NotificationItem, NotificationType } from "@/context/NotificationContext";

export default function NotificationsClient() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    refreshNotifications,
  } = useNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshNotifications();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Compute category counts
  const stats = useMemo(() => {
    const unread = unreadCount;
    let urgent = 0;
    let drives = 0;
    let matches = 0;

    notifications.forEach((n) => {
      if (n.type === "DEADLINE_URGENT") urgent++;
      if (n.type === "NEW_DRIVE") drives++;
      if (n.type === "HIGH_MATCH") matches++;
    });

    return {
      unread,
      urgent,
      drives,
      matches,
      total: notifications.length,
    };
  }, [notifications, unreadCount]);

  // Filtered list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchesSearch =
        !searchQuery.trim() ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesCategory = true;
      if (selectedFilter === "UNREAD") {
        matchesCategory = !n.read;
      } else if (selectedFilter === "DEADLINE_URGENT") {
        matchesCategory = n.type === "DEADLINE_URGENT";
      } else if (selectedFilter === "NEW_DRIVE") {
        matchesCategory = n.type === "NEW_DRIVE";
      } else if (selectedFilter === "HIGH_MATCH") {
        matchesCategory = n.type === "HIGH_MATCH";
      } else if (selectedFilter === "STATUS_CHANGE") {
        matchesCategory = n.type === "STATUS_CHANGE";
      }

      return matchesSearch && matchesCategory;
    });
  }, [notifications, searchQuery, selectedFilter]);

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "DEADLINE_URGENT":
        return (
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20 shadow-xs">
            <Clock className="h-5 w-5" />
          </div>
        );
      case "HIGH_MATCH":
        return (
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 shadow-xs">
            <Sparkles className="h-5 w-5" />
          </div>
        );
      case "NEW_DRIVE":
        return (
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20 shadow-xs">
            <Briefcase className="h-5 w-5" />
          </div>
        );
      case "STATUS_CHANGE":
        return (
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20 shadow-xs">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        );
      case "SHARED_ACCESS":
        return (
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20 shadow-xs">
            <Users className="h-5 w-5" />
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-xl bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 flex items-center justify-center shrink-0 border border-zinc-500/20 shadow-xs">
            <Bell className="h-5 w-5" />
          </div>
        );
    }
  };

  const getTypeLabel = (type: NotificationType) => {
    switch (type) {
      case "DEADLINE_URGENT":
        return { label: "Urgent Deadline", badgeClass: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" };
      case "HIGH_MATCH":
        return { label: "Top Match", badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" };
      case "NEW_DRIVE":
        return { label: "New Drive", badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
      case "STATUS_CHANGE":
        return { label: "Status Update", badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
      case "SHARED_ACCESS":
        return { label: "Shared Access", badgeClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" };
      default:
        return { label: "System", badgeClass: "bg-muted text-muted-foreground border-border" };
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
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shadow-xs">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-heading">
                  Notification Center
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-bold shadow-xs">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Centralized real-time hub for upcoming deadlines, new company drives, and progress updates.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-9 gap-1.5 text-xs font-medium rounded-xl border-border cursor-pointer hover:bg-muted"
            title="Refresh notifications"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              size="sm"
              className="h-9 gap-1.5 text-xs font-semibold rounded-xl bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-sm cursor-pointer hover:opacity-90"
            >
              <CheckCheck className="h-4 w-4" />
              <span>Mark All as Read</span>
            </Button>
          )}

          {notifications.some((n) => n.read) && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearAllNotifications(true)}
              className="h-9 gap-1.5 text-xs font-medium rounded-xl border-border hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Read</span>
            </Button>
          )}
        </div>
      </div>

      {/* BENTO STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setSelectedFilter("UNREAD")}
          className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedFilter === "UNREAD" ? "border-primary ring-1 ring-primary" : "border-border shadow-2xs hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Unread Alerts</span>
            <Bell className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">{stats.unread}</div>
          <p className="text-[11px] text-muted-foreground">Action items awaiting review</p>
        </div>

        <div
          onClick={() => setSelectedFilter("DEADLINE_URGENT")}
          className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedFilter === "DEADLINE_URGENT" ? "border-primary ring-1 ring-primary" : "border-border shadow-2xs hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Urgent Deadlines</span>
            <Clock className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">{stats.urgent}</div>
          <p className="text-[11px] text-muted-foreground">Closing within 48 hours</p>
        </div>

        <div
          onClick={() => setSelectedFilter("NEW_DRIVE")}
          className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedFilter === "NEW_DRIVE" ? "border-primary ring-1 ring-primary" : "border-border shadow-2xs hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">New Drives</span>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">{stats.drives}</div>
          <p className="text-[11px] text-muted-foreground">Extracted from placement cell</p>
        </div>

        <div
          onClick={() => setSelectedFilter("ALL")}
          className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedFilter === "ALL" ? "border-primary ring-1 ring-primary" : "border-border shadow-2xs hover:border-border/80"
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total History</span>
            <CheckCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">{stats.total}</div>
          <p className="text-[11px] text-muted-foreground">All tracked notifications</p>
        </div>
      </div>

      {/* SEARCH & CATEGORY FILTER TABS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts by company, role, or message..."
            className="pl-9 h-10 text-xs rounded-xl bg-card border-border shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Alerts" },
            { id: "UNREAD", label: `Unread (${unreadCount})` },
            { id: "DEADLINE_URGENT", label: "Deadlines" },
            { id: "NEW_DRIVE", label: "New Drives" },
            { id: "HIGH_MATCH", label: "Top Matches" },
            { id: "STATUS_CHANGE", label: "Status" },
          ].map((tab) => (
            <Button
              key={tab.id}
              size="sm"
              variant={selectedFilter === tab.id ? "default" : "outline"}
              onClick={() => setSelectedFilter(tab.id)}
              className={`h-8 text-xs px-3 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === tab.id
                  ? "bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* NOTIFICATIONS FEED */}
      {notifications.length === 0 ? (
        /* ZERO NOTIFICATIONS EMPTY STATE */
        <div className="glass-panel rounded-3xl p-12 text-center border border-border space-y-4 max-w-xl mx-auto shadow-sm">
          <div className="h-16 w-16 rounded-3xl bg-primary/10 border border-primary/20 text-primary mx-auto flex items-center justify-center">
            <Inbox className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-foreground">You&apos;re All Caught Up!</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Whenever placement cell emails arrive or application deadlines are closing soon,
              real-time notifications will be archived and highlighted here.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/dashboard">
              <Button className="gap-2 text-xs font-semibold rounded-xl px-5 h-10 shadow-sm cursor-pointer">
                <Briefcase className="h-4 w-4" />
                <span>Explore Placement Drives</span>
              </Button>
            </Link>
          </div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        /* NO MATCHING FILTER RESULTS */
        <div className="glass-panel rounded-2xl p-8 text-center border border-border space-y-3">
          <p className="text-xs text-muted-foreground">
            No notifications match your search query or selected filter.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setSelectedFilter("ALL");
            }}
            className="text-xs rounded-xl"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        /* NOTIFICATIONS LIST */
        <div className="space-y-3">
          {filteredNotifications.map((n) => {
            const typeInfo = getTypeLabel(n.type);

            return (
              <div
                key={n._id}
                className={`glass-panel rounded-2xl p-4 sm:p-5 border transition-all ${
                  n.read
                    ? "border-border/70 bg-card/40 opacity-80 hover:opacity-100"
                    : "border-primary/40 bg-primary/5 shadow-2xs border-l-4 border-l-primary"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left: Icon & Content */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    {getNotificationIcon(n.type)}

                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeInfo.badgeClass}`}
                        >
                          {typeInfo.label}
                        </span>

                        <h3 className={`text-sm ${n.read ? "font-semibold text-foreground" : "font-bold text-foreground"}`}>
                          {n.title}
                        </h3>

                        <span className="text-[11px] text-muted-foreground ml-auto sm:ml-0">
                          {formatTimestamp(n.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-foreground/80 leading-relaxed">
                        {n.message}
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {n.link && (
                      <Link href={n.link} onClick={() => !n.read && markAsRead(n._id)}>
                        <Button
                          size="sm"
                          className="h-8 text-xs font-semibold rounded-xl gap-1.5 bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs cursor-pointer"
                        >
                          <span>View Drive</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(n._id)}
                      disabled={n.read}
                      className="h-8 px-2.5 text-xs rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                      title={n.read ? "Already read" : "Mark as read"}
                    >
                      {n.read ? (
                        <Check className="h-4 w-4 text-muted-foreground/60" />
                      ) : (
                        <CheckCheck className="h-4 w-4 text-primary" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNotification(n._id)}
                      className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-rose-600 cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

