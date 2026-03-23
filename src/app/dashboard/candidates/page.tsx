import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus } from "lucide-react";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic'

/** My Candidates list page – /dashboard/candidates */
export default async function CandidatesPage() {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login");
  }

  const candidates = await prisma.candidate.findMany({
    where: session.user.role === "admin" ? {} : { recruiterId: session.user.id },
    include: { applications: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Candidates</h1>
          <p className="text-muted-foreground">All candidates in your pipeline</p>
        </div>
        <Button asChild className="bg-primary">
          <Link href="/add-candidate">
            <UserPlus className="h-4 w-4 mr-2" /> Add Candidate
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {candidates.map((candidate) => (
          <Card key={candidate.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-primary/10 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {candidate.fullName.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{candidate.fullName}</h3>
                    <Badge variant="secondary" className="text-xs">{candidate.skills[0] ?? "Profile"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {candidate.email} · {candidate.location}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {candidate.skills.slice(0, 4).map((s) => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <Badge variant="info" className="text-xs">
                    {candidate.applications.length} app{candidate.applications.length !== 1 ? "s" : ""}
                  </Badge>
                  <div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/dashboard/candidates/${candidate.id}`}>View Profile</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
