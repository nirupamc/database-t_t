import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";

/** Layout for /add-candidate  (reuses sidebar + topbar) */
export default function AddCandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
