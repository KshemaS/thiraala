import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";
import prisma from "@/lib/prisma";

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
    const cookieStore = await cookies();
    const userId = cookieStore.get("thiraala_user_id")?.value;

    if (!userId) {
      return NextResponse.json({ success: false, user: null }, { status: 200 });
    }

    // Try finding in DB
    try {
      if ((prisma as any)?.user) {
        const dbUser = await (prisma as any).user.findUnique({
          where: { id: userId },
        });
        if (dbUser) {
          return NextResponse.json({
            success: true,
            user: {
              id: dbUser.id,
              firstName: dbUser.firstName,
              lastName: dbUser.lastName || "",
              email: dbUser.email,
              phone: dbUser.phone || null,
              role: dbUser.role || "customer",
              createdAt: dbUser.createdAt,
            },
          });
        }
      }
    } catch {
      // Prisma offline or unmigrated - fall through
    }

    // Check JSON file
    const fileUsers = getUsersFromFile();
    const matched = fileUsers.find((u) => u.id === userId);

    if (matched) {
      return NextResponse.json({
        success: true,
        user: {
          id: matched.id,
          firstName: matched.firstName,
          lastName: matched.lastName || "",
          email: matched.email,
          phone: matched.phone || null,
          role: matched.role || "customer",
          createdAt: matched.createdAt,
        },
      });
    }

    return NextResponse.json({ success: false, user: null }, { status: 200 });
  } catch (error: any) {
    console.error("Error in /api/auth/me:", error);
    return NextResponse.json({ success: false, user: null }, { status: 200 });
  }
}
