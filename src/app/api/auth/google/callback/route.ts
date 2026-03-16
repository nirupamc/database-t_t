import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/google/callback
 * Handles Google OAuth callback and stores tokens
 */
export async function GET(request: NextRequest) {
  console.log("[Google Callback] ========== ROUTE HIT ==========");
  
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    console.log("[Google Callback] Params received:", { 
      hasCode: !!code, 
      hasState: !!state,
      error: error || "none"
    });

    // Handle user denial
    if (error) {
      console.error("[Google Callback] OAuth error from Google:", error);
      return NextResponse.redirect(new URL("/settings?calendar=error", baseUrl));
    }

    // Validate required params
    if (!code || !state) {
      console.error("[Google Callback] Missing code or state");
      return NextResponse.redirect(new URL("/settings?calendar=error", baseUrl));
    }

    // Decode and validate state
    let stateData: { recruiterId: string; timestamp: number };
    try {
      const decoded = Buffer.from(state, "base64").toString("utf-8");
      console.log("[Google Callback] Decoded state:", decoded);
      stateData = JSON.parse(decoded);
      console.log("[Google Callback] RecruiterId from state:", stateData.recruiterId);
    } catch (e) {
      console.error("[Google Callback] Failed to decode state:", e);
      return NextResponse.redirect(new URL("/settings?calendar=error", baseUrl));
    }

    // Check state is not too old (max 10 minutes)
    const stateAge = Date.now() - stateData.timestamp;
    console.log("[Google Callback] State age:", Math.round(stateAge / 1000), "seconds");
    if (stateAge > 10 * 60 * 1000) {
      console.error("[Google Callback] State expired");
      return NextResponse.redirect(new URL("/settings?calendar=error", baseUrl));
    }

    // Initialize OAuth2 client directly here for reliability
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    console.log("[Google Callback] Exchanging code for tokens...");
    console.log("[Google Callback] Using redirect URI:", process.env.GOOGLE_REDIRECT_URI);
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    console.log("[Google Callback] Tokens received:", {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    });

    if (!tokens.access_token) {
      console.error("[Google Callback] No access token received");
      return NextResponse.redirect(new URL("/settings?calendar=error", baseUrl));
    }

    console.log("[Google Callback] Saving tokens to database...");
    
    // Save tokens to database
    await prisma.recruiter.update({
      where: { id: stateData.recruiterId },
      data: {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token ?? null,
        googleTokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        calendarConnected: true,
      },
    });

    console.log("[Google Callback] ✅ Successfully saved tokens for recruiter:", stateData.recruiterId);
    
    return NextResponse.redirect(new URL("/settings?calendar=connected", baseUrl));
  } catch (error) {
    console.error("[Google Callback] ❌ Unexpected error:", error);
    return NextResponse.redirect(new URL("/settings?calendar=error", baseUrl));
  }
}
