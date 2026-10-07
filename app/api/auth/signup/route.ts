import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import prisma from "@/lib/prisma";

const dataFilePath = path.join(process.cwd(), "data", "users.json");

export interface StoredUser {
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

function getUsers(): StoredUser[] {
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

function saveUsers(users: StoredUser[]): boolean {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(users, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing users.json:", error);
    return false;
  }
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/auth/signup",
    description: "Website customer signup API. Send a POST request with firstName, lastName, email, and password.",
  });
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

    const { firstName, lastName, email, password, phone } = body;

    // Validate First Name
    if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
      return NextResponse.json(
        { success: false, error: "First name is required." },
        { status: 400 }
      );
    }

    // Validate Email
    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { success: false, error: "Email address is required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // Validate Password if supplied
    if (password !== undefined && password !== null && password !== "") {
      if (typeof password !== "string" || password.length < 6) {
        return NextResponse.json(
          { success: false, error: "Password must be at least 6 characters long." },
          { status: 400 }
        );
      }
    }

    // 1. Check for duplicate email in JSON storage
    const existingUsers = getUsers();
    const userExistsInJson = existingUsers.some(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (userExistsInJson) {
      return NextResponse.json(
        {
          success: false,
          error: "An account with this email address already exists. Please log in or use a different email.",
        },
        { status: 409 }
      );
    }

    // 2. Check for duplicate email in Prisma database if available
    try {
      if ((prisma as any)?.user) {
        const dbUser = await (prisma as any).user.findUnique({
          where: { email: cleanEmail },
        });
        if (dbUser) {
          return NextResponse.json(
            {
              success: false,
              error: "An account with this email address already exists. Please log in or use a different email.",
            },
            { status: 409 }
          );
        }
      }
    } catch {
      // Prisma offline or schema not migrated yet - proceed with file-based check
    }

    // 3. Create new user record
    const now = new Date().toISOString();
    const passwordHash = password ? hashPassword(password) : null;

    const newUser: StoredUser = {
      id: `usr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      firstName: firstName.trim(),
      lastName: typeof lastName === "string" ? lastName.trim() : "",
      email: cleanEmail,
      passwordHash,
      phone: typeof phone === "string" ? phone.trim() : null,
      role: "customer",
      createdAt: now,
      updatedAt: now,
    };

    // 4. Try saving to Prisma PostgreSQL
    try {
      if ((prisma as any)?.user) {
        await (prisma as any).user.create({
          data: {
            id: newUser.id,
            firstName: newUser.firstName,
            lastName: newUser.lastName || null,
            email: newUser.email,
            passwordHash: newUser.passwordHash,
            phone: newUser.phone,
            role: newUser.role,
            createdAt: new Date(newUser.createdAt),
            updatedAt: new Date(newUser.updatedAt),
          },
        });
      }
    } catch (dbError) {
      console.warn("Prisma user save skipped (database offline or unmigrated):", dbError);
    }

    // 5. Save to local JSON storage
    existingUsers.push(newUser);
    saveUsers(existingUsers);

    // 6. Return sanitized user data (do not leak password hash)
    const sanitizedUser = {
      id: newUser.id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully!",
        user: sanitizedUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Signup API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "An unexpected error occurred while creating your account.",
      },
      { status: 500 }
    );
  }
}
