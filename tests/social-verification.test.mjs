import assert from "node:assert/strict";
import { test } from "node:test";
import { hasPendingInstagram, canVerifyTikTok, waitForTikTokVerification, verificationPollDelay } from "../src/lib/social-verification.ts";

const campaign = { status: "active", code: "BC-ABC234", participationStatus: "pending", networks: ["tiktok"] };

test("TikTok pendiente no activa sondeo, incluso tras completar Instagram en una campaña mixta", () => {
  assert.equal(hasPendingInstagram(campaign), false);
  assert.equal(hasPendingInstagram({ ...campaign, networks: ["instagram", "tiktok"], participations: [{ network: "instagram", status: "completed" }, { network: "tiktok", status: "pending" }] }), false);
  assert.equal(hasPendingInstagram({ ...campaign, networks: ["instagram", "tiktok"], participations: [{ network: "instagram", status: "pending" }, { network: "tiktok", status: "completed" }] }), true);
  assert.equal(hasPendingInstagram({ status: "active", participationStatus: "pending" }), true);
  assert.equal(hasPendingInstagram({ status: "paused", participationStatus: "pending" }), false);
});

test("verificar exige TikTok pendiente, código y campaña activa", () => {
  assert.equal(canVerifyTikTok(campaign), true);
  for (const patch of [{ code: null }, { status: "closed" }, { status: "paused" }, { participationStatus: "completed" }, { networks: ["instagram"] }, { participations: [{ network: "tiktok", status: "completed" }, { network: "instagram", status: "pending" }] }]) {
    assert.equal(canVerifyTikTok({ ...campaign, ...patch }), false);
  }
  assert.equal(canVerifyTikTok({ ...campaign, participations: [{ network: "instagram", status: "completed" }, { network: "tiktok", status: "pending" }] }), true);
});

test("consulta solo el trabajo aceptado hasta que termina", async () => {
  const states = ["running", "processing", "succeeded"];
  let reads = 0;
  const result = await waitForTikTokVerification({ id: "j1", status: "queued" }, async () => ({ id: "j1", status: states[reads++] }), new AbortController().signal, { intervalMs: 1, maxChecks: 5 });
  assert.equal(result.status, "succeeded");
  assert.equal(reads, 3);
});

test("limita las consultas y distingue trabajo pendiente, fallo y conexión caída", async () => {
  let reads = 0;
  const result = await waitForTikTokVerification({ id: "j1", status: "running" }, async () => { reads++; return { id: "j1", status: "running" }; }, new AbortController().signal, { intervalMs: 1, maxChecks: 2 });
  assert.equal(result, null);
  assert.equal(reads, 2);
  for (const status of ["failed", "unknown", "succeeded"]) {
    const job = await waitForTikTokVerification({ id: "j1", status }, () => assert.fail("no debe consultar un trabajo terminado"), new AbortController().signal);
    assert.equal(job.status, status);
  }
  await assert.rejects(waitForTikTokVerification({ id: "j1", status: "queued" }, async () => { throw new Error("sin conexión"); }, new AbortController().signal, { intervalMs: 1, maxChecks: 1 }), /sin conexión/);
});

test("abandonar la tarjeta cancela las lecturas pendientes", async () => {
  const controller = new AbortController();
  const pending = waitForTikTokVerification({ id: "j1", status: "queued" }, () => assert.fail("consulta después de cancelar"), controller.signal);
  controller.abort();
  await assert.rejects(pending, { name: "AbortError" });
});


test("el sondeo se espacia mientras extrae y acelera al procesar", () => {
  assert.deepEqual([0,2,4,6,10].map(i=>verificationPollDelay({id:"j",status:"running"},i)),[2000,4000,8000,15000,15000]);
  assert.equal(verificationPollDelay({id:"j",status:"processing"},10),2000);
  assert.equal(verificationPollDelay({id:"j",status:"running",retryAfterSeconds:5},0),5000);
  assert.equal(verificationPollDelay({id:"j",status:"running",retryAfterSeconds:Infinity},0),2000);
});

test("un resultado ya acreditado no genera lecturas adicionales", async () => {
  const result=await waitForTikTokVerification({id:"code1",status:"succeeded"},()=>assert.fail("lectura innecesaria"),new AbortController().signal);
  assert.equal(result.status,"succeeded");
});

test("respeta el límite de tiempo sin iniciar otra consulta", async () => {
  const result=await waitForTikTokVerification({id:"j",status:"running"},()=>assert.fail("lectura tras el plazo"),new AbortController().signal,{maxChecks:60,intervalMs:100,maxWaitMs:1});
  assert.equal(result,null);
});
