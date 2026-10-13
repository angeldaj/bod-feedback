"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

type Ember = {
  x: number;
  y: number;
  r: number;
  speed: number;
  sway: number;
  phase: number;
  hue: "gold" | "coral";
};

const COUNT = 34;
const COLORS = { gold: "239, 199, 126", coral: "255, 138, 95" };

function spawn(width: number, height: number, anywhere: boolean): Ember {
  return {
    x: Math.random() * width,
    y: anywhere ? Math.random() * height : height + Math.random() * 40,
    r: 0.8 + Math.random() * 1.6,
    speed: 10 + Math.random() * 22,
    sway: 6 + Math.random() * 14,
    phase: Math.random() * Math.PI * 2,
    hue: Math.random() < 0.75 ? "gold" : "coral",
  };
}

/**
 * Chispas de horno que suben despacio detrás de la portada de la carta.
 * Pocas partículas en un canvas: se pausa cuando la portada sale de la
 * pantalla o la pestaña se oculta, y no se dibuja con "reducir movimiento".
 */
export function Embers({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || reduce) return;

    let width = 0;
    let height = 0;
    let embers: Ember[] = [];
    let frame = 0;
    let last = 0;
    let onScreen = true;

    function resize() {
      if (!canvas || !ctx) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (embers.length === 0) embers = Array.from({ length: COUNT }, () => spawn(width, height, true));
    }

    function draw(now: number) {
      if (!ctx) return;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < embers.length; i++) {
        const ember = embers[i];
        ember.y -= ember.speed * dt;
        ember.phase += dt * 1.3;
        if (ember.y < -10) embers[i] = spawn(width, height, false);
        const x = ember.x + Math.sin(ember.phase) * ember.sway;
        // Se apagan al subir y titilan un poco.
        const life = Math.max(0, Math.min(1, ember.y / height));
        const alpha = life * (0.55 + Math.sin(ember.phase * 3) * 0.25);
        ctx.beginPath();
        ctx.fillStyle = `rgba(${COLORS[ember.hue]}, ${alpha})`;
        ctx.shadowColor = `rgba(${COLORS[ember.hue]}, ${alpha})`;
        ctx.shadowBlur = ember.r * 6;
        ctx.arc(x, ember.y, ember.r, 0, Math.PI * 2);
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    }

    function start() {
      if (frame || !onScreen || document.hidden) return;
      last = 0;
      frame = requestAnimationFrame(draw);
    }

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
    }

    const resizer = new ResizeObserver(resize);
    resizer.observe(canvas);
    const watcher = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) start();
      else stop();
    });
    watcher.observe(canvas);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    start();
    return () => {
      stop();
      resizer.disconnect();
      watcher.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduce]);

  if (reduce) return null;
  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none ${className}`} />;
}
