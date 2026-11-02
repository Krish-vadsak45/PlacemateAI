"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bookmark, Trash2, ExternalLink, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SavedComparisonsModalProps {
  currentPlacementIds: string[];
  onLoadComparison: (ids: string[]) => void;
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
}

interface SavedItem {
  _id: string;
  title: string;
  placementIds: Array<{
    _id: string;
    companyName: string;
    jobRole: string;
    package?: string;
  }>;
  createdAt: string;
}

export default function SavedComparisonsModal({
  currentPlacementIds,
  onLoadComparison,
  isOpen,
  open,
  onClose,
  onOpenChange,
}: SavedComparisonsModalProps) {
  const isModalOpen = open ?? isOpen ?? false;
  const handleClose = () => {
    onClose?.();
    onOpenChange?.(false);
  };

  const [savedList, setSavedList] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      fetchSavedComparisons();
    }
  }, [isModalOpen]);

  const fetchSavedComparisons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/placements/compare/saved');
      const data = await res.json();
      if (res.ok) {
        setSavedList(data.savedComparisons || []);
      }
    } catch (e) {
      console.error('Error fetching saved comparisons:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a name for this comparison set');
      return;
    }
    if (currentPlacementIds.length < 2) {
      toast.error('Need at least 2 placements to save a comparison set');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/placements/compare/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          placementIds: currentPlacementIds,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      toast.success('Comparison set saved!');
      setTitle('');
      setShowSaveForm(false);
      fetchSavedComparisons();
    } catch (err: any) {
      toast.error(err.message || 'Error saving comparison set');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/placements/compare/saved?id=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Comparison deleted');
        setSavedList((prev) => prev.filter((item) => item._id !== id));
      }
    } catch (e) {
      toast.error('Failed to delete comparison');
    }
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(openVal) => { if (!openVal) handleClose(); }}>
      <DialogContent className="max-w-lg bg-card/95 backdrop-blur-xl p-6 border border-border shadow-2xl rounded-2xl">
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            <DialogTitle className="font-bold text-base text-foreground font-heading">
              Saved Placement Sets
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Manage and reload your saved placement comparison views
          </DialogDescription>
        </DialogHeader>

        {/* Save Current Section */}
        {currentPlacementIds.length >= 2 && (
          <div className="my-2 p-3.5 rounded-xl border border-primary/20 bg-primary/5">
            {!showSaveForm ? (
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  Save active view ({currentPlacementIds.length} items)
                </span>
                <Button
                  size="sm"
                  onClick={() => setShowSaveForm(true)}
                  className="bg-primary text-primary-foreground text-xs rounded-xl"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Save Set
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSaveCurrent} className="space-y-3">
                <input
                  type="text"
                  placeholder="e.g. Top Tech Offers 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSaveForm(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    size="sm"
                    className="bg-primary text-primary-foreground text-xs rounded-lg"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Confirm Save'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Saved List */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1 my-2 custom-scrollbar">
          {loading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Loading saved comparisons...
            </div>
          ) : savedList.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No saved comparison sets yet.
            </div>
          ) : (
            savedList.map((item) => {
              const ids = item.placementIds.map((p) => p._id);
              return (
                <div
                  key={item._id}
                  onClick={() => {
                    onLoadComparison(ids);
                    handleClose();
                  }}
                  className="p-3 rounded-xl border border-border hover:border-primary/50 bg-muted/20 hover:bg-muted/50 transition-all cursor-pointer flex items-center justify-between group"
                >
                  <div>
                    <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {item.placementIds.map((p) => p.companyName).join(' vs ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(item._id, e)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
