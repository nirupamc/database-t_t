"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { InterviewRound } from "@/types";

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-200 text-amber-800",
  Cleared: "bg-green-200 text-green-800",
  Rescheduled: "bg-blue-200 text-blue-800",
  Failed: "bg-red-200 text-red-800",
};

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function RoundCard({ round, index }: { round: InterviewRound; index: number }) {
  return (
    <Card className="border border-yellow-200/50 bg-card/60">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">
              Round {index}: {round.roundType}
            </h4>
            <Badge className={statusStyles[round.status] ?? "bg-muted text-foreground"}>{round.status}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>📅 {formatDate(round.date)}</div>
          <div>⏰ {round.time} ({round.timezone})</div>
          <div>⏱ Duration: {round.duration}</div>
          <div>💻 Mode: {round.mode}</div>
          <div>📧 VC Receiver: {round.vcReceiver || "Not set"}</div>
          <div>👤 Coordinator: {round.frontendCoordinator || "—"}</div>
          <div>🔄 Lipsync: {round.lipsyncQuality || "—"}</div>
        </div>

        {round.feedback && (
          <div className="rounded-md border border-yellow-200/60 bg-muted/40 p-3 text-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Feedback</p>
            <p>{round.feedback}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
