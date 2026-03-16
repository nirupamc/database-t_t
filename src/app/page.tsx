import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/** Root page – redirect based on session */
export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");
  redirect(session.user.role === "admin" ? "/admin" : "/dashboard");
}
