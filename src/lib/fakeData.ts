export type EmployeeRole = "Recruiter" | "Admin";
export type InterviewStatus = "Pending" | "Scheduled" | "Completed";
export type RoundStatus = "Pending" | "Cleared" | "Rescheduled" | "Failed";
export type ApplicationStatus =
  | "Applied"
  | "Screening"
  | "Interviewing"
  | "Offer"
  | "Placed"
  | "Rejected";

export interface EmployeeRecord {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  assignedCandidates: number;
  totalApplications: number;
  totalPlacements: number;
  lastActivityDate: string;
}

export interface CandidateRound {
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
  status: RoundStatus;
}

export interface CandidateApplication {
  id: string;
  jobTitle: string;
  company: string;
  jobPostingUrl: string;
  appliedDate: string;
  source: string;
  techTags: string[];
  status: ApplicationStatus;
  rounds: CandidateRound[];
}

export interface CandidateRecord {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedInUrl: string;
  avatarUrl?: string;
  assignedRecruiter: string;
  experienceYears: number;
  location: string;
  noticePeriod: string;
  expectedCtc: string;
  resumeLink: string;
  quickNotes: string;
  applications: CandidateApplication[];
}

export interface CandidateMetrics {
  totalApplications: number;
  activeApplications: number;
  interviewsScheduled: number;
  offersExtended: number;
  placements: number;
  latestApplicationStatus: ApplicationStatus;
}

export const employeesSeed: EmployeeRecord[] = [
  {
    id: "emp-1",
    name: "Faizan Ahmed",
    email: "faizan@hireflow.com",
    role: "Admin",
    assignedCandidates: 9,
    totalApplications: 32,
    totalPlacements: 6,
    lastActivityDate: "2026-03-11",
  },
  {
    id: "emp-2",
    name: "Priya Sharma",
    email: "priya@hireflow.com",
    role: "Recruiter",
    assignedCandidates: 14,
    totalApplications: 51,
    totalPlacements: 8,
    lastActivityDate: "2026-03-10",
  },
  {
    id: "emp-3",
    name: "Sarah Jenkins",
    email: "sarah@hireflow.com",
    role: "Recruiter",
    assignedCandidates: 11,
    totalApplications: 45,
    totalPlacements: 7,
    lastActivityDate: "2026-03-09",
  },
  {
    id: "emp-4",
    name: "Rohit Nair",
    email: "rohit@hireflow.com",
    role: "Recruiter",
    assignedCandidates: 10,
    totalApplications: 39,
    totalPlacements: 5,
    lastActivityDate: "2026-03-08",
  },
  {
    id: "emp-5",
    name: "Anita Roy",
    email: "anita@hireflow.com",
    role: "Recruiter",
    assignedCandidates: 8,
    totalApplications: 28,
    totalPlacements: 4,
    lastActivityDate: "2026-03-10",
  },
  {
    id: "emp-6",
    name: "Nirupam Chatterjee",
    email: "nirupam@hireflow.com",
    role: "Admin",
    assignedCandidates: 7,
    totalApplications: 23,
    totalPlacements: 5,
    lastActivityDate: "2026-03-07",
  },
  {
    id: "emp-7",
    name: "Ayesha Khan",
    email: "ayesha@hireflow.com",
    role: "Recruiter",
    assignedCandidates: 12,
    totalApplications: 41,
    totalPlacements: 6,
    lastActivityDate: "2026-03-09",
  },
  {
    id: "emp-8",
    name: "Daniel Park",
    email: "daniel@hireflow.com",
    role: "Recruiter",
    assignedCandidates: 6,
    totalApplications: 20,
    totalPlacements: 3,
    lastActivityDate: "2026-03-06",
  },
];

const recruiters = employeesSeed
  .filter((employee) => employee.role === "Recruiter")
  .map((employee) => employee.name);

const roundStatusPool: RoundStatus[] = ["Pending", "Cleared", "Rescheduled", "Failed"];
const applicationStatusPool: ApplicationStatus[] = [
  "Applied",
  "Screening",
  "Interviewing",
  "Offer",
  "Placed",
  "Rejected",
];

