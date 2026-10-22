import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth/guard";

const dataFilePath = path.join(process.cwd(), "data", "users.json");

function getUsersFromFile(): any[] {
  try {
    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, "utf8");
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch (error) {
    console.error("Error reading users.json:", error);
  }
  return [];
}

export async function GET() {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin privileges required." },
        { status: 401 }
      );
    }
    let users: any[] = [];

    // Try finding in Prisma database first
    try {
      if ((prisma as any)?.user) {
        const dbUsers = await (prisma as any).user.findMany({
          orderBy: { createdAt: "desc" },
        });
        if (dbUsers && dbUsers.length > 0) {
          users = dbUsers.map((u: any) => ({
            id: u.id,
            firstName: u.firstName,
            lastName: u.lastName || "",
            email: u.email,
            phone: u.phone,
            role: u.role || "customer",
            createdAt: u.createdAt,
          }));
        }
      }
    } catch {
      // Prisma offline or unmigrated - fall through
    }

    if (users.length === 0) {
      const fileUsers = getUsersFromFile();
      users = fileUsers.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName || "",
        email: u.email,
        phone: u.phone,
        role: u.role || "customer",
        createdAt: u.createdAt,
      }));
    }

    return NextResponse.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
