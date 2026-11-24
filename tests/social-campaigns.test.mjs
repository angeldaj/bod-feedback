import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { before, after, test } from "node:test";
import { chromium } from "playwright";

const port = 3198;
const origin = `http://127.0.0.1:${port}`;
let server;
let browser;

before(async () => {
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", process.env.SOCIAL_TEST_BUILD ? "start" : "dev", "--hostname", "127.0.0.1", "--port", String(port)], { stdio: "ignore" });
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try { if ((await fetch(origin)).ok) break; } catch {}
    if (server.exitCode !== null) throw new Error(`Next terminó: ${server.exitCode}`);
    await delay(500);
  }
  browser = await chromium.launch({ headless: true });
});
after(async () => { await browser?.close(); server?.kill("SIGTERM"); });

const member = { id: "m1", nationality: "V", ci: 12345678, name: "Ana Prueba", whatsapp: "04141234567", email: "ana@example.com", username: "ana", birthday: null, homeBranchId: null, preferences: [], acceptsMarketing: false, memberNo: "BC-001", createdAt: "2026-01-01T12:00:00Z", referralCode: "ABCDEFGH", profileCompletionPoints: 0, state: { balance: 100, lifetime: 100, tierName: null } };

async function livePage() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  await page.addInitScript(() => { localStorage.setItem("bodega-club-refresh-token", "test-refresh"); sessionStorage.setItem("club-intro-seen", "1"); });
  const state = { posts: 0, reads: 0, statusReads: 0, awarded: false, fail: false, found: false, retryAfterSeconds: null };
  await page.route("**/loyalty/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body;
    let status = 200;
    if (path.endsWith("/auth/refresh")) body = { accessToken: "test-access", refreshToken: "test-refresh" };
    else if (path.endsWith("/loyalty/me")) body = member;
    else if (path.endsWith("/card")) body = { memberNo: "BC-001", holderName: "Ana Prueba", qrValue: "test", balance: state.awarded ? 110 : 100, lifetime: state.awarded ? 110 : 100, visits: 1, memberSince: "2026-01-01", tier: null, nextTier: null, designId: "free-classic" };
    else if (path.endsWith("/rewards")) body = { available: 100, rewards: [] };
    else if (path.endsWith("/timeline")) body = { items: [], monthly: [], thisMonth: { spent: 0, points: 0, visits: 0, favoriteBranch: null } };
    else if (path.endsWith("/tiktok-sync") && route.request().method() === "POST") {
      assert.equal(route.request().headers().authorization, "Bearer test-access");
      state.posts++;
      if (state.fail) { status = 409; body = { message: "Espera un minuto antes de volver a verificar este video.", retryAfterSeconds: state.retryAfterSeconds }; }
      else { status = 202; body = { id: "job1", status: "queued" }; }
    } else if (path.endsWith("/tiktok-sync/job1")) {
      assert.equal(route.request().headers().authorization, "Bearer test-access");
      state.statusReads++;
      state.awarded = state.found;
      body = { id: "job1", status: "succeeded" };
    } else if (path.endsWith("/social-campaigns")) {
      state.reads++;
      body = [{ id: "campaign1", title: "Prueba TikTok", instructions: "Comenta tu código", postUrl: "", tiktokUrl: "https://www.tiktok.com/@labodega", networks: ["tiktok"], points: 10, startsAt: "2026-01-01T00:00:00Z", endsAt: "2099-12-31T23:59:59Z", status: "active", code: "BC-ABC234", participationStatus: state.awarded ? "completed" : "pending", completedAt: state.awarded ? new Date().toISOString() : null, participations: [{ network: "tiktok", status: state.awarded ? "completed" : "pending", awardedPoints: state.awarded ? 10 : 0, completedAt: null }] }];
    } else if (path.endsWith("/spins")) { status = 404; body = { message: "Sin ruleta" }; }
    else if (["/card-designs", "/vouchers", "/feed", "/notifications"].some((suffix) => path.endsWith(suffix))) body = [];
    else { status = 404; body = { message: "No disponible en esta prueba" }; }
    await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  await page.goto(`${origin}/mi-club`);
  await page.getByRole("button", { name: "Verificar mi comentario" }).waitFor();
  return { page, state };
}

test("TikTok espera al clic, bloquea duplicados, consulta el trabajo y muestra el resultado", async () => {
  const { page, state } = await livePage();
  try {
    const reads = state.reads;
    await delay(5_500);
    assert.equal(state.posts, 0);
    assert.equal(state.reads, reads, "TikTok pendiente no debe activar sondeo");
    const button = page.getByRole("button", { name: "Verificar mi comentario" });
    await button.click();
    const busy = page.getByRole("button", { name: "Verificando…" });
    await busy.waitFor();
    assert.equal(await busy.isDisabled(), true);
    assert.equal(state.posts, 1);
    await page.getByText("No encontramos tu comentario.", { exact: false }).waitFor({ timeout: 15_000 });
    assert.equal(state.statusReads, 1);
    assert.equal(state.posts, 1);
    assert.equal(await button.isEnabled(), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    if (process.env.SOCIAL_TEST_SCREENSHOT) await page.locator(".social-card").screenshot({ path: process.env.SOCIAL_TEST_SCREENSHOT });
    state.fail = true;
    await button.click();
    await page.getByText("Espera un minuto antes de volver a verificar este video.", { exact: true }).waitFor();
    assert.equal(await button.isEnabled(), true);
    state.fail = false;
    state.found = true;
    await button.click();
    await page.getByRole("button", { name: "Ver mi saldo", exact: true }).click({ timeout: 15_000 });
    await page.getByText("+10 pts acreditados", { exact: true }).waitFor({ timeout: 15_000 });
    assert.equal(await button.count(), 0);
    assert.equal(state.posts, 3);
  } finally { await page.close(); }
});

test("la demo permite obtener código y verificar sin llamar a TikTok", async () => {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  try {
    await page.goto(`${origin}/club-mock`);
    const card = page.locator(".social-card").filter({ has: page.getByRole("heading", { name: "Comenta en TikTok", exact: true }) });
    await card.waitFor();
    assert.equal(await card.getByRole("button", { name: "Verificar mi comentario" }).count(), 0);
    await card.getByRole("button", { name: "Obtener mi código" }).click();
    await card.getByRole("button", { name: "Verificar mi comentario" }).click();
    await page.getByRole("button", { name: "Ver mi saldo", exact: true }).click({ timeout: 15_000 });
    await card.getByText("+10 pts acreditados", { exact: true }).waitFor({ timeout: 5_000 });
    assert.equal(await card.getByRole("button", { name: "Verificar mi comentario" }).count(), 0);
  } finally { await page.close(); }
});


test("respeta la espera del servidor y no repite llamadas durante el bloqueo", async () => {
  const {page,state}=await livePage();
  try {
    await page.clock.install();
    state.fail=true;state.retryAfterSeconds=120;
    await page.getByRole("button",{name:"Verificar mi comentario",exact:true}).click();
    const blocked=page.getByRole("button",{name:"Espera para verificar de nuevo",exact:true});
    await blocked.waitFor();
    assert.equal(await blocked.isDisabled(),true);
    assert.equal(state.posts,1);
    await page.clock.fastForward(120_001);
    assert.equal(await page.getByRole("button",{name:"Verificar mi comentario",exact:true}).isEnabled(),true);
    assert.equal(state.posts,1);
  } finally {await page.close();}
});
