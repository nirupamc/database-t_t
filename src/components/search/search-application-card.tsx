'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createRoundAction } from '@/actions/rounds';
import { RoundCard } from '@/components/rounds/round-card';
import type { Application, RoundStatus, RoundType, InterviewMode, LipsyncQuality } from '@/types';
import { formatDistanceToNow } from 'date-fns';

// ── Round type options ──
const roundTypes: RoundType[] = [
  'Round 1',
  'Round 2',
  'Confirmation Call',
  'HR Screen',
  'Technical Interview',
  'System Design',
  'Behavioral',
  'Live Coding',
  'Final Round',
  'Managerial',
];

const interviewModes: InterviewMode[] = [
  'Phone',
  'Video Call (Google Meet)',
  'Video Call (Zoom)',
  'In-Person',
  'Take-Home Assignment',
];

const lipsyncOptions: LipsyncQuality[] = ['Excellent', 'Good', 'Average', 'Poor'];

/** Map app status → badge variant */
function appStatusVariant(status: string | undefined) {
  if (!status) return 'secondary' as const;
  if (status.includes('Interview') || status === 'In Interview') return 'info' as const;
  if (status === 'Offer Received' || status === 'Offer Stage') return 'success' as const;
  if (status === 'Rejected') return 'destructive' as const;
  if (status === 'Applied' || status === 'HR Screen') return 'warning' as const;
  return 'secondary' as const;
}

interface SearchApplicationCardProps {
  application: Application;
  candidateName?: string;
  candidateEmail?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  highlightQuery?: string;
}

/**
 * Application card optimized for search results
 * Reuses existing application accordion UI but optimized for inline expansion within modal
 */
