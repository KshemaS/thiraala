import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boutique Heritage & About Us",
  description: "Learn the story behind thiraala, our master weavers, artisanal handlooms, and mission to deliver timeless sarees.",
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
