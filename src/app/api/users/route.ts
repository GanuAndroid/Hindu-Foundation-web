import { NextRequest, NextResponse } from "next/server";
import { dbService } from "@/lib/db";

// GET /api/users - List all registered users
export async function GET() {
  try {
    const users = await dbService.getUsers();
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/users - Create a new user (admin dashboard CRUD)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, mobile, role } = body;

    if (!name || !mobile || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check if user mobile already exists
    const existingUser = await dbService.findUserByMobile(mobile);
    if (existingUser) {
      return NextResponse.json({ error: "User with this mobile number already exists" }, { status: 400 });
    }

    const newUser = await dbService.createUser({
      name,
      mobile,
      role,
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create user" }, { status: 500 });
  }
}

// PUT /api/users - Update a user's role or details
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const updatedUser = await dbService.updateUser(id, updates);
    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/users?id=xxx - Delete a user
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const deleted = await dbService.deleteUser(id);
    if (!deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete user" }, { status: 500 });
  }
}
