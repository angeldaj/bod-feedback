"use client";

import { useState } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { ArrowUpRight, Images, Play } from "lucide-react";
import type { InstagramPost } from "@/lib/club-api";
import { useClub } from "./club-provider";
import { shortDate } from "./club-visuals";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const INSTAGRAM_HANDLE = "panaderialabodega";
const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_HANDLE}/`;

// Las bandejas salen del horno una tras otra: 6 × 0,06 s se lee como un solo golpe.
const tray: Variants = {
  hidden: {},
  shown: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const loaf: Variants = {
  hidden: (i: number) => ({ opacity: 0, y: 34, scale: 0.94, rotate: i % 2 ? 2.2 : -2.2 }),
  shown: { opacity: 1, y: 0, scale: 1, rotate: 0, transition: { type: "spring", stiffness: 140, damping: 19 } },
};

/**
 * Últimas publicaciones de Instagram en Inicio, como tarjetas de panadería.
 * Solo aparece si el backend devuelve posts (sin conexión con Meta no hay sección).
 */
export function InstagramFeedSection() {
  const { instagramFeed } = useClub();
  const reduce = useReducedMotion();
  if (instagramFeed?.length === 0) return null;

  return (
    <section className="ig-sec" aria-labelledby="ig-sec-title" aria-busy={instagramFeed === null}>
      <div className="sec-head">
        <h2 id="ig-sec-title">Recién horneado en Instagram</h2>
        <a href={INSTAGRAM_URL} className="link" target="_blank" rel="noreferrer">
          @{INSTAGRAM_HANDLE}
          <ArrowUpRight aria-hidden="true" />
        </a>
      </div>
      {instagramFeed === null ? (
        <ul className="ig-grid" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="ig-card ig-ghost">
              <span className="ig-photo" />
              <span className="ig-ticket">
                <span className="ig-line" />
                <span className="ig-line short" />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <motion.ul
          className="ig-grid"
          variants={tray}
          initial={reduce ? false : "hidden"}
          whileInView="shown"
          viewport={{ once: true, amount: 0.15 }}
        >
          {instagramFeed.map((post, i) => (
            <motion.li key={post.id} custom={i} variants={loaf}>
              <InstagramCard post={post} reduce={!!reduce} />
            </motion.li>
          ))}
        </motion.ul>
      )}
    </section>
  );
}

function InstagramCard({ post, reduce }: { post: InstagramPost; reduce: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const caption = post.caption?.trim() || null;
  const kind = post.mediaType === "VIDEO" ? "Video" : post.mediaType === "CAROUSEL_ALBUM" ? "Galería" : null;

  return (
    <motion.a
      className="ig-card"
      href={post.permalink}
      target="_blank"
      rel="noreferrer"
      aria-label={`${kind ? `${kind} de` : "Publicación de"} La Bodega en Instagram${caption ? `: ${caption.slice(0, 90)}` : ""}`}
      whileHover={reduce ? undefined : { y: -6, rotate: -0.6 }}
      whileTap={reduce ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <span className="ig-photo" data-loaded={loaded || undefined}>
        <motion.img
          src={post.thumbnailUrl}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={() => setLoaded(true)}
          // Desde caché la imagen puede cargar antes de hidratar y onLoad no llega.
          ref={(el) => {
            if (el?.complete && el.naturalWidth > 0) setLoaded(true);
          }}
          initial={reduce ? false : { opacity: 0, scale: 1.12 }}
          animate={loaded ? { opacity: 1, scale: 1 } : undefined}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        />
        {kind ? (
          <span className="ig-kind" aria-hidden="true">
            {post.mediaType === "VIDEO" ? <Play /> : <Images />}
          </span>
        ) : null}
        <span className="ig-open" aria-hidden="true">
          <ArrowUpRight />
        </span>
      </span>
      <span className="ig-ticket">
        {caption ? <span className="ig-cap">{caption}</span> : null}
        {post.timestamp ? <time dateTime={post.timestamp}>{shortDate(post.timestamp)}</time> : null}
      </span>
    </motion.a>
  );
}
