'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Share2,
  UserPlus,
  Mail,
  Eye,
  Pencil,
  X,
  Check,
  Clock,
  Shield,
  Users,
  Loader2,
} from 'lucide-react';

interface SharedItem {
  _id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerImage?: string;
  sharedWithEmail: string;
  sharedWithName?: string;
  sharedWithImage?: string;
  permission: 'viewer' | 'editor';
  status: 'pending' | 'accepted' | 'revoked';
  createdAt: string;
  acceptedAt?: string;
}

export default function SharingManager() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'viewer' | 'editor'>('viewer');
  const [isInviting, setIsInviting] = useState(false);
  const [sharedByMe, setSharedByMe] = useState<SharedItem[]>([]);
  const [sharedWithMe, setSharedWithMe] = useState<SharedItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent');

  const fetchSharing = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/sharing');
      const data = await res.json();
      if (data.success) {
        setSharedByMe(data.sharedByMe || []);
        setSharedWithMe(data.sharedWithMe || []);
      }
    } catch (error) {
      console.error('Error fetching sharing:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && session?.user) {
      fetchSharing();
    }
  }, [isOpen, session, fetchSharing]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setIsInviting(true);
      const res = await fetch('/api/sharing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), permission }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Invitation sent!');
        setEmail('');
        fetchSharing();
      } else {
        toast.error(data.error || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Error inviting:', error);
      toast.error('Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleAction = async (id: string, action: 'accept' | 'reject', label: string) => {
    try {
      const res = await fetch(`/api/sharing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || `${label} successful`);
        fetchSharing();
      } else {
        toast.error(data.error || `Failed to ${label.toLowerCase()}`);
      }
    } catch (error) {
      console.error(`Error ${label.toLowerCase()}:`, error);
      toast.error(`Failed to ${label.toLowerCase()}`);
    }
  };

  const handleUpdatePermission = async (id: string, newPermission: 'viewer' | 'editor') => {
    try {
      const res = await fetch(`/api/sharing/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', permission: newPermission }),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Permission updated');
        fetchSharing();
      } else {
        toast.error(data.error || 'Failed to update permission');
      }
    } catch (error) {
      console.error('Error updating permission:', error);
      toast.error('Failed to update permission');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/sharing/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || 'Removed');
        fetchSharing();
      } else {
        toast.error(data.error || 'Failed to remove');
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error('Failed to remove');
    }
  };

  const pendingInvites = sharedWithMe.filter(s => s.status === 'pending');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-xs h-9 rounded-xl border-border bg-card relative"
          />
        }
      >
        <Share2 className="h-3.5 w-3.5 text-primary" />
        Share Dashboard
        {pendingInvites.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center animate-pulse">
            {pendingInvites.length}
          </span>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" />
            Dashboard Sharing
          </DialogTitle>
        </DialogHeader>

        {/* Invite Form */}
        <form onSubmit={handleInvite} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Friend's email address..."
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-9 h-10 rounded-xl text-sm"
                required
              />
            </div>
            <select
              value={permission}
              onChange={e => setPermission(e.target.value as 'viewer' | 'editor')}
              className="h-10 rounded-xl border border-border bg-card px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="viewer">👁️ Viewer</option>
              <option value="editor">✏️ Editor</option>
            </select>
            <Button
              type="submit"
              size="sm"
              disabled={isInviting || !email.trim()}
              className="h-10 gap-1.5 rounded-xl px-4"
            >
              {isInviting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserPlus className="h-3.5 w-3.5" />
              )}
              Invite
            </Button>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>
              <strong>Viewer</strong> = read-only &nbsp;|&nbsp; <strong>Editor</strong> = can edit
              placements, events &amp; notes
            </span>
          </div>
        </form>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-xl mt-2">
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'sent'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Shared by Me ({sharedByMe.length})
          </button>
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all relative ${
              activeTab === 'received'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Shared with Me ({sharedWithMe.length})
            {pendingInvites.length > 0 && (
              <span className="ml-1 inline-flex h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground items-center justify-center">
                {pendingInvites.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : activeTab === 'sent' ? (
          <div className="space-y-2">
            {sharedByMe.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Share2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>You haven&apos;t shared your dashboard with anyone yet.</p>
                <p className="text-xs mt-1">Invite a classmate above to get started!</p>
              </div>
            ) : (
              sharedByMe.map(item => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                      {item.sharedWithName?.charAt(0).toUpperCase() ||
                        item.sharedWithEmail.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.sharedWithName || item.sharedWithEmail}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="truncate">{item.sharedWithEmail}</span>
                        <span>•</span>
                        {item.status === 'pending' ? (
                          <span className="flex items-center gap-0.5 text-amber-500">
                            <Clock className="h-2.5 w-2.5" />
                            Pending
                          </span>
                        ) : (
                          <span className="flex items-center gap-0.5 text-emerald-500">
                            <Check className="h-2.5 w-2.5" />
                            Accepted
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {/* Permission toggle */}
                    <button
                      onClick={() =>
                        handleUpdatePermission(
                          item._id,
                          item.permission === 'viewer' ? 'editor' : 'viewer'
                        )
                      }
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                        item.permission === 'editor'
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-border bg-muted/50 text-muted-foreground'
                      }`}
                      title={`Click to change to ${item.permission === 'viewer' ? 'editor' : 'viewer'}`}
                    >
                      {item.permission === 'editor' ? (
                        <Pencil className="h-2.5 w-2.5" />
                      ) : (
                        <Eye className="h-2.5 w-2.5" />
                      )}
                      {item.permission}
                    </button>
                    {/* Revoke */}
                    <button
                      onClick={() => handleAction(item._id, 'reject', 'Revoke')}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Revoke access"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {sharedWithMe.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>No one has shared their dashboard with you yet.</p>
              </div>
            ) : (
              sharedWithMe.map(item => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold shrink-0">
                      {item.ownerName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.ownerName}</p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="truncate">{item.ownerEmail}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          {item.permission === 'editor' ? (
                            <Pencil className="h-2.5 w-2.5" />
                          ) : (
                            <Eye className="h-2.5 w-2.5" />
                          )}
                          {item.permission}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {item.status === 'pending' ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAction(item._id, 'accept', 'Accept')}
                          className="h-7 text-[11px] rounded-lg px-3 gap-1"
                        >
                          <Check className="h-3 w-3" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAction(item._id, 'reject', 'Decline')}
                          className="h-7 text-[11px] rounded-lg px-2 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <a
                          href={`/dashboard?ownerId=${item.ownerId}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                        >
                          View Dashboard
                        </a>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Remove access"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
