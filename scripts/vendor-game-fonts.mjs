import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const destination = new URL('../public/fonts/games/', import.meta.url);
await mkdir(destination, { recursive: true });
const manifest = [];
for (const folder of ['bigshoulders', 'hankengrotesk', 'shrikhand']) {
  const base = `https://raw.githubusercontent.com/google/fonts/main/ofl/${folder}/`;
  const metadataResponse = await fetch(base + 'METADATA.pb');
  if (!metadataResponse.ok) throw new Error(`Cannot read font metadata: ${folder}`);
  const metadata = await metadataResponse.text();
  const file = [...metadata.matchAll(/filename: "([^"]+\.ttf)"/g)].map(match => match[1]).find(name => !name.toLowerCase().includes('italic'));
  if (!file) throw new Error(`Missing regular font: ${folder}`);
  const response = await fetch(base + encodeURIComponent(file));
  if (!response.ok) throw new Error(`Cannot download font: ${folder}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 1024 || buffer.readUInt32BE(0) !== 0x00010000) throw new Error(`Invalid TrueType asset: ${folder}`);
  await writeFile(new URL(`${folder}.ttf`, destination), buffer);
  const license = await fetch(base + 'OFL.txt');
  if (!license.ok) throw new Error(`Missing license: ${folder}`);
  await writeFile(new URL(`${folder}-OFL.txt`, destination), await license.text());
  manifest.push({ file: `${folder}.ttf`, source: base + encodeURIComponent(file), sha256: createHash('sha256').update(buffer).digest('hex') });
}
await writeFile(new URL('sources.json', destination), JSON.stringify(manifest, null, 2) + '\n');
console.log('Vendored original Google Fonts assets and licenses.');
