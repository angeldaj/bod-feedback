// Física del Bodingo con Matter.js: la tómbola (tambor giratorio con paletas)
// y la lluvia de bolas de la celebración (se pueden agarrar y lanzar).
// Es solo decorativa: el número que sale siempre lo decide el servidor.

import Matter from "matter-js";
import { letterOf } from "@/lib/games-api";

const { Engine, Bodies, Body, Composite, Constraint, Query } = Matter;
// Los tipos de @types/matter-js no traen el 3er argumento de Matter 0.20.
const setAngle = Body.setAngle as (
  body: Matter.Body,
  angle: number,
  updateVelocity?: boolean,
) => void;

// El canvas no entiende variables CSS: se lee la familia real de next/font una vez.
let numFont = '"Arial Narrow", sans-serif';
export function setBallFontFrom(el: Element | null) {
  const family = el
    ? getComputedStyle(el).getPropertyValue("--font-game-num").trim()
    : "";
  if (family) numFont = family;
}

/** Bola dorada: la luz no gira, el disco con el número sí. */
export function drawBall(
  x: CanvasRenderingContext2D,
  px: number,
  py: number,
  r: number,
  n: number | null,
  angle = 0,
) {
  x.save();
  x.translate(px, py);
  const g = x.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.05, 0, 0, r);
  g.addColorStop(0, "#FFF1CC");
  g.addColorStop(0.35, "#F0C274");
  g.addColorStop(1, "#8E621A");
  x.beginPath();
  x.arc(0, 0, r, 0, Math.PI * 2);
  x.fillStyle = g;
  x.fill();
  x.rotate(angle);
  x.beginPath();
  if (n) {
    x.arc(0, 0, r * 0.58, 0, Math.PI * 2);
    x.fillStyle = "#FBF6EA";
    x.fill();
    x.fillStyle = "#2A1A11";
    x.font = `900 ${r * 0.68}px ${numFont}`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(String(n), 0, r * 0.04);
  } else {
    x.arc(r * 0.25, 0, r * 0.3, 0, Math.PI * 2);
    x.fillStyle = "rgba(251,246,234,.9)";
    x.fill();
  }
  x.rotate(-angle);
  x.beginPath();
  x.ellipse(-r * 0.38, -r * 0.42, r * 0.26, r * 0.16, -0.6, 0, Math.PI * 2);
  x.fillStyle = "rgba(255,255,255,.55)";
  x.fill();
  x.restore();
}

const W = 104;
const H = 124;
const CX = 52;
const CY = 52;
const R = 44;
const BR = 6.2;
const BALL_OPTS = {
  restitution: 0.45,
  friction: 0.02,
  frictionAir: 0.004,
  density: 0.002,
};

