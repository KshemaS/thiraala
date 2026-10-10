This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Admin authentication

The dashboard (`/dashboard`) and all admin write APIs require a signed-in admin. Sessions are an httpOnly cookie signed with `AUTH_SECRET`; admin accounts live in the `admin_users` table with scrypt password hashes.

Environment variables:

| Variable | Where | Purpose |
| --- | --- | --- |
| `AUTH_SECRET` | App (local + Vercel) | Random string, 32+ chars, used to sign session cookies. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. Changing it signs everyone out. |
| `ADMIN_PASSWORD` | Seed only | Password for the admin account (12+ chars). Without it the seed skips the admin user. |
| `ADMIN_USERNAME` | Seed only | Optional, defaults to `admin`. |

Create or reset the admin login (runs only the admin part of the seed, against whatever `DATABASE_URL` points to):

```bash
ADMIN_PASSWORD='choose-a-long-password' npx tsx prisma/seed-admin.ts
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
