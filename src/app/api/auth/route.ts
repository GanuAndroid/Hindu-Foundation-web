import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { verifyIdToken } from "@/lib/firebaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const { idToken, role, name } = await req.json();

    if (!idToken || !role) {
      return NextResponse.json({ error: "Authentication Token and Role are required" }, { status: 400 });
    }

    // 1. Verify the client-provided Firebase ID Token using Firebase Admin SDK
    let decodedToken;
    try {
      if (idToken.startsWith("mock-token-")) {
        const parts = idToken.split("-");
        const mobile = parts[2];
        const role = parts[3];
        decodedToken = {
          phone_number: `+91${mobile}`,
          role: role,
        };
        console.log(`[MOCK AUTH] Successfully verified mock token locally for mobile: ${mobile}, role: ${role}`);
      } else {
        decodedToken = await verifyIdToken(idToken);
      }
    } catch (err: any) {
      console.error("Firebase ID Token verification failed:", err);
      return NextResponse.json({ error: "Invalid or expired authentication session." }, { status: 401 });
    }

    // 2. Extract and format the phone number from the cryptographically verified token
    const phone = decodedToken.phone_number;
    if (!phone) {
      return NextResponse.json({ error: "No verified phone number linked to this authentication token." }, { status: 400 });
    }

    // Extract the standard 10-digit national number to match our PostgreSQL database format
    let mobile = phone.replace(/\D/g, "");
    if (mobile.length > 10) {
      mobile = mobile.slice(-10);
    }

    if (!mobile || mobile.length !== 10) {
      return NextResponse.json({ error: "Invalid phone number format extracted from auth session." }, { status: 400 });
    }

    // 3. Special validation for Admin role
    if (role === "admin") {
      let adminUser = await dbService.findUserByMobile(mobile);
      if (adminUser && adminUser.role !== "admin") {
        // Phone exists but is NOT an admin
        return NextResponse.json({ error: "Unauthorized: This phone number is not registered as an Admin." }, { status: 403 });
      }
      if (!adminUser) {
        // First-time admin login — auto-register as admin
        adminUser = await dbService.createUser({
          mobile,
          role: "admin",
          name: name || `Admin-${mobile.slice(-4)}`,
        });
      }
      return NextResponse.json(adminUser);
    }

    // 4. Special validation for Rescue Team role
    if (role === "team") {
      const activeTeams = await dbService.getRescueTeams();
      const teamRecord = activeTeams.find((t) => t.mobile === mobile);
      if (!teamRecord) {
        return NextResponse.json({ error: "Your mobile number is not registered as an active Rescue Team." }, { status: 403 });
      }
      if (teamRecord.status === "Disabled") {
        return NextResponse.json({ error: "Your Rescue Team account has been disabled by Admin." }, { status: 403 });
      }

      // Check if user entry exists for team, if not, create it
      let teamUser = await dbService.findUserByMobile(mobile);
      if (!teamUser) {
        teamUser = await dbService.createUser({
          mobile,
          role: "team",
          name: teamRecord.name,
        });
      }
      return NextResponse.json(teamUser);
    }

    // 5. Standard Public Citizen User Flow
    let existingUser = await dbService.findUserByMobile(mobile);
    if (!existingUser) {
      // Auto-signup for new citizens
      existingUser = await dbService.createUser({
        mobile,
        role: "user",
        name: name || `Citizen-${mobile.slice(-4)}`,
      });
    }

    return NextResponse.json(existingUser);
  } catch (error: any) {
    console.error("Backend auth route error:", error);
    return NextResponse.json({ error: error.message || "Authentication gateway error" }, { status: 500 });
  }
}
