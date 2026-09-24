// Capturas de /feedback v2 (encuesta + queja) a 375 y 1280 px, día y noche.
// Uso: con la landing corriendo en :3000 → `node shoot.mjs <carpeta-salida>`.
// Recorre los pasos SIN enviar (no crea encuestas ni quejas en el backend).
import { chromium } from "playwright";

const OUT = process.argv[2] || ".";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();

async function shoot(width, height, theme, tag) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem("labodega-theme", t);
    } catch {}
  }, theme);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));
  const snap = async (name) => {
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/${tag}-${name}.png`, fullPage: true });
  };
  const next = () => page.getByRole("button", { name: "Siguiente" }).click();

  try {
    await page.goto(`${BASE}/feedback`, { waitUntil: "networkidle" });
    await snap("covers");

    // Encuesta
    await page.getByRole("button", { name: /^Tu opinión/ }).click();
    await page.getByRole("heading", { name: "¿Dónde nos visitaste?" }).waitFor();
    await page.getByRole("radio").first().click();
    await page.getByRole("radio", { name: "Delivery" }).click();
    await page.getByRole("radio", { name: "Cena" }).click();
    await snap("s1-visit");
    await next();
    await page.getByRole("radio", { name: "4 de 5" }).click();
    await snap("s2-overall");
    await next();
    await snap("s3-aspects");
    await next();
    await page.getByRole("group", { name: "Lo que más te gustó" }).getByRole("button", { name: "Sabor" }).click();
    await snap("s4-topics");
    await next();
    await page.getByRole("radio", { name: "9 de 10" }).click();
    await snap("s5-recommend");

    // Queja
    await page.getByRole("button", { name: "Cambiar", exact: true }).first().click();
    await page.getByRole("button", { name: /^Tu queja/ }).click();
    await page.getByRole("heading", { name: "¿Dónde fue?" }).waitFor();
    await snap("q1-where");
    await page.getByRole("radio").first().click();
    await page.getByRole("radio", { name: "Comí en el local" }).click();
    await next();
    await page.getByRole("button", { name: "Reacción alérgica" }).click();
    await snap("q2-what");
    await next();
    await snap("q3-contact");
  } catch (e) {
    errors.push(`flow: ${e.message.split("\n").slice(0, 3).join(" | ")}`);
  }
  await ctx.close();
  return errors;
}

for (const [w, h, t] of [
  [1280, 900, "day"],
  [1280, 900, "night"],
  [375, 812, "day"],
  [375, 812, "night"],
]) {
  const tag = `${w < 600 ? "mob" : "desk"}-${t}`;
  const errors = await shoot(w, h, t, tag);
  console.log(`${tag} notes:`, errors.length ? errors : "none");
}
await browser.close();
