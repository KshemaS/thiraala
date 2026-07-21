import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { WishlistProvider } from "@/context/WishlistContext";
import { CartProvider } from "@/context/CartContext";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "thiraala | Elegant Saree Collection",
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
        <WishlistProvider>
          <CartProvider>{children}</CartProvider>
        </WishlistProvider>
      </body>
    </html>
  );
}
