import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";
import { notificationService } from "@/lib/notifications";

// GET /api/tickets - List all tickets (supports filters)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const createdBy = searchParams.get("createdBy");
    const assignedTeamId = searchParams.get("assignedTeamId");
    const status = searchParams.get("status");

    let tickets = await dbService.getTickets();

    if (createdBy) {
      tickets = tickets.filter((t) => t.createdBy === createdBy);
    }
    if (assignedTeamId) {
      tickets = tickets.filter((t) => t.assignedRescueTeamId === assignedTeamId);
    }
    if (status) {
      tickets = tickets.filter((t) => t.status === status);
    }

    // Sort sequence: Pending first, then Accepted, then Closed. Within status, sort by newest first.
    const statusPriority: Record<string, number> = {
      Pending: 1,
      Accepted: 2,
      Closed: 3,
    };
    tickets.sort((a, b) => {
      const pA = statusPriority[a.status] || 99;
      const pB = statusPriority[b.status] || 99;
      if (pA !== pB) return pA - pB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json(tickets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch tickets" }, { status: 500 });
  }
}

// POST /api/tickets - Create a new ticket
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      eventId,
      animalType,
      customAnimalType,
      description,
      imageUrl,
      videoUrl,
      latitude,
      longitude,
      createdBy,
      creatorMobile,
    } = body;

    // Enforce validations
    if (!eventId || !String(eventId).trim()) {
      return NextResponse.json({ error: "Case ID (Police 112) is required." }, { status: 400 });
    }
    if (!animalType) {
      return NextResponse.json({ error: "Animal Type is required." }, { status: 400 });
    }
    if (animalType === "Other" && !customAnimalType) {
      return NextResponse.json({ error: "Custom animal description is required since 'Other' was selected." }, { status: 400 });
    }
    if (!imageUrl) {
      return NextResponse.json({ error: "Animal image upload is required." }, { status: 400 });
    }
    if (!latitude || !longitude) {
      return NextResponse.json({ error: "GPS Coordinates (Latitude & Longitude) are required." }, { status: 400 });
    }
    if (!description || !String(description).trim()) {
      return NextResponse.json({ error: "Case description is required." }, { status: 400 });
    }

    const newTicket = await dbService.createTicket({
      eventId: String(eventId),
      animalType,
      customAnimalType: customAnimalType || undefined,
      description,
      imageUrl,
      videoUrl,
      latitude: Number(latitude),
      longitude: Number(longitude),
      createdBy: createdBy || "Citizen Reporter",
      creatorMobile: creatorMobile || "",
    });

    // Trigger Notification Event
    try {
      notificationService.notifyTicketCreated(newTicket.id, newTicket.animalType);
    } catch (err) {
      console.error("Failed to send notification logs:", err);
    }

    return NextResponse.json(newTicket, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create ticket" }, { status: 500 });
  }
}
