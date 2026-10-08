"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bookmark, Trash2, ExternalLink, Plus, Check, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

interface SavedComparisonsModalProps {
  currentPlacementIds: string[];
  onLoadComparison: (ids: string[]) => void;
  isOpen: boolean;
  onClose: () => void;
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
  onClose,
}: SavedComparisonsModalProps) {
  const [savedList, setSavedList] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSavedComparisons();
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <div className="glass-panel w-full max-w-lg p-6 rounded-2xl border border-border shadow-2xl bg-card">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-base text-foreground">Saved Placement Sets</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Save Current Section */}
        {currentPlacementIds.length >= 2 && (
          <div className="my-4 p-3.5 rounded-xl border border-primary/20 bg-primary/5">
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
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1 my-4">
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
                    onClose();
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
      </div>
    </div>
  );
}