const candidateProfiles = [
  {
    name: "Aarav Mehta",
    title: "Senior Frontend Engineer",
    location: "Bengaluru",
    experienceYears: 7,
    noticePeriod: "30 Days",
    expectedCtc: "INR 34 LPA",
    phone: "+91 98765 11001",
    avatarUrl: "https://i.pravatar.cc/160?img=12",
    quickNotes: "Strong React architecture depth and excellent stakeholder communication.",
  },
  {
    name: "Sneha Reddy",
    title: "Product Designer",
    location: "Hyderabad",
    experienceYears: 6,
    noticePeriod: "Immediate",
    expectedCtc: "INR 24 LPA",
    phone: "+91 98765 11002",
    avatarUrl: "https://i.pravatar.cc/160?img=32",
    quickNotes: "Portfolio quality is high, especially design systems and research storytelling.",
  },
  {
    name: "Rohan Kapoor",
    title: "Backend Engineer",
    location: "Pune",
    experienceYears: 5,
    noticePeriod: "45 Days",
    expectedCtc: "INR 28 LPA",
    phone: "+91 98765 11003",
    avatarUrl: "https://i.pravatar.cc/160?img=14",
    quickNotes: "Strong in distributed systems and API performance tuning.",
  },
  {
    name: "Maya Iyer",
    title: "QA Automation Lead",
    location: "Chennai",
    experienceYears: 8,
    noticePeriod: "15 Days",
    expectedCtc: "INR 22 LPA",
    phone: "+91 98765 11004",
    avatarUrl: "https://i.pravatar.cc/160?img=47",
    quickNotes: "Has built Cypress and Playwright suites across multiple product lines.",
  },
  {
    name: "Kabir Malhotra",
    title: "Data Analyst",
    location: "Gurugram",
    experienceYears: 4,
    noticePeriod: "30 Days",
    expectedCtc: "INR 18 LPA",
    phone: "+91 98765 11005",
    avatarUrl: "https://i.pravatar.cc/160?img=53",
    quickNotes: "Sharp SQL and dashboarding skills, needs deeper experimentation examples.",
  },
  {
    name: "Ananya Das",
    title: "Full Stack Developer",
    location: "Kolkata",
    experienceYears: 6,
    noticePeriod: "60 Days",
    expectedCtc: "INR 26 LPA",
    phone: "+91 98765 11006",
    avatarUrl: "https://i.pravatar.cc/160?img=44",
    quickNotes: "Balanced frontend and backend profile with strong ownership signals.",
  },
  {
    name: "Vikram Sethi",
    title: "DevOps Engineer",
    location: "Noida",
    experienceYears: 7,
    noticePeriod: "30 Days",
    expectedCtc: "INR 31 LPA",
    phone: "+91 98765 11007",
    avatarUrl: "https://i.pravatar.cc/160?img=60",
    quickNotes: "Very strong on AWS and Kubernetes, moderate on security automation.",
  },
  {
    name: "Pooja Sen",
    title: "Talent Acquisition Specialist",
    location: "Mumbai",
    experienceYears: 5,
    noticePeriod: "Immediate",
    expectedCtc: "INR 16 LPA",
    phone: "+91 98765 11008",
    avatarUrl: "https://i.pravatar.cc/160?img=25",
    quickNotes: "Relevant only for internal TA roles, excellent closing track record.",
  },
  {
    name: "Rahul Verma",
    title: "Machine Learning Engineer",
    location: "Bengaluru",
    experienceYears: 6,
    noticePeriod: "45 Days",
    expectedCtc: "INR 36 LPA",
    phone: "+91 98765 11009",
    avatarUrl: "https://i.pravatar.cc/160?img=66",
    quickNotes: "Strong on production ML pipelines, weaker on deep research depth.",
  },
  {
    name: "Nisha Patel",
    title: "Business Analyst",
    location: "Ahmedabad",
    experienceYears: 5,
    noticePeriod: "15 Days",
    expectedCtc: "INR 17 LPA",
    phone: "+91 98765 11010",
    avatarUrl: "https://i.pravatar.cc/160?img=23",
    quickNotes: "Very articulate, with clean BRD and stakeholder alignment examples.",
  },
  {
    name: "Karthik Raman",
    title: "Engineering Manager",
    location: "Hyderabad",
    experienceYears: 10,
    noticePeriod: "60 Days",
    expectedCtc: "INR 52 LPA",
    phone: "+91 98765 11011",
    avatarUrl: "https://i.pravatar.cc/160?img=69",
    quickNotes: "Good delivery leadership and hiring signals, could be stronger on technical depth.",
  },
  {
    name: "Ishita Bose",
    title: "Content Strategist",
    location: "Remote",
    experienceYears: 4,
    noticePeriod: "30 Days",
    expectedCtc: "INR 14 LPA",
    phone: "+91 98765 11012",
    avatarUrl: "https://i.pravatar.cc/160?img=41",
    quickNotes: "Brand writing samples are strong; B2B SaaS experience is relevant.",
  },
  {
    name: "Aditya Kulkarni",
    title: "Mobile Engineer",
    location: "Pune",
    experienceYears: 5,
    noticePeriod: "30 Days",
    expectedCtc: "INR 25 LPA",
    phone: "+91 98765 11013",
    avatarUrl: "https://i.pravatar.cc/160?img=8",
    quickNotes: "Cross-platform depth is strong, native Android depth is moderate.",
  },
  {
    name: "Simran Kaur",
    title: "HR Operations Lead",
    location: "Delhi",
    experienceYears: 7,
    noticePeriod: "Immediate",
    expectedCtc: "INR 19 LPA",
    phone: "+91 98765 11014",
    avatarUrl: "https://i.pravatar.cc/160?img=5",
    quickNotes: "Process-heavy profile with solid compliance and onboarding systems exposure.",
  },
  {
    name: "Yash Thakur",
    title: "Cloud Architect",
    location: "Noida",
    experienceYears: 11,
    noticePeriod: "90 Days",
    expectedCtc: "INR 58 LPA",
    phone: "+91 98765 11015",
    avatarUrl: "https://i.pravatar.cc/160?img=67",
    quickNotes: "Excellent enterprise cloud migration background with client-facing confidence.",
  },
  {
    name: "Fatima Noor",
    title: "Customer Success Manager",
    location: "Mumbai",
    experienceYears: 6,
    noticePeriod: "30 Days",
    expectedCtc: "INR 21 LPA",
    phone: "+91 98765 11016",
    avatarUrl: "https://i.pravatar.cc/160?img=39",
    quickNotes: "Strong retention and renewals metrics, should be shortlisted for SaaS CS roles.",
  },
  {
    name: "Harsh Gupta",
    title: "Site Reliability Engineer",
    location: "Bengaluru",
    experienceYears: 8,
    noticePeriod: "45 Days",
    expectedCtc: "INR 33 LPA",
    phone: "+91 98765 11017",
    avatarUrl: "https://i.pravatar.cc/160?img=16",
    quickNotes: "Strong incident response and observability ownership in high-scale teams.",
  },
  {
    name: "Meera Joshi",
    title: "Project Manager",
    location: "Chennai",
    experienceYears: 9,
    noticePeriod: "30 Days",
    expectedCtc: "INR 27 LPA",
    phone: "+91 98765 11018",
    avatarUrl: "https://i.pravatar.cc/160?img=31",
    quickNotes: "Can run cross-functional delivery well, especially for enterprise rollouts.",
  },
  {
    name: "Arjun Nambiar",
    title: "Cybersecurity Analyst",
    location: "Kochi",
    experienceYears: 5,
    noticePeriod: "15 Days",
    expectedCtc: "INR 23 LPA",
    phone: "+91 98765 11019",
    avatarUrl: "https://i.pravatar.cc/160?img=11",
    quickNotes: "Strong threat monitoring and vulnerability triage, limited GRC exposure.",
  },
  {
    name: "Tanya Arora",
    title: "Growth Marketing Manager",
    location: "Gurugram",
    experienceYears: 6,
    noticePeriod: "30 Days",
    expectedCtc: "INR 20 LPA",
    phone: "+91 98765 11020",
    avatarUrl: "https://i.pravatar.cc/160?img=37",
    quickNotes: "Performance marketing metrics are strong and SaaS funnel understanding is solid.",
  },
] as const;

