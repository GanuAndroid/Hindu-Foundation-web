import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";

// GET /api/teams/members - Retrieve members, optionally filtered by teamId
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const teamId = searchParams.get("teamId") || undefined;

    const members = await dbService.getTeamMembers(teamId);
    return NextResponse.json(members);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch team members" }, { status: 500 });
  }
}

// POST /api/teams/members - Add a new team member
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { teamId, memberName, mobileNumber, email, status, city, state } = body;

    if (!teamId || !memberName || !mobileNumber) {
      return NextResponse.json({ error: "Team, Member Name, and Mobile Number are required" }, { status: 400 });
    }

    // Format and validate mobile number
    let cleanMobile = mobileNumber.replace(/\D/g, "");
    if (cleanMobile.length > 10) {
      cleanMobile = cleanMobile.slice(-10);
    }
    if (cleanMobile.length !== 10) {
      return NextResponse.json({ error: "Mobile number must be a valid 10-digit number" }, { status: 400 });
    }

    // Check if the team exists
    const teams = await dbService.getRescueTeams();
    const teamRecord = teams.find((t) => t.id === teamId);
    if (!teamRecord) {
      return NextResponse.json({ error: "The selected rescue team unit does not exist" }, { status: 400 });
    }

    // Check if mobile number is already registered in team_members
    const existingMember = await dbService.findTeamMemberByMobile(cleanMobile);
    if (existingMember) {
      return NextResponse.json({
        error: `Mobile number is already registered to member "${existingMember.memberName}" in team "${existingMember.teamName}"`
      }, { status: 400 });
    }

    // Create the team member using team info
    const newMember = await dbService.createTeamMember({
      teamId,
      teamName: teamRecord.name,
      memberName,
      mobileNumber: cleanMobile,
      email: email || undefined,
      city: city || teamRecord.city,
      state: state || teamRecord.state,
      status: status || "Active",
      role: "RESCUE_TEAM",
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create team member" }, { status: 500 });
  }
}

// PUT /api/teams/members - Update an existing team member
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, teamId, memberName, mobileNumber, email, status, city, state } = body;

    if (!id) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    const updates: any = {};

    if (memberName !== undefined) updates.memberName = memberName;
    if (email !== undefined) updates.email = email;
    if (status !== undefined) updates.status = status;
    if (city !== undefined) updates.city = city;
    if (state !== undefined) updates.state = state;

    if (mobileNumber !== undefined) {
      let cleanMobile = mobileNumber.replace(/\D/g, "");
      if (cleanMobile.length > 10) {
        cleanMobile = cleanMobile.slice(-10);
      }
      if (cleanMobile.length !== 10) {
        return NextResponse.json({ error: "Mobile number must be a valid 10-digit number" }, { status: 400 });
      }

      // Check if mobile number is already in use by another member
      const existingMember = await dbService.findTeamMemberByMobile(cleanMobile);
      if (existingMember && existingMember.id !== id) {
        return NextResponse.json({
          error: `Mobile number is already registered to member "${existingMember.memberName}" in team "${existingMember.teamName}"`
        }, { status: 400 });
      }
      updates.mobileNumber = cleanMobile;
    }

    if (teamId !== undefined) {
      const teams = await dbService.getRescueTeams();
      const teamRecord = teams.find((t) => t.id === teamId);
      if (!teamRecord) {
        return NextResponse.json({ error: "The selected rescue team unit does not exist" }, { status: 400 });
      }
      updates.teamId = teamId;
      updates.teamName = teamRecord.name;
      if (city === undefined) updates.city = teamRecord.city;
      if (state === undefined) updates.state = teamRecord.state;
    }

    const updatedMember = await dbService.updateTeamMember(id, updates);
    if (!updatedMember) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    return NextResponse.json(updatedMember);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update team member" }, { status: 500 });
  }
}

// DELETE /api/teams/members?id=xxx - Delete a team member
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    const deleted = await dbService.deleteTeamMember(id);
    if (!deleted) {
      return NextResponse.json({ error: "Team member not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Team member deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete team member" }, { status: 500 });
  }
}
