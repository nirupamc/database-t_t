import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";

/** Dashboard layout – sidebar + top bar wrapping all /dashboard/* routes */
export default function DashboardLayout({
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