/** Tómbola en un canvas de 104×124 px. `kick()` la acelera antes de soltar una bola. */
export class Tombola {
  private engine = Engine.create();
  private cage: Matter.Body;
  private speed = 0.8;
  private raf = 0;
  private ctx: CanvasRenderingContext2D | null;
  private timers: number[] = [];

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly still: boolean,
  ) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    this.ctx = canvas.getContext("2d");
    this.ctx?.scale(dpr, dpr);
    this.engine.positionIterations = 8;
    const parts: Matter.Body[] = [];
    const n = 30;
    const th = 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const d = R + th / 2 - 1;
      parts.push(
        Bodies.rectangle(
          CX + Math.cos(a) * d,
          CY + Math.sin(a) * d,
          (2 * Math.PI * d) / n + 1.5,
          th,
          { angle: a + Math.PI / 2 },
        ),
      );
    }
    // Tres paletas levantan las bolas cuando el tambor acelera.
    for (let k = 0; k < 3; k++) {
      const a = (k * 2 * Math.PI) / 3;
      parts.push(
        Bodies.rectangle(
          CX + Math.cos(a) * (R - 6),
          CY + Math.sin(a) * (R - 6),
          12,
          3,
          { angle: a },
        ),
      );
    }
    this.cage = Body.create({ parts, isStatic: true, friction: 0.4 });
    const balls = Array.from({ length: 14 }, (_, i) =>
      Bodies.circle(
        CX - 14 + (i % 5) * 7,
        CY - 6 + Math.floor(i / 5) * 7,
        BR,
        BALL_OPTS,
      ),
    );
    Composite.add(this.engine.world, [this.cage, ...balls]);
    for (let i = 0; i < 90; i++) Engine.update(this.engine, 1000 / 60);
    if (still) this.draw();
    else this.loop();
  }

  private balls() {
    return Composite.allBodies(this.engine.world).filter(
      (b) => b.label === "Circle Body",
    );
  }

  private loop() {
    let last = performance.now();
    const frame = (t: number) => {
      const dt = Math.min(32, t - last);
      last = t;
      this.speed += (0.8 - this.speed) * Math.min(1, (dt / 1000) * 1.1);
      for (let s = 0; s < 3; s++) {
        // updateVelocity = true: el tambor empuja las bolas en vez de atravesarlas (Matter 0.20).
        setAngle(
          this.cage,
          this.cage.angle + (this.speed * dt) / 1000 / 3,
          true,
        );
        Engine.update(this.engine, dt / 3);
      }
      for (const b of this.balls()) {
        if (Math.hypot(b.position.x - CX, b.position.y - CY) > R + 4) {
          Body.setPosition(b, { x: CX, y: CY });
          Body.setVelocity(b, { x: 0, y: 0 });
        }
      }
      this.draw();
      this.raf = requestAnimationFrame(frame);
    };
    this.raf = requestAnimationFrame(frame);
  }

  private draw() {
    const x = this.ctx;
    if (!x) return;
    const ang = this.cage.angle;
    x.clearRect(0, 0, W, H);
    x.strokeStyle = "#6B3B27";
    x.lineWidth = 5;
    x.lineCap = "round";
    x.beginPath();
    x.moveTo(CX, CY);
    x.lineTo(CX - 30, H - 7);
    x.moveTo(CX, CY);
    x.lineTo(CX + 30, H - 7);
    x.stroke();
    x.fillStyle = "#6B3B27";
    x.fillRect(CX - 40, H - 8, 80, 5);
    x.fillStyle = "rgba(0,0,0,.32)";
    x.beginPath();
    x.arc(CX, CY, R, 0, Math.PI * 2);
    x.fill();
    for (const b of this.balls())
      drawBall(x, b.position.x, b.position.y, BR, null, b.angle);
    x.strokeStyle = "rgba(240,194,116,.45)";
    x.lineWidth = 1.1;
    x.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = ang + (k * Math.PI) / 4;
      x.moveTo(CX, CY);
      x.lineTo(CX + Math.cos(a) * R, CY + Math.sin(a) * R);
    }
    x.stroke();
    x.beginPath();
    x.arc(CX, CY, R * 0.55, 0, Math.PI * 2);
    x.stroke();
    x.strokeStyle = "#F0C274";
    x.lineWidth = 2.6;
    for (let k = 0; k < 3; k++) {
      const a = ang + (k * 2 * Math.PI) / 3;
      x.beginPath();
      x.moveTo(CX + Math.cos(a) * (R - 12), CY + Math.sin(a) * (R - 12));
      x.lineTo(CX + Math.cos(a) * R, CY + Math.sin(a) * R);
      x.stroke();
    }
    x.beginPath();
    x.arc(CX, CY, R, 0, Math.PI * 2);
    x.stroke();
    x.fillStyle = "#F0C274";
    x.beginPath();
    x.arc(CX, CY, 4, 0, Math.PI * 2);
    x.fill();
    x.strokeStyle = "#8A5236";
    x.lineWidth = 9;
    x.lineCap = "butt";
    x.beginPath();
    x.moveTo(CX + R * 0.6, CY + R * 0.62);
    x.lineTo(W, CY + R * 0.95);
    x.stroke();
  }

  kick() {
    this.speed = 9;
  }

  /** Saca la bola más cercana a la canaleta y devuelve su posición en pantalla; repone otra después. */
  takeBall(): { x: number; y: number } {
    const r = this.canvas.getBoundingClientRect();
    const k = r.width / W;
    const balls = this.balls();
    if (!balls.length)
      return { x: r.right - 4, y: r.top + (CY + R * 0.95) * k };
    const b = balls.reduce((a, c) =>
      c.position.y + c.position.x * 0.3 > a.position.y + a.position.x * 0.3
        ? c
        : a,
    );
    Composite.remove(this.engine.world, b);
    this.timers.push(
      window.setTimeout(
        () =>
          Composite.add(
            this.engine.world,
            Bodies.circle(CX, CY - R * 0.5, BR, BALL_OPTS),
          ),
        1400,
      ),
    );
    if (this.still) this.draw();
    return { x: r.left + b.position.x * k, y: r.top + b.position.y * k };
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.timers.forEach(clearTimeout);
    Engine.clear(this.engine);
  }
}

/**
 * Celebración: las bolas de la partida caen, se amontonan y se pueden agarrar y
 * lanzar. Arrastre propio con eventos de puntero (Matter.Mouse redondea la
 * escala de pantalla y falla con 125 %/150 %). El canvas no captura punteros:
 * un toque sobre una bola la agarra; en otro lado llega a los botones.
 */
export function startBallRain(
  host: HTMLElement,
  numbers: number[],
  winning: number | null,
): () => void {
  const canvas = document.createElement("canvas");
  canvas.className = "bdg-pile";
  host.appendChild(canvas);
  // shortcut: el área se mide una vez; girar el teléfono con la celebración abierta deja las paredes viejas.
  const w = window.innerWidth;
  const h = window.innerHeight;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const x = canvas.getContext("2d");
  x?.scale(dpr, dpr);
  const engine = Engine.create();
  const wall = { isStatic: true, friction: 0.6 };
  Composite.add(engine.world, [
    Bodies.rectangle(w / 2, h + 30, w * 3, 60, wall),
    Bodies.rectangle(-30, h / 2, 60, h * 4, wall),
    Bodies.rectangle(w + 30, h / 2, 60, h * 4, wall),
  ]);
  const r0 = Math.max(18, Math.min(30, w / 16));
  const meta = new Map<number, { n: number; r: number }>();
  const timers: number[] = [];
  numbers.slice(-34).forEach((n, i, list) => {
    timers.push(
      window.setTimeout(
        () => {
          const r =
            n === winning ? r0 * 1.5 : r0 * (0.85 + Math.random() * 0.25);
          const b = Bodies.circle(
            r + Math.random() * (w - 2 * r),
            -r - Math.random() * 80,
            r,
            {
              restitution: 0.5,
              friction: 0.08,
              frictionAir: 0.01,
              density: 0.002,
            },
          );
          Body.setAngularVelocity(b, (Math.random() - 0.5) * 0.25);
          meta.set(b.id, { n, r });
          Composite.add(engine.world, b);
        },
        n === winning ? list.length * 55 + 250 : i * 55,
      ),
    );
  });
  const balls = () =>
    Composite.allBodies(engine.world).filter((b) => meta.has(b.id));
  let drag: Matter.Constraint | null = null;
  let swallowClick = false;
  const prevTouch = host.style.touchAction;
  host.style.touchAction = "none";
  const onDown = (e: PointerEvent) => {
    const pt = { x: e.clientX, y: e.clientY };
    const hit = Query.point(balls(), pt).at(-1);
    if (!hit) return;
    e.preventDefault();
    e.stopPropagation();
    swallowClick = true;
    drag = Constraint.create({
      pointA: pt,
      bodyB: hit,
      pointB: { x: pt.x - hit.position.x, y: pt.y - hit.position.y },
      length: 0,
      stiffness: 0.2,
      damping: 0.1,
    });
    Composite.add(engine.world, drag);
    try {
      host.setPointerCapture(e.pointerId);
    } catch {
      // Sin captura el arrastre igual funciona mientras el puntero siga sobre la capa.
    }
    host.style.cursor = "grabbing";
  };
  const onMove = (e: PointerEvent) => {
    const pt = { x: e.clientX, y: e.clientY };
    if (drag) drag.pointA = pt;
    else host.style.cursor = Query.point(balls(), pt).length ? "grab" : "";
  };
  const onUp = () => {
    if (!drag) return;
    Composite.remove(engine.world, drag);
    drag = null;
    host.style.cursor = "";
    window.setTimeout(() => (swallowClick = false), 0);
  };
  const onClick = (e: MouseEvent) => {
    if (!swallowClick) return;
    swallowClick = false;
    e.preventDefault();
    e.stopPropagation();
  };
  host.addEventListener("pointerdown", onDown, true);
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerup", onUp);
  host.addEventListener("pointercancel", onUp);
  host.addEventListener("click", onClick, true);
  let raf = 0;
  const frame = () => {
    Engine.update(engine, 1000 / 60);
    if (x) {
      x.clearRect(0, 0, w, h);
      for (const b of balls()) {
        const m = meta.get(b.id)!;
        drawBall(x, b.position.x, b.position.y, m.r, m.n, b.angle);
      }
    }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf);
    timers.forEach(clearTimeout);
    host.removeEventListener("pointerdown", onDown, true);
    host.removeEventListener("pointermove", onMove);
    host.removeEventListener("pointerup", onUp);
    host.removeEventListener("pointercancel", onUp);
    host.removeEventListener("click", onClick, true);
    host.style.touchAction = prevTouch;
    host.style.cursor = "";
    Engine.clear(engine);
    canvas.remove();
  };
}

export const ballLabel = (n: number) => `${letterOf(n)}-${n}`;
