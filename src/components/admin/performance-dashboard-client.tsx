"use client";

import { useState } from "react";
import { Trophy, BarChart, TrendingUp, Users, Target } from "lucide-react";

import { RecruiterLeaderboard } from "@/components/admin/recruiter-leaderboard";
import { PerformanceCharts } from "@/components/admin/performance-charts";
import { ManageTargetsDialog } from "@/components/admin/manage-targets-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { RecruiterKPI, PerformanceChartData, WeeklyTrendData } from "@/types/performance";

interface PerformanceDashboardClientProps {
  kpiData: RecruiterKPI[];
  chartData: PerformanceChartData[];
  weeklyTrendData: WeeklyTrendData[];
}

export default function PerformanceDashboardClient({ 
  kpiData, 
  chartData, 
  weeklyTrendData 
}: PerformanceDashboardClientProps) {
  const [selectedRecruiter, setSelectedRecruiter] = useState<RecruiterKPI | null>(
    kpiData.find(r => r.isTopPerformer) || kpiData[0] || null
  );
  const [manageTargetsOpen, setManageTargetsOpen] = useState(false);
  const [recruiterToManage, setRecruiterToManage] = useState<RecruiterKPI | null>(null);

  const handleManageTargets = (recruiter: RecruiterKPI) => {
    setRecruiterToManage(recruiter);
    setManageTargetsOpen(true);
  };

  const handleTargetsUpdated = () => {
    // Trigger a page refresh to get updated data
    window.location.reload();
  };

  // Calculate summary stats
  const totalSubmissions = kpiData.reduce((sum, r) => sum + r.actualSubmissions, 0);
  const totalPlacements = kpiData.reduce((sum, r) => sum + r.actualPlacements, 0);
  const averageEfficiency = kpiData.length > 0 
    ? Math.round(kpiData.reduce((sum, r) => sum + r.efficiencyRatio, 0) / kpiData.length)
    : 0;
  const topPerformers = kpiData.filter(r => r.kpiLevel === 'excellent' || r.kpiLevel === 'good').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
          <Trophy className="w-10 h-10 text-yellow-600" />
          Recruiter Performance Dashboard
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Monitor team performance, track KPIs, and manage targets to drive recruitment excellence
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800 flex items-center gap-2">
              <BarChart className="w-4 h-4" />
              Total Submissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{totalSubmissions}</div>
            <p className="text-xs text-yellow-700">This month</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Total Placements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{totalPlacements}</div>
            <p className="text-xs text-green-700">This month</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Avg Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{averageEfficiency}%</div>
            <p className="text-xs text-blue-700">Placement rate</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
              <Users className="w-4 h-4" />
              High Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{topPerformers}</div>
            <p className="text-xs text-purple-700">Above 70% KPI</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <PerformanceCharts 
        chartData={chartData}
        weeklyTrendData={weeklyTrendData}
        selectedRecruiter={selectedRecruiter}
      />

      {/* Leaderboard */}
      <RecruiterLeaderboard 
        kpiData={kpiData}
        onManageTargets={handleManageTargets}
      />

      {/* Additional Actions */}
      <div className="flex justify-center">
        <div className="text-center text-sm text-gray-500 space-y-2">
          <p>Click on any recruiter row to view their detailed KPI progress in the charts above</p>
          <p className="text-xs">
            KPI Levels: 🏆 Excellent (90%+) • ✅ Good (70%+) • ⚠️ Warning (50%+) • ❌ Needs Improvement (&lt;50%)
          </p>
        </div>
      </div>

      {/* Manage Targets Dialog */}
      <ManageTargetsDialog
        open={manageTargetsOpen}
        onOpenChange={setManageTargetsOpen}
        recruiter={recruiterToManage}
        onTargetsUpdated={handleTargetsUpdated}
      />
    </div>
  );
}