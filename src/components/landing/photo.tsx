"use client";

import Image from "next/image";

/**
 * Curated stock food photography (Unsplash) for the landing, referenced by
 * photo `id`. A warm gradient sits underneath as a graceful fallback while the
 * photo loads or if it is unavailable.
 *
 * Swap for real/branded shots: drop files in /public/img and pass an absolute
 * path as `id` starting with "/" (handled below) — no layout change needed.
 */
export function Photo({
  id,
  alt,
  w = 1200,
  h = 900,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
  className = "",
}: {
  id: string;
  alt: string;
  w?: number;
  h?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const src = id.startsWith("/")
    ? id
    : `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&q=72&auto=format&fit=crop`;
  return (
    <>
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(135deg,#f6b45a,#e2492a)]"
      />
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        priority={priority}
        sizes={sizes}
        className={"object-cover " + className}
      />
    </>
  );
}
