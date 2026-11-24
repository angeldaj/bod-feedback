import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

// Exercise the real API adapter and phone normalizer without a browser or live API.
function apiFixture() {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const calls = [];
  const cache = new Map();
  const fetch = async (url, init) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ id: 'case', caseNumber: 'Q-0123', priority: 'medium' }), { status: 201 });
  };
  function load(filename) {
    if (cache.has(filename)) return cache.get(filename);
    const loadedModule = { exports: {} };
    cache.set(filename, loadedModule.exports);
    const output = ts.transpileModule(readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const localRequire = id => {
      if (!id.startsWith('@/')) throw new Error(`Unexpected import ${id}`);
      return load(path.join(root, 'src', `${id.slice(2)}.ts`));
    };
    new Function('require', 'module', 'exports', 'fetch', 'FormData', 'File', 'process', output)(localRequire, loadedModule, loadedModule.exports, fetch, FormData, File, { env: { NEXT_PUBLIC_API_BASE_URL: 'https://example.invalid/api' } });
    return loadedModule.exports;
  }
  return { api: load(path.join(root, 'src/lib/feedback-api.ts')), calls };
}
const state = { branchId: 'branch', channel: 'dine_in', orderNumber: '', categories: ['cold_food'], description: 'Llegó fría.', name: 'María', phone: '4141234567' };
test('el teléfono por sí solo no autoriza WhatsApp; el permiso no es obligatorio para enviar', async () => {
  const { api, calls } = apiFixture();
  await api.submitIncident(state, [], null);
  assert.equal(calls[0].init.body.get('phone'), '+584141234567');
  assert.equal(calls[0].init.body.get('whatsappConsent'), 'false');
});
test('envía opt-in solo con teléfono válido y autorización explícita', async () => {
  const { api, calls } = apiFixture();
  await api.submitIncident({ ...state, whatsappConsent: true }, [], null);
  await api.submitIncident({ ...state, phone: '', whatsappConsent: true }, [], null);
  assert.equal(calls[0].init.body.get('whatsappConsent'), 'true');
  assert.equal(calls[1].init.body.get('whatsappConsent'), 'false');
});
test('conserva la clave de envío en los reintentos para que el backend deduplique', async () => {
  const { api, calls } = apiFixture();
  const options = { submissionId: '11111111-1111-4111-8111-111111111111' };
  await api.submitIncident(state, [], null, options);
  await api.submitIncident(state, [], null, options);
  assert.equal(calls[0].init.body.get('submissionId'), options.submissionId);
  assert.equal(calls[1].init.body.get('submissionId'), options.submissionId);
});
