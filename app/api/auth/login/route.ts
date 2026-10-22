import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import prisma from "@/lib/prisma";

const dataFilePath = path.join(process.cwd(), "data", "users.json");

interface StoredUser {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  passwordHash?: string | null;
  phone?: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
}

function getUsersFromFile(): StoredUser[] {
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

function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 2) return false;
    const [salt, originalHash] = parts;
    const computedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    return computedHash === originalHash;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload provided." },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Email address is required." },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Password is required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Try finding in Prisma database first
    let matchedUser: StoredUser | null = null;
    try {
      if ((prisma as any)?.user) {
        const dbUser = await (prisma as any).user.findUnique({
          where: { email: cleanEmail },
        });
        if (dbUser) {
          matchedUser = {
            id: dbUser.id,
            firstName: dbUser.firstName,
            lastName: dbUser.lastName || "",
            email: dbUser.email,
            passwordHash: dbUser.passwordHash,
            phone: dbUser.phone,
            role: dbUser.role || "customer",
            createdAt: dbUser.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: dbUser.updatedAt?.toISOString() || new Date().toISOString(),
          };
        }
      }
    } catch {
      // Prisma offline or unmigrated - fall through to file
    }

    // 2. If not found in DB, check JSON file
    if (!matchedUser) {
      const fileUsers = getUsersFromFile();
      matchedUser = fileUsers.find((u) => u.email.toLowerCase() === cleanEmail) || null;
    }

    if (!matchedUser) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 3. Verify password
    if (matchedUser.passwordHash) {
      const isMatch = verifyPassword(password, matchedUser.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { success: false, error: "Invalid email or password." },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // 4. Prepare sanitized user response
    const sanitizedUser = {
      id: matchedUser.id,
      firstName: matchedUser.firstName,
      lastName: matchedUser.lastName || "",
      email: matchedUser.email,
      phone: matchedUser.phone || null,
      role: matchedUser.role || "customer",
      createdAt: matchedUser.createdAt,
    };

    const response = NextResponse.json({
      success: true,
      message: "Signed in successfully!",
      user: sanitizedUser,
    });

    // Set cookie for session persistence
    response.cookies.set("thiraala_user_id", matchedUser.id, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
