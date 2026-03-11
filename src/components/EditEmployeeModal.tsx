"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EmployeeRecord } from "@/lib/fakeEmployees";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().min(10, "Phone is required"),
});

type FormValues = z.infer<typeof schema>;

interface EditEmployeeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeRecord;
  onSave: (employee: EmployeeRecord) => void;
}

export function EditEmployeeModal({ open, onOpenChange, employee, onSave }: EditEmployeeModalProps) {
  const [imagePreview, setImagePreview] = useState<string | undefined>(employee.imageUrl);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
    },
  });

  useEffect(() => {
    reset({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
    });
    setImagePreview(employee.imageUrl);
  }, [employee, reset]);

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

    onSave({
      ...employee,
      name: values.name,
      email: values.email,
      phone: values.phone,
      imageUrl: imagePreview,
    });
    toast.success("Employee profile updated");
    onOpenChange(false);
  };

  const initials = employee.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>Update personal details and profile image.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border border-border">
              <AvatarImage src={imagePreview} alt={employee.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <Label htmlFor="edit-image">Image Upload (optional)</Label>
              <label
                htmlFor="edit-image"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
              >
                <Upload className="h-4 w-4" /> Upload Image
              </label>
              <Input id="edit-image" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input id="edit-phone" {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
