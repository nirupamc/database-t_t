import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Calendar, Gift } from "lucide-react";

interface DashboardStatsView {
  activeCandidates: number;
  activeCandidatesChange: string;
  interviewsThisWeek: number;
  interviewsNote: string;
  offersPending: number;
  offersNote: string;
}

/** Stats row on the dashboard */
export function StatsCards({ dashboardStats }: { dashboardStats: DashboardStatsView }) {
  const stats = [
    {
      title: "Active Candidates",
      value: dashboardStats.activeCandidates,
      change: dashboardStats.activeCandidatesChange,
      changeColor: "text-yellow-600",
      icon: TrendingUp,
      iconBg: "bg-blue-50 text-blue-600",
    },
    {
      title: "Interviews This Week",
      value: dashboardStats.interviewsThisWeek,
      subtitle: dashboardStats.interviewsNote,
      icon: Calendar,
      iconBg: "bg-purple-50 text-purple-600",
    },
    {
      title: "Offers Pending",
      value: dashboardStats.offersPending,
      subtitle: dashboardStats.offersNote,
      subtitleColor: "text-red-500",
      icon: Gift,
      iconBg: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
          <CardContent className="flex items-center gap-4 p-6">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.iconBg}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold">{stat.value}</p>
                {stat.change && (
                  <span className={`text-sm font-medium ${stat.changeColor}`}>
                    {stat.change}
                  </span>
                )}
              </div>
              {stat.subtitle && (
                <p className={`text-xs ${stat.subtitleColor || "text-muted-foreground"}`}>
                  {stat.subtitle}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
