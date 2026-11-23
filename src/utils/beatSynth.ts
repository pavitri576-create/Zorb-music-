import { BeatMood, BeatPadId, BeatPattern, BeatRowCategory } from '../types/zorb';

export interface BeatPadSpec {
  id: BeatPadId;
  label: string;
  subLabel: string;
  category: BeatRowCategory;
  defaultSteps: boolean[];
}

export const BEAT_ROWS: { category: BeatRowCategory; pads: BeatPadSpec[] }[] = [
  {
    category: 'KICK',
    pads: [
      {
        id: 'kick-hard',
        label: 'Kick 1',
        subLabel: 'Hard',
        category: 'KICK',
        defaultSteps: [true, false, false, true, true, false, false, false],
      },
      {
        id: 'kick-deep',
        label: 'Kick 2',
        subLabel: 'Deep',
        category: 'KICK',
        defaultSteps: [true, false, false, false, true, false, true, false],
      },
      {
        id: 'kick-punchy',
        label: 'Kick 3',
        subLabel: 'Punchy',
        category: 'KICK',
        defaultSteps: [true, false, true, false, false, false, true, false],
      },
      {
        id: 'kick-soft',
        label: 'Kick 4',
        subLabel: 'Soft',
        category: 'KICK',
        defaultSteps: [true, false, false, true, false, false, true, false],
      },
    ],
  },
  {
    category: 'BASS / 808',
    pads: [
      {
        id: '808-dark',
        label: '808 Dark',
        subLabel: 'Gritty',
        category: 'BASS / 808',
        defaultSteps: [true, false, false, true, false, false, true, false],
      },
      {
        id: '808-slide',
        label: '808 Slide',
        subLabel: 'Glide',
        category: 'BASS / 808',
        defaultSteps: [false, false, false, true, false, false, false, true],
      },
      {
        id: '808-heavy',
        label: '808 Heavy',
        subLabel: 'Clipped',
        category: 'BASS / 808',
        defaultSteps: [true, false, true, false, false, true, false, false],
      },
      {
        id: '808-sub',
        label: '808 Sub',
        subLabel: 'Boom',
        category: 'BASS / 808',
        defaultSteps: [true, false, false, false, true, false, false, false],
      },
    ],
  },
  {
    category: 'HI-HAT / SNARE',
    pads: [
      {
        id: 'hh-fast',
        label: 'Hi-Hat Fast',
        subLabel: 'Roll',
        category: 'HI-HAT / SNARE',
        defaultSteps: [true, true, true, true, true, true, true, true],
      },
      {
        id: 'hh-slow',
        label: 'Hi-Hat Slow',
        subLabel: 'Open',
        category: 'HI-HAT / SNARE',
        defaultSteps: [false, true, false, true, false, true, false, true],
      },
      {
        id: 'snare',
        label: 'Snare',
        subLabel: 'Crack',
        category: 'HI-HAT / SNARE',
        defaultSteps: [false, false, true, false, false, false, true, false],
      },
      {
        id: 'clap',
        label: 'Clap',
        subLabel: 'Wide',
        category: 'HI-HAT / SNARE',
        defaultSteps: [false, false, true, false, false, false, true, true],
      },
    ],
  },
  {
    category: 'MELODY / FX',
    pads: [
      {
        id: 'dark-bell',
        label: 'Dark Bell',
        subLabel: 'Chime',
        category: 'MELODY / FX',
        defaultSteps: [true, false, false, true, false, true, false, false],
      },
      {
        id: 'cowbell',
        label: 'Cowbell',
        subLabel: 'Phonk',
        category: 'MELODY / FX',
        defaultSteps: [true, false, true, true, false, true, false, true],
      },
      {
        id: 'synth-pad',
        label: 'Synth Pad',
        subLabel: 'Mood',
        category: 'MELODY / FX',
        defaultSteps: [true, false, false, false, true, false, false, false],
      },
      {
        id: 'vocal-hey',
        label: 'Vocal Chop',
        subLabel: '"Hey" FX',
        category: 'MELODY / FX',
        defaultSteps: [false, false, false, false, true, false, false, false],
      },
    ],
  },
];

export const ALL_PADS: BeatPadSpec[] = BEAT_ROWS.flatMap((r) => r.pads);

