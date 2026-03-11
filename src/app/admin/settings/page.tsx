import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Settings</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Placeholder settings page for admin-level preferences.
      </CardContent>
    </Card>
  );
}
