"use client";

import { useRef } from "react";
import QRCode from "react-qr-code";
import { Sparkles } from "lucide-react";
import Image from "next/image";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";
import { MEMBER, POINTS } from "./data";

/**
 * The showpiece: a holographic gold membership card that tilts toward the
 * pointer in 3D and carries a cursor-tracked glare. Falls back to a static card
 * when the user prefers reduced motion. The QR encodes the member's account URL.
 */
export function MembershipCard() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(py, [0, 1], [9, -9]), {
    stiffness: 160,
    damping: 18,
  });
  const rotateY = useSpring(useTransform(px, [0, 1], [-11, 11]), {
    stiffness: 160,
    damping: 18,
  });

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduce) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    px.set(x);
    py.set(y);
    ref.current?.style.setProperty("--gx", `${x * 100}%`);
    ref.current?.style.setProperty("--gy", `${y * 100}%`);
  }

  function handleLeave() {
    px.set(0.5);
    py.set(0.5);
    ref.current?.style.setProperty("--gx", "70%");
    ref.current?.style.setProperty("--gy", "12%");
  }

  return (
    <div className="mc-card-scene w-full">
      <motion.div
        ref={ref}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={reduce ? undefined : { rotateX, rotateY }}
        className="mc-card mx-auto flex aspect-[1.586/1] w-full max-w-[27rem] flex-col justify-between p-6 sm:p-7"
      >
        <span className="mc-card-grain" aria-hidden="true" />
        <span className="mc-card-glare" aria-hidden="true" />

        <div className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#1a120b]">
              <Image
                src="/logo-bodega.png"
                alt=""
                width={30}
                height={30}
                className="size-7 object-contain"
              />
            </span>
            <div className="leading-none">
              <p className="text-lg font-bold uppercase tracking-[0.05em] text-[#2a1608]">
                Bodega Club
              </p>
              <p className="mt-0.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#7a4a16]">
                Tarjeta de socio
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#2a1608] px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-[#f3d692]">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {MEMBER.tier}
          </span>
        </div>

        <div className="relative flex items-end justify-between gap-5">
          <div className="min-w-0">
            <span className="mc-card-chip mb-4 block" aria-hidden="true" />
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#7a4a16]">
              Puntos disponibles
            </p>
            <p className="mc-card-value mt-1 text-[3.25rem]">
              {POINTS.balance}
            </p>
            <p className="mt-2 truncate text-base font-semibold uppercase tracking-[0.04em] text-[#3a1e08]">
              {MEMBER.fullName}
            </p>
            <p className="font-serif text-sm tracking-[0.14em] text-[#6b3e14] tabular-nums">
              {MEMBER.memberNo}
            </p>
          </div>
          <div className="mc-card-qr shrink-0">
            <QRCode
              value={MEMBER.qrValue}
              size={78}
              bgColor="transparent"
              fgColor="#2a1608"
              level="M"
              aria-hidden="true"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
