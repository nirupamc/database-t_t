// Performance KPI types and interfaces
export interface RecruiterKPI {
  id: string;
  name: string;
  profilePhotoUrl?: string;
  submissionTarget: number;
  placementTarget: number;
  actualSubmissions: number;
  actualPlacements: number;
  submissionRate: number;
  placementRate: number;
  efficiencyRatio: number;
  overallKPI: number;
  kpiLevel: 'excellent' | 'good' | 'warning' | 'poor';
  weeklySubmissions: number;
  isTopPerformer?: boolean;
}

export interface PerformanceChartData {
  name: string;
  submissions: number;
  placements: number;
}

export interface WeeklyTrendData {
  week: string;
  submissions: number;
  date: string;
}

export interface RadialKPIData {
  submissionProgress: number;
  placementProgress: number;
  efficiency: number;
}

export function calculateKPILevel(submissionRate: number, placementRate: number): 'excellent' | 'good' | 'warning' | 'poor' {
  const avgRate = (submissionRate + placementRate) / 2;
  if (avgRate >= 90) return 'excellent';
  if (avgRate >= 70) return 'good';
  if (avgRate >= 50) return 'warning';
  return 'poor';
}

export function getKPIColors(level: 'excellent' | 'good' | 'warning' | 'poor') {
  switch (level) {
    case 'excellent':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'good':
      return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
    case 'warning':
      return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' };
    case 'poor':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
  }
}