const companyPool = [
  "NovaStack",
  "BlueOrbit",
  "CloudHarbor",
  "BrightPixel",
  "TalentForge",
  "Astra Labs",
  "PulseGrid",
  "ZenithPay",
  "Maple Systems",
  "CipherOne",
];

const jobPool = [
  "Senior React Engineer",
  "Lead Product Designer",
  "Platform Backend Engineer",
  "QA Automation Manager",
  "Data Insights Analyst",
  "Full Stack Developer",
  "DevOps Consultant",
  "ML Platform Engineer",
  "Engineering Manager",
  "Cloud Infrastructure Architect",
];

const sourcePool = ["LinkedIn", "Naukri", "Referral", "Company Careers", "Instahyre", "Foundit"];
const techTagPool = [
  "React",
  "Next.js",
  "Node.js",
  "TypeScript",
  "Java",
  "Python",
  "AWS",
  "Kubernetes",
  "Figma",
  "SQL",
  "Cypress",
  "Playwright",
  "TensorFlow",
  "Kafka",
  "Docker",
  "GCP",
];
const roundTypePool = ["HR Screen", "Technical Round 1", "Technical Round 2", "Managerial", "Client Round"];
const modePool = ["Google Meet", "Microsoft Teams", "Zoom", "In Person"];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function formatDate(offset: number) {
  const day = ((offset % 28) + 1).toString().padStart(2, "0");
  return `2026-02-${day}`;
}

