import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function POST(request: NextRequest) {
  console.log("[Resume Upload] Route hit");

  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const candidateName = (formData.get("candidateName") as string) || "Candidate";

    console.log("[Resume Upload] File received:", {
      name: file?.name,
      size: file?.size,
      type: file?.type,
    });

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only DOCX and PDF files are allowed" },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 },
      );
    }

    const ext = file.name.split(".").pop();
    const cleanName = candidateName
      .replace(/[^a-zA-Z0-9]/g, "_")
      .substring(0, 30);
    const timestamp = Date.now();
    const filename = `resumes/Resume_${cleanName}_${timestamp}.${ext}`;

    console.log("[Resume Upload] Uploading to Vercel Blob:", filename);

    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    console.log("[Resume Upload] ✅ Upload successful:", blob.url);

    return NextResponse.json({
      url: blob.url,
      filename: blob.pathname,
    });
  } catch (error) {
    console.error("[Resume Upload] Error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}
