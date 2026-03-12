import { ApplicationStatus, CandidateStatus, RoundStatus, UserRole } from "@prisma/client";

import { prisma } from "../src/lib/prisma";
import { hashPassword } from "../src/lib/password";

function randomItem<T>(items: T[], index: number) {
  return items[index % items.length];
}

async function main() {
  await prisma.round.deleteMany();
  await prisma.application.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.recruiter.deleteMany();

  const hashed = await hashPassword("Password@123");

  const employees = await prisma.$transaction(
    Array.from({ length: 5 }).map((_, index) =>
      prisma.recruiter.create({
        data: {
          name:
            index === 0
              ? "Admin User"
              : ["Priya Sharma", "Sarah Jenkins", "Rohit Nair", "Ayesha Khan"][index - 1],
          email: index === 0 ? "admin@hireflow.com" : `recruiter${index}@hireflow.com`,
          phone: `+91 90000 0000${index}`,
          password: hashed,
          role: index === 0 ? UserRole.ADMIN : UserRole.RECRUITER,
          profilePhotoUrl: `https://i.pravatar.cc/150?img=${index + 20}`,
        },
      })
    )
  );

  const recruiters = employees.filter((item) => item.role === UserRole.RECRUITER);

  const candidates = await prisma.$transaction(
    Array.from({ length: 20 }).map((_, index) => {
      const recruiter = randomItem(recruiters, index);
      return prisma.candidate.create({
        data: {
          fullName: `Candidate ${index + 1}`,
          email: `candidate${index + 1}@mail.com`,
          phone: `+91 98888 10${(index + 10).toString().padStart(2, "0")}`,
          personalLinkedIn: `https://linkedin.com/in/candidate-${index + 1}`,
          profilePhotoUrl: `https://i.pravatar.cc/150?img=${index + 1}`,
          resumeUrl: `https://example.com/resume-${index + 1}.pdf`,
          skills: ["React", "Node.js", "TypeScript", "SQL"].slice(0, 2 + (index % 3)),
          experienceYears: 2 + (index % 8),
          location: randomItem(["Bengaluru", "Hyderabad", "Pune", "Delhi"], index),
          noticePeriod: randomItem(["Immediate", "15 Days", "30 Days", "60 Days"], index),
          expectedCTC: `INR ${10 + index} LPA`,
          status: randomItem(
            [
              CandidateStatus.ACTIVE,
              CandidateStatus.ON_HOLD,
              CandidateStatus.PLACED,
              CandidateStatus.REJECTED,
            ],
            index
          ),
          recruiterId: recruiter.id,
          addedBy: recruiter.email,
        },
      });
    })
  );

  const applications = await prisma.$transaction(
    Array.from({ length: 50 }).map((_, index) => {
      const candidate = randomItem(candidates, index);
      return prisma.application.create({
        data: {
          candidateId: candidate.id,
          jobTitle: randomItem(
            [
              "Frontend Engineer",
              "Backend Engineer",
              "Full Stack Engineer",
              "QA Engineer",
              "Product Designer",
            ],
            index
          ),
          company: randomItem(["NovaStack", "BlueOrbit", "TalentForge", "CipherOne"], index),
          jobUrl: `https://jobs.example.com/posting-${index + 1}`,
          source: randomItem(["LinkedIn", "Naukri", "Referral", "Instahyre"], index),
          techTags: ["React", "Node", "AWS", "Postgres"].slice(0, 2 + (index % 2)),
          appliedDate: new Date(2026, 1, 1 + (index % 28)),
          status: randomItem(
            [
              ApplicationStatus.APPLIED,
              ApplicationStatus.INTERVIEW_SCHEDULED,
              ApplicationStatus.FEEDBACK_RECEIVED,
              ApplicationStatus.OFFER_EXTENDED,
              ApplicationStatus.PLACED,
              ApplicationStatus.REJECTED,
              ApplicationStatus.ON_HOLD,
            ],
            index
          ),
        },
      });
    })
  );

  await prisma.$transaction(
    Array.from({ length: 100 }).map((_, index) => {
      const application = randomItem(applications, index);
      return prisma.round.create({
        data: {
          applicationId: application.id,
          roundType: randomItem(["HR Screen", "Technical", "Managerial", "Client"], index),
          date: new Date(2026, 2, 1 + (index % 28)),
          time: randomItem(["10:00", "11:30", "14:00", "16:00"], index),
          timezone: "IST",
          duration: randomItem(["30 mins", "45 mins", "60 mins"], index),
          mode: randomItem(["Google Meet", "Zoom", "MS Teams"], index),
          vcReceiver: `panel${(index % 8) + 1}@hireflow.com`,
          frontend: index % 2 === 0,
          lipsync: index % 3 === 0,
          feedback: `Round feedback ${index + 1}`,
          roundStatus: randomItem(
            [RoundStatus.PENDING, RoundStatus.CLEARED, RoundStatus.RESCHEDULED, RoundStatus.FAILED],
            index
          ),
        },
      });
    })
  );

  console.log("Seed complete: 5 employees, 20 candidates, 50 applications, 100 rounds");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
