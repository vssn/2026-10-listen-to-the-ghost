// Tiny Web-Audio synth: all sounds and music are generated, no audio files.

let ctx = null;
let master = null;
let musicBus = null;
let muted = false;
let noiseBuf = null;

export function initAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    musicBus = ctx.createGain();
    musicBus.gain.value = 0.55;
    musicBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === 'suspended') ctx.resume();
}

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.setTargetAtTime(muted ? 0 : 0.5, ctx.currentTime, 0.02);
  return muted;
}
export const isMuted = () => muted;

function env(g, t, a, peak, d) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function tone({ type = 'sine', f0, f1 = f0, dur = 0.2, vol = 0.2, delay = 0, attack = 0.01, out = master, vibrato = 0 }) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  if (vibrato) {
    const lfo = ctx.createOscillator();
    const lg = ctx.createGain();
    lfo.frequency.value = 7;
    lg.gain.value = vibrato;
    lfo.connect(lg).connect(o.frequency);
    lfo.start(t);
    lfo.stop(t + dur + 0.05);
  }
  env(g, t, attack, vol, dur);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + attack + dur + 0.05);
}

function noise({ dur = 0.2, vol = 0.2, delay = 0, type = 'lowpass', f0 = 1000, f1 = f0, q = 1 }) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const s = ctx.createBufferSource();
  s.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  const g = ctx.createGain();
  env(g, t, 0.005, vol, dur);
  s.connect(f).connect(g).connect(master);
  s.start(t);
  s.stop(t + dur + 0.05);
}

export const sfx = {
  boo() {
    tone({ type: 'sine', f0: 260, f1: 140, dur: 0.55, vol: 0.35, attack: 0.04, vibrato: 18 });
    tone({ type: 'triangle', f0: 390, f1: 200, dur: 0.5, vol: 0.12, attack: 0.04, vibrato: 12 });
  },
  scream() {
    const b = 500 + Math.random() * 300;
    tone({ type: 'square', f0: b, f1: b * 2.4, dur: 0.28, vol: 0.07, vibrato: 30 });
    tone({ type: 'sawtooth', f0: b * 1.5, f1: b * 3, dur: 0.22, vol: 0.04, delay: 0.03 });
  },
  hide() { noise({ dur: 0.12, vol: 0.25, f0: 400, f1: 120 }); },
  zap() {
    tone({ type: 'sawtooth', f0: 1400, f1: 300, dur: 0.18, vol: 0.08 });
    noise({ dur: 0.1, vol: 0.08, type: 'highpass', f0: 3000 });
  },
  charge() { tone({ type: 'sine', f0: 200, f1: 900, dur: 0.45, vol: 0.08, vibrato: 25 }); },
  fizzle() { noise({ dur: 0.08, vol: 0.06, type: 'highpass', f0: 4000 }); },
  crash() {
    noise({ dur: 0.6, vol: 0.45, f0: 2500, f1: 200 });
    tone({ type: 'triangle', f0: 120, f1: 40, dur: 0.4, vol: 0.35 });
    for (let i = 0; i < 4; i++) tone({ type: 'square', f0: 1800 + Math.random() * 1500, dur: 0.06, vol: 0.03, delay: 0.05 + i * 0.07 });
  },
  creak() { tone({ type: 'sawtooth', f0: 90, f1: 60, dur: 0.35, vol: 0.06, vibrato: 10 }); },
  hurt() {
    tone({ type: 'square', f0: 420, f1: 120, dur: 0.25, vol: 0.12 });
  },
  poof() { noise({ dur: 0.35, vol: 0.2, type: 'bandpass', f0: 300, f1: 2500, q: 2 }); },
  bonk() {
    tone({ type: 'square', f0: 180, f1: 90, dur: 0.15, vol: 0.15 });
    tone({ type: 'sine', f0: 1200, f1: 1600, dur: 0.3, vol: 0.06, delay: 0.1, vibrato: 60 });
  },
  laugh() {
    [0, 0.18, 0.36, 0.54].forEach((d, i) => {
      tone({ type: 'sawtooth', f0: 210 - i * 15, f1: 150 - i * 12, dur: 0.14, vol: 0.12, delay: d, vibrato: 8 });
    });
  },
  rise() {
    tone({ type: 'sine', f0: 110, f1: 440, dur: 1.6, vol: 0.18, attack: 0.3, vibrato: 6 });
    tone({ type: 'sine', f0: 165, f1: 660, dur: 1.6, vol: 0.08, attack: 0.3, vibrato: 9 });
  },
  dirt() { noise({ dur: 0.3, vol: 0.2, f0: 600, f1: 150 }); },
  squeak() { tone({ type: 'square', f0: 2600, f1: 3200, dur: 0.05, vol: 0.025 }); },
  repair() { [0, 0.08, 0.16].forEach((d, i) => tone({ type: 'triangle', f0: 600 + i * 200, dur: 0.12, vol: 0.06, delay: d })); },
  hoot() {
    tone({ type: 'sine', f0: 420, f1: 380, dur: 0.22, vol: 0.12, attack: 0.03 });
    tone({ type: 'sine', f0: 400, f1: 340, dur: 0.35, vol: 0.12, attack: 0.04, delay: 0.3 });
  },
  tick() { for (let i = 0; i < 6; i++) tone({ type: 'square', f0: i % 2 ? 1800 : 1500, dur: 0.02, vol: 0.03, delay: i * 0.16 }); },
  static() { noise({ dur: 0.5, vol: 0.06, type: 'highpass', f0: 2500 }); },
  thud() { tone({ type: 'triangle', f0: 160, f1: 70, dur: 0.1, vol: 0.12 }); },
  bark() {
    tone({ type: 'sawtooth', f0: 520, f1: 260, dur: 0.09, vol: 0.09 });
    noise({ dur: 0.08, vol: 0.06, type: 'bandpass', f0: 900, q: 3 });
    tone({ type: 'sawtooth', f0: 560, f1: 280, dur: 0.09, vol: 0.08, delay: 0.16 });
  },
  yelp() { tone({ type: 'sine', f0: 1200, f1: 700, dur: 0.35, vol: 0.08, vibrato: 40 }); },
  rumble() {
    noise({ dur: 2.2, vol: 0.18, f0: 300, f1: 90 });
    tone({ type: 'triangle', f0: 55, f1: 45, dur: 2.2, vol: 0.12, attack: 0.3 });
  },
  brake() {
    tone({ type: 'sawtooth', f0: 2400, f1: 1400, dur: 1.1, vol: 0.03, attack: 0.2, vibrato: 25 });
    noise({ dur: 1.0, vol: 0.06, type: 'highpass', f0: 3000 });
  },
  chime() { [659, 523].forEach((f, i) => tone({ type: 'sine', f0: f, dur: 0.4, vol: 0.08, delay: i * 0.35 })); },
  tickets() { for (let i = 0; i < 8; i++) tone({ type: 'square', f0: 900 + (i % 2) * 300, dur: 0.03, vol: 0.03, delay: i * 0.06 }); },
  rattle() { for (let i = 0; i < 6; i++) tone({ type: 'square', f0: 700 + Math.random() * 900, dur: 0.025, vol: 0.04, delay: i * 0.05 }); },
  point() { tone({ type: 'square', f0: 880, f1: 1320, dur: 0.08, vol: 0.05 }); },
  win() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone({ type: 'square', f0: f, dur: 0.18, vol: 0.07, delay: i * 0.13 }));
    [262, 330, 392].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.8, vol: 0.08, delay: 0.8 + i * 0.02 }));
  },
  lose() {
    [392, 370, 349, 330].forEach((f, i) => tone({ type: 'triangle', f0: f, f1: f * 0.97, dur: 0.35, vol: 0.1, delay: i * 0.3 }));
  },
};

