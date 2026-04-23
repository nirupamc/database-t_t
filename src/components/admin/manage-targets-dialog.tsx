"use client";

import React, { useState } from "react";
import { Target, Save, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { RecruiterKPI } from "@/types/performance";
import { updateRecruiterTargetsAction } from "@/actions/performance";

interface ManageTargetsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recruiter: RecruiterKPI | null;
  onTargetsUpdated: () => void;
}

export function ManageTargetsDialog({ open, onOpenChange, recruiter, onTargetsUpdated }: ManageTargetsDialogProps) {
  const [submissionTarget, setSubmissionTarget] = useState(recruiter?.submissionTarget ?? 10);
  const [placementTarget, setPlacementTarget] = useState(recruiter?.placementTarget ?? 2);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when recruiter changes
  React.useEffect(() => {
    if (recruiter) {
      setSubmissionTarget(recruiter.submissionTarget);
      setPlacementTarget(recruiter.placementTarget);
    }
  }, [recruiter]);

  const handleSave = async () => {
    if (!recruiter) return;

    if (submissionTarget < 0 || placementTarget < 0) {
      toast.error("Invalid Input: Targets must be positive numbers");
      return;
    }

    setIsLoading(true);
    try {
      await updateRecruiterTargetsAction({
        recruiterId: recruiter.id,
        submissionTarget,
        placementTarget,
      });

      toast.success(`Successfully updated targets for ${recruiter.name}`);

      onTargetsUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating targets:", error);
      toast.error("Failed to update targets. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!recruiter) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-2 border-yellow-200 bg-gradient-to-br from-yellow-50/90 to-orange-50/60">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-gray-900">
            <Target className="w-5 h-5 text-yellow-600" />
            Manage Performance Targets
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Set monthly submission and placement targets for this recruiter
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Recruiter Info */}
          <div className="flex items-center gap-4 p-4 bg-white/70 rounded-lg border border-yellow-200">
            <Avatar className="w-12 h-12">
              <AvatarImage src={recruiter.profilePhotoUrl} />
              <AvatarFallback className="bg-yellow-100 text-yellow-800 font-semibold">
                {recruiter.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-gray-900">{recruiter.name}</div>
              <div className="text-sm text-gray-600">
                Current: {recruiter.actualSubmissions} submissions, {recruiter.actualPlacements} placements this month
              </div>
            </div>
          </div>

          {/* Target Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="submissionTarget" className="text-sm font-medium text-gray-700">
                Monthly Submission Target
              </Label>
              <Input
                id="submissionTarget"
                type="number"
                min="0"
                max="100"
                value={submissionTarget}
                onChange={(e) => setSubmissionTarget(Number(e.target.value))}
                className="border-yellow-200 focus:border-yellow-400 focus:ring-yellow-400/20"
                placeholder="e.g. 15"
              />
              <div className="text-xs text-gray-500">
                Current rate: {recruiter.submissionRate}%
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="placementTarget" className="text-sm font-medium text-gray-700">
                Monthly Placement Target
              </Label>
              <Input
                id="placementTarget"
                type="number"
                min="0"
                max="50"
                value={placementTarget}
                onChange={(e) => setPlacementTarget(Number(e.target.value))}
                className="border-yellow-200 focus:border-yellow-400 focus:ring-yellow-400/20"
                placeholder="e.g. 3"
              />
              <div className="text-xs text-gray-500">
                Current rate: {recruiter.placementRate}%
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-900 mb-2">Preview Impact:</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">New Submission Rate:</span>{' '}
                <span className="font-semibold">
                  {submissionTarget > 0 ? Math.round((recruiter.actualSubmissions / submissionTarget) * 100) : 0}%
                </span>
              </div>
              <div>
                <span className="text-blue-700">New Placement Rate:</span>{' '}
                <span className="font-semibold">
                  {placementTarget > 0 ? Math.round((recruiter.actualPlacements / placementTarget) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {isLoading ? (
              <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isLoading ? 'Saving...' : 'Save Targets'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}