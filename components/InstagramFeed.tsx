"use client";

import Image from "next/image";

// Import all static images mapping to the 4 posts shown in the user's layout screenshot
import honey from "@/public/images/honey.jpeg";
import kalippattam from "@/public/images/mambazham.jpeg";
import mulcotton from "@/public/images/mulcottom.jpeg";
import swa from "@/public/images/swa.jpeg";

const instagramPosts = [
  {
    id: 801,
    img: honey,
    alt: "Purple saree draped next to a stone temple pillar",
    link: "https://instagram.com",
  },
  {
    id: 802,
    img: kalippattam,
    alt: "Royal blue sequined saree next to a wooden side table",
    link: "https://instagram.com",
  },
  {
    id: 803,
    img: mulcotton,
    alt: "Lavender pink embroidered saree next to a green plant",
    link: "https://instagram.com",
  },
  {
    id: 804,
    img: swa,
    alt: "Black traditional saree with gold borders in an outdoor park setting",
    link: "https://instagram.com",
  },
];

export default function InstagramFeed() {
  return (
    <section className="w-full mb-[140px] select-none">
      {/* Centered Heading and Description */}
      <div className="text-center max-w-2xl mx-auto mb-16 px-6">
        <h2 className="text-[#1E3A2C] font-bold text-3xl sm:text-4xl tracking-tight">
          Follow Us On Instagram
        </h2>
        <div className="w-12 h-1 bg-[#0c2b1c] mx-auto my-4 rounded-full"></div>
        <p className="text-[#1E3A2C]/70 text-sm sm:text-base leading-relaxed">
          Step into our visual log of stories, behind-the-scenes moments, and community styles. Tag <span className="font-bold text-[#1E3A2C]">@thiraala</span> to be featured.
        </p>
      </div>

      {/* Grid listing section (4 items in a row, full-width, no gaps, no rounded borders) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 w-full">
        {instagramPosts.map((post) => (
          <a
            key={post.id}
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative aspect-[3/4.2] w-full overflow-hidden transition-all duration-300"
          >
            {/* Instagram Photo */}
            <Image
              src={post.img.src}
              alt={post.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105 pointer-events-none"
            />

            {/* Dark Mask Hover Overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center pointer-events-none">

              {/* Instagram Icon SVG in Center (zooms in on hover) */}
              <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center text-white transform scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-300">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </div>

            </div>
          </a>
        ))}
      </div>

      {/* Centered 'Explore More' button */}
      <div className="text-center mt-12">
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center btn-animate-border btn-animate-border-light px-8 py-3 rounded-full font-bold text-xs tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] cursor-pointer shadow-sm shadow-[#1E3A2C]/5"
        >
          Explore More
        </a>
      </div>
    </section>
  );
}
