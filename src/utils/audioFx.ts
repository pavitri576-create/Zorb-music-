import { AudioSpeedMode, EqPresetId } from '../types/zorb';

interface AttachedAudioGraph {
  ctx: AudioContext;
  bassFilter: BiquadFilterNode;
  presenceFilter: BiquadFilterNode;
}

const audioGraphs = new WeakMap<HTMLAudioElement, AttachedAudioGraph>();

export function applyPlaybackSpeed(audio: HTMLAudioElement, speedMode: AudioSpeedMode): void {
  const rate = speedMode === 'slowed' ? 0.85 : speedMode === 'sped' ? 1.15 : 1.0;
  const preservePitch = speedMode === 'normal';

  audio.playbackRate = rate;
  audio.defaultPlaybackRate = rate;

  const compat = audio as HTMLAudioElement & {
    preservesPitch?: boolean;
    mozPreservesPitch?: boolean;
    webkitPreservesPitch?: boolean;
  };
  if ('preservesPitch' in compat) compat.preservesPitch = preservePitch;
  if ('mozPreservesPitch' in compat) compat.mozPreservesPitch = preservePitch;
  if ('webkitPreservesPitch' in compat) compat.webkitPreservesPitch = preservePitch;
}

function getEqGains(preset: EqPresetId): { bassDb: number; presenceDb: number } {
  switch (preset) {
    case 'sub-bass':
      return { bassDb: 9.0, presenceDb: -1.0 };
    case 'vocal-crisp':
      return { bassDb: -1.5, presenceDb: 5.5 };
    case 'flat':
    default:
      return { bassDb: 0, presenceDb: 0 };
  }
}

export function applyEqPreset(audio: HTMLAudioElement, preset: EqPresetId): void {
  const { bassDb, presenceDb } = getEqGains(preset);
  let graph = audioGraphs.get(audio);

  // Only initialize Web Audio graph once the user picks a non-flat preset (keeps zero overhead on Flat)
  if (!graph && preset === 'flat') return;

  try {
    if (!graph) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(audio);

      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = 'lowshelf';
      bassFilter.frequency.value = 85;

      const presenceFilter = ctx.createBiquadFilter();
      presenceFilter.type = 'peaking';
      presenceFilter.frequency.value = 3200;
      presenceFilter.Q.value = 0.9;

      source.connect(bassFilter);
      bassFilter.connect(presenceFilter);
      presenceFilter.connect(ctx.destination);

      graph = { ctx, bassFilter, presenceFilter };
      audioGraphs.set(audio, graph);
    }

    if (graph.ctx.state === 'suspended') {
      graph.ctx.resume().catch(() => undefined);
    }

    const now = graph.ctx.currentTime;
    graph.bassFilter.gain.setTargetAtTime(bassDb, now, 0.04);
    graph.presenceFilter.gain.setTargetAtTime(presenceDb, now, 0.04);
  } catch {
    // Graceful fallback: keep raw HTML5 audio playback unaffected
  }
}
