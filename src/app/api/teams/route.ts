import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";

// GET /api/teams - List all rescue teams
export async function GET() {
  try {
    const teams = await dbService.getRescueTeams();
    return NextResponse.json(teams);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch teams" }, { status: 500 });
  }
}

// POST /api/teams - Create a new rescue team
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, mobile, city, state, email, status } = body;

    if (!name || !city || !state) {
      return NextResponse.json({ error: "Unit Name, City, and State are required" }, { status: 400 });
    }

    // Generate unique placeholder mobile & email if not provided (since only Unit Name, City, State and Status are needed)
    const finalMobile = mobile || `U-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const finalEmail = email || `unit-${Date.now()}@humhaihindufoundation.org`;

    // Check if team mobile already exists
    const existingTeams = await dbService.getRescueTeams();
    if (existingTeams.some((t) => t.mobile === finalMobile)) {
      return NextResponse.json({ error: "Rescue team with this mobile number already exists" }, { status: 400 });
    }

    const newTeam = await dbService.createRescueTeam({
      name,
      mobile: finalMobile,
      city,
      state,
      email: finalEmail,
      status: status || "Active",
    });

    return NextResponse.json(newTeam, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create team" }, { status: 500 });
  }
}

// PUT /api/teams - Update a rescue team
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    const updatedTeam = await dbService.updateRescueTeam(id, updates);
    if (!updatedTeam) {
      return NextResponse.json({ error: "Rescue team not found" }, { status: 404 });
    }

    return NextResponse.json(updatedTeam);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update team" }, { status: 500 });
  }
}

// DELETE /api/teams?id=xxx - Delete a rescue team
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Team ID is required" }, { status: 400 });
    }

    const deleted = await dbService.deleteRescueTeam(id);
    if (!deleted) {
      return NextResponse.json({ error: "Rescue team not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Rescue team deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete team" }, { status: 500 });
  }
}
