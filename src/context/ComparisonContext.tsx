"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CompareItem {
  id: string;
  companyName: string;
  jobRole: string;
  package?: string;
}

interface ComparisonContextType {
  selectedItems: CompareItem[];
  addItem: (item: CompareItem) => boolean;
  removeItem: (id: string) => void;
  toggleItem: (item: CompareItem) => void;
  isSelected: (id: string) => boolean;
  clearAll: () => void;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

const STORAGE_KEY = 'placemate_comparison_items';

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [selectedItems, setSelectedItems] = useState<CompareItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSelectedItems(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to parse comparison storage:', e);
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedItems));
      } catch (e) {
        console.error('Failed to write comparison storage:', e);
      }
    }
  }, [selectedItems, isInitialized]);

  const isSelected = (id: string) => {
    return selectedItems.some((item) => item.id === id);
  };

  const addItem = (item: CompareItem): boolean => {
    if (isSelected(item.id)) return true;
    if (selectedItems.length >= 3) {
      return false; // Max 3 items
    }
    setSelectedItems((prev) => [...prev, item]);
    return true;
  };

  const removeItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleItem = (item: CompareItem) => {
    if (isSelected(item.id)) {
      removeItem(item.id);
    } else {
      addItem(item);
    }
  };

  const clearAll = () => {
    setSelectedItems([]);
  };

  return (
    <ComparisonContext.Provider
      value={{
        selectedItems,
        addItem,
        removeItem,
        toggleItem,
        isSelected,
        clearAll,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
}
