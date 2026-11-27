import type { NextConfig } from "next";

/**
 * Content-Security-Policy. Only this site and Razorpay (checkout) may run
 * scripts, be framed, or be contacted; plus the postal pincode lookup on the
 * bag page.
 *
 * - 'unsafe-eval' is only allowed in development (React needs it there for
 *   error overlays; production React/Next don't use eval).
 * - script-src still has 'unsafe-inline': Next.js puts small inline scripts in
 *   statically built pages, and removing it needs per-request nonces, which
 *   would make every page server-rendered on each visit (slower, no CDN
 *   caching). The other rules still stop injected scripts from loading code
 *   from other sites or sending data to them.
 * - style-src 'unsafe-inline' is needed for animation and image styles.
 */
const isDev = process.env.NODE_ENV !== "production";
const RAZORPAY = "https://checkout.razorpay.com https://api.razorpay.com https://*.razorpay.com";
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${RAZORPAY}`,
  `frame-src 'self' ${RAZORPAY}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${RAZORPAY}`,
  "font-src 'self' data:",
  `connect-src 'self' ${RAZORPAY} https://lumberjack.razorpay.com https://lumberjack-cx.razorpay.com https://api.postalpincode.in`,
  "object-src 'none'",
  "base-uri 'self'",
  `form-action 'self' ${RAZORPAY}`,
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512, 640, 768, 1024, 1200],
    qualities: [75, 85, 90, 95, 100],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;

