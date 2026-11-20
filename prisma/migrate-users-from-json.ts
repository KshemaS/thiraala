/**
 * One-off: copies customer accounts that only existed in data/users.json into
 * the database (the site no longer reads that file). Keeps each account's id
 * (so existing orders stay linked) and password hash (old-style hashes are
 * upgraded automatically on the customer's next sign-in). Accounts whose
 * email is already in the database are skipped, so it's safe to re-run.
 *
 *   npx tsx prisma/migrate-users-from-json.ts
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

interface FileUser {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  passwordHash?: string | null;
  phone?: string | null;
  role?: string;
  createdAt?: string;
}

async function main() {
  const file = path.join(process.cwd(), "data", "users.json");
  if (!fs.existsSync(file)) {
    console.log("No data/users.json — nothing to migrate.");
    return;
  }
  const users: FileUser[] = JSON.parse(fs.readFileSync(file, "utf8"));
  const prisma = new PrismaClient();
  let created = 0;
  let skipped = 0;
  try {
    for (const u of users) {
      const email = String(u.email || "").trim().toLowerCase();
      if (!email || !u.id || !u.firstName) {
        skipped++;
        continue;
      }
      const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { id: u.id }] } });
      if (exists) {
        skipped++;
        continue;
      }
      await prisma.user.create({
        data: {
          id: u.id,
          firstName: u.firstName.trim(),
          lastName: u.lastName?.trim() || null,
          email,
          passwordHash: u.passwordHash || null,
          phone: u.phone?.trim() || null,
          role: u.role || "customer",
          createdAt: u.createdAt ? new Date(u.createdAt) : undefined,
        },
      });
      created++;
    }
  } finally {
    await prisma.$disconnect();
  }
  console.log(`Customer accounts: ${created} copied into the database, ${skipped} already there or invalid.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
