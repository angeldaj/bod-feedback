// Texturas del Bodingo generadas una vez en el navegador: fibra del papel kraft
// y cuatro máscaras de tinta de sello (poros, borde irregular, salpicaduras).
// Se publican como variables CSS en <html>: --fiber, --stamp-0 … --stamp-3.

let done = false;

function paint(
  w: number,
  h: number,
  fn: (x: CanvasRenderingContext2D) => void,
): string {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  if (!x) return "";
  fn(x);
  return c.toDataURL("image/png");
}

export function ensureBodingoTextures(): void {
  if (done || typeof document === "undefined") return;
  done = true;
  const root = document.documentElement.style;
  const fiber = paint(180, 180, (x) => {
    for (let i = 0; i < 900; i++) {
      const a = Math.random() * Math.PI;
      const l = 2 + Math.random() * 7;
      const px = Math.random() * 180;
      const py = Math.random() * 180;
      x.strokeStyle = `rgba(${90 + Math.floor(Math.random() * 40)},${55 + Math.floor(Math.random() * 30)},25,${0.08 + Math.random() * 0.14})`;
      x.lineWidth = 0.6 + Math.random() * 0.8;
      x.beginPath();
      x.moveTo(px, py);
      x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l);
      x.stroke();
    }
  });
  if (fiber) root.setProperty("--fiber", `url(${fiber})`);
  for (let k = 0; k < 4; k++) {
    const mask = paint(128, 128, (x) => {
      const cx = 64;
      const R = 46;
      x.fillStyle = "#000";
      x.beginPath();
      for (let i = 0; i <= 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        const r = R + (Math.random() - 0.5) * 3.2 + Math.sin(a * 3 + k) * 1.2;
        if (i) x.lineTo(cx + Math.cos(a) * r, cx + Math.sin(a) * r);
        else x.moveTo(cx + Math.cos(a) * r, cx + Math.sin(a) * r);
      }
      x.fill();
      x.globalCompositeOperation = "destination-out";
      x.lineWidth = 2.2;
      x.strokeStyle = "rgba(0,0,0,.55)";
      x.beginPath();
      x.arc(cx, cx, R - 7, 0, Math.PI * 2);
      x.stroke();
      for (let i = 0; i < 260; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * R;
        x.fillStyle = `rgba(0,0,0,${0.2 + Math.random() * 0.6})`;
        x.beginPath();
        x.arc(
          cx + Math.cos(a) * r,
          cx + Math.sin(a) * r,
          0.4 + Math.random() * 1.6,
          0,
          7,
        );
        x.fill();
      }
      // Un lado más claro, como un sello que no asentó parejo.
      const g = x.createLinearGradient(0, 0, 128, 128);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(1, `rgba(0,0,0,${0.15 + k * 0.06})`);
      x.fillStyle = g;
      x.fillRect(0, 0, 128, 128);
      x.globalCompositeOperation = "source-over";
      x.fillStyle = "#000";
      for (let i = 0; i < 2 + k; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = R + 6 + Math.random() * 10;
        x.beginPath();
        x.arc(
          cx + Math.cos(a) * r,
          cx + Math.sin(a) * r,
          1 + Math.random() * 2.6,
          0,
          7,
        );
        x.fill();
      }
    });
    if (mask) root.setProperty(`--stamp-${k}`, `url(${mask})`);
  }
}