function formatDateTime(offset: number) {
  const day = ((offset % 28) + 1).toString().padStart(2, "0");
  const hour = (10 + (offset % 8)).toString().padStart(2, "0");
  const minute = offset % 2 === 0 ? "00" : "30";
  return `2026-03-${day}T${hour}:${minute}:00+05:30`;
}

function getRoundStatus(status: ApplicationStatus, roundIndex: number, seed: number): RoundStatus {
  if (status === "Placed") {
    return roundIndex === 3 ? "Cleared" : roundStatusPool[(seed + roundIndex + 1) % 2];
  }

  if (status === "Offer") {
    return roundIndex === 2 ? "Cleared" : roundStatusPool[(seed + roundIndex) % 3];
  }

  if (status === "Rejected") {
    return roundIndex === 1 ? "Failed" : roundStatusPool[(seed + roundIndex) % roundStatusPool.length];
  }

  return roundStatusPool[(seed + roundIndex) % roundStatusPool.length];
}

function buildRounds(candidateIndex: number, applicationIndex: number, status: ApplicationStatus): CandidateRound[] {
  const roundCount = 1 + ((candidateIndex + applicationIndex) % 4);

  return Array.from({ length: roundCount }).map((_, roundIndex) => {
    const seed = candidateIndex * 3 + applicationIndex + roundIndex;
    const roundStatus = getRoundStatus(status, roundIndex, seed);

    return {
      id: `round-${candidateIndex + 1}-${applicationIndex + 1}-${roundIndex + 1}`,
      roundType: roundTypePool[roundIndex % roundTypePool.length],
      dateTime: formatDateTime(seed + 4),
      timezone: "IST",
      duration: `${45 + ((seed % 3) * 15)} mins`,
      mode: modePool[seed % modePool.length],
      vcReceiver: [`panel${(seed % 4) + 1}@hireflow.com`, `team${(seed % 5) + 1}@company.com`][seed % 2],
      frontend: seed % 2 === 0,
      lipsync: seed % 3 === 0,
      feedback:
        roundStatus === "Cleared"
          ? "Strong communication and role-relevant depth. Proceed to next stage."
          : roundStatus === "Failed"
            ? "Skill alignment was partial and examples lacked depth for this role."
            : roundStatus === "Rescheduled"
              ? "Candidate requested a revised slot due to another interview overlap."
              : "Awaiting interviewer submission after the scheduled round.",
      status: roundStatus,
    };
  });
}

function buildApplications(candidateIndex: number): CandidateApplication[] {
  const count = 2 + (candidateIndex % 7);

  return Array.from({ length: count }).map((_, applicationIndex) => {
    const status = applicationStatusPool[(candidateIndex + applicationIndex) % applicationStatusPool.length];
    const company = companyPool[(candidateIndex + applicationIndex) % companyPool.length];
    const jobTitle = jobPool[(candidateIndex + applicationIndex * 2) % jobPool.length];
    const techTags = Array.from({ length: 3 }).map(
      (_, tagIndex) => techTagPool[(candidateIndex + applicationIndex + tagIndex) % techTagPool.length]
    );

    return {
      id: `app-${candidateIndex + 1}-${applicationIndex + 1}`,
      jobTitle,
      company,
      jobPostingUrl: `https://jobs.example.com/${slugify(company)}/${slugify(jobTitle)}`,
      appliedDate: formatDate(candidateIndex + applicationIndex + 1),
      source: sourcePool[(candidateIndex + applicationIndex) % sourcePool.length],
      techTags,
      status,
      rounds: buildRounds(candidateIndex, applicationIndex, status),
    };
  });
}

export const candidatesSeed: CandidateRecord[] = candidateProfiles.map((profile, index) => ({
  id: `acand-${index + 1}`,
  name: profile.name,
  title: profile.title,
  email: `${slugify(profile.name)}@mail.com`,
  phone: profile.phone,
  linkedInUrl: `https://www.linkedin.com/in/${slugify(profile.name)}`,
  avatarUrl: profile.avatarUrl,
  assignedRecruiter: recruiters[index % recruiters.length],
  experienceYears: profile.experienceYears,
  location: profile.location,
  noticePeriod: profile.noticePeriod,
  expectedCtc: profile.expectedCtc,
  resumeLink: `https://example.com/resumes/${slugify(profile.name)}.pdf`,
  quickNotes: profile.quickNotes,
  applications: buildApplications(index),
}));

export function getCandidateMetrics(candidate: CandidateRecord): CandidateMetrics {
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
  const offersExtended = candidate.applications.filter((application) => application.status === "Offer").length;
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
