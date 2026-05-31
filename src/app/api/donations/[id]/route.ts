import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";

// PUT /api/donations/[id] - Update donation details/status (Admins only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status, amount } = body;

    if (!status) {
      return NextResponse.json({ error: "Status field is required" }, { status: 400 });
    }

    const amt = amount !== undefined ? Number(amount) : undefined;
    const updated = await dbService.updateDonationStatusAndAmount(id, status, amt);

    if (!updated) {
      return NextResponse.json({ error: "Donation record not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update donation record" },
      { status: 500 }
    );
  }
}
