import { candidatesSeed, getCandidateMetrics } from "@/lib/fakeData";

export type EmployeeRole = "Admin" | "Recruiter";

export interface EmployeeCandidateSummary {
  id: string;
  name: string;
  email: string;
  currentProfileStatus: string;
  totalApplications: number;
  nextRoundDate: string | null;
}

export interface EmployeePerformanceStats {
  totalAssignedCandidates: number;
  totalApplicationsSubmitted: number;
  totalInterviewsScheduled: number;
  totalOffersExtended: number;
  totalPlacements: number;
}

export interface EmployeeRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: EmployeeRole;
  imageUrl?: string;
  lastActivityDate: string;
  assignedCandidates: EmployeeCandidateSummary[];
  performance: EmployeePerformanceStats;
}

const employeeBase = [
  {
    id: "emp-a1",
    name: "Faizan Ahmed",
    email: "faizan@hireflow.com",
    phone: "+91 98980 12001",
    role: "Admin" as const,
    imageUrl: "https://i.pravatar.cc/120?img=12",
    lastActivityDate: "2026-03-11",
  },
  {
    id: "emp-r1",
    name: "Priya Sharma",
    email: "priya@hireflow.com",
    phone: "+91 98980 12002",
    role: "Recruiter" as const,
    imageUrl: "https://i.pravatar.cc/120?img=32",
    lastActivityDate: "2026-03-11",
  },
  {
    id: "emp-r2",
    name: "Sarah Jenkins",
    email: "sarah@hireflow.com",
    phone: "+91 98980 12003",
    role: "Recruiter" as const,
    imageUrl: "https://i.pravatar.cc/120?img=47",
    lastActivityDate: "2026-03-10",
  },
  {
    id: "emp-r3",
    name: "Rohit Nair",
    email: "rohit@hireflow.com",
    phone: "+91 98980 12004",
    role: "Recruiter" as const,
    imageUrl: "https://i.pravatar.cc/120?img=53",
    lastActivityDate: "2026-03-10",
  },
  {
    id: "emp-r4",
    name: "Anita Roy",
    email: "anita@hireflow.com",
    phone: "+91 98980 12005",
    role: "Recruiter" as const,
    imageUrl: "https://i.pravatar.cc/120?img=25",
    lastActivityDate: "2026-03-09",
  },
  {
    id: "emp-a2",
    name: "Nirupam Chatterjee",
    email: "nirupam@hireflow.com",
    phone: "+91 98980 12006",
    role: "Admin" as const,
    imageUrl: "https://i.pravatar.cc/120?img=60",
    lastActivityDate: "2026-03-09",
  },
  {
    id: "emp-r5",
    name: "Ayesha Khan",
    email: "ayesha@hireflow.com",
    phone: "+91 98980 12007",
    role: "Recruiter" as const,
    imageUrl: "https://i.pravatar.cc/120?img=66",
    lastActivityDate: "2026-03-08",
  },
  {
    id: "emp-r6",
    name: "Daniel Park",
    email: "daniel@hireflow.com",
    phone: "+91 98980 12008",
    role: "Recruiter" as const,
    imageUrl: "https://i.pravatar.cc/120?img=23",
    lastActivityDate: "2026-03-08",
  },
  {
    id: "emp-r7",
    name: "Ritika Menon",
    email: "ritika@hireflow.com",
    phone: "+91 98980 12009",
    role: "Recruiter" as const,
    imageUrl: "https://i.pravatar.cc/120?img=41",
    lastActivityDate: "2026-03-07",
  },
  {
    id: "emp-r8",
    name: "Karan Suri",
    email: "karan@hireflow.com",
    phone: "+91 98980 12010",
    role: "Recruiter" as const,
    imageUrl: "https://i.pravatar.cc/120?img=8",
    lastActivityDate: "2026-03-07",
  },
  {
    id: "emp-r9",
    name: "Neha Kapoor",
    email: "neha@hireflow.com",
    phone: "+91 98980 12011",
    role: "Recruiter" as const,
    imageUrl: "https://i.pravatar.cc/120?img=5",
    lastActivityDate: "2026-03-06",
  },
  {
    id: "emp-r10",
    name: "Arvind Rao",
    email: "arvind@hireflow.com",
    phone: "+91 98980 12012",
    role: "Recruiter" as const,
    imageUrl: "https://i.pravatar.cc/120?img=67",
    lastActivityDate: "2026-03-06",
  },
];

