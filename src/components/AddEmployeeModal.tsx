"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Upload } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
interface AddEmployeePayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  profilePhotoUrl?: string;
}

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Phone is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof schema>;

interface AddEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddEmployee: (employee: AddEmployeePayload) => Promise<void> | void;
  submitting?: boolean;
}

export function AddEmployeeModal({
  open,
  onOpenChange,
  onAddEmployee,
  submitting = false,
}: AddEmployeeModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(typeof reader.result === "string" ? reader.result : undefined);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (values: FormValues) => {
    await new Promise((resolve) => setTimeout(resolve, 350));

    await onAddEmployee({
      name: values.name,
      email: values.email,
      phone: values.phone,
      password: values.password,
      profilePhotoUrl: imagePreview,
    });
    reset();
    setImagePreview(undefined);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Create a new employee account for the recruitment dashboard.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border border-border">
              <AvatarImage src={imagePreview} alt="Employee preview" />
              <AvatarFallback>NE</AvatarFallback>
            </Avatar>
            <div className="space-y-1.5">
              <Label htmlFor="image">Image Upload (optional)</Label>
              <label
                htmlFor="image"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
              >
                <Upload className="h-4 w-4" /> Upload Image
              </label>
              <Input id="image" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} placeholder="Employee name" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...register("email")} placeholder="name@hireflow.com" />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} placeholder="+91 98765 43210" />
            {errors.phone && (
              <p className="text-xs text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
              />
              <button
                type="button"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                aria-label="Toggle confirm password visibility"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting || submitting}>
              {isSubmitting || submitting ? "Adding..." : "Create Employee"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
