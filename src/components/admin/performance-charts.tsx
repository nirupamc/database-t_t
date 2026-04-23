"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar, LineChart, Line, Legend } from "recharts";
import { TrendingUp, Users, Crown, Target } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecruiterKPI, PerformanceChartData, WeeklyTrendData } from "@/types/performance";

interface PerformanceChartsProps {
  chartData: PerformanceChartData[];
  weeklyTrendData: WeeklyTrendData[];
  selectedRecruiter?: RecruiterKPI;
}

export function PerformanceCharts({ chartData, weeklyTrendData, selectedRecruiter }: PerformanceChartsProps) {
  // Prepare radial chart data for selected recruiter
  const radialData = selectedRecruiter ? [
    {
      name: 'Submission Rate',
      value: selectedRecruiter.submissionRate,
      fill: selectedRecruiter.submissionRate >= 90 ? '#10b981' : 
            selectedRecruiter.submissionRate >= 70 ? '#3b82f6' : 
            selectedRecruiter.submissionRate >= 50 ? '#f59e0b' : '#ef4444',
    },
    {
      name: 'Placement Rate',
      value: selectedRecruiter.placementRate,
      fill: selectedRecruiter.placementRate >= 90 ? '#059669' : 
            selectedRecruiter.placementRate >= 70 ? '#2563eb' : 
            selectedRecruiter.placementRate >= 50 ? '#d97706' : '#dc2626',
    }
  ] : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-yellow-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.dataKey}: {entry.value}
              {entry.dataKey.includes('Rate') ? '%' : ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Dual Bar Chart */}
      <Card className="xl:col-span-2 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-5 h-5 text-yellow-600" />
            Submissions vs Placements
          </CardTitle>
          <CardDescription>
            Compare submission and placement counts across all recruiters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                stroke="#92400e"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#92400e"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                dataKey="submissions" 
                fill="#f59e0b" 
                name="Submissions"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="placements" 
                fill="#10b981" 
                name="Placements"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Radial Progress Chart */}
      <Card className="border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-yellow-600" />
            {selectedRecruiter ? `${selectedRecruiter.name.split(' ')[0]}'s Progress` : 'Top Performer Progress'}
          </CardTitle>
          <CardDescription>
            Individual KPI progress towards monthly targets
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedRecruiter ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="40%" outerRadius="90%" data={radialData}>
                  <RadialBar 
                    dataKey="value"
                    cornerRadius={8}
                    fill={(entry) => entry.fill}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadialBarChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {selectedRecruiter.submissionRate}%
                  </div>
                  <div className="text-sm text-gray-600">Submission Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {selectedRecruiter.placementRate}%
                  </div>
                  <div className="text-sm text-gray-600">Placement Rate</div>
                </div>
              </div>
              
              <div className="text-center pt-2 border-t border-yellow-100">
                <div className="text-lg font-semibold text-gray-700">
                  Efficiency: {selectedRecruiter.efficiencyRatio}%
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-500">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Select a recruiter to view their KPI progress</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Trend Line Chart */}
      <Card className="xl:col-span-3 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-600" />
            Weekly Application Submission Trend
          </CardTitle>
          <CardDescription>
            Track submission volume trends throughout the current month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weeklyTrendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" />
              <XAxis 
                dataKey="week" 
                tick={{ fontSize: 12 }}
                stroke="#92400e"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#92400e"
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="submissions" 
                stroke="#f59e0b" 
                strokeWidth={3}
                dot={{ fill: '#f59e0b', strokeWidth: 2, r: 6 }}
                activeDot={{ r: 8, fill: '#d97706' }}
                name="Submissions"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}