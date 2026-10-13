"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Un efecto de partículas: cómo nace cada una, cómo avanza y cómo se dibuja.
 * Las coordenadas son píxeles CSS del canvas (`w` × `h`).
 */
export type ParticleSystem<P> = {
  count: number;
  /** `initial`: al arrancar, repartidas por todo el recorrido. */
  spawn(w: number, h: number, initial: boolean): P;
  /** Avanza `dt` segundos; `false` si terminó y hay que hacer nacer otra. */
  step(p: P, dt: number, w: number, h: number): boolean;
  draw(ctx: CanvasRenderingContext2D, p: P, w: number, h: number): void;
};

/**
 * Canvas liviano para efectos de la carta (brasas, vapor, burbujas…). Solo
 * anima mientras se ve en pantalla y la pestaña está activa, y con
 * "reducir movimiento" no se dibuja. `system` debe ser una constante del
 * módulo (no se recrea en cada render).
 */
export function ParticleCanvas<P>({ system, className = "" }: { system: ParticleSystem<P>; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || reduce) return;

    let width = 0;
    let height = 0;
    let particles: P[] = [];
    let frame = 0;
    let last = 0;
    let onScreen = false;

    function resize() {
      if (!canvas || !ctx) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (particles.length === 0 && width > 0) {
        particles = Array.from({ length: system.count }, () => system.spawn(width, height, true));
      }
    }

    function draw(now: number) {
      if (!ctx) return;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        if (!system.step(particles[i], dt, width, height)) particles[i] = system.spawn(width, height, false);
        system.draw(ctx, particles[i], width, height);
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
    return () => {
      stop();
      resizer.disconnect();
      watcher.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduce, system]);

  if (reduce) return null;
  return <canvas ref={canvasRef} aria-hidden="true" className={`pointer-events-none ${className}`} />;
}
