// Sonidos de los minijuegos sintetizados con Web Audio: nada que descargar.
// Si el navegador no deja sonar todavía (sin un toque previo), se callan.

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined" || !("AudioContext" in window)) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
    return ctx;
  } catch {
    return null;
  }
}

/** Ráfaga de ruido filtrado: el "clac" de la lengüeta o de una bola. */
function click(a: AudioContext, at: number, freq: number, gain: number, dur = 0.03) {
  const length = Math.ceil(a.sampleRate * dur);
  const buffer = a.createBuffer(1, length, a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
  const source = a.createBufferSource();
  source.buffer = buffer;
  const filter = a.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 4;
  const amp = a.createGain();
  amp.gain.value = gain;
  source.connect(filter).connect(amp).connect(a.destination);
  source.start(at);
}

/** Nota corta con caída: los destellos del confeti. */
function chime(a: AudioContext, at: number, freq: number, gain: number, dur = 0.25) {
  const osc = a.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, at);
  const amp = a.createGain();
  amp.gain.setValueAtTime(0.0001, at);
  amp.gain.exponentialRampToValueAtTime(gain, at + 0.008);
  amp.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(amp).connect(a.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

/** Tic de la ruleta al pasar cada divisoria. */
export function playTick() {
  const a = audio();
  if (a) click(a, a.currentTime, 2600, 0.5);
}

/** Tómbola girando: tic-tic de bolas que se acelera y se frena en `ms`. */
export function playDrumRoll(ms = 820) {
  const a = audio();
  if (!a) return;
  const total = ms / 1000;
  let t = 0;
  while (t < total) {
    const u = t / total;
    click(a, a.currentTime + t, 1500 + Math.random() * 900, 0.35 * (1 - u * 0.6));
    // Más juntos a la mitad (gira más rápido), más separados al frenar.
    t += 0.03 + 0.07 * Math.abs(u - 0.4);
  }
}

/** Confeti: un "pop" y una lluvia de destellos agudos. */
export function playConfetti() {
  const a = audio();
  if (!a) return;
  const now = a.currentTime;
  click(a, now, 900, 0.9, 0.08);
  const notes = [1568, 2093, 2349, 2637, 3136, 3520];
  for (let i = 0; i < 14; i++) {
    chime(a, now + 0.05 + Math.random() * 0.7, notes[Math.floor(Math.random() * notes.length)], 0.05 + Math.random() * 0.05, 0.18 + Math.random() * 0.2);
  }
}
