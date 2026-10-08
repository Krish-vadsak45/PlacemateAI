'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronDown,
  Eye,
  Pencil,
  User,
  Users,
  ArrowLeft,
} from 'lucide-react';

interface SharedDashboard {
  _id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerImage?: string;
  permission: 'viewer' | 'editor';
  status: string;
}

export default function DashboardSwitcher() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [sharedDashboards, setSharedDashboards] = useState<SharedDashboard[]>([]);

  const currentOwnerId = searchParams.get('ownerId');
  const isViewingShared = !!currentOwnerId;

  // Find current shared dashboard info
  const currentShared = sharedDashboards.find(d => d.ownerId === currentOwnerId);

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const res = await fetch('/api/sharing');
        const data = await res.json();
        if (data.success) {
          // Only accepted invitations
          setSharedDashboards(
            (data.sharedWithMe || []).filter((s: SharedDashboard) => s.status === 'accepted')
          );
        }
      } catch (error) {
        console.error('Error fetching shared dashboards:', error);
      }
    };

    if (session?.user) {
      fetchShared();
    }
  }, [session]);

  const switchDashboard = (ownerId?: string) => {
    setIsOpen(false);
    if (ownerId) {
      router.push(`/dashboard?ownerId=${ownerId}`);
    } else {
      router.push('/dashboard');
    }
  };

  // Don't render if no shared dashboards and not viewing shared
  if (sharedDashboards.length === 0 && !isViewingShared) return null;

  return (
    <div className="relative">
      {/* Shared Dashboard Banner */}
      {isViewingShared && currentShared && (
        <div className="mb-4 flex items-center justify-between gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
              {currentShared.ownerName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-medium">
                Viewing <span className="text-primary">{currentShared.ownerName}&apos;s</span> Dashboard
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {currentShared.permission === 'editor' ? (
                  <>
                    <Pencil className="h-2.5 w-2.5 text-primary" />
                    <span>You have <strong>edit</strong> access</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-2.5 w-2.5" />
                    <span>You have <strong>view-only</strong> access</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => switchDashboard()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-background border border-border hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            My Dashboard
          </button>
        </div>
      )}

      {/* Dashboard Selector Dropdown */}
      <div className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-card border border-border hover:bg-muted/50 transition-colors"
        >
          {isViewingShared ? (
            <Users className="h-3.5 w-3.5 text-primary" />
          ) : (
            <User className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          <span className="max-w-[120px] truncate">
            {isViewingShared
              ? `${currentShared?.ownerName || 'Shared'}`
              : 'My Dashboard'}
          </span>
          <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            {/* Dropdown */}
            <div className="absolute left-0 top-full mt-1 z-50 w-64 rounded-xl border border-border bg-card shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* My Dashboard */}
              <button
                onClick={() => switchDashboard()}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors ${
                  !isViewingShared ? 'bg-muted/30' : ''
                }`}
              >
                <div className="h-7 w-7 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center text-xs font-semibold">
                  {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">My Dashboard</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {session?.user?.email}
                  </p>
                </div>
                {!isViewingShared && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-primary shrink-0" />
                )}
              </button>

              {sharedDashboards.length > 0 && (
                <>
                  <div className="h-px bg-border" />
                  <div className="px-3 py-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Shared with you
                    </p>
                  </div>

                  {sharedDashboards.map(dashboard => (
                    <button
                      key={dashboard._id}
                      onClick={() => switchDashboard(dashboard.ownerId)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors ${
                        currentOwnerId === dashboard.ownerId ? 'bg-muted/30' : ''
                      }`}
                    >
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                        {dashboard.ownerName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{dashboard.ownerName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {dashboard.ownerEmail}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          dashboard.permission === 'editor'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {dashboard.permission === 'editor' ? (
                          <Pencil className="h-2 w-2" />
                        ) : (
                          <Eye className="h-2 w-2" />
                        )}
                        {dashboard.permission}
                      </span>
                      {currentOwnerId === dashboard.ownerId && (
                        <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