export function SearchApplicationCard({
  application,
  candidateName = 'Unknown',
  candidateEmail = '',
  isOpen = false,
  onOpenChange,
  highlightQuery,
}: SearchApplicationCardProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [roundForm, setRoundForm] = useState({
    roundType: 'Confirmation Call' as RoundType,
    date: new Date().toISOString().split('T')[0],
    time: '',
    timezone: 'IST',
    duration: '30 mins',
    mode: 'Video Call (Google Meet)' as InterviewMode,
    vcReceiver: '',
    coordinator: '',
    lipsync: 'Excellent' as LipsyncQuality,
    feedback: '',
    roundStatus: 'Pending' as RoundStatus,
  });
  const [showRoundForm, setShowRoundForm] = useState(false);

  const resetForm = () => {
    setRoundForm({
      roundType: 'Confirmation Call',
      date: new Date().toISOString().split('T')[0],
      time: '',
      timezone: 'IST',
      duration: '30 mins',
      mode: 'Video Call (Google Meet)',
      vcReceiver: '',
      coordinator: '',
      lipsync: 'Excellent',
      feedback: '',
      roundStatus: 'Pending',
    });
    setFormErrors({});
  };

  const updateField = <K extends keyof typeof roundForm>(
    key: K,
    value: (typeof roundForm)[K]
  ) => {
    setRoundForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!roundForm.roundType) errors.roundType = 'Round type is required';
    if (!roundForm.date) errors.date = 'Date is required';
    if (!roundForm.time) errors.time = 'Time is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveRound = async () => {
    if (!validateForm()) return;
    try {
      setIsSaving(true);
      const result = await createRoundAction({
        applicationId: application.id,
        roundType: roundForm.roundType,
        date: roundForm.date,
        time: roundForm.time,
        timezone: roundForm.timezone,
        duration: roundForm.duration,
        mode: roundForm.mode,
        vcReceiver: roundForm.vcReceiver || '',
        coordinator: roundForm.coordinator || '',
        lipsync: roundForm.lipsync || '',
        feedback: roundForm.feedback || '',
        roundStatus: roundForm.roundStatus.toUpperCase(),
      });

      if (result?.success) {
        toast.success('Round saved! 🗓️');
        setShowRoundForm(false);
        resetForm();
        router.refresh();
      } else {
        toast.error('Failed to save round.');
      }
    } catch {
      toast.error('Error saving round.');
    } finally {
      setIsSaving(false);
    }
  };

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

  return (
    <Accordion type="single" collapsible value={isOpen ? application.id : ''}>
      <AccordionItem
        value={application.id}
        className="rounded-xl border bg-card px-4 shadow-sm"
      >
        <AccordionTrigger
          className="hover:no-underline py-4"
          onClick={() => onOpenChange?.(!isOpen)}
        >
          <div className="flex flex-1 items-start justify-between pr-4 text-left">
            <div className="flex-1 min-w-0">
              {/* Candidate name */}
              <div className="font-semibold text-base text-foreground">
                {highlightText(candidateName)}
              </div>

              {/* Company & Job Title with work mode */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 flex-wrap">
                <span>{highlightText(application.company)}</span>
                <span>•</span>
                <span>{highlightText(application.jobTitle)}</span>
                {application.workMode && (
                  <>
                    <span>•</span>
                    <span>{application.workMode}</span>
                  </>
                )}
              </div>

              {/* Status and stats */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={appStatusVariant(application.status)} className="text-xs">
                  {application.status}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {application.rounds?.length ?? 0} Round{
                    (application.rounds?.length ?? 0) !== 1 ? 's' : ''
                  }
                </Badge>
                {application.rounds?.[0] && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    Next: {formatDistanceToNow(new Date(application.rounds[0].date), { addSuffix: true })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="pb-4 space-y-4">
          {/* Email */}
          {candidateEmail && (
            <div className="text-sm text-muted-foreground border-l-2 border-muted pl-3">
              <span className="font-medium">Contact:</span> {candidateEmail}
            </div>
          )}

          {/* Tags */}
          {application.tags && application.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {application.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs uppercase tracking-wide">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Interview Rounds header */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">🎯 Interview Rounds</span>
              <Badge variant="outline" className="bg-yellow-200/70 text-black">
                {application.rounds?.length ?? 0}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-primary border-primary/30"
              onClick={() => setShowRoundForm(!showRoundForm)}
            >
              <Plus className="h-4 w-4 mr-1" /> Add Round
            </Button>
          </div>

          {/* Rounds list */}
          {application.rounds && application.rounds.length > 0 && (
            <div className="space-y-2">
              {application.rounds.map((round) => (
                <RoundCard key={round.id} round={round} />
              ))}
            </div>
          )}

          {application.rounds && application.rounds.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No rounds yet. Add one to schedule the interview.
            </p>
          )}

          {/* Add Round form */}
          {showRoundForm && (
            <Card className="border border-primary/30 bg-muted/40">
              <CardContent className="space-y-4 pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wider">Round Type</Label>
                    <Select
                      value={roundForm.roundType}
                      onValueChange={(v) => updateField('roundType', v as RoundType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roundTypes.map((rt) => (
                          <SelectItem key={rt} value={rt}>
                            {rt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.roundType && (
                      <p className="text-xs text-red-500">{formErrors.roundType}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wider">Date</Label>
                    <Input
                      type="date"
                      value={roundForm.date}
                      onChange={(e) => updateField('date', e.target.value)}
                    />
                    {formErrors.date && (
                      <p className="text-xs text-red-500">{formErrors.date}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wider">Time</Label>
                    <Input
                      type="time"
                      value={roundForm.time}
                      onChange={(e) => updateField('time', e.target.value)}
                    />
                    {formErrors.time && (
                      <p className="text-xs text-red-500">{formErrors.time}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wider">Mode</Label>
                    <Select
                      value={roundForm.mode}
                      onValueChange={(v) => updateField('mode', v as InterviewMode)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {interviewModes.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wider">Timezone</Label>
                    <Input
                      value={roundForm.timezone}
                      onChange={(e) => updateField('timezone', e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wider">Duration</Label>
                    <Input
                      value={roundForm.duration}
                      onChange={(e) => updateField('duration', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs uppercase tracking-wider">Feedback</Label>
                  <Textarea
                    placeholder="Any notes about this round..."
                    value={roundForm.feedback}
                    onChange={(e) => updateField('feedback', e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={handleSaveRound}
                    disabled={isSaving}
                  >
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Round
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowRoundForm(false);
                      resetForm();
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
