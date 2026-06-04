import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { dbService } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch tickets and donations data
    const [tickets, donations] = await Promise.all([
      dbService.getTickets(),
      dbService.getDonations(),
    ]);

    // 2. Scan public/uploads directory
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    const mediaItems: any[] = [];

    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);

      for (const file of files) {
        // Skip hidden files like .DS_Store or macOS temporary dotfiles
        if (file.startsWith(".")) continue;

        const filePath = path.join(uploadDir, file);
        let fileStats;
        try {
          fileStats = fs.statSync(filePath);
          if (fileStats.isDirectory()) continue;
        } catch {
          continue;
        }

        const url = `/uploads/${file}`;
        const fileType = file.match(/\.(mp4|mov|avi|wmv|webm)$/i) ? "video" : "image";
        
        let category = "unlinked";
        let associatedId = "";
        let associatedName = "";

        // Look for matching references in tickets
        const matchingTicket = tickets.find(
          (t) => t.imageUrl === url || t.videoUrl === url || t.closurePhotoUrl === url
        );

        if (matchingTicket) {
          associatedId = matchingTicket.id;
          associatedName = matchingTicket.createdBy;
          if (matchingTicket.imageUrl === url) {
            category = "incident_image";
          } else if (matchingTicket.videoUrl === url) {
            category = "incident_video";
          } else if (matchingTicket.closurePhotoUrl === url) {
            category = "closure_photo";
          }
        } else {
          // Look for matching references in donations
          const matchingDonation = donations.find((d) => d.screenshotUrl === url);
          if (matchingDonation) {
            category = "donation_proof";
            associatedId = matchingDonation.id;
            associatedName = matchingDonation.donorName;
          }
        }

        mediaItems.push({
          fileName: file,
          url,
          fileType,
          sizeBytes: fileStats.size,
          uploadedAt: fileStats.mtime.toISOString(),
          category,
          associatedId,
          associatedName,
        });
      }
    }

    // Sort items by upload date descending
    mediaItems.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return NextResponse.json({ success: true, media: mediaItems });
  } catch (error: any) {
    console.error("Failed to list media:", error);
    return NextResponse.json({ error: error.message || "Failed to load media items" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL query parameter is required" }, { status: 400 });
    }

    // 1. Remove media reference in database
    await dbService.deleteMediaReference(url);

    // 2. Remove file from storage
    if (url.startsWith("/uploads/")) {
      const fileName = url.substring("/uploads/".length);
      const filePath = path.join(process.cwd(), "public", "uploads", fileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return NextResponse.json({ success: true, message: "Media deleted successfully" });
  } catch (error: any) {
    console.error("Failed to delete media:", error);
    return NextResponse.json({ error: error.message || "Failed to delete media item" }, { status: 500 });
  }
}