export function createEmptyPattern(): BeatPattern {
  const pattern = {} as BeatPattern;
  for (const pad of ALL_PADS) {
    pattern[pad.id] = Array(8).fill(false);
  }
  return pattern;
}

export function isPadActiveInPattern(pattern: BeatPattern, padId: BeatPadId): boolean {
  return Boolean(pattern[padId]?.some(Boolean));
}

// Curated Phonk presets per Mood so "Auto Make For Me" creates an authentic Phonk groove instantly
const MOOD_PRESETS: Record<BeatMood, Partial<Record<BeatPadId, boolean[]>>[]> = {
  DARK: [
    {
      'kick-deep': [true, false, false, true, true, false, false, false],
      '808-dark': [true, false, false, true, false, false, true, false],
      'hh-fast': [true, true, true, true, true, true, true, true],
      snare: [false, false, true, false, false, false, true, false],
      cowbell: [true, false, true, true, false, true, false, true],
      'dark-bell': [true, false, false, false, true, false, false, false],
    },
    {
      'kick-hard': [true, false, false, false, true, false, true, false],
      '808-slide': [false, false, false, true, false, false, false, true],
      '808-sub': [true, false, false, false, true, false, false, false],
      'hh-slow': [false, true, false, true, false, true, false, true],
      clap: [false, false, true, false, false, false, true, false],
      'dark-bell': [true, false, true, false, false, true, false, false],
      'vocal-hey': [false, false, false, false, false, false, false, true],
    },
  ],
  AGGRESSIVE: [
    {
      'kick-hard': [true, false, false, true, true, false, true, false],
      '808-heavy': [true, false, true, false, true, false, true, false],
      'hh-fast': [true, true, true, true, true, true, true, true],
      snare: [false, false, true, false, false, false, true, false],
      clap: [false, false, true, false, false, false, true, true],
      cowbell: [true, true, false, true, true, false, true, true],
      'vocal-hey': [false, false, false, false, true, false, false, false],
    },
    {
      'kick-punchy': [true, false, true, false, true, false, true, false],
      '808-dark': [true, false, false, true, true, false, false, true],
      'hh-fast': [true, true, true, true, true, true, true, true],
      snare: [false, false, true, false, false, false, true, false],
      cowbell: [true, false, true, true, true, false, true, false],
      'synth-pad': [true, false, false, false, false, false, false, false],
    },
  ],
  CHILL: [
    {
      'kick-soft': [true, false, false, true, false, false, true, false],
      '808-sub': [true, false, false, false, true, false, false, false],
      'hh-slow': [true, true, true, true, true, true, true, true],
      clap: [false, false, true, false, false, false, true, false],
      'dark-bell': [true, false, false, true, false, true, false, false],
      'synth-pad': [true, false, false, false, true, false, false, false],
    },
    {
      'kick-deep': [true, false, false, false, true, false, false, true],
      '808-slide': [false, false, false, false, false, true, false, true],
      '808-sub': [true, false, false, false, true, false, false, false],
      'hh-slow': [false, true, false, true, false, true, false, true],
      snare: [false, false, true, false, false, false, true, false],
      cowbell: [true, false, false, true, false, false, true, false],
      'synth-pad': [true, false, false, false, false, false, false, false],
    },
  ],
};

export function createAutoPhonkPattern(mood: BeatMood, variantIndex = 0): BeatPattern {
  const presets = MOOD_PRESETS[mood];
  const preset = presets[variantIndex % presets.length];
  const pattern = createEmptyPattern();
  for (const [padId, steps] of Object.entries(preset)) {
    if (steps) {
      pattern[padId as BeatPadId] = [...steps];
    }
  }
  return pattern;
}

const MOOD_ROOT_HZ: Record<BeatMood, number> = {
  DARK: 43.65, // F1 (DVRST / dark Memphis)
  AGGRESSIVE: 36.71, // D1 (Kordhell / Sahara hard phonk)
  CHILL: 49.0, // G1 (MoonDeity / chill night drive)
};

// Semitone offsets across steps 0..7 so melody pads naturally form a Phonk hook
const COWBELL_SEMITONES: Record<BeatMood, number[]> = {
  DARK: [0, 3, 7, 8, 7, 3, 10, 7],
  AGGRESSIVE: [0, 7, 8, 7, 1, 7, 10, 8],
  CHILL: [7, 10, 12, 10, 7, 5, 3, 5],
};

