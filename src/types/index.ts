// ───────────────────────────────────────────────
// Domain types for the Recruitment Dashboard
// ───────────────────────────────────────────────

/** Interview round status */
export type RoundStatus = "Pending" | "Cleared" | "Rescheduled" | "Failed";

/** Application-level status */
export type ApplicationStatus =
  | "Applied"
  | "HR Screen"
  | "Interview Scheduled"
  | "In Interview"
  | "Technical Interview"
  | "Offer Stage"
  | "Offer Received"
  | "Rejected"
  | "On Hold"
  | "Draft";

/** Interview round mode */
export type InterviewMode =
  | "Phone"
  | "Video Call (Google Meet)"
  | "Video Call (Zoom)"
  | "In-Person"
  | "Take-Home Assignment";

/** Round type */
export type RoundType =
  | "Confirmation Call"
  | "HR Screen"
  | "Technical Interview"
  | "System Design"
  | "Behavioral"
  | "Live Coding"
  | "Final Round"
  | "Managerial";

/** Lipsync quality rating */
export type LipsyncQuality = "Excellent" | "Good" | "Average" | "Poor";

/** Single interview round */
export interface InterviewRound {
  id: string;
  roundNumber: number;
  title: string;
  roundType: RoundType;
  date: string;        // ISO date
  time: string;        // e.g. "02:30 PM"
  timezone: string;
  duration: string;    // e.g. "30 mins"
  mode: InterviewMode;
  vcReceiver: string;
  frontendCoordinator: string;
  lipsyncQuality: LipsyncQuality;
  feedback: string;
  status: RoundStatus;
}

/** A job application for a candidate */
export interface Application {
  id: string;
  jobTitle: string;
  company: string;
  workMode: "Remote" | "Hybrid" | "Onsite";
  source: string;         // e.g. "LinkedIn", "Naukri", "Referral"
  jobPostingUrl?: string;
  status: ApplicationStatus;
  appliedDate: string;
  hiringManager?: string;
  tags: string[];          // skill/source tags shown as pills
  nextAction?: string;
  rounds: InterviewRound[];
}

/** Candidate profile */
export interface Candidate {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedIn: string;
  avatarUrl: string;
  location: string;
  workType: string;        // "Full-time", "Contract", etc.
  workMode: string;        // "Remote", "Hybrid", "Onsite"
  skills: string[];
  noticePeriod: string;
  currentCtc: string;
  expectedCtc: string;
  yearsOfExperience: number;
  resumeUrl?: string;
  assignedRecruiter: string;
  notes: string;
  applications: Application[];
  createdAt: string;       // ISO date
  uvPhone?: string;
  uvPassword?: string;
}

/** Recruiter user (simplified) */
export interface Recruiter {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
}
