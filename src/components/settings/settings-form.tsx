"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Upload,
  Trash2,
  LogOut,
} from "lucide-react";
import { currentRecruiter } from "@/lib/data";

// ── Zod schema ──
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  timezone: z.string().min(1, "Timezone is required"),
  defaultSource: z.string().optional(),
  defaultStatus: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  interviewNotifications: z.boolean().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// ── Timezone options ──
const timezoneOptions = ["IST", "CST", "EST", "PST", "GMT", "CET", "JST", "AEST"] as const;

// ── Source options ──
const sourceOptions = ["LinkedIn", "Naukri", "Referral", "Company Career Site", "Other"] as const;

// ── Status options ──
const statusOptions = [
  "Applied",
  "Interview Scheduled",
  "Feedback Received",
  "Offer Extended",
  "Placed",
  "Rejected",
  "On Hold",
] as const;

export function SettingsForm() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentRecruiter.name,
      phone: "+91 98765 43210",
      timezone: "IST",
      defaultSource: "LinkedIn",
      defaultStatus: "Applied",
      emailNotifications: true,
      interviewNotifications: true,
    },
  });

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      toast.success("Logged out successfully");
      router.push("/");
    }, 500);
  };

  const onSubmit = async (data: ProfileFormValues) => {
    await new Promise((r) => setTimeout(r, 800));
    console.log("Saving settings:", data);
    toast.success("Settings saved successfully!");
  };

  const watchedTimezone = watch("timezone");
  const watchedSource = watch("defaultSource");
  const watchedStatus = watch("defaultStatus");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl mx-auto">
      {/* ── Page heading ── */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings & Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings, preferences, and notifications
        </p>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="profile">👤 Profile</TabsTrigger>
          <TabsTrigger value="preferences">⚙️ Preferences</TabsTrigger>
          <TabsTrigger value="notifications">🔔 Notifications</TabsTrigger>
        </TabsList>

        {/* ────── PROFILE TAB ────── */}
        <TabsContent value="profile" className="space-y-4 mt-4">
          {/* Avatar section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Photo</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <Avatar className="h-20 w-20 border-4 border-primary/10">
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {currentRecruiter.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info("Photo upload coming soon")}
                >
                  <Upload className="h-4 w-4 mr-2" /> Upload Photo
                </Button>
                <Button type="button" variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Remove
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
              <CardDescription>Update your basic profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="Your name" {...register("name")} />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Email (read-only) */}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={currentRecruiter.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email is managed by your administrator
                </p>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 000-0000"
                  {...register("phone")}
                />
              </div>

              {/* Timezone */}
              <div className="space-y-1.5">
                <Label>Preferred Timezone</Label>
                <Select
                  value={watchedTimezone}
                  onValueChange={(v) => setValue("timezone", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneOptions.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Save button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </TabsContent>

        {/* ────── PREFERENCES TAB ────── */}
        <TabsContent value="preferences" className="space-y-4 mt-4">
          {/* Default settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Defaults</CardTitle>
              <CardDescription>
                Set default values for new applications you create
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Default Source */}
              <div className="space-y-1.5">
                <Label>Default Application Source</Label>
                <Select
                  value={watchedSource}
                  onValueChange={(v) => setValue("defaultSource", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Default Status */}
              <div className="space-y-1.5">
                <Label>Default Application Status</Label>
                <Select
                  value={watchedStatus}
                  onValueChange={(v) => setValue("defaultStatus", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Theme */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Appearance</CardTitle>
              <CardDescription>
                Choose Light, Dark, or follow your system preference
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <ThemeToggle />
              <p className="text-xs text-muted-foreground">
                Theme preference is saved automatically and shared across the dashboard.
              </p>
            </CardContent>
          </Card>

          {/* Save button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Preferences"}
            </Button>
          </div>
        </TabsContent>

        {/* ────── NOTIFICATIONS TAB ────── */}
        <TabsContent value="notifications" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Email Notifications</CardTitle>
              <CardDescription>Choose what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New assignments */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium text-sm">New Candidate Assignments</p>
                  <p className="text-xs text-muted-foreground">
                    Get notified when a new candidate is assigned to you
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 cursor-pointer"
                  onChange={(e) => setValue("emailNotifications", e.target.checked)}
                />
              </div>

              {/* Upcoming interviews */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium text-sm">Upcoming Interview Reminders</p>
                  <p className="text-xs text-muted-foreground">
                    Receive reminders 24 hours before scheduled interviews
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 cursor-pointer"
                  onChange={(e) => setValue("interviewNotifications", e.target.checked)}
                />
              </div>

              {/* Application status updates */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium text-sm">Application Status Updates</p>
                  <p className="text-xs text-muted-foreground">
                    Get notified when application statuses change
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 cursor-pointer"
                />
              </div>

              {/* Weekly digest */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                <div>
                  <p className="font-medium text-sm">Weekly Digest</p>
                  <p className="text-xs text-muted-foreground">
                    Receive a summary of your weekly activity every Monday
                  </p>
                </div>
                <input type="checkbox" className="h-4 w-4 cursor-pointer" />
              </div>
            </CardContent>
          </Card>

          {/* Save button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Notifications"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Danger Zone ── */}
      <Separator className="my-8" />

      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Actions here cannot be undone. Please be careful.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="destructive"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isLoggingOut ? "Logging out..." : "Logout"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