const BASS_SEMITONES: Record<BeatMood, number[]> = {
  DARK: [0, 0, 0, 3, -4, -4, -2, -2],
  AGGRESSIVE: [0, 0, 1, 0, -4, -4, -2, 0],
  CHILL: [0, 0, -4, -4, -5, -5, -2, -2],
};

let sharedCtx: AudioContext | null = null;
let sharedNoiseBuffer: AudioBuffer | null = null;

export function getBeatAudioContext(): AudioContext {
  if (!sharedCtx) {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedCtx = new AudioCtx();
  }
  if (sharedCtx.state === 'suspended') {
    sharedCtx.resume().catch(() => undefined);
  }
  return sharedCtx;
}

function getNoiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  if (ctx === sharedCtx && sharedNoiseBuffer) {
    return sharedNoiseBuffer;
  }
  const length = Math.floor(ctx.sampleRate * 0.6);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  if (ctx === sharedCtx) {
    sharedNoiseBuffer = buffer;
  }
  return buffer;
}

function createSaturationCurve(amount: number): Float32Array<ArrayBuffer> {
  const samples = 1024;
  const buffer = new ArrayBuffer(samples * 4);
  const curve = new Float32Array(buffer);
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = Math.tanh(x * amount);
  }
  return curve;
}

export function triggerPadSound(
  ctx: BaseAudioContext,
  destination: AudioNode,
  padId: BeatPadId,
  mood: BeatMood,
  when: number,
  stepIndex: number = 0,
  stepDurationSec: number = 0.214
): void {
  const root = MOOD_ROOT_HZ[mood];
  const stepSafe = ((stepIndex % 8) + 8) % 8;

  switch (padId) {
    case 'kick-hard':
    case 'kick-deep':
    case 'kick-punchy':
    case 'kick-soft': {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const shaper = ctx.createWaveShaper();

      const startHz =
        padId === 'kick-hard' ? 195 : padId === 'kick-deep' ? 130 : padId === 'kick-punchy' ? 165 : 108;
      const endHz =
        padId === 'kick-hard' ? 50 : padId === 'kick-deep' ? 38 : padId === 'kick-punchy' ? 56 : 45;
      const decay = padId === 'kick-deep' ? 0.34 : padId === 'kick-soft' ? 0.22 : 0.27;
      const drive = padId === 'kick-hard' ? 3.2 : padId === 'kick-soft' ? 1.3 : 2.2;

      shaper.curve = createSaturationCurve(drive);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(startHz, when);
      osc.frequency.exponentialRampToValueAtTime(endHz, when + 0.065);

      gain.gain.setValueAtTime(0.001, when);
      gain.gain.linearRampToValueAtTime(0.95, when + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.001, when + decay);

      osc.connect(shaper);
      shaper.connect(gain);
      gain.connect(destination);

      osc.start(when);
      osc.stop(when + decay + 0.02);

      if (padId === 'kick-hard' || padId === 'kick-punchy') {
        const clickOsc = ctx.createOscillator();
        const clickGain = ctx.createGain();
        clickOsc.type = 'triangle';
        clickOsc.frequency.setValueAtTime(padId === 'kick-hard' ? 1800 : 1100, when);
        clickOsc.frequency.exponentialRampToValueAtTime(160, when + 0.018);
        clickGain.gain.setValueAtTime(0.35, when);
        clickGain.gain.exponentialRampToValueAtTime(0.001, when + 0.022);
        clickOsc.connect(clickGain);
        clickGain.connect(destination);
        clickOsc.start(when);
        clickOsc.stop(when + 0.03);
      }
      break;
    }

    case '808-dark':
    case '808-slide':
    case '808-heavy':
    case '808-sub': {
      const semi = BASS_SEMITONES[mood][stepSafe];
      const noteHz = root * Math.pow(2, semi / 12);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const shaper = ctx.createWaveShaper();

      osc.type = padId === '808-sub' ? 'sine' : 'triangle';
      const dur = padId === '808-slide' ? 0.42 : 0.48;

      if (padId === '808-slide') {
        osc.frequency.setValueAtTime(noteHz * 2.0, when);
        osc.frequency.exponentialRampToValueAtTime(noteHz, when + 0.14);
      } else {
        osc.frequency.setValueAtTime(noteHz * 1.15, when);
        osc.frequency.exponentialRampToValueAtTime(noteHz, when + 0.04);
      }

      const sat = padId === '808-heavy' ? 4.2 : padId === '808-dark' ? 2.8 : padId === '808-slide' ? 2.3 : 1.25;
      shaper.curve = createSaturationCurve(sat);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(padId === '808-sub' ? 220 : mood === 'CHILL' ? 480 : 880, when);

      gain.gain.setValueAtTime(0.001, when);
      gain.gain.linearRampToValueAtTime(0.75, when + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, when + dur);

      osc.connect(shaper);
      shaper.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      osc.start(when);
      osc.stop(when + dur + 0.03);
      break;
    }

    case 'hh-fast': {
      // Double 16th/32nd trap roll feel
      const offsets = [0, Math.min(0.095, stepDurationSec * 0.48)];
      offsets.forEach((off, idx) => {
        const src = ctx.createBufferSource();
        src.buffer = getNoiseBuffer(ctx);
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.setValueAtTime(7200, when + off);
        const g = ctx.createGain();
        const amp = idx === 0 ? 0.24 : 0.15;
        g.gain.setValueAtTime(amp, when + off);
        g.gain.exponentialRampToValueAtTime(0.001, when + off + 0.045);
        src.connect(hp);
        hp.connect(g);
        g.connect(destination);
        src.start(when + off);
        src.stop(when + off + 0.055);
      });
      break;
    }

    case 'hh-slow': {
      const src = ctx.createBufferSource();
      src.buffer = getNoiseBuffer(ctx);
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(5800, when);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.24, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.19);
      src.connect(hp);
      hp.connect(g);
      g.connect(destination);
      src.start(when);
      src.stop(when + 0.21);
      break;
    }

    case 'snare': {
      const bodyOsc = ctx.createOscillator();
      const bodyGain = ctx.createGain();
      bodyOsc.type = 'triangle';
      bodyOsc.frequency.setValueAtTime(220, when);
      bodyOsc.frequency.exponentialRampToValueAtTime(125, when + 0.08);
      bodyGain.gain.setValueAtTime(0.45, when);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, when + 0.12);
      bodyOsc.connect(bodyGain);
      bodyGain.connect(destination);
      bodyOsc.start(when);
      bodyOsc.stop(when + 0.14);

      const noise = ctx.createBufferSource();
      noise.buffer = getNoiseBuffer(ctx);
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(2400, when);
      bp.Q.setValueAtTime(0.7, when);
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.5, when);
      nGain.gain.exponentialRampToValueAtTime(0.001, when + 0.18);
      noise.connect(bp);
      bp.connect(nGain);
      nGain.connect(destination);
      noise.start(when);
      noise.stop(when + 0.2);
      break;
    }

    case 'clap': {
      const bursts = [0, 0.013, 0.026, 0.039];
      bursts.forEach((b, idx) => {
        const noise = ctx.createBufferSource();
        noise.buffer = getNoiseBuffer(ctx);
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1650, when + b);
        bp.Q.setValueAtTime(0.9, when + b);
        const g = ctx.createGain();
        const isLast = idx === bursts.length - 1;
        g.gain.setValueAtTime(isLast ? 0.42 : 0.28, when + b);
        g.gain.exponentialRampToValueAtTime(0.001, when + b + (isLast ? 0.2 : 0.025));
        noise.connect(bp);
        bp.connect(g);
        g.connect(destination);
        noise.start(when + b);
        noise.stop(when + b + (isLast ? 0.22 : 0.03));
      });
      break;
    }

    case 'cowbell': {
      // Classic Memphis 808 Cowbell dual-square ratio (1 : 1.481) through bandpass + grit
      const semi = COWBELL_SEMITONES[mood][stepSafe];
      const baseHz = root * 8.0 * Math.pow(2, semi / 12);

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      osc1.type = 'square';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(baseHz, when);
      osc2.frequency.setValueAtTime(baseHz * 1.481, when);

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(baseHz * 1.35, when);
      bp.Q.setValueAtTime(1.6, when);

      const shaper = ctx.createWaveShaper();
      shaper.curve = createSaturationCurve(mood === 'AGGRESSIVE' ? 2.6 : 1.8);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, when);
      g.gain.linearRampToValueAtTime(0.36, when + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.24);

      osc1.connect(bp);
      osc2.connect(bp);
      bp.connect(shaper);
      shaper.connect(g);
      g.connect(destination);

      osc1.start(when);
      osc2.start(when);
      osc1.stop(when + 0.26);
      osc2.stop(when + 0.26);
      break;
    }

    case 'dark-bell': {
      const semi = COWBELL_SEMITONES[mood][stepSafe];
      const freq = root * 8.0 * Math.pow(2, semi / 12);
      const car = ctx.createOscillator();
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      const g = ctx.createGain();

      car.type = 'sine';
      mod.type = 'triangle';
      car.frequency.setValueAtTime(freq, when);
      mod.frequency.setValueAtTime(freq * 2.5, when);
      modGain.gain.setValueAtTime(freq * 1.4, when);
      modGain.gain.exponentialRampToValueAtTime(20, when + 0.25);

      g.gain.setValueAtTime(0.001, when);
      g.gain.linearRampToValueAtTime(0.34, when + 0.006);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.45);

      mod.connect(modGain);
      modGain.connect(car.frequency);
      car.connect(g);
      g.connect(destination);

      car.start(when);
      mod.start(when);
      car.stop(when + 0.48);
      mod.stop(when + 0.48);
      break;
    }

    case 'synth-pad': {
      // Minor chord stab
      const intervals = [0, 3, 7];
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(mood === 'CHILL' ? 1200 : 1900, when);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, when);
      g.gain.linearRampToValueAtTime(0.24, when + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.55);

      filter.connect(g);
      g.connect(destination);

      intervals.forEach((semi) => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(root * 4 * Math.pow(2, semi / 12), when);
        osc.connect(filter);
        osc.start(when);
        osc.stop(when + 0.58);
      });
      break;
    }

    case 'vocal-hey': {
      // Punchy formant "HEY!" FX stab
      const osc = ctx.createOscillator();
      const f1 = ctx.createBiquadFilter();
      const f2 = ctx.createBiquadFilter();
      const g = ctx.createGain();

      osc.type = 'sawtooth';
      const pitch = mood === 'DARK' ? 175 : mood === 'AGGRESSIVE' ? 210 : 195;
      osc.frequency.setValueAtTime(pitch * 1.12, when);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.88, when + 0.19);

      f1.type = 'bandpass';
      f1.frequency.setValueAtTime(680, when);
      f1.Q.setValueAtTime(4.0, when);

      f2.type = 'bandpass';
      f2.frequency.setValueAtTime(1850, when);
      f2.Q.setValueAtTime(4.5, when);

      g.gain.setValueAtTime(0.001, when);
      g.gain.linearRampToValueAtTime(0.45, when + 0.014);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.22);

      osc.connect(f1);
      osc.connect(f2);
      f1.connect(g);
      f2.connect(g);
      g.connect(destination);

      osc.start(when);
      osc.stop(when + 0.24);
      break;
    }
  }
}