// ---------- Music ----------
let musicTimer = null;
let musicMode = null;
let step = 0;
let nextTime = 0;

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);

const SONGS = {
  world: {
    stepDur: 0.25,
    bass: [45, 45, 41, 41, 43, 43, 40, 40], // A F G E (per 8 steps)
    scale: [69, 72, 74, 75, 76, 79, 81, 84],
    melodyChance: 0.32,
  },
  boss: {
    stepDur: 0.14,
    bass: [45, 45, 48, 45, 51, 45, 48, 44],
    scale: [69, 70, 73, 75, 76, 77, 81],
    melodyChance: 0.45,
  },
};

function musicTick() {
  if (!ctx || !musicMode) return;
  const song = SONGS[musicMode];
  while (nextTime < ctx.currentTime + 0.3) {
    const t = nextTime - ctx.currentTime;
    if (musicMode === 'world') {
      if (step % 8 === 0) {
        const n = song.bass[(step / 8) % song.bass.length];
        tone({ type: 'triangle', f0: NOTE(n), dur: 1.9, vol: 0.12, attack: 0.15, delay: t, out: musicBus });
        tone({ type: 'sine', f0: NOTE(n + 12), dur: 1.6, vol: 0.04, attack: 0.3, delay: t, out: musicBus, vibrato: 3 });
      }
      if (step % 2 === 0 && Math.random() < song.melodyChance) {
        const n = song.scale[Math.floor(Math.random() * song.scale.length)];
        tone({ type: 'sine', f0: NOTE(n), dur: 0.7, vol: 0.05, delay: t, out: musicBus });
        tone({ type: 'sine', f0: NOTE(n + 24), dur: 0.25, vol: 0.012, delay: t, out: musicBus });
      }
    } else {
      if (step % 2 === 0) {
        const n = song.bass[(step / 2) % song.bass.length];
        tone({ type: 'square', f0: NOTE(n - 12), dur: 0.12, vol: 0.06, delay: t, out: musicBus });
      }
      if (step % 16 === 0) tone({ type: 'sawtooth', f0: NOTE(57), dur: 2, vol: 0.03, attack: 0.2, delay: t, out: musicBus, vibrato: 4 });
      if (step % 4 === 2) noise({ dur: 0.04, vol: 0.03, type: 'highpass', f0: 6000, delay: t });
      if (step % 2 === 1 && Math.random() < song.melodyChance) {
        const n = song.scale[Math.floor(Math.random() * song.scale.length)];
        tone({ type: 'triangle', f0: NOTE(n), dur: 0.16, vol: 0.05, delay: t, out: musicBus });
      }
    }
    nextTime += song.stepDur;
    step++;
  }
}

export function playMusic(mode) {
  if (!ctx || musicMode === mode) return;
  stopMusic();
  musicMode = mode;
  step = 0;
  nextTime = ctx.currentTime + 0.1;
  musicTimer = setInterval(musicTick, 80);
}

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
  musicMode = null;
}
