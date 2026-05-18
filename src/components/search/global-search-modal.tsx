'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Command } from 'cmdk';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@/components/ui/visually-hidden';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchResultItem } from './search-result-item';
import { SearchApplicationCard } from './search-application-card';
import { useGlobalSearch } from './use-global-search';
import { Loader2, Search, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Global application search modal
 * Accessible via Ctrl+K keyboard shortcut
 * Features:
 * - Real-time full-text search
 * - Inline accordion expansion for rounds
 * - Add/edit rounds without leaving modal
 * - Recent applications and upcoming interviews
 */
export function GlobalSearchModal({
  isOpen,
  onOpenChange,
}: SearchModalProps) {
  const { query, setQuery, handleSearch, results, isLoading, error, recentItems } =
    useGlobalSearch();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, (results.length || recentItems.length) - 1)
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const items = query ? results : recentItems;
        if (items.length > 0) {
          const item = items[selectedIndex];
          setExpandedAppId(item.id === expandedAppId ? null : item.id);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (expandedAppId) {
          setExpandedAppId(null);
        } else {
          onOpenChange(false);
        }
      }
    },
    [results, recentItems, query, selectedIndex, expandedAppId, onOpenChange]
  );

  // Display items
  const displayItems = query ? results : recentItems;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 p-0 shadow-lg max-h-[85vh] flex flex-col">
        <VisuallyHidden asChild>
          <DialogTitle>Application Search</DialogTitle>
        </VisuallyHidden>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b px-4 py-3 flex-shrink-0">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <span>Search applications • Ctrl+K to toggle • Esc to close</span>
            </div>
          </div>

          {/* Input */}
          <div className="border-b px-4 py-3 flex-shrink-0">
            <Input
              placeholder="Search by candidate, company, job title, skills... (Esc to close)"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="border-0 bg-transparent text-base focus:ring-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Results or Recent - Scrollable */}
          <ScrollArea
            ref={scrollRef}
            className="flex-1 overflow-hidden"
          >
            <div className="px-4 py-3 space-y-3">
              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* No Results */}
              {!isLoading &&
                !error &&
                query &&
                displayItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Search className="mb-2 h-8 w-8 opacity-30" />
                    <p className="font-medium">No applications found</p>
                    <p className="text-sm">Try searching by candidate name, company, or job title</p>
                  </div>
                )}

              {/* Recent Items Header */}
              {!query && displayItems.length > 0 && (
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground/70 px-1">
                  <Clock className="h-3 w-3" />
                  Recent Applications & Interviews
                </div>
              )}

              {/* Results List - Click to expand full card */}
              {displayItems.length > 0 && !expandedAppId && (
                <div className="space-y-2">
                  {displayItems.map((item, idx) => (
                    <SearchResultItem
                      key={item.id}
                      id={item.id}
                      candidateName={item.candidateName || item.title || ''}
                      company={item.company || ''}
                      jobTitle={item.jobTitle || item.subtitle?.split('•')[1]?.trim() || ''}
                      status={item.status || 'APPLIED'}
                      workMode={item.workMode}
                      roundCount={item.roundCount || 0}
                      nextRound={item.nextRound}
                      isSelected={idx === selectedIndex}
                      onClick={() => setExpandedAppId(item.id)}
                      highlightQuery={query}
                    />
                  ))}
                </div>
              )}

              {/* Expanded Application Card - Full editor mode */}
              {expandedAppId && (() => {
                const expanded = displayItems.find(item => item.id === expandedAppId);
                if (!expanded) return null;
                
                // Create a minimal Application object for the card
                const app = {
                  id: expanded.id,
                  jobTitle: expanded.jobTitle || '',
                  company: expanded.company || '',
                  jobUrl: '',
                  source: '',
                  techTags: [],
                  appliedDate: new Date(expanded.appliedDate),
                  status: expanded.status as any,
                  candidateId: expanded.candidateId,
                  tags: [],
                  rounds: [],
                  workMode: expanded.workMode as any || 'Remote',
                } as any;

                return (
                  <div className="space-y-3 pb-4">
                    <button
                      onClick={() => setExpandedAppId(null)}
                      className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      ← Back to search results
                    </button>
                    <SearchApplicationCard
                      application={app}
                      candidateName={expanded.candidateName}
                      candidateEmail={expanded.candidateEmail}
                      isOpen={true}
                      onOpenChange={(open) => {
                        if (!open) setExpandedAppId(null);
                      }}
                      highlightQuery={query}
                    />
                  </div>
                );
              })()}

              {/* Empty State for Recent */}
              {!query &&
                !isLoading &&
                displayItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Search className="mb-2 h-8 w-8 opacity-30" />
                    <p className="font-medium">Start typing to search</p>
                    <p className="text-sm">
                      Or view recent applications and upcoming interviews
                    </p>
                  </div>
                )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground flex items-center justify-between flex-shrink-0">
            <div className="flex gap-2">
              <Badge variant="outline" className="text-xs">
                ↑↓ Navigate
              </Badge>
              <Badge variant="outline" className="text-xs">
                Enter Select
              </Badge>
              <Badge variant="outline" className="text-xs">
                Esc {expandedAppId ? 'Back' : 'Close'}
              </Badge>
            </div>
            <span>{displayItems.length} results</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