export interface LiveRecordedHit {
  padId: BeatPadId;
  offsetSec: number;
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = length * blockAlign;
  const out = new ArrayBuffer(44 + dataSize);
  const view = new DataView(out);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const channels = Array.from({ length: numChannels }, (_, c) => buffer.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([out], { type: 'audio/wav' });
}

export async function renderBeatToWavBlob(
  pattern: BeatPattern,
  bpm: number,
  mood: BeatMood,
  durationSec: number,
  volume: number = 0.85,
  liveHits: LiveRecordedHit[] = []
): Promise<Blob> {
  const sampleRate = 22050;
  const safeDur = Math.max(4, Math.min(120, durationSec));
  const totalFrames = Math.floor(sampleRate * safeDur);
  const offline = new OfflineAudioContext(2, totalFrames, sampleRate);

  const masterGain = offline.createGain();
  masterGain.gain.setValueAtTime(Math.max(0.1, Math.min(1, volume)), 0);

  const compressor = offline.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(-14, 0);
  compressor.ratio.setValueAtTime(4, 0);
  compressor.attack.setValueAtTime(0.005, 0);
  compressor.release.setValueAtTime(0.08, 0);

  masterGain.connect(compressor);
  compressor.connect(offline.destination);

  // Fade out gently in final 1.2s
  masterGain.gain.setValueAtTime(Math.max(0.1, Math.min(1, volume)), Math.max(0, safeDur - 1.2));
  masterGain.gain.linearRampToValueAtTime(0.001, safeDur);

  // 8-step beat sequencer: 2 steps per beat (8th notes -> punchy high-energy 140 BPM feel)
  const stepSec = 60 / bpm / 2;
  const totalSteps = Math.floor(safeDur / stepSec);

  for (let s = 0; s < totalSteps; s++) {
    const stepIdx = s % 8;
    const when = s * stepSec;
    for (const pad of ALL_PADS) {
      if (pattern[pad.id]?.[stepIdx]) {
        triggerPadSound(offline, masterGain, pad.id, mood, when, stepIdx, stepSec);
      }
    }
  }

  // Mix in any live pad taps captured during recording
  for (const hit of liveHits) {
    if (hit.offsetSec >= 0 && hit.offsetSec < safeDur - 0.1) {
      triggerPadSound(
        offline,
        masterGain,
        hit.padId,
        mood,
        hit.offsetSec,
        Math.floor(hit.offsetSec / stepSec) % 8,
        stepSec
      );
    }
  }

  const rendered = await offline.startRendering();
  return audioBufferToWavBlob(rendered);
}

export function generateBeatCoverDataUrl(
  title: string,
  mood: BeatMood,
  bpm: number,
  accentHex: string
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '/src/assets/images/phonk_cover_neon_blade_1795441176315.jpg';

  // Pure black background + subtle mood radial glow
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 512, 512);

