"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { z } from "zod";

import { parseOrThrow, requireAdmin } from "@/actions/_helpers";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const createEmployeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "RECRUITER"]),
  profilePhotoUrl: z.string().url().optional().or(z.literal("")),
});

const updateEmployeeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  role: z.enum(["ADMIN", "RECRUITER"]),
  profilePhotoUrl: z.string().url().optional().or(z.literal("")),
});

const changePasswordSchema = z.object({
  id: z.string().min(1),
  password: z.string().min(6),
});

export async function listEmployeesAction() {
  await requireAdmin();
  return prisma.recruiter.findMany({
    include: {
      candidates: {
        include: {
          applications: {
            include: { rounds: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getEmployeeByIdAction(id: string) {
  await requireAdmin();
  return prisma.recruiter.findUnique({
    where: { id },
    include: {
      candidates: {
        include: {
          applications: {
            include: { rounds: true },
          },
        },
      },
    },
  });
}

export async function createEmployeeAction(payload: unknown) {
  await requireAdmin();
  const data = parseOrThrow(createEmployeeSchema, payload);
  const hashedPassword = await hashPassword(data.password);

  const created = await prisma.recruiter.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      password: hashedPassword,
      role: data.role as UserRole,
      profilePhotoUrl: data.profilePhotoUrl || null,
    },
  });

  revalidatePath("/admin/employees");
  return { success: true, data: created };
}

export async function updateEmployeeAction(payload: unknown) {
  await requireAdmin();
  const data = parseOrThrow(updateEmployeeSchema, payload);

  const updated = await prisma.recruiter.update({
    where: { id: data.id },
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      role: data.role as UserRole,
      profilePhotoUrl: data.profilePhotoUrl || null,
    },
  });

  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${data.id}`);
  return { success: true, data: updated };
}

export async function changeEmployeePasswordAction(payload: unknown) {
  await requireAdmin();
  const data = parseOrThrow(changePasswordSchema, payload);
  const hashedPassword = await hashPassword(data.password);

  await prisma.recruiter.update({
    where: { id: data.id },
    data: { password: hashedPassword },
  });

  revalidatePath(`/admin/employees/${data.id}`);
  return { success: true };
}

export async function deleteEmployeeAction(id: string, reassignRecruiterId?: string) {
  await requireAdmin();

  if (reassignRecruiterId) {
    await prisma.candidate.updateMany({
      where: { recruiterId: id },
      data: { recruiterId: reassignRecruiterId },
    });
  }

  await prisma.recruiter.delete({ where: { id } });

  revalidatePath("/admin/employees");
  return { success: true };
}
