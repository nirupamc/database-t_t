import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Sidebar />
      <TopBar />
      <main className="flex-1 lg:pl-64 pt-16">
        {children}
      </main>
    </div>
  );
}