  const glowColor =
    mood === 'AGGRESSIVE' ? '#FF1744' : mood === 'CHILL' ? accentHex : accentHex;

  const grad = ctx.createRadialGradient(256, 220, 20, 256, 220, 270);
  grad.addColorStop(0, `${glowColor}55`);
  grad.addColorStop(0.55, `${glowColor}1A`);
  grad.addColorStop(1, '#000000');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Architectural frame lines
  ctx.strokeStyle = `${glowColor}66`;
  ctx.lineWidth = 3;
  ctx.strokeRect(22, 22, 468, 468);

  // Subtle puzzle piece shapes scattered around frame
  const puzzleSpots = [
    { x: 76, y: 88, s: 1.1, r: -0.3 },
    { x: 422, y: 94, s: 1.3, r: 0.4 },
    { x: 90, y: 400, s: 1.0, r: 0.25 },
    { x: 410, y: 386, s: 1.2, r: -0.35 },
    { x: 165, y: 140, s: 0.85, r: 0.18 },
    { x: 350, y: 165, s: 0.9, r: -0.22 },
  ];

  puzzleSpots.forEach((p) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.r);
    ctx.scale(p.s, p.s);
    ctx.fillStyle = `${glowColor}99`;
    ctx.beginPath();
    ctx.roundRect(-12, -12, 24, 24, 4);
    ctx.arc(0, -13, 6, 0, Math.PI * 2);
    ctx.arc(13, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // Outline ZORB emblem
  ctx.textAlign = 'center';
  ctx.font = '800 92px "Barlow Condensed", Impact, sans-serif';
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 4;
  ctx.strokeText('ZORB', 256, 236);
  ctx.fillText('ZORB', 256, 236);

  // Formula
  ctx.fillStyle = glowColor;
  ctx.font = '700 20px "JetBrains Mono", monospace';
  ctx.fillText('Z = M × D²', 256, 274);

  // Beat Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 34px "Barlow Condensed", sans-serif';
  const cleanTitle = (title || 'MY FIRST PHONK').toUpperCase().slice(0, 22);
  ctx.fillText(cleanTitle, 256, 368);

  // Metadata footer
  ctx.fillStyle = '#A1A1AA';
  ctx.font = '600 18px "JetBrains Mono", monospace';
  ctx.fillText(`${bpm} BPM · ${mood} PHONK`, 256, 412);

  return canvas.toDataURL('image/jpeg', 0.9);
}
