'use client';

import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  onClick?: () => void;
  className?: string;
}

/**
 * Search input button for topbar
 * Triggers global search modal on click
 * Shows keyboard shortcut hint
 */
export function SearchInput({ onClick, className }: SearchInputProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className={cn(
        'relative w-full max-w-md justify-start text-sm text-muted-foreground hover:text-foreground',
        className
      )}
    >
      <Search className="mr-2 h-4 w-4" />
      <span className="hidden lg:inline-flex">Search applications...</span>
      <span className="inline-flex lg:hidden">Search...</span>
      <kbd className="pointer-events-none absolute right-1.5 hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
}