function pickNextRoundDate(candidateId: string): string | null {
  const candidate = candidatesSeed.find((item) => item.id === candidateId);
  if (!candidate) {
    return null;
  }

  const pendingRound = candidate.applications
    .flatMap((application) => application.rounds)
    .find((round) => round.status === "Pending" || round.status === "Rescheduled");

  return pendingRound?.dateTime ?? null;
}

function buildCandidateSummary(name: string): EmployeeCandidateSummary[] {
  return candidatesSeed
    .filter((candidate) => candidate.assignedRecruiter === name)
    .map((candidate) => {
      const metrics = getCandidateMetrics(candidate);
      return {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        currentProfileStatus: metrics.latestApplicationStatus,
        totalApplications: metrics.totalApplications,
        nextRoundDate: pickNextRoundDate(candidate.id),
      };
    });
}

function buildPerformance(assignedCandidates: EmployeeCandidateSummary[]): EmployeePerformanceStats {
  const summaries = assignedCandidates
    .map((summary) => candidatesSeed.find((candidate) => candidate.id === summary.id))
    .filter((candidate) => candidate !== undefined);

  const totals = summaries.reduce(
    (accumulator, candidate) => {
      const metrics = getCandidateMetrics(candidate);
      return {
        totalAssignedCandidates: accumulator.totalAssignedCandidates + 1,
        totalApplicationsSubmitted:
          accumulator.totalApplicationsSubmitted + metrics.totalApplications,
        totalInterviewsScheduled:
          accumulator.totalInterviewsScheduled + metrics.interviewsScheduled,
        totalOffersExtended: accumulator.totalOffersExtended + metrics.offersExtended,
        totalPlacements: accumulator.totalPlacements + metrics.placements,
      };
    },
    {
      totalAssignedCandidates: 0,
      totalApplicationsSubmitted: 0,
      totalInterviewsScheduled: 0,
      totalOffersExtended: 0,
      totalPlacements: 0,
    }
  );

  return totals;
}

export const fakeEmployees: EmployeeRecord[] = employeeBase.map((employee, index) => {
  const assignedCandidates = buildCandidateSummary(employee.name);
  const performance = buildPerformance(assignedCandidates);

  if (assignedCandidates.length === 0 && employee.role === "Recruiter") {
    const fallbackCandidate = candidatesSeed[index % candidatesSeed.length];
    const fallbackMetrics = getCandidateMetrics(fallbackCandidate);
    return {
      ...employee,
      assignedCandidates: [
        {
          id: fallbackCandidate.id,
          name: fallbackCandidate.name,
          email: fallbackCandidate.email,
          currentProfileStatus: fallbackMetrics.latestApplicationStatus,
          totalApplications: fallbackMetrics.totalApplications,
          nextRoundDate: pickNextRoundDate(fallbackCandidate.id),
        },
      ],
      performance: {
        totalAssignedCandidates: 1,
        totalApplicationsSubmitted: fallbackMetrics.totalApplications,
        totalInterviewsScheduled: fallbackMetrics.interviewsScheduled,
        totalOffersExtended: fallbackMetrics.offersExtended,
        totalPlacements: fallbackMetrics.placements,
      },
    };
  }

  return {
    ...employee,
    assignedCandidates,
    performance,
  };
});

export function getEmployeeById(employeeId: string) {
  return fakeEmployees.find((employee) => employee.id === employeeId);
}
