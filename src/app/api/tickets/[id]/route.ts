import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { notificationService } from "@/lib/notifications";
import { TicketStatus } from "@/lib/types";

// GET /api/tickets/[id] - Get details + history of a ticket
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ticket = await dbService.getTicketById(id);

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const history = await dbService.getTicketHistory(id);

    return NextResponse.json({ ticket, history });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch ticket" }, { status: 500 });
  }
}

// PUT /api/tickets/[id] - Update ticket state
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      action, // "accept" | "pending" | "close" | "assign"
      updaterName, // Name of the person/team initiating
      
      // fields for Accept
      assignedRescueTeamId,
      assignedRescueTeamName,

      // fields for Pending
      pendingReason,
      pendingDescription,

      // fields for Close
      closureReason,
      closureDescription,
      closurePhotoUrl,

      // fields for Admin Assignment
      newTeamId,
    } = body;

    const ticket = await dbService.getTicketById(id);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    if (!action || !updaterName) {
      return NextResponse.json({ error: "Action and Updater Name are required" }, { status: 400 });
    }

    let updatedTicket;

    if (action === "accept") {
      let finalTeamId = assignedRescueTeamId;
      let finalTeamName = assignedRescueTeamName;

      const bodyMobile = body.assignedRescueTeamMobile;
      if (bodyMobile) {
        const teams = await dbService.getRescueTeams();
        const foundTeam = teams.find(
          (t) =>
            t.mobile === bodyMobile ||
            t.mobile.replace(/\D/g, "").slice(-10) === bodyMobile.replace(/\D/g, "").slice(-10)
        );
        if (foundTeam) {
          finalTeamId = foundTeam.id;
          finalTeamName = foundTeam.name;
        }
      }

      if (!finalTeamId || !finalTeamName) {
        return NextResponse.json({ error: "Assigned Team details are required to Accept Rescue." }, { status: 400 });
      }

      updatedTicket = await dbService.updateTicketStatus(
        id,
        "Accepted",
        updaterName,
        `Rescue operation accepted by team: ${finalTeamName}.`,
        {
          assignedRescueTeamId: finalTeamId,
          assignedRescueTeamName: finalTeamName,
          pendingRemarks: undefined, // Clear any previous pending remarks
        }
      );

      // Send Accept Notifications
      if (updatedTicket) {
        // Find reporter's mobile
        const reporterMobile = "7777777777"; // Fallback or retrieve from creator info
        notificationService.notifyTicketAccepted(
          id,
          updatedTicket.animalType,
          assignedRescueTeamName,
          reporterMobile
        );
      }
    } else if (action === "pending") {
      if (!pendingReason) {
        return NextResponse.json({ error: "A reason is required to revert a ticket back to Pending." }, { status: 400 });
      }
      if (pendingReason === "Other" && (!pendingDescription || pendingDescription.trim().length === 0)) {
        return NextResponse.json({ error: "A custom description is required when 'Other' reason is selected." }, { status: 400 });
      }

      const remarks = `Rescue team marked status back to Pending. Reason: ${pendingReason}${
        pendingReason === "Other" ? ` (${pendingDescription})` : ""
      }`;

      updatedTicket = await dbService.updateTicketStatus(
        id,
        "Pending",
        updaterName,
        remarks,
        {
          assignedRescueTeamId: undefined,
          assignedRescueTeamName: undefined,
          pendingRemarks: remarks,
        }
      );
    } else if (action === "close") {
      if (!closureReason) {
        return NextResponse.json({ error: "Closure reason is required." }, { status: 400 });
      }
      if (closureReason === "Other" && (!closureDescription || closureDescription.trim().length === 0)) {
        return NextResponse.json({ error: "A custom description is required when 'Other' reason is selected." }, { status: 400 });
      }
      if (!closurePhotoUrl) {
        return NextResponse.json({ error: "A final proof photo is required to close a rescue operation." }, { status: 400 });
      }

      const remarks = `Rescue operation closed successfully. Outcome: ${closureReason}${
        closureReason === "Other" ? ` (${closureDescription})` : ""
      }`;

      updatedTicket = await dbService.updateTicketStatus(
        id,
        "Closed",
        updaterName,
        remarks,
        {
          closureReason,
          closureDescription: closureReason === "Other" ? closureDescription : undefined,
          closurePhotoUrl,
        }
      );

      // Send Close Notifications
      if (updatedTicket) {
        const reporterMobile = "7777777777";
        notificationService.notifyTicketClosed(
          id,
          updatedTicket.animalType,
          closureReason,
          reporterMobile
        );
      }
    } else if (action === "assign") {
      // Admin manual assignment/reassignment
      if (!newTeamId) {
        return NextResponse.json({ error: "Team ID is required for allocation." }, { status: 400 });
      }

      const teams = await dbService.getRescueTeams();
      const allocatedTeam = teams.find((t) => t.id === newTeamId);
      if (!allocatedTeam) {
        return NextResponse.json({ error: "Rescue Team not found." }, { status: 404 });
      }

      const isReassignment = !!ticket.assignedRescueTeamId;
      const remarkMsg = isReassignment
        ? `Ticket reassigned by Admin to team: "${allocatedTeam.name}". Previously: "${ticket.assignedRescueTeamName}".`
        : `Ticket assigned by Admin to team: "${allocatedTeam.name}".`;

      updatedTicket = await dbService.updateTicketStatus(
        id,
        "Accepted",
        updaterName,
        remarkMsg,
        {
          assignedRescueTeamId: allocatedTeam.id,
          assignedRescueTeamName: allocatedTeam.name,
          pendingRemarks: undefined,
        }
      );

      if (updatedTicket) {
        const reporterMobile = "7777777777";
        notificationService.notifyTicketAccepted(
          id,
          updatedTicket.animalType,
          allocatedTeam.name,
          reporterMobile
        );
      }
    } else {
      return NextResponse.json({ error: "Invalid action type." }, { status: 400 });
    }

    return NextResponse.json(updatedTicket);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update ticket" }, { status: 500 });
  }
}
