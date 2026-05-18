'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

export interface RecentItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'search' | 'application' | 'interview';
}

/**
 * Hook to manage global search modal state and keyboard shortcuts
 */
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const router = useRouter();

  // Load recent items on mount
  useEffect(() => {
    loadRecentItems();
  }, []);

  // Load recent applications and searches from localStorage
  const loadRecentItems = useCallback(async () => {
    try {
      // Fetch recent data from API
      const response = await fetch('/api/search/applications', {
        credentials: 'include',
      });
      if (!response.ok) return;

      const data = await response.json();
      if (!data.success) return;

      const items: RecentItem[] = [];

      // Add recent applications
      if (data.data?.recentApplications) {
        data.data.recentApplications.slice(0, 4).forEach((app: any) => {
          items.push({
            id: app.id,
            title: `${app.candidate.fullName}`,
            subtitle: `${app.company} • ${app.jobTitle}`,
            type: 'application',
          });
        });
      }

      // Add upcoming interviews
      if (data.data?.upcomingInterviews) {
        data.data.upcomingInterviews.slice(0, 3).forEach((app: any) => {
          const roundTime = app.rounds[0]
            ? new Date(app.rounds[0].date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            : '';
          items.push({
            id: app.id,
            title: `Interview: ${app.candidate.fullName}`,
            subtitle: `${app.company} • ${roundTime}`,
            type: 'interview',
          });
        });
      }

      setRecentItems(items);
    } catch (err) {
      console.error('[useGlobalSearch] Error loading recent items:', err);
    }
  }, []);

  // Handle Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Debounced search handler
  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    setError(null);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!q.trim()) {
      console.log('[useGlobalSearch] ℹ️ Empty query, clearing results');
      setResults([]);
      return;
    }

    setIsLoading(true);
    console.log('[useGlobalSearch] 🔍 Starting debounced search for:', q);

    // Debounce the search request
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('[useGlobalSearch] ⏱️ Debounce complete. Sending API request');
        console.log('[useGlobalSearch] Query:', q);

        const requestBody = {
          q: q.trim(),
          limit: 15,
          offset: 0,
        };
        console.log('[useGlobalSearch] Request body:', requestBody);

        const response = await fetch('/api/search/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(requestBody),
        });

        console.log('[useGlobalSearch] ✅ Response received:', {
          status: response.status,
          ok: response.ok,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[useGlobalSearch] ❌ API error:', errorData);
          throw new Error(
            errorData.error || `Search failed (${response.status})`
          );
        }

        const data = await response.json();
        console.log('[useGlobalSearch] 📊 Response data:', data);
        console.log('[useGlobalSearch] Results count:', data.data?.length);

        if (data.data && data.data.length > 0) {
          console.log('[useGlobalSearch] ✅ First result:', {
            id: data.data[0].id,
            company: data.data[0].company,
            candidateName: data.data[0].candidateName,
          });
        }

        setResults(data.data || []);
        setError(null);
      } catch (err) {
        console.error('[useGlobalSearch] ❌ Search error:', err);
        setError(
          err instanceof Error ? err.message : 'Search failed. Please try again.'
        );
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 200); // 200ms debounce
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  }, []);

  const openSearch = useCallback(() => {
    setIsOpen(true);
  }, []);

  return {
    isOpen,
    setIsOpen,
    openSearch,
    closeSearch,
    query,
    setQuery,
    handleSearch,
    results,
    isLoading,
    error,
    recentItems,
  };
}
