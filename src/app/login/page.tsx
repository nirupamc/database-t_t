"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
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

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [forgotOpen, setForgotOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true)
      console.log('[Login] Attempting login for:', data.email)

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      console.log('[Login] SignIn result:', result)

      if (!result) {
        toast.error('Login failed. Please try again.')
        return
      }

      if (result.error) {
        console.log('[Login] Error:', result.error)
        toast.error('Invalid email or password')
        return
      }

      if (result.ok) {
        console.log('[Login] Success, fetching session...')

        // Wait briefly for session to be established
        await new Promise(resolve => setTimeout(resolve, 500))

        // Fetch the session to get the role
        const response = await fetch('/api/auth/session')
        const session = await response.json()

        console.log('[Login] Session:', session)

        if (session?.user?.role === 'ADMIN') {
          console.log('[Login] Redirecting to /admin')
          router.push('/admin')
          router.refresh()
        } else if (session?.user?.role === 'RECRUITER') {
          console.log('[Login] Redirecting to /dashboard')
          router.push('/dashboard')
          router.refresh()
        } else {
          console.log('[Login] No role found, redirecting to /dashboard')
          router.push('/dashboard')
          router.refresh()
        }
      }

    } catch (error) {
      console.error('[Login] Unexpected error:', error)
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Login to Tantech</CardTitle>
          <CardDescription>
            Use your registered Tantech credentials to continue
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
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Login"}
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
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
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
