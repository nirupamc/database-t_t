import { SettingsForm } from "@/components/settings/settings-form";

export const metadata = {
  title: "Settings | HireFlow",
  description: "Manage your profile, preferences, and notifications",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6 p-6 md:p-8">
      <SettingsForm />
    </div>
  );
}
