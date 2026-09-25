"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight, Gift, Layers, Rotate3d, ScanLine, Sparkles } from "lucide-react";
import type { ClubCard } from "@/lib/club-api";
import { useClub } from "../club-provider";
import { MembershipCard } from "../membership-card";
import { SKIN_NAME, fmtPts, toFace } from "../club-visuals";
import { Skeleton, WalletPocket } from "../pieces";

function TierProgress({ card }: { card: ClubCard }) {
  const next = card.nextTier;
  if (!next) {
    return (
      <div className="tile tier-prog">
        <div className="tp-row">
          <h3>Estás en el nivel más alto</h3>
          <div className="num">
            {fmtPts(card.lifetime)}
            <small>pts acumulados</small>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="tile tier-prog">
      <div className="tp-row">
        <h3>Camino a {next.name}</h3>
        <div className="num">
          {fmtPts(next.pointsToGo)}
          <small>pts para llegar</small>
        </div>
      </div>
      <div className="track" role="progressbar" aria-label={`Progreso hacia ${next.name}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={next.progressPct}>
        <motion.span initial={{ width: 0 }} animate={{ width: `${next.progressPct}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />
      </div>
      <div className="tp-next">
        <span className="pill">
          <Sparkles aria-hidden="true" />
          Piel {SKIN_NAME[next.skin]}
        </span>
        {next.unlocksDesign ? (
          <span className="pill">
            <Layers aria-hidden="true" />
            Diseño {next.unlocksDesign}
          </span>
        ) : null}
        {next.perk ? (
          <span className="pill coral">
            <Gift aria-hidden="true" />
            {next.perk}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function HomeScreen() {
  const { card, member, loading, activeVouchers, openOverlay } = useClub();
  const [flipped, setFlipped] = useState(false);

  if (loading || !card || !member) {
    return (
      <div className="view view-home" aria-busy="true">
        <Skeleton height={96} />
        <div className="card-hero">
          <Skeleton height={260} className="card-scene" />
        </div>
        <div className="home-side">
          <Skeleton height={150} />
          <Skeleton height={260} />
        </div>
      </div>
    );
  }

  return (
    <div className="view view-home">
      <div className="hello">
        <h1>Hola, {member.firstName}.</h1>
        <p>
          Nivel <b>{card.tier.name}</b>, en el club desde {card.memberSince}. Tienes <b className="tab-nums">{fmtPts(card.balance)}</b> pts para canjear.
        </p>
      </div>

      <div className="card-hero">
        <div className="card-scene">
          <MembershipCard data={toFace(card)} interactive flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
        </div>
        <button type="button" className="flip-btn" onClick={() => setFlipped((f) => !f)} aria-pressed={flipped}>
          <Rotate3d aria-hidden="true" />
          {flipped ? "Ver frente" : "Ver reverso"}
        </button>
        <div className="hero-actions">
          <button type="button" className="btn btn-pop" onClick={() => openOverlay({ type: "caja" })}>
            <ScanLine aria-hidden="true" />
            Mostrar en caja
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => openOverlay({ type: "gallery" })}>
            <Layers aria-hidden="true" />
            Diseño
          </button>
        </div>
      </div>

      <div className="home-side">
        <TierProgress card={card} />
        <div className="sec-head">
          <h2>Tu Wallet</h2>
          <Link href="/mi-club/wallet" className="link">
            Ver todo
            <ChevronRight aria-hidden="true" />
          </Link>
        </div>
        <WalletPocket vouchers={activeVouchers} compact />
      </div>
    </div>
  );
}
