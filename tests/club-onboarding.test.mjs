import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { after, before, test } from "node:test";
import { chromium } from "playwright";

const port = 3197;
const origin = `http://127.0.0.1:${port}`;
let server;
let browser;

before(async () => {
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
    stdio: "ignore",
  });
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(origin);
      if (response.ok) break;
    } catch {}
    if (server.exitCode !== null) throw new Error(`Next dev server exited with ${server.exitCode}`);
    await delay(500);
  }
  browser = await chromium.launch({ headless: true });
});

after(async () => {
  await browser?.close();
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
    await delay(500);
  }
});

test("registro reducido valida contraseña y envía el código de referido automáticamente", async () => {
  const page = await browser.newPage();
  let registrationBody;
  await page.route("https://app.bod-service.cloud/api/loyalty/register", async (route) => {
    registrationBody = route.request().postDataJSON();
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "access", refreshToken: "refresh", welcomeBonus: 50,
        member: {
          id: "member-1", nationality: "V", ci: 12345678, name: null, whatsapp: null,
          referralCode: "A1B2C3D4E5F6", profileCompletionPoints: 10,
          email: "ana@example.com", username: "ana.prueba", birthday: null,
          homeBranchId: null, preferences: [], acceptsMarketing: false,
          notifyWhatsapp: true, notifyEmail: false, notifyOffers: true,
          memberNo: "BC-001", createdAt: new Date().toISOString(),
          state: { balance: 50, lifetime: 50, tierName: null },
        },
      }),
    });
  });

  await page.goto(`${origin}/bodega-club?ref=ABCDEF123456`);
  await page.getByRole("dialog").waitFor();
  assert.equal(await page.getByLabel("Nombre completo").count(), 0);
  assert.equal(await page.getByLabel("WhatsApp", { exact: true }).count(), 0);
  assert.equal(await page.getByLabel("Cumpleaños, opcional").count(), 0);
  assert.equal(await page.getByLabel("Correo").count(), 1);
  assert.equal(await page.getByLabel("Usuario").count(), 1);
  assert.equal(await page.getByLabel("Confirmar contraseña").count(), 1);

  await page.getByLabel("Cédula").fill("12345678");
  await page.getByLabel("Correo").fill("ana@example.com");
  await page.getByLabel("Usuario").fill("ana.prueba");
  await page.getByLabel("Contraseña", { exact: true }).fill("secreto123");
  await page.getByLabel("Confirmar contraseña").fill("otra-clave");
  await page.getByRole("button", { name: "Crear mi membresía" }).click();
  await page.getByText("Las contraseñas no coinciden.").waitFor();
  assert.equal(registrationBody, undefined);
  await page.getByLabel("Confirmar contraseña").fill("secreto123");
  await page.getByRole("button", { name: "Crear mi membresía" }).click();
  await page.getByText("Registro completado").waitFor();

  assert.deepEqual(registrationBody, {
    nationality: "V", ci: 12345678, email: "ana@example.com", password: "secreto123",
    username: "ana.prueba", referralCode: "ABCDEF123456",
  });
  await page.close();
});
