import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getCurrentSession } from "@/lib/auth";

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow for calendar integration
 */
export async function GET(request: NextRequest) {
  console.log("[Google Auth] ========== INITIATOR ROUTE HIT ==========");
  
  try {
    const session = await getCurrentSession();
    
    if (!session?.user?.id) {
      console.error("[Google Auth] No session found, redirecting to login");
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const recruiterId = session.user.id;
    console.log("[Google Auth] RecruiterId from session:", recruiterId);

    // Initialize OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    console.log("[Google Auth] Redirect URI:", process.env.GOOGLE_REDIRECT_URI);

    // Create state with recruiter ID for callback verification
    const state = Buffer.from(JSON.stringify({
      recruiterId,
      timestamp: Date.now(),
    })).toString("base64");

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/userinfo.email",
        "openid",
      ],
      state,
    });

    console.log("[Google Auth] Generated auth URL, redirecting to Google...");
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[Google Auth] Error initiating auth:", error);
    return NextResponse.redirect(
      new URL("/settings?calendar=error", request.url)
    );
  }
}
