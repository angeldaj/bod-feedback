import { chromium } from "playwright";

const OUT = process.argv[2] || ".";
const steps = {
  intro: "¿Cómo estuvo",
  overall: "¿Qué tal la pasaste?",
  visit: "¿Dónde nos visitaste?",
  aspects: "¿Cómo estuvo cada cosa?",
  issues: "¿Algo que mejorar?",
  contact: "¿Te contactamos?",
  done: "Gracias",
};

const browser = await chromium.launch();

async function shoot(width, height, tag) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(String(e)));

  for (const [s, heading] of Object.entries(steps)) {
    await page.goto(`http://localhost:3000/feedback#${s}`, { waitUntil: "networkidle" });
    try { await page.getByText(heading, { exact: false }).first().waitFor({ timeout: 8000 }); } catch {}
    try {
      if (s === "overall") await page.getByRole("radio", { name: "4 de 5" }).click({ timeout: 4000 });
      if (s === "visit") {
        await page.getByRole("radio", { name: "Bodega 2" }).click({ timeout: 4000 });
        await page.getByRole("radio", { name: "Cena" }).click({ timeout: 4000 });
      }
      if (s === "issues") {
        await page.getByRole("button", { name: "Espera", exact: true }).click({ timeout: 4000 });
        await page.getByRole("button", { name: "Ruido", exact: true }).click({ timeout: 4000 });
      }
    } catch (e) { errors.push(`interact ${s}: ${e.message.split("\n")[0]}`); }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${OUT}/${tag}-${s}.png` });
  }
  await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/${tag}-home.png` });
  await ctx.close();
  return errors;
}

const d = await shoot(1280, 900, "desk");
const m = await shoot(390, 844, "mob");
await browser.close();
console.log("DESKTOP notes:", d.length ? d : "none");
console.log("MOBILE notes:", m.length ? m : "none");
