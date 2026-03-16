"use client";

"use no memo";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  Trash2,
  LogOut,
  Calendar,
  Bell,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Check,
  Info,
  MessageCircle,
} from "lucide-react";
import { 
  updateReminderTimingAction, 
  disconnectGoogleCalendarAction 
} from "@/actions/settings";
import { formatPhoneDisplay, validateIndianMobile } from "@/lib/phone-utils";

interface SettingsUser {
  name: string;
  email: string;
  phone: string | null;
}

interface SettingsFormProps {
  user: SettingsUser;
  calendarConnected: boolean;
  reminderTiming: number;
  googleTokenExpiry: string | null;
  calendarParam?: string;
  successMessage?: string;
  errorMessage?: string;
}

// Google Calendar SVG Icon
function GoogleCalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.5 4H5.5C4.67 4 4 4.67 4 5.5V18.5C4 19.33 4.67 20 5.5 20H18.5C19.33 20 20 19.33 20 18.5V5.5C20 4.67 19.33 4 18.5 4Z" fill="#4285F4"/>
      <path d="M18.5 4H12V12H20V5.5C20 4.67 19.33 4 18.5 4Z" fill="#EA4335"/>
      <path d="M20 12H12V20H18.5C19.33 20 20 19.33 20 18.5V12Z" fill="#FBBC04"/>
      <path d="M12 12H4V18.5C4 19.33 4.67 20 5.5 20H12V12Z" fill="#34A853"/>
      <path d="M8 9H10V11H8V9Z" fill="white"/>
      <path d="M14 9H16V11H14V9Z" fill="white"/>
      <path d="M8 14H10V16H8V14Z" fill="white"/>
      <path d="M14 14H16V16H14V14Z" fill="white"/>
    </svg>
  );
}

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

/**
 * Mask phone number for privacy display
 * "+91 98765 43210" → "+91 XXXXX 43210"
 * Handles various input formats by normalizing first
 */
function maskPhoneNumber(phone: string): string {
  const formatted = formatPhoneDisplay(phone);
  // formatPhoneDisplay returns "+91 XXXXX XXXXX" format
  // We want to mask first 5 digits: "+91 XXXXX 43210"
  // The regex handles the space between +91 and digits
  return formatted.replace(/(\+91 )(\d{5})( \d{5})/, "$1XXXXX$3");
}

/**
 * Check if token is expiring within 24 hours
 */
function isTokenExpiringSoon(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const hoursUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
  return hoursUntilExpiry > 0 && hoursUntilExpiry <= 24;
}

export function SettingsForm({ 
  user, 
  calendarConnected, 
  reminderTiming: initialReminderTiming,
  googleTokenExpiry,
  calendarParam,
  successMessage,
  errorMessage,
}: SettingsFormProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [reminderTiming, setReminderTiming] = useState(initialReminderTiming.toString());
  const [isSavingReminder, setIsSavingReminder] = useState(false);
  const [reminderSaveSuccess, setReminderSaveSuccess] = useState(false);

  // Validate phone number
  const phoneValidation = user.phone ? validateIndianMobile(user.phone) : { valid: false, error: "No phone number" };
  const tokenExpiringSoon = isTokenExpiringSoon(googleTokenExpiry);

  // Handle URL params for calendar connection status
  useEffect(() => {
    if (calendarParam === "connected") {
      toast.success("Google Calendar connected successfully!", {
        description: "Your interviews will now sync automatically.",
      });
      router.replace("/settings");
    } else if (calendarParam === "error") {
      toast.error("Failed to connect Google Calendar", {
        description: "Please try again.",
      });
      router.replace("/settings");
    } else if (calendarParam === "disconnected") {
      toast.info("Google Calendar disconnected.");
      router.replace("/settings");
    }
  }, [calendarParam, router]);

  // Show toast messages from URL params (legacy)
  useEffect(() => {
    if (successMessage === "google_calendar_connected") {
      toast.success("Google Calendar connected successfully!");
    }
    if (errorMessage) {
      const errorMessages: Record<string, string> = {
        google_auth_failed: "Failed to connect Google Calendar",
        google_auth_denied: "Google Calendar access was denied",
        google_auth_no_code: "No authorization code received",
        google_auth_invalid_state: "Invalid state parameter",
        google_auth_no_token: "No access token received",
      };
      toast.error(errorMessages[errorMessage] || "An error occurred");
    }
  }, [successMessage, errorMessage]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      phone: user.phone ?? "",
      timezone: "IST",
      defaultSource: "LinkedIn",
      defaultStatus: "Applied",
      emailNotifications: true,
      interviewNotifications: true,
    },
  });

  const handleLogout = () => {
    setIsLoggingOut(true);
    window.location.href = "/api/auth/signout?callbackUrl=/login";
  };

  const handleConnectCalendar = () => {
    setIsConnecting(true);
    window.location.href = "/api/auth/google";
  };

  const handleDisconnectCalendar = async () => {
    setIsDisconnecting(true);
    try {
      const result = await disconnectGoogleCalendarAction();
      if (result.success) {
        toast.success("Google Calendar disconnected");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to disconnect");
      }
    } catch (error) {
      toast.error("Failed to disconnect Google Calendar");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleReminderTimingChange = async (value: string) => {
    const previousValue = reminderTiming;
    setReminderTiming(value);
    setIsSavingReminder(true);
    setReminderSaveSuccess(false);
    
    try {
      const result = await updateReminderTimingAction(parseInt(value, 10));
      if (result.success) {
        setReminderSaveSuccess(true);
        setTimeout(() => setReminderSaveSuccess(false), 2000);
      } else {
        toast.error(result.error || "Failed to update");
        setReminderTiming(previousValue); // Revert on failure
      }
    } catch (error) {
      toast.error("Failed to update reminder timing");
      setReminderTiming(previousValue); // Revert on failure
    } finally {
      setIsSavingReminder(false);
    }
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
                  {user.name
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
                  value={user.email}
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
          {/* Google Calendar Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Google Calendar
              </CardTitle>
              <CardDescription>
                Sync interview rounds to your personal Google Calendar automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {calendarConnected ? (
                <>
                  {/* Connected State */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">Your Google Calendar is connected</p>
                          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                            <Check className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        </div>
                        {tokenExpiringSoon && (
                          <div className="flex items-center gap-1 mt-1">
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Token expiring soon — reconnect recommended
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {tokenExpiringSoon && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleConnectCalendar}
                          disabled={isConnecting || isDisconnecting}
                          className="border-primary text-primary hover:bg-primary/10"
                        >
                          {isConnecting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Reconnect
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isDisconnecting || isConnecting}
                            className="text-destructive hover:text-destructive border-destructive/50"
                          >
                            {isDisconnecting ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2" />
                            )}
                            Disconnect
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Disconnect Google Calendar?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure? Future interview rounds will not be added to your 
                              Google Calendar until you reconnect.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleDisconnectCalendar}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Disconnect
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Not Connected State */}
                  <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="font-medium text-sm">Not Connected</p>
                        <p className="text-xs text-muted-foreground">
                          Connect to sync interviews to Google Calendar
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={handleConnectCalendar}
                      disabled={isConnecting}
                      className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                    >
                      {isConnecting ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <GoogleCalendarIcon className="h-4 w-4 mr-2" />
                      )}
                      Connect Google Calendar
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      You&apos;ll be redirected to Google to authorize access. 
                      We only request permission to manage calendar events.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <div className="w-full p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                  <ul className="text-xs text-yellow-800 dark:text-yellow-200 space-y-1">
                    <li>• Interview rounds are added automatically when scheduled</li>
                    <li>• Events include VC links, candidate name, and role details</li>
                    <li>• Rescheduled rounds update your calendar automatically</li>
                    <li>• Deleted rounds are removed from your calendar</li>
                  </ul>
                </div>
              </div>
            </CardFooter>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Configure how and when you receive WhatsApp reminders
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Reminder Timing */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Interview Reminder</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  How long before an interview should we send you a WhatsApp reminder?
                </p>
                <div className="flex items-center gap-2">
                  <Select
                    value={reminderTiming}
                    onValueChange={handleReminderTimingChange}
                    disabled={isSavingReminder}
                  >
                    <SelectTrigger className="w-full md:w-[280px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes before</SelectItem>
                      <SelectItem value="30">30 minutes before</SelectItem>
                      <SelectItem value="60">1 hour before</SelectItem>
                      <SelectItem value="120">2 hours before</SelectItem>
                      <SelectItem value="1440">1 day before</SelectItem>
                    </SelectContent>
                  </Select>
                  {isSavingReminder && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {reminderSaveSuccess && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </div>

              <Separator />

              {/* WhatsApp Number */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp Notifications
                </Label>
                <p className="text-xs text-muted-foreground">
                  Reminders are sent to your registered phone number
                </p>
                {phoneValidation.valid ? (
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30">
                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                      Active
                    </Badge>
                    <span className="text-sm font-mono">
                      {user.phone ? maskPhoneNumber(user.phone) : "—"}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-3 border rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      No valid phone number on file. Update your phone number in the 
                      profile section to receive WhatsApp reminders.
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              {/* Notification Types */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">You will be notified for:</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-xs">
                    🗓 New interview scheduled
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    ⏰ Interview reminder
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    📋 Round status changed
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    🎉 Candidate placed
                  </Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">
                WhatsApp notifications are sent to both you and the admin for all interview-related events.
              </p>
            </CardFooter>
          </Card>

          {/* Email Notifications */}
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
