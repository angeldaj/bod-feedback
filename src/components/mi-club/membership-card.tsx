"use client";

import { useRef } from "react";
import Image from "next/image";
import QRCode from "react-qr-code";
import { Lock, Sparkles } from "lucide-react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import type { CardSkin } from "@/lib/club-api";
import { SKIN_QR, fmtPts, textureUrl } from "./club-visuals";

export type CardFaceData = {
  holderName: string;
  memberNo: string;
  qrValue: string;
  balance: number;
  tierName: string;
  skin: CardSkin;
  designId: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

function CardQr({ value, skin }: { value: string; skin: CardSkin }) {
  return (
    <QRCode
      value={value}
      size={256}
      viewBox="0 0 256 256"
      bgColor="transparent"
      fgColor={SKIN_QR[skin]}
      level="M"
      aria-hidden="true"
      style={{ width: "100%", height: "100%" }}
    />
  );
}

function FaceLayers() {
  return (
    <>
      <div className="skin" />
      <div className="tex" />
      <div className="glare" />
    </>
  );
}

/**
 * La tarjeta de socio: la piel la decide el nivel y la textura el diseño
 * elegido. Interactiva, se inclina hacia el puntero y se voltea para mostrar
 * el QR grande de caja. Sin `interactive` es una tarjeta estática (galería,
 * subida de nivel).
 */
export function MembershipCard({
  data,
  interactive = false,
  flipped = false,
  onFlip,
  showBack = true,
  locked = false,
}: {
  data: CardFaceData;
  interactive?: boolean;
  flipped?: boolean;
  onFlip?: () => void;
  showBack?: boolean;
  locked?: boolean;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const glareX = useMotionValue(72);
  const glareY = useMotionValue(10);
  const rotateX = useSpring(useTransform(py, [0, 1], [8, -8]), { stiffness: 160, damping: 18 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-10, 10]), { stiffness: 160, damping: 18 });
  const gx = useMotionTemplate`${glareX}%`;
  const gy = useMotionTemplate`${glareY}%`;

  const tilt = interactive && !reduce;

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!tilt || event.pointerType === "touch") return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    px.set(x);
    py.set(y);
    glareX.set(x * 100);
    glareY.set(y * 100);
  }

  function handleLeave() {
    px.set(0.5);
    py.set(0.5);
    glareX.set(72);
    glareY.set(10);
  }

  const cardStyle = {
    "--tex": `url(${textureUrl(data.designId)})`,
    "--gx": gx,
    "--gy": gy,
    "--px": gx,
    ...(tilt ? { rotateX, rotateY } : {}),
  } as React.ComponentProps<typeof motion.div>["style"];

  return (
    <motion.div
      ref={ref}
      className={`card skin-${data.skin}`}
      style={cardStyle}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <motion.div
        className="card-inner"
        initial={false}
        animate={reduce ? undefined : { rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.75, ease: EASE }}
      >
        <div
          className="face front"
          style={reduce ? { opacity: flipped ? 0 : 1, transition: "opacity .2s" } : undefined}
          aria-hidden={flipped}
        >
          <FaceLayers />
          <div className="fc">
            <div className="fc-top">
              <div className="brand">
                <span className="logo">
                  <Image src="/logo-bodega.png" alt="" width={40} height={40} />
                </span>
                <span>
                  <b className="wm">Bodega Club</b>
                  <small>Tarjeta de socio</small>
                </span>
              </div>
              <span className="tier-pill">
                <Sparkles aria-hidden="true" />
                {data.tierName}
              </span>
            </div>
            <div className="fc-bottom">
              <div className="who">
                <small>
                  <span className="chip" aria-hidden="true" />
                  Puntos disponibles
                </small>
                <strong className="pts">{fmtPts(data.balance)}</strong>
                <span className="nm">{data.holderName}</span>
                <span className="no">{data.memberNo}</span>
              </div>
              <div className="qr-tile small">
                <CardQr value={data.qrValue} skin={data.skin} />
              </div>
            </div>
          </div>
          {locked ? (
            <span className="lock-pill">
              <Lock aria-hidden="true" />
              Por ganar
            </span>
          ) : null}
        </div>

        {showBack ? (
          <div
            className="face back"
            style={reduce ? { transform: "none", opacity: flipped ? 1 : 0, transition: "opacity .2s" } : undefined}
            aria-hidden={!flipped}
          >
            <FaceLayers />
            <div className="fc back-c">
              <div className="qr-tile big">
                <CardQr value={data.qrValue} skin={data.skin} />
              </div>
              <div className="back-info">
                <small>Muestra este código en caja</small>
                <strong className="no">{data.memberNo}</strong>
                <span className="nm">{data.holderName}</span>
                <span className="hint">Tus vouchers activos aparecen al escanear.</span>
              </div>
            </div>
          </div>
        ) : null}
      </motion.div>

      {interactive && onFlip ? (
        <button
          type="button"
          className="card-tap"
          onClick={onFlip}
          aria-label={flipped ? "Ver el frente de tu tarjeta" : "Ver el reverso de tu tarjeta con el QR"}
        />
      ) : null}
    </motion.div>
  );
}
