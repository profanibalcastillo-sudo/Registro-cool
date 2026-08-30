// Web Audio API Synthesizer for School Bells, Chimes, and Timers
// Pure client-side synthesis: zero network dependencies, 100% reliable in any browser.

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export type BellSoundType = 'school_bell' | 'chime' | 'digital_gong' | 'marimba';

/**
 * Play a school bell / chime sound using Web Audio API synthesis
 */
export function playSchoolBell(soundOrVolume?: BellSoundType | number, maybeVolume?: number) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    let type: BellSoundType = 'school_bell';
    let volume = 0.8;

    if (typeof soundOrVolume === 'string') {
      type = soundOrVolume;
      if (typeof maybeVolume === 'number') volume = maybeVolume;
    } else if (typeof soundOrVolume === 'number') {
      volume = soundOrVolume;
    }

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.min(1.0, Math.max(0.05, volume)), now);
    masterGain.connect(ctx.destination);

    if (type === 'school_bell') {
      // Classic mechanical / electric school bell: repeated rapid striking with harmonics
      const strikeTimes = [0, 0.12, 0.24, 0.36, 0.48, 0.60, 0.72, 0.84, 0.96, 1.08, 1.20, 1.32, 1.44, 1.56, 1.68, 1.80];
      const baseFreq = 880; // A5
      strikeTimes.forEach((t) => {
        const strikeTime = now + t;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq + (Math.random() * 20 - 10), strikeTime);
        gain.gain.setValueAtTime(0.6, strikeTime);
        gain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.15);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(strikeTime);
        osc.stop(strikeTime + 0.18);
      });

      // Long resonant decay after final strike
      const ringOsc = ctx.createOscillator();
      const ringGain = ctx.createGain();
      ringOsc.type = 'sine';
      ringOsc.frequency.setValueAtTime(baseFreq, now + 1.8);
      ringGain.gain.setValueAtTime(0.4, now + 1.8);
      ringGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
      ringOsc.connect(ringGain);
      ringGain.connect(masterGain);
      ringOsc.start(now + 1.8);
      ringOsc.stop(now + 3.6);
    } else if (type === 'chime') {
      // 4-Note Melodic Chime
      const notes = [
        { freq: 659.25, time: 0 },    // E5
        { freq: 523.25, time: 0.35 }, // C5
        { freq: 587.33, time: 0.70 }, // D5
        { freq: 392.00, time: 1.05 }, // G4
      ];
      notes.forEach(({ freq, time }) => {
        const noteTime = now + time;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);
        gain.gain.setValueAtTime(0.7, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 1.2);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(noteTime);
        osc.stop(noteTime + 1.3);
      });
    } else if (type === 'digital_gong') {
      const freqs = [330, 495, 660, 990];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.5 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(now);
        osc.stop(now + 3.0);
      });
    } else if (type === 'marimba') {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const noteTime = now + idx * 0.15;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);
        gain.gain.setValueAtTime(0.8, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(noteTime);
        osc.stop(noteTime + 0.45);
      });
    }
  } catch (err) {
    console.warn('Unable to play audio synthesizer:', err);
  }
}

/**
 * Play a gentle pre-warning notification chime (e.g. 5 minutes before class period ends)
 */
export function playWarningBell(volume: number = 0.5) {
  playSchoolBell('chime', volume);
}
