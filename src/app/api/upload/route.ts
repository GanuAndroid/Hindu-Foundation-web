import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Production Ready AWS S3 Configuration (Commented out for local out-of-the-box operation)
/*
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

async function uploadToS3(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
  const bucketName = process.env.AWS_S3_BUCKET_NAME || "hindu-foundation-rescue-media";
  const uniqueKey = `rescue-media/${Date.now()}-${fileName}`;
  
  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: uniqueKey,
      Body: fileBuffer,
      ContentType: mimeType,
      ACL: "public-read",
    })
  );
  
  return `https://${bucketName}.s3.amazonaws.com/${uniqueKey}`;
}
*/

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Development Environment: Save file locally in public/uploads/
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    
    // Ensure the folder exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Clean name to prevent path traversals
    const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadDir, safeName);
    
    fs.writeFileSync(filePath, buffer);
    const localUrl = `/uploads/${safeName}`;

    // Return production response layout
    return NextResponse.json({
      success: true,
      url: localUrl,
      message: "Media uploaded successfully to S3-simulated local storage.",
      provider: "local-disk-mock-s3",
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload file" }, { status: 500 });
  }
}
export const config = {
  api: {
    bodyParser: false, // Disabling Next.js default parser to handle multipart stream
  },
};
