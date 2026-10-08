"use client";

import React from 'react';
import { useComparison } from '@/context/ComparisonContext';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Scale, X, ArrowRight, Trash2, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CompareFloatingBar() {
  const { selectedItems, removeItem, clearAll } = useComparison();
  const router = useRouter();
  const pathname = usePathname();

  // Don't display floating bar if on compare page itself or if no items selected
  if (pathname === '/placements/compare' || selectedItems.length === 0) {
    return null;
  }

  const handleCompareClick = () => {
    const idsParam = selectedItems.map((item) => item.id).join(',');
    router.push(`/placements/compare?ids=${idsParam}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-2xl"
      >
        <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-primary/20 shadow-2xl bg-background/95 backdrop-blur-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Scale className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Compare Placements
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                  {selectedItems.length}/3
                </span>
              </div>

              {/* Selected Pills */}
              <div className="flex items-center gap-2 pt-1 overflow-x-auto scrollbar-none">
                {selectedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted text-xs font-medium text-foreground shrink-0 border border-border"
                  >
                    <span className="truncate max-w-[100px]">{item.companyName}</span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      title="Remove"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {selectedItems.length < 3 && (
                  <span className="text-xs text-muted-foreground italic shrink-0 hidden sm:inline">
                    Select up to {3 - selectedItems.length} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-muted-foreground hover:text-foreground text-xs px-2.5"
            >
              <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Clear</span>
            </Button>

            <Button
              onClick={handleCompareClick}
              disabled={selectedItems.length < 2}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-4 rounded-xl shadow-lg shadow-primary/20"
            >
              <span>Compare</span>
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
