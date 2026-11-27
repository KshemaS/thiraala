import type { Metadata } from "next";
import MotionProvider from "@/components/MotionProvider";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.thiraala.com"),
  openGraph: { siteName: "thiraala", type: "website", locale: "en_IN" },
  title: {
    default: "thiraala | Elegant Saree Collection",
    template: "%s | thiraala",
  },
  description: "Discover beautiful sarees for every occasion at thiraala. Explore our curated collection of simple, elegant, and comfortable sarees designed to make your moments special.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${openSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <MotionProvider>
          <AuthProvider>
            <WishlistProvider>
              <CartProvider>{children}</CartProvider>
            </WishlistProvider>
          </AuthProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
