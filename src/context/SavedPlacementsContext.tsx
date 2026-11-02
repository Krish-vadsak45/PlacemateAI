"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

interface SavedPlacementsContextType {
  savedIds: Set<string>;
  savedCount: number;
  isSaved: (id: string) => boolean;
  toggleSave: (id: string) => Promise<boolean>;
  loading: boolean;
  refreshSaved: () => Promise<void>;
}

const SavedPlacementsContext = createContext<SavedPlacementsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'placemate_saved_placement_ids';

export function SavedPlacementsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [savedIdsArray, setSavedIdsArray] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize from local storage for instantaneous render
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedIdsArray(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved placements from localStorage', e);
    }
  }, []);

  // Fetch persisted saved placements from server
  const refreshSaved = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/placements/saved');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.savedPlacementIds)) {
          setSavedIdsArray(data.savedPlacementIds);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.savedPlacementIds));
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch saved placements from server:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync from server on mount and whenever session changes
  useEffect(() => {
    refreshSaved();
  }, [refreshSaved, session]);

  const savedIds = useMemo(() => new Set(savedIdsArray), [savedIdsArray]);
  const savedCount = savedIdsArray.length;

  const isSaved = useCallback(
    (id: string) => {
      if (!id) return false;
      return savedIds.has(id);
    },
    [savedIds]
  );

  const toggleSave = useCallback(
    async (id: string): Promise<boolean> => {
      if (!id) return false;

      const wasSaved = savedIds.has(id);
      const nextSaved = !wasSaved;

      // Optimistic client-side update
      const updatedList = wasSaved
        ? savedIdsArray.filter((item) => item !== id)
        : [...savedIdsArray, id];

      setSavedIdsArray(updatedList);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedList));
      } catch (e) {
        console.warn('Failed to save to localStorage', e);
      }

      if (nextSaved) {
        toast.success('Saved to your favorites', {
          description: 'Saved to your permanent profile and filter tab.',
        });
      } else {
        toast.info('Removed from saved placements');
      }

      // Sync with MongoDB backend
      try {
        const res = await fetch('/api/placements/saved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ placementId: id }),
        });

        if (res.status === 401) {
          toast.warning('Please sign in to save placements permanently to your MongoDB account.');
          return nextSaved;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Server error saving placement');
        }

        const resData = await res.json();
        console.log('[SavedPlacements] Backend response:', resData);
      } catch (err) {
        console.error('Failed to sync saved placement to server:', err);
        // Rollback state on failure
        setSavedIdsArray(savedIdsArray);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedIdsArray));
        } catch (e) {
          // ignore
        }
        toast.error('Failed to update permanent database. Reverted change.');
        return wasSaved;
      }

      return nextSaved;
    },
    [savedIds, savedIdsArray]
  );

  return (
    <SavedPlacementsContext.Provider
      value={{
        savedIds,
        savedCount,
        isSaved,
        toggleSave,
        loading,
        refreshSaved,
      }}
    >
      {children}
    </SavedPlacementsContext.Provider>
  );
}

export function useSavedPlacements() {
  const context = useContext(SavedPlacementsContext);
  if (!context) {
    throw new Error('useSavedPlacements must be used within a SavedPlacementsProvider');
  }
  return context;
}
