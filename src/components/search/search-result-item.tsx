'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface SearchResultItemProps {
  id: string;
  candidateName: string;
  company: string;
  jobTitle: string;
  status: string;
  workMode?: string;
  roundCount: number;
  nextRound?: {
    roundType: string;
    date: Date;
    time: string;
  };
  isSelected?: boolean;
  onClick?: () => void;
  highlightQuery?: string;
}

/**
 * Search result item component - lightweight preview card
 * Clicking expands the full application accordion
 */
export function SearchResultItem({
  id,
  candidateName,
  company,
  jobTitle,
  status,
  workMode,
  roundCount,
  nextRound,
  isSelected,
  onClick,
  highlightQuery,
}: SearchResultItemProps) {
  // Status styling
  function getStatusIcon() {
    if (
      status === 'PLACED' ||
      status === 'OFFER_EXTENDED' ||
      status === 'Placed'
    ) {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    if (nextRound) {
      return <Clock className="h-4 w-4 text-blue-500" />;
    }
    if (status === 'REJECTED' || status === 'Rejected') {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return null;
  }

  function getStatusBadgeVariant(s: string) {
    if (s === 'PLACED' || s === 'Placed') return 'default' as const;
    if (s === 'INTERVIEW_SCHEDULED' || s === 'Interview Scheduled')
      return 'secondary' as const;
    if (s === 'REJECTED' || s === 'Rejected') return 'destructive' as const;
    if (s === 'APPLIED' || s === 'Applied') return 'outline' as const;
    return 'secondary' as const;
  }

  // Highlight matching search terms
  function highlightText(text: string) {
    if (!highlightQuery) return text;
    const regex = new RegExp(`(${highlightQuery})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, idx) =>
      regex.test(part) ? (
        <mark key={idx} className="bg-yellow-200/50 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  const statusDisplay =
    status
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim() || 'Applied';

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col gap-2 rounded-lg border p-3 cursor-pointer transition-all',
        'hover:bg-accent hover:border-primary/50',
        isSelected && 'bg-accent border-primary ring-1 ring-primary'
      )}
    >
      {/* Header: Candidate name */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {highlightText(candidateName)}
          </p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Company & Job Title */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="truncate">{highlightText(company)}</span>
        <span className="text-muted-foreground/50">•</span>
        <span className="truncate">{highlightText(jobTitle)}</span>
      </div>

      {/* Status & Work Mode */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          {getStatusIcon()}
          <Badge variant={getStatusBadgeVariant(status)} className="text-xs">
            {statusDisplay}
          </Badge>
        </div>
        {workMode && (
          <Badge variant="outline" className="text-xs">
            {workMode}
          </Badge>
        )}
        {roundCount > 0 && (
          <Badge variant="secondary" className="text-xs">
            {roundCount} Round{roundCount !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Next Round Info */}
      {nextRound && (
        <div className="text-xs text-muted-foreground bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded px-2 py-1 border border-blue-200/30 dark:border-blue-800/30">
          <span className="font-medium">Next:</span> {nextRound.roundType} •{' '}
          {formatDistanceToNow(new Date(nextRound.date), { addSuffix: true })}
        </div>
      )}
    </div>
  );
}
