import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";

// GET /api/donations - Get all donations
export async function GET() {
  try {
    const donations = await dbService.getDonations();
    
    // Sort by newest first
    donations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(donations);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch donations" }, { status: 500 });
  }
}

// POST /api/donations - Record a new donation (Razorpay/UPI callback or offline proof submission)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { donorName, mobile, amount, paymentMode, transactionId, email, purpose, screenshotUrl, status } = body;

    if (!donorName || !mobile || !amount || !paymentMode) {
      return NextResponse.json({ error: "Name, Mobile, Amount, and Mode are required" }, { status: 400 });
    }

    if (Number(amount) <= 0) {
      return NextResponse.json({ error: "Donation amount must be greater than 0" }, { status: 400 });
    }

    // Generate transaction ID if not provided (e.g. for QR scan)
    const txId = transactionId || `tx_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

    // If receipt proof screenshot exists, default status to 'Pending' (for admin audit)
    const activeStatus = status || (screenshotUrl ? "Pending" : "Verified");

    const newDonation = await dbService.createDonation({
      donorName,
      mobile,
      amount: Number(amount),
      paymentMode,
      transactionId: txId,
      email: email || undefined,
      purpose: purpose || undefined,
      screenshotUrl: screenshotUrl || undefined,
      status: activeStatus,
    });

    return NextResponse.json(newDonation, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create donation record" }, { status: 500 });
  }
}
