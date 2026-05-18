'use client';

import { ReactNode } from 'react';
import { GlobalSearchModal } from './global-search-modal';
import { useGlobalSearch } from './use-global-search';

/**
 * Search provider component
 * Wraps the application and provides global search functionality
 */
export function SearchProvider({ children }: { children: ReactNode }) {
  const { isOpen, setIsOpen, openSearch, closeSearch } = useGlobalSearch();

  return (
    <>
      {children}
      <GlobalSearchModal isOpen={isOpen} onOpenChange={setIsOpen} />
      {/* Store search functions in window for easy access from topbars */}
      {typeof window !== 'undefined' &&
        (() => {
          (window as any).__searchContext = {
            openSearch,
            closeSearch,
          };
        })()}
    </>
  );
}

/**
 * Hook to access search functions
 */
export function useSearch() {
  if (typeof window === 'undefined') {
    return {
      openSearch: () => {},
      closeSearch: () => {},
    };
  }

  const context = (window as any).__searchContext || {
    openSearch: () => {},
    closeSearch: () => {},
  };

  return {
    openSearch: context.openSearch,
    closeSearch: context.closeSearch,
  };
}
