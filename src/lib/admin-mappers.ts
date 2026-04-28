import type { ApplicationStatus, CandidateStatus, Recruiter, RoundStatus, UserRole } from "@prisma/client";

export type AdminCandidateApplicationStatus =
  | "Applied"
  | "Interview Scheduled"
  | "Feedback Received"
  | "Offer Extended"
  | "Placed"
  | "Rejected"
  | "On Hold";

export type AdminRoundStatus = "Pending" | "Cleared" | "Rescheduled" | "Failed";
export type AdminEmployeeRole = "Admin" | "Recruiter";

export interface AdminCandidateRoundView {
  id: string;
  roundType: string;
  dateTime: string;
  timezone: string;
  duration: string;
  mode: string;
  vcReceiver: string;
  frontend: boolean;
  lipsync: boolean;
  feedback: string;
  status: AdminRoundStatus;
}

export interface AdminCandidateApplicationView {
  id: string;
  jobTitle: string;
  company: string;
  jobPostingUrl: string;
  appliedDate: string;
  source: string;
  techTags: string[];
  status: AdminCandidateApplicationStatus;
  rounds: AdminCandidateRoundView[];
}

export interface AdminCandidateView {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedInUrl: string;
  avatarUrl?: string;
  assignedRecruiter: string;
  recruiterId: string;
  experienceYears: number;
  location: string;
  noticePeriod: string;
  expectedCtc: string;
  resumeLink: string;
  quickNotes: string;
  employmentType?: string;
  workMode?: string;
  candidateType?: string;
  applications: AdminCandidateApplicationView[];
}

export interface AdminCandidateMetrics {
  totalApplications: number;
  activeApplications: number;
  interviewsScheduled: number;
  offersExtended: number;
  placements: number;
  latestApplicationStatus: AdminCandidateApplicationStatus;
}

export interface AdminEmployeeCandidateSummary {
  id: string;
  name: string;
  email: string;
  currentProfileStatus: AdminCandidateApplicationStatus;
  totalApplications: number;
  nextRoundDate: string | null;
}

export interface AdminEmployeePerformanceView {
  totalAssignedCandidates: number;
  totalApplicationsSubmitted: number;
  totalInterviewsScheduled: number;
  totalOffersExtended: number;
  totalPlacements: number;
}

export interface AdminEmployeeView {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminEmployeeRole;
  imageUrl?: string;
  lastActivityDate: string;
  assignedCandidates: AdminEmployeeCandidateSummary[];
  performance: AdminEmployeePerformanceView;
}

type CandidateWithRelations = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  personalLinkedIn: string | null;
  profilePhotoUrl: string | null;
  resumeUrl: string | null;
  skills: string[];
  experienceYears: number;
  location: string;
  noticePeriod: string;
  expectedCTC: string;
  status: CandidateStatus;
  recruiterId: string;
  employmentType: string | null;
  workMode: string | null;
  candidateType: string | null;
  recruiter: Pick<Recruiter, "id" | "name" | "email">;
  applications: Array<{
    id: string;
    jobTitle: string;
    company: string;
    jobUrl: string;
    source: string;
    techTags: string[];
    appliedDate: Date;
    status: ApplicationStatus;
    rounds: Array<{
      id: string;
      roundType: string;
      date: Date;
      time: string;
      timezone: string;
      duration: string;
      mode: string;
      vcReceiver: string;
      frontend: boolean;
      lipsync: boolean;
      feedback: string | null;
      roundStatus: RoundStatus;
    }>;
  }>;
};

type RecruiterWithRelations = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  profilePhotoUrl: string | null;
  updatedAt: Date;
  candidates: Array<{
    id: string;
    fullName: string;
    email: string;
    applications: Array<{
      id: string;
      status: ApplicationStatus;
      rounds: Array<{
        id: string;
        date: Date;
        time: string;
        roundStatus: RoundStatus;
      }>;
    }>;
  }>;
};

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: Date) {
  return value.toISOString().split("T")[0];
}

function formatDateTime(date: Date, time: string) {
  return `${formatDate(date)} ${time}`;
}

export function getAdminCandidateMetrics(candidate: AdminCandidateView): AdminCandidateMetrics {
  const totalApplications = candidate.applications.length;
  const activeApplications = candidate.applications.filter(
    (application) => application.status !== "Placed" && application.status !== "Rejected"
  ).length;
  const interviewsScheduled = candidate.applications.reduce(
    (count, application) =>
      count +
      application.rounds.filter(
        (round) => round.status === "Pending" || round.status === "Rescheduled"
      ).length,
    0
  );
  const offersExtended = candidate.applications.filter(
    (application) => application.status === "Offer Extended"
  ).length;
  const placements = candidate.applications.filter((application) => application.status === "Placed").length;

  return {
    totalApplications,
    activeApplications,
    interviewsScheduled,
    offersExtended,
    placements,
    latestApplicationStatus: candidate.applications[0]?.status ?? "Applied",
  };
}

