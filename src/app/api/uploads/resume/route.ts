import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import path from "path";
import { promises as fs } from "fs";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function inferExtension(file: File): string {
  const originalName = file.name?.toLowerCase() ?? "";
  const fallback =
    file.type === "application/msword"
      ? "doc"
      : file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ? "docx"
        : "pdf";

  if (!originalName.includes(".")) {
    return fallback;
  }

  const ext = originalName.split(".").pop();
  return ext && ext.length <= 5 ? ext : fallback;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only PDF or Word documents are supported" },
        { status: 415 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 10MB limit" },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "resumes");
    await fs.mkdir(uploadsDir, { recursive: true });

    const safeFileName = `${Date.now()}-${randomUUID()}.${inferExtension(file)}`;
    const filePath = path.join(uploadsDir, safeFileName);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/resumes/${safeFileName}`;

    return NextResponse.json({
      url: publicUrl,
      originalName: file.name,
      size: file.size,
    });
  } catch (error) {
    console.error("[ResumeUpload] Failed", error);
    return NextResponse.json(
      { error: "Failed to upload resume. Please try again." },
      { status: 500 },
    );
  }
}
