import type { Application, Candidate, InterviewRound } from "@/types";

type CandidateWithRelations = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  personalLinkedIn: string;
  profilePhotoUrl: string | null;
  location: string;
  skills: string[];
  noticePeriod: string;
  expectedCTC: string;
  experienceYears: number;
  resumeUrl: string | null;
  employmentType: string | null;
  workMode: string | null;
  candidateType: string | null;
  applications: Array<{
    id: string;
    jobTitle: string;
    company: string;
    source: string;
    jobUrl: string;
    status: string;
    appliedDate: Date;
    techTags: string[];
    rounds: Array<{
      id: string;
      roundType: string;
      date: Date;
      time: string;
      timezone: string;
      duration: string;
      mode: string;
      vcReceiver: string | null;
      feedback: string | null;
      roundStatus: string;
      createdAt: Date;
    }>;
  }>;
  recruiter: {
    name: string;
  };
  createdAt: Date;
  uvPhone?: string | null;
  uvPassword?: string | null;
};

function mapRound(round: CandidateWithRelations["applications"][number]["rounds"][number], index: number): InterviewRound {
  return {
    id: round.id,
    roundNumber: index + 1,
    title: `Round ${index + 1}: ${round.roundType}`,
    roundType: (round.roundType as InterviewRound["roundType"]) ?? "Technical Interview",
    date: round.date.toISOString().split("T")[0],
    time: round.time,
    timezone: round.timezone,
    duration: round.duration,
    mode: (round.mode as InterviewRound["mode"]) ?? "Video Call (Google Meet)",
    vcReceiver: round.vcReceiver ?? "",
    frontendCoordinator: "Coordinator",
    lipsyncQuality: "Good",
    feedback: round.feedback ?? "",
    status: (round.roundStatus.charAt(0) + round.roundStatus.slice(1).toLowerCase()) as InterviewRound["status"],
  };
}

function mapApplication(application: CandidateWithRelations["applications"][number]): Application {
  const statusMap: Record<string, Application["status"]> = {
    APPLIED: "Applied",
    INTERVIEW_SCHEDULED: "Interview Scheduled",
    FEEDBACK_RECEIVED: "In Interview",
    OFFER_EXTENDED: "Offer Stage",
    PLACED: "Offer Received",
    REJECTED: "Rejected",
    ON_HOLD: "On Hold",
  };

  return {
    id: application.id,
    jobTitle: application.jobTitle,
    company: application.company,
    workMode: "Hybrid",
    source: application.source,
    jobPostingUrl: application.jobUrl,
    status: statusMap[application.status] ?? "Applied",
    appliedDate: application.appliedDate.toISOString().split("T")[0],
    tags: application.techTags,
    nextAction: application.rounds[0]?.date
      ? `Round on ${application.rounds[0].date.toISOString().split("T")[0]}`
      : undefined,
    rounds: application.rounds.map(mapRound),
  };
}

// Map employment type from database to display format
function formatEmploymentType(type: string | null): string {
  if (!type) return "Full-time";
  const map: Record<string, string> = {
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    FREELANCE: "Freelance",
    CONTRACT: "Contract",
    INTERNSHIP: "Internship",
  };
  return map[type] || type;
}

// Map work mode from database to display format
function formatWorkMode(mode: string | null): string {
  if (!mode) return "Hybrid";
  const map: Record<string, string> = {
    ON_SITE: "Onsite",
    HYBRID: "Hybrid",
    REMOTE: "Remote",
  };
  return map[mode] || mode;
}

// Map candidate type from database to display format
function formatCandidateType(type: string | null): string {
  if (!type) return "";
  const map: Record<string, string> = {
    OPT: "OPT",
    FULL_TIME: "Full-time",
    C2C: "C2C",
  };
  return map[type] || type;
}

export function mapCandidateToView(candidate: CandidateWithRelations): Candidate {
  return {
    id: candidate.id,
    name: candidate.fullName,
    title: candidate.skills[0] ? `${candidate.skills[0]} Specialist` : "Candidate",
    email: candidate.email,
    phone: candidate.phone,
    linkedIn: candidate.personalLinkedIn,
    avatarUrl: candidate.profilePhotoUrl ?? "",
    location: candidate.location,
    workType: formatEmploymentType(candidate.employmentType),
    workMode: formatWorkMode(candidate.workMode),
    skills: candidate.skills,
    noticePeriod: candidate.noticePeriod,
    currentCtc: "Confidential",
    expectedCtc: candidate.expectedCTC,
    yearsOfExperience: candidate.experienceYears,
    resumeUrl: candidate.resumeUrl ?? undefined,
    assignedRecruiter: candidate.recruiter.name,
    notes: "",
    employmentType: candidate.employmentType ?? undefined,
    candidateType: formatCandidateType(candidate.candidateType) || undefined,
    applications: candidate.applications.map(mapApplication),
    createdAt: candidate.createdAt.toISOString(),
    uvPhone: candidate.uvPhone ?? undefined,
    uvPassword: candidate.uvPassword ?? undefined,
  };
}