export function mapCandidateToAdminView(candidate: CandidateWithRelations): AdminCandidateView {
  return {
    id: candidate.id,
    name: candidate.fullName,
    title: candidate.skills[0] ? `${candidate.skills[0]} Specialist` : formatEnum(candidate.status),
    email: candidate.email,
    phone: candidate.phone,
    linkedInUrl: candidate.personalLinkedIn ?? "",
    avatarUrl: candidate.profilePhotoUrl ?? undefined,
    assignedRecruiter: candidate.recruiter.name,
    recruiterId: candidate.recruiterId,
    experienceYears: candidate.experienceYears,
    location: candidate.location,
    noticePeriod: candidate.noticePeriod,
    expectedCtc: candidate.expectedCTC,
    resumeLink: candidate.resumeUrl ?? "#",
    quickNotes:
      candidate.applications.flatMap((application) => application.rounds).find((round) => round.feedback)?.feedback ??
      "No feedback notes have been added yet.",
    employmentType: candidate.employmentType ?? undefined,
    workMode: candidate.workMode ?? undefined,
    candidateType: candidate.candidateType ?? undefined,
    applications: candidate.applications.map((application) => ({
      id: application.id,
      jobTitle: application.jobTitle,
      company: application.company,
      jobPostingUrl: application.jobUrl,
      appliedDate: formatDate(application.appliedDate),
      source: application.source,
      techTags: application.techTags,
      status: formatEnum(application.status) as AdminCandidateApplicationStatus,
      rounds: application.rounds.map((round) => ({
        id: round.id,
        roundType: round.roundType,
        dateTime: formatDateTime(round.date, round.time),
        timezone: round.timezone,
        duration: round.duration,
        mode: round.mode,
        vcReceiver: round.vcReceiver,
        frontend: round.frontend,
        lipsync: round.lipsync,
        feedback: round.feedback ?? "Awaiting feedback",
        status: formatEnum(round.roundStatus) as AdminRoundStatus,
      })),
    })),
  };
}

export function mapRecruiterToAdminView(recruiter: RecruiterWithRelations): AdminEmployeeView {
  const assignedCandidates = recruiter.candidates.map((candidate) => {
    const applications = candidate.applications.map((application) => ({
      id: application.id,
      status: formatEnum(application.status) as AdminCandidateApplicationStatus,
      rounds: application.rounds.map((round) => ({
        id: round.id,
        dateTime: formatDateTime(round.date, round.time),
        status: formatEnum(round.roundStatus) as AdminRoundStatus,
      })),
    }));
    const totalApplications = applications.length;
    const activeApplications = applications.filter(
      (application) => application.status !== "Placed" && application.status !== "Rejected"
    ).length;
    const interviewsScheduled = applications.reduce(
      (count, application) =>
        count +
        application.rounds.filter(
          (round) => round.status === "Pending" || round.status === "Rescheduled"
        ).length,
      0
    );
    const offersExtended = applications.filter((application) => application.status === "Offer Extended").length;
    const placements = applications.filter((application) => application.status === "Placed").length;
    const nextRound = applications
      .flatMap((application) => application.rounds)
      .find((round) => round.status === "Pending" || round.status === "Rescheduled");

    return {
      id: candidate.id,
      name: candidate.fullName,
      email: candidate.email,
      currentProfileStatus: applications[0]?.status ?? "Applied",
      totalApplications,
      nextRoundDate: nextRound?.dateTime ?? null,
      activeApplications,
      interviewsScheduled,
      offersExtended,
      placements,
    };
  });

  const performance = assignedCandidates.reduce<AdminEmployeePerformanceView>(
    (accumulator, summary) => {
      return {
        totalAssignedCandidates: accumulator.totalAssignedCandidates + 1,
        totalApplicationsSubmitted: accumulator.totalApplicationsSubmitted + summary.totalApplications,
        totalInterviewsScheduled: accumulator.totalInterviewsScheduled + summary.interviewsScheduled,
        totalOffersExtended: accumulator.totalOffersExtended + summary.offersExtended,
        totalPlacements: accumulator.totalPlacements + summary.placements,
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

  return {
    id: recruiter.id,
    name: recruiter.name,
    email: recruiter.email,
    phone: recruiter.phone,
    role: recruiter.role === "ADMIN" ? "Admin" : "Recruiter",
    imageUrl: recruiter.profilePhotoUrl ?? undefined,
    lastActivityDate: formatDate(recruiter.updatedAt),
    assignedCandidates: assignedCandidates.map(({ id, name, email, currentProfileStatus, totalApplications, nextRoundDate }) => ({
      id,
      name,
      email,
      currentProfileStatus,
      totalApplications,
      nextRoundDate,
    })),
    performance,
  };
}