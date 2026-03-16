"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createRoundAction } from "@/actions/rounds";
import type {
  Application,
  InterviewRound,
  RoundStatus,
  RoundType,
  InterviewMode,
  LipsyncQuality,
} from "@/types";

// ── Round type options ──
const roundTypes: RoundType[] = [
  "Confirmation Call",
  "HR Screen",
  "Technical Interview",
  "System Design",
  "Behavioral",
  "Live Coding",
  "Final Round",
  "Managerial",
];

const interviewModes: InterviewMode[] = [
  "Phone",
  "Video Call (Google Meet)",
  "Video Call (Zoom)",
  "In-Person",
  "Take-Home Assignment",
];

const lipsyncOptions: LipsyncQuality[] = ["Excellent", "Good", "Average", "Poor"];

const statusColors: Record<RoundStatus, string> = {
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Cleared: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Rescheduled: "bg-blue-100 text-blue-700 border-blue-200",
  Failed: "bg-red-100 text-red-700 border-red-200",
};

/** Single interview round card */
function RoundCard({
  round,
  onDelete,
}: {
  round: InterviewRound;
  onDelete: () => void;
}) {
  const [status, setStatus] = useState<RoundStatus>(round.status);

  return (
    <Card className="border border-gray-200">
      <CardContent className="p-5 space-y-4">
        {/* Round header */}
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">
            Round {round.roundNumber}: {round.roundType}
          </h4>
          <Button variant="ghost" size="icon" onClick={onDelete} className="text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Fields grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Round Type */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Round Type</Label>
            <Select defaultValue={round.roundType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roundTypes.map((rt) => (
                  <SelectItem key={rt} value={rt}>{rt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date</Label>
            <Input type="date" defaultValue={round.date} />
          </div>

          {/* Time & Timezone */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Time & Timezone</Label>
            <div className="flex gap-2">
              <Input defaultValue={round.time} className="flex-1" />
              <Select defaultValue={round.timezone}>
                <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IST">IST</SelectItem>
                  <SelectItem value="EST">EST</SelectItem>
                  <SelectItem value="PST">PST</SelectItem>
                  <SelectItem value="GMT">GMT</SelectItem>
                  <SelectItem value="CST">CST</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Duration</Label>
            <Select defaultValue={round.duration}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="15 mins">15 mins</SelectItem>
                <SelectItem value="30 mins">30 mins</SelectItem>
                <SelectItem value="45 mins">45 mins</SelectItem>
                <SelectItem value="60 mins">60 mins</SelectItem>
                <SelectItem value="90 mins">90 mins</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mode */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mode</Label>
            <Select defaultValue={round.mode}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {interviewModes.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* VC Receiver */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">VC Receiver</Label>
            <Input defaultValue={round.vcReceiver} placeholder="email@example.com" />
          </div>

          {/* Frontend / Coordinator */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Frontend / Coordinator</Label>
            <Input defaultValue={round.frontendCoordinator} placeholder="Coordinator name" />
          </div>

          {/* Lipsync */}
          <div className="space-y-1">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">Lipsync</Label>
            <Select defaultValue={round.lipsyncQuality}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {lipsyncOptions.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Feedback */}
        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Feedback</Label>
          <Textarea
            defaultValue={round.feedback}
            placeholder="Add detailed feedback about the candidate's performance..."
            className="min-h-[80px]"
          />
        </div>

        {/* Round Status */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Round Status</Label>
          <div className="flex flex-wrap gap-2">
            {(["Pending", "Cleared", "Rescheduled", "Failed"] as RoundStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                  status === s
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

/** Map app status → badge variant */
function appStatusVariant(status: string) {
  if (status.includes("Interview") || status === "In Interview") return "info" as const;
  if (status === "Offer Received" || status === "Offer Stage") return "success" as const;
  if (status === "Rejected") return "destructive" as const;
  if (status === "Applied" || status === "HR Screen") return "warning" as const;
  return "secondary" as const;
}

/** Application accordion item with interview rounds */
export function ApplicationsList({
  applications: initialApps,
}: {
  applications: Application[];
}) {
  const router = useRouter();
  const [applications, setApplications] = useState(initialApps);
  const [activeAppId, setActiveAppId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [roundForm, setRoundForm] = useState({
    roundType: "Confirmation Call",
    date: new Date().toISOString().split("T")[0],
    time: "",
    timezone: "IST",
    duration: "30 mins",
    mode: "Video Call (Google Meet)",
    vcReceiver: "",
    coordinator: "",
    lipsync: "Excellent" as LipsyncQuality,
    feedback: "",
    roundStatus: "Pending" as RoundStatus,
  });

  const resetForm = () => {
    setRoundForm({
      roundType: "Confirmation Call",
      date: new Date().toISOString().split("T")[0],
      time: "",
      timezone: "IST",
      duration: "30 mins",
      mode: "Video Call (Google Meet)",
      vcReceiver: "",
      coordinator: "",
      lipsync: "Excellent",
      feedback: "",
      roundStatus: "Pending",
    });
    setFormErrors({});
  };

  const addRound = (appId: string) => {
    setActiveAppId(appId);
    resetForm();
  };

  const deleteRound = (appId: string, roundId: string) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id !== appId) return app;
        return {
          ...app,
          rounds: app.rounds.filter((r) => r.id !== roundId),
        };
      })
    );
    toast.info("Round removed");
  };

  const updateField = <K extends keyof typeof roundForm>(key: K, value: (typeof roundForm)[K]) => {
    setRoundForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!roundForm.roundType) errors.roundType = "Round type is required";
    if (!roundForm.date) errors.date = "Date is required";
    if (!roundForm.time) errors.time = "Time is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveRound = async (appId: string) => {
    if (!validateForm()) return;
    try {
      setIsSaving(true);
      const result = await createRoundAction({
        applicationId: appId,
        roundType: roundForm.roundType,
        date: roundForm.date,
        time: roundForm.time,
        timezone: roundForm.timezone,
        duration: roundForm.duration,
        mode: roundForm.mode,
        vcReceiver: roundForm.vcReceiver || "",
        coordinator: roundForm.coordinator || "",
        lipsync: roundForm.lipsync || "",
        feedback: roundForm.feedback || "",
        roundStatus: roundForm.roundStatus.toUpperCase(),
      });

      if (result?.success) {
        toast.success("Round saved successfully! 🗓");
        setActiveAppId(null);
        resetForm();
        router.refresh();
      } else {
        toast.error("Failed to save round. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to save round. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (applications.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No applications yet. Click &quot;+ New Application&quot; to add one.
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="space-y-3">
      {applications.map((app) => (
        <AccordionItem
          key={app.id}
          value={app.id}
          className="rounded-xl border bg-card px-5 shadow-sm"
        >
          <AccordionTrigger className="hover:no-underline py-5">
            <div className="flex flex-1 items-center justify-between pr-4">
              <div className="text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-base">
                    {app.jobTitle} @ {app.company}
                  </h3>
                  <Badge variant={appStatusVariant(app.status)} className="text-xs">
                    {app.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {app.workMode}
                  {app.hiringManager && ` · Hiring Manager: ${app.hiringManager}`}
                </p>
              </div>
            </div>
          </AccordionTrigger>

          <AccordionContent className="pb-5 space-y-4">
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5">
              {app.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs uppercase tracking-wide">
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Interview Rounds header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">🎯 Interview Rounds</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-primary border-primary/30"
                onClick={() => addRound(app.id)}
              >
                <Plus className="h-4 w-4 mr-1" /> Add Round
              </Button>
            </div>

            {/* Add Round form */}
            {activeAppId === app.id && (
              <Card className="border border-primary/30 bg-muted/40">
                <CardContent className="space-y-4 pt-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Round Type</Label>
                      <Select value={roundForm.roundType} onValueChange={(v) => updateField("roundType", v)}>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                          {roundTypes.map((rt) => (
                            <SelectItem key={rt} value={rt}>{rt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.roundType && <p className="text-xs text-destructive">{formErrors.roundType}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Date</Label>
                      <Input
                        type="date"
                        value={roundForm.date}
                        onChange={(e) => updateField("date", e.target.value)}
                      />
                      {formErrors.date && <p className="text-xs text-destructive">{formErrors.date}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Time & Timezone</Label>
                      <div className="flex gap-2">
                        <Input
                          value={roundForm.time}
                          onChange={(e) => updateField("time", e.target.value)}
                          placeholder="14:30"
                          className="flex-1"
                        />
                        <Select value={roundForm.timezone} onValueChange={(v) => updateField("timezone", v)}>
                          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["IST","CST","EST","PST","GMT","CET"].map((tz) => (
                              <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {formErrors.time && <p className="text-xs text-destructive">{formErrors.time}</p>}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Duration</Label>
                      <Select value={roundForm.duration} onValueChange={(v) => updateField("duration", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["15 mins","30 mins","45 mins","60 mins","90 mins"].map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Mode</Label>
                      <Select value={roundForm.mode} onValueChange={(v) => updateField("mode", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {interviewModes.map((m) => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">VC Receiver</Label>
                      <Input
                        value={roundForm.vcReceiver}
                        onChange={(e) => updateField("vcReceiver", e.target.value)}
                        placeholder="email@example.com"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Frontend / Coordinator</Label>
                      <Input
                        value={roundForm.coordinator}
                        onChange={(e) => updateField("coordinator", e.target.value)}
                        placeholder="Coordinator name"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Lipsync</Label>
                      <Select value={roundForm.lipsync} onValueChange={(v) => updateField("lipsync", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {lipsyncOptions.map((l) => (
                            <SelectItem key={l} value={l}>{l}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Round Status</Label>
                      <Select value={roundForm.roundStatus} onValueChange={(v) => updateField("roundStatus", v as RoundStatus)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(["Pending","Cleared","Rescheduled","Failed"] as RoundStatus[]).map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Feedback</Label>
                    <Textarea
                      value={roundForm.feedback}
                      onChange={(e) => updateField("feedback", e.target.value)}
                      placeholder="Add detailed feedback about the candidate's performance..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-muted-foreground/40 text-muted-foreground"
                      onClick={() => { setActiveAppId(null); resetForm(); }}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleSaveRound(app.id)}
                      disabled={isSaving}
                      className="bg-primary text-black hover:bg-primary/90 w-full sm:w-auto"
                    >
                      {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save Round"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rounds list */}
            <div className="space-y-3">
              {app.rounds.map((round) => (
                <RoundCard
                  key={round.id}
                  round={round}
                  onDelete={() => deleteRound(app.id, round.id)}
                />
              ))}
              {app.rounds.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No rounds yet. Add one to get started.
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
