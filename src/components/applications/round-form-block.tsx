"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import type { RoundStatus } from "@/types";

// ── Options ──

const roundTypeOptions = [
  "Confirmation Call",
  "Technical",
  "HR Screen",
  "Coding Test",
  "Final Interview",
  "Other",
] as const;

const durationOptions = ["15 min", "30 min", "45 min", "60 min"] as const;

const modeOptions = [
  "Phone",
  "Teams",
  "Zoom",
  "Google Meet",
  "In-Person",
] as const;

const timezoneOptions = ["IST", "CST", "EST", "PST", "GMT", "CET"] as const;

const lipsyncOptions = ["Good", "Poor", "Not Applicable"] as const;

const statusColors: Record<RoundStatus, string> = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Cleared: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Rescheduled: "bg-blue-100 text-blue-700 border-blue-200",
  Failed: "bg-red-100 text-red-700 border-red-200",
};

/** Data shape for a single round within the form */
export interface RoundFormData {
  id: string;
  roundType: string;
  date: string;
  time: string;
  timezone: string;
  duration: string;
  mode: string;
  vcReceiver: string;
  frontendCoordinator: string;
  lipsync: string;
  feedback: string;
  status: RoundStatus;
}

/** Creates a blank round with defaults */
export function createBlankRound(roundNumber: number): RoundFormData {
  return {
    id: `round-${Date.now()}-${roundNumber}`,
    roundType: "Confirmation Call",
    date: new Date().toISOString().split("T")[0],
    time: "02:30 PM",
    timezone: "IST",
    duration: "30 min",
    mode: "Google Meet",
    vcReceiver: "",
    frontendCoordinator: "",
    lipsync: "Good",
    feedback: "",
    status: "Pending",
  };
}

interface RoundFormBlockProps {
  round: RoundFormData;
  roundIndex: number;
  onChange: (updated: RoundFormData) => void;
  onDelete: () => void;
}

/**
 * A single interview-round form card.
 * Fields: Round Type, Date, Time/TZ, Duration, Mode, VC Receiver,
 *         Frontend/Coordinator, Lipsync, Feedback, Round Status badges.
 */
export function RoundFormBlock({
  round,
  roundIndex,
  onChange,
  onDelete,
}: RoundFormBlockProps) {
  const update = <K extends keyof RoundFormData>(key: K, value: RoundFormData[K]) => {
    onChange({ ...round, [key]: value });
  };

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">
            Round {roundIndex + 1}: {round.roundType}
          </h4>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Fields grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Round Type */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Round Type
            </Label>
            <Select value={round.roundType} onValueChange={(v) => update("roundType", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roundTypeOptions.map((rt) => (
                  <SelectItem key={rt} value={rt}>{rt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date</Label>
            <Input
              type="date"
              value={round.date}
              onChange={(e) => update("date", e.target.value)}
            />
          </div>

          {/* Time & Timezone */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Time & Timezone
            </Label>
            <div className="flex gap-2">
              <Input
                value={round.time}
                onChange={(e) => update("time", e.target.value)}
                placeholder="02:30 PM"
                className="flex-1"
              />
              <Select value={round.timezone} onValueChange={(v) => update("timezone", v)}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {timezoneOptions.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Duration
            </Label>
            <Select value={round.duration} onValueChange={(v) => update("duration", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {durationOptions.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mode */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mode</Label>
            <Select value={round.mode} onValueChange={(v) => update("mode", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {modeOptions.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* VC Receiver */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              VC Receiver
            </Label>
            <Input
              value={round.vcReceiver}
              onChange={(e) => update("vcReceiver", e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          {/* Frontend / Coordinator */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Frontend / Coordinator
            </Label>
            <Input
              value={round.frontendCoordinator}
              onChange={(e) => update("frontendCoordinator", e.target.value)}
              placeholder="Coordinator name"
            />
          </div>

          {/* Lipsync Quality */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Lipsync Quality
            </Label>
            <Select value={round.lipsync} onValueChange={(v) => update("lipsync", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {lipsyncOptions.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Feedback / Notes */}
        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Feedback / Notes
          </Label>
          <Textarea
            value={round.feedback}
            onChange={(e) => update("feedback", e.target.value)}
            placeholder="Add detailed feedback about the candidate's performance..."
            className="min-h-[80px]"
          />
        </div>

        {/* Round Status toggle buttons */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Round Status
          </Label>
          <div className="flex flex-wrap gap-2">
            {(["Pending", "Cleared", "Rescheduled", "Failed"] as RoundStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => update("status", s)}
                className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                  round.status === s
                    ? statusColors[s]
                    : "border-gray-200 text-gray-400 hover:border-gray-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
