"use client";

import { ImageIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Voucher } from "@/lib/club-api";
import { useClub } from "./club-provider";
import { expiryLabel, voucherIcon, voucherKindClass, type Tone } from "./club-visuals";

/**
 * Espacio para foto. Mientras no haya fotografía real, muestra un recuadro
 * punteado que dice qué foto va ahí; si llega `src`, la foto lo reemplaza.
 */
export function ImageSlot({
  tone,
  icon: Icon,
  caption,
  src,
}: {
  tone: Tone;
  icon: LucideIcon;
  caption?: string;
  src?: string | null;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- origen arbitrario del backend
    return <img className="ph-photo" src={src} alt={caption ?? ""} loading="lazy" />;
  }
  return (
    <div className={`ph-img tone-${tone}`} role="img" aria-label={caption ? `Espacio para foto: ${caption}` : "Espacio para foto"}>
      <span className="ph-glyph">
        <Icon aria-hidden="true" strokeWidth={1.6} />
      </span>
      {caption ? (
        <span className="ph-cap">
          <ImageIcon aria-hidden="true" />
          Foto: {caption}
        </span>
      ) : null}
    </div>
  );
}

/** Bolsillo de la Bodega Wallet: los vouchers asoman por encima. */
export function WalletPocket({ vouchers, compact = false }: { vouchers: Voucher[]; compact?: boolean }) {
  const { openOverlay } = useClub();
  const shown = vouchers.slice(0, compact ? 3 : 4);
  const more = vouchers.length - shown.length;
  const soonest = vouchers[0];

  return (
    <div className={`pocket-wrap${compact ? " compact" : ""}`} style={{ "--n": shown.length } as React.CSSProperties}>
      {shown.map((v, i) => {
        const Icon = voucherIcon(v);
        const expiry = expiryLabel(v.expiresAt);
        return (
          <button
            key={v.id}
            type="button"
            className={`vch ${voucherKindClass(v)}`}
            style={{ "--i": i } as React.CSSProperties}
            onClick={() => openOverlay({ type: "voucher", id: v.id })}
            aria-label={`${v.title}, ${v.origin === "redemption" ? "canje" : "regalo"}, ${expiry}`}
          >
            <span className="vch-l">
              <span className="ic">
                <Icon aria-hidden="true" />
              </span>
              <span>
                <b>{v.title}</b>
                <small>
                  {v.origin === "redemption" ? "Canje" : "Regalo"}, {expiry.toLowerCase()}
                </small>
              </span>
            </span>
            <span className="vch-r">{v.valueLabel}</span>
          </button>
        );
      })}
      <div className="pocket">
        <span className="pocket-stitch" aria-hidden="true" />
        {vouchers.length ? (
          <div className="pocket-c">
            <span className="big">{vouchers.length}</span>
            <b>{vouchers.length === 1 ? "Voucher activo" : "Vouchers activos"}</b>
            <small>
              {more > 0 ? `y ${more} más adentro. ` : ""}El próximo: {expiryLabel(soonest.expiresAt).toLowerCase()}
            </small>
          </div>
        ) : (
          <p className="pocket-empty">Tu Wallet está vacía. Canjea puntos o espera un regalo de la casa.</p>
        )}
      </div>
    </div>
  );
}

export function Skeleton({ height, className = "" }: { height: number | string; className?: string }) {
  return <div className={`sk ${className}`} style={{ height }} aria-hidden="true" />;
}
