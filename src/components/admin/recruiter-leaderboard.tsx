"use client";

import { useState } from "react";
import { Crown, TrendingUp, Target, Zap, Users, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { RecruiterKPI } from "@/types/performance";
import { getKPIColors } from "@/types/performance";
import { cn } from "@/lib/utils";

interface RecruiterLeaderboardProps {
  kpiData: RecruiterKPI[];
  onManageTargets: (recruiter: RecruiterKPI) => void;
}

export function RecruiterLeaderboard({ kpiData, onManageTargets }: RecruiterLeaderboardProps) {
  const [sortBy, setSortBy] = useState<'submissions' | 'placements' | 'efficiency'>('submissions');

  const sortedData = [...kpiData].sort((a, b) => {
    switch (sortBy) {
      case 'submissions':
        return b.actualSubmissions - a.actualSubmissions;
      case 'placements':
        return b.actualPlacements - a.actualPlacements;
      case 'efficiency':
        return b.efficiencyRatio - a.efficiencyRatio;
      default:
        return 0;
    }
  });

  const getKPIBadge = (kpi: RecruiterKPI) => {
    const colors = getKPIColors(kpi.kpiLevel);
    const icons = {
      excellent: <Crown className="w-3 h-3" />,
      good: <Trophy className="w-3 h-3" />,
      warning: <Target className="w-3 h-3" />,
      poor: <TrendingUp className="w-3 h-3" />,
    };

    return (
      <Badge variant="outline" className={cn(colors.bg, colors.text, colors.border, "gap-1")}>
        {icons[kpi.kpiLevel]}
        {kpi.overallKPI}%
      </Badge>
    );
  };

  return (
    <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50/50 to-orange-50/30">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-600" />
              Recruiter Performance Leaderboard
            </CardTitle>
            <CardDescription className="text-base mt-1">
              Monthly performance tracking with KPI indicators and targets
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'submissions' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('submissions')}
            >
              <Users className="w-4 h-4 mr-2" />
              Submissions
            </Button>
            <Button
              variant={sortBy === 'placements' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('placements')}
            >
              <Crown className="w-4 h-4 mr-2" />
              Placements
            </Button>
            <Button
              variant={sortBy === 'efficiency' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('efficiency')}
            >
              <Zap className="w-4 h-4 mr-2" />
              Efficiency
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-lg border border-yellow-200 bg-white/60 backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-yellow-100/70 hover:bg-yellow-100/70">
                <TableHead className="w-12">#</TableHead>
                <TableHead className="font-semibold">Recruiter</TableHead>
                <TableHead className="font-semibold text-center">Submissions</TableHead>
                <TableHead className="font-semibold text-center">Placements</TableHead>
                <TableHead className="font-semibold text-center">Efficiency</TableHead>
                <TableHead className="font-semibold text-center">KPI Indicator</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((recruiter, index) => (
                <TableRow 
                  key={recruiter.id} 
                  className="hover:bg-yellow-50/50 transition-colors"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {index + 1}
                      {recruiter.isTopPerformer && (
                        <span className="text-orange-500" title="Top Performer This Week">
                          🔥
                        </span>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={recruiter.profilePhotoUrl} />
                        <AvatarFallback className="bg-yellow-100 text-yellow-800 text-xs font-semibold">
                          {recruiter.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900">{recruiter.name}</div>
                        {recruiter.weeklySubmissions > 0 && (
                          <div className="text-xs text-gray-500">
                            {recruiter.weeklySubmissions} this week
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <div className="font-semibold text-lg">
                        {recruiter.actualSubmissions}
                        <span className="text-gray-400 text-sm font-normal">
                          /{recruiter.submissionTarget}
                        </span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          recruiter.submissionRate >= 90 ? "bg-green-50 text-green-700 border-green-200" :
                          recruiter.submissionRate >= 70 ? "bg-blue-50 text-blue-700 border-blue-200" :
                          recruiter.submissionRate >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                          "bg-red-50 text-red-700 border-red-200"
                        )}
                      >
                        {recruiter.submissionRate}%
                      </Badge>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <div className="space-y-1">
                      <div className="font-semibold text-lg">
                        {recruiter.actualPlacements}
                        <span className="text-gray-400 text-sm font-normal">
                          /{recruiter.placementTarget}
                        </span>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          recruiter.placementRate >= 90 ? "bg-green-50 text-green-700 border-green-200" :
                          recruiter.placementRate >= 70 ? "bg-blue-50 text-blue-700 border-blue-200" :
                          recruiter.placementRate >= 50 ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                          "bg-red-50 text-red-700 border-red-200"
                        )}
                      >
                        {recruiter.placementRate}%
                      </Badge>
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    <div className="font-semibold text-lg">
                      {recruiter.efficiencyRatio}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {recruiter.actualPlacements}/{recruiter.actualSubmissions}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-center">
                    {getKPIBadge(recruiter)}
                  </TableCell>
                  
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onManageTargets(recruiter)}
                      className="text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100"
                    >
                      <Target className="w-4 h-4 mr-1" />
                      Set Targets
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {sortedData.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No recruiter performance data available yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}