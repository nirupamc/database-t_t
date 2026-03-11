"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setAuthSession } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [forgotOpen, setForgotOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const isAdmin = values.email.toLowerCase().endsWith("@admin.com");

    if (isAdmin) {
      setAuthSession("admin");
      toast.success("Admin login successful");
      router.push("/admin");
      return;
    }

    setAuthSession("recruiter");
    toast.success("Employee login successful");
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Login to Recruitment Hub</CardTitle>
          <CardDescription>
            Use any `@admin.com` email for admin access, otherwise recruiter login
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="name@company.com" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register("password")} />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </Button>

            <div className="text-center text-sm">
              <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
                <DialogTrigger asChild>
                  <button type="button" className="text-primary hover:underline">
                    Forgot Password?
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                      Fake reset flow for demo. We sent a reset link to your email.
                    </DialogDescription>
                  </DialogHeader>
                  <Button
                    type="button"
                    onClick={() => {
                      toast.success("Reset link sent");
                      setForgotOpen(false);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Send Reset Link
                  </Button>
                </DialogContent>
              </Dialog>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Back to <Link href="/" className="text-primary hover:underline">Home</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
