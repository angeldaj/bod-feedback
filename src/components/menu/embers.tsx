"use client";

import { ParticleCanvas, type ParticleSystem } from "./particle-canvas";

type Ember = {
  x: number;
  y: number;
  r: number;
  speed: number;
  sway: number;
  phase: number;
  color: string;
};

const GOLD = "239, 199, 126";
const CORAL = "255, 138, 95";

/** Chispas de horno que suben, se mecen, titilan y se apagan al subir. */
const EMBERS: ParticleSystem<Ember> = {
  count: 34,
  spawn: (w, h, initial) => ({
    x: Math.random() * w,
    y: initial ? Math.random() * h : h + Math.random() * 40,
    r: 0.8 + Math.random() * 1.6,
    speed: 10 + Math.random() * 22,
    sway: 6 + Math.random() * 14,
    phase: Math.random() * Math.PI * 2,
    color: Math.random() < 0.75 ? GOLD : CORAL,
  }),
  step: (p, dt) => {
    p.y -= p.speed * dt;
    p.phase += dt * 1.3;
    return p.y >= -10;
  },
  draw: (ctx, p, _w, h) => {
    const life = Math.max(0, Math.min(1, p.y / h));
    const alpha = life * (0.55 + Math.sin(p.phase * 3) * 0.25);
    ctx.beginPath();
    ctx.fillStyle = `rgba(${p.color}, ${alpha})`;
    ctx.shadowColor = `rgba(${p.color}, ${alpha})`;
    ctx.shadowBlur = p.r * 6;
    ctx.arc(p.x + Math.sin(p.phase) * p.sway, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  },
};

/** Brasas detrás de la portada de la carta. */
export function Embers({ className = "" }: { className?: string }) {
  return <ParticleCanvas system={EMBERS} className={className} />;
}
