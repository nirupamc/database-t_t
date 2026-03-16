// Run this script to create the Google OAuth routes
// Usage: node create-google-oauth.js

const fs = require('fs');
const path = require('path');

// Create directories
const dirs = [
  'src/app/api/auth/google',
  'src/app/api/auth/google/callback',
];

dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created: ${dir}`);
  }
});

// Create /api/auth/google/route.ts
const googleRouteContent = `import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google-calendar";
import { getCurrentSession } from "@/lib/auth";

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow for calendar integration
 */
export async function GET() {
  try {
    const session = await getCurrentSession();
    
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:3000"));
    }

    // Create state with recruiter ID for callback verification
    const state = Buffer.from(JSON.stringify({
      recruiterId: session.user.id,
      timestamp: Date.now(),
    })).toString("base64");

    const authUrl = getGoogleAuthUrl(state);
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("[Google OAuth] Error initiating auth:", error);
    return NextResponse.redirect(
      new URL("/settings?calendar=error", process.env.NEXTAUTH_URL || "http://localhost:3000")
    );
  }
}
`;

// Create /api/auth/google/callback/route.ts
const callbackRouteContent = `import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/google-calendar";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/google/callback
 * Handles Google OAuth callback and stores tokens
 */
export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    // Handle user denial
    if (error) {
      console.error("[Google OAuth] User denied access:", error);
      return NextResponse.redirect(new URL("/settings?calendar=error", baseUrl));
    }

    // Validate required params
    if (!code || !state) {
      console.error("[Google OAuth] Missing code or state");
      return NextResponse.redirect(new URL("/settings?calendar=error", baseUrl));
    }

    // Decode and validate state
    let stateData: { recruiterId: string; timestamp: number };
    try {
      stateData = JSON.parse(Buffer.from(state, "base64").toString());
    } catch {
      console.error("[Google OAuth] Invalid state parameter");
      return NextResponse.redirect(new URL("/settings?calendar=error", baseUrl));
    }

    // Check state is not too old (max 10 minutes)
    const stateAge = Date.now() - stateData.timestamp;
    if (stateAge > 10 * 60 * 1000) {
      console.error("[Google OAuth] State expired");
      return NextResponse.redirect(new URL("/settings?calendar=error", baseUrl));
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);

    if (!tokens.access_token) {
      console.error("[Google OAuth] No access token received");
      return NextResponse.redirect(new URL("/settings?calendar=error", baseUrl));
    }

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

    console.log("[Google OAuth] Successfully connected calendar for recruiter:", stateData.recruiterId);
    
    return NextResponse.redirect(new URL("/settings?calendar=connected", baseUrl));
  } catch (error) {
    console.error("[Google OAuth] Callback error:", error);
    return NextResponse.redirect(new URL("/settings?calendar=error", baseUrl));
  }
}
`;

// Write files
fs.writeFileSync(
  path.join(__dirname, 'src/app/api/auth/google/route.ts'),
  googleRouteContent
);
console.log('Created: src/app/api/auth/google/route.ts');

fs.writeFileSync(
  path.join(__dirname, 'src/app/api/auth/google/callback/route.ts'),
  callbackRouteContent
);
console.log('Created: src/app/api/auth/google/callback/route.ts');

console.log('\\nDone! Google OAuth routes created.');
console.log('\\nMake sure you have these environment variables in .env.local:');
console.log('  GOOGLE_CLIENT_ID=your_client_id');
console.log('  GOOGLE_CLIENT_SECRET=your_client_secret');
console.log('  GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback');
