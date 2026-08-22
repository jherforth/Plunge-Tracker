let audioCtx: AudioContext | null = null;

export const playChime = (freq = 880, type: OscillatorType = 'sine', duration = 0.5) => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = type;
  osc.frequency.value = freq;
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  gain.gain.setValueAtTime(0, audioCtx.currentTime);
  gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
};

export type TrackId = 'none' | 'ice-cave' | 'blizzard' | 'crystal';

let isPlaying = false;
let nextNoteTime = 0;
let currentStep = 0;
let scheduleTimer: number | null = null;
let activeTrack: TrackId = 'none';

const TRACKS = {
  'ice-cave': {
    speed: 4.0,
    type: 'sine' as OscillatorType,
    attack: 2.0,
    release: 4.0,
    volume: 0.15,
    notes: [
      130.81, 196.00, 164.81, 0, 146.83, 220.00, 196.00, 0
    ]
  },
  'blizzard': {
    speed: 1.5,
    type: 'sine' as OscillatorType,
    attack: 0.8,
    release: 3.5,
    volume: 0.08,
    notes: [
      783.99, 0, 523.25, 880.00, 0, 659.25, 0, 1046.50, 783.99, 0, 587.33, 0
    ]
  },
  'crystal': {
    speed: 2.0,
    type: 'triangle' as OscillatorType,
    attack: 1.5,
    release: 5.0,
    volume: 0.06,
    notes: [
      261.63, 392.00, 329.63, 293.66,
      349.23, 523.25, 440.00, 392.00,
      220.00, 329.63, 261.63, 246.94,
      196.00, 293.66, 246.94, 220.00
    ]
  }
};

function scheduleNote() {
  if (!audioCtx || activeTrack === 'none' || !isPlaying) return;
  const track = TRACKS[activeTrack];
  
  while (nextNoteTime < audioCtx.currentTime + 0.1) {
    const freq = track.notes[currentStep];
    
    if (freq > 0) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = track.type;
      osc.frequency.value = freq;
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      const attack = (track as any).attack || 0.1;
      const release = (track as any).release || (track.speed - 0.01);
      const volume = (track as any).volume || 0.05;
      
      gain.gain.setValueAtTime(0, nextNoteTime);
      gain.gain.linearRampToValueAtTime(volume, nextNoteTime + attack);
      gain.gain.exponentialRampToValueAtTime(0.001, nextNoteTime + attack + release);
      
      osc.start(nextNoteTime);
      osc.stop(nextNoteTime + attack + release + 0.1);
    }
    
    nextNoteTime += track.speed;
    currentStep = (currentStep + 1) % track.notes.length;
  }
  
  scheduleTimer = window.setTimeout(scheduleNote, 25);
}

export const playTrack = (trackId: TrackId) => {
  if (trackId === 'none') {
    stopTrack();
    return;
  }
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  
  if (isPlaying) stopTrack();
  
  activeTrack = trackId;
  isPlaying = true;
  currentStep = 0;
  nextNoteTime = audioCtx.currentTime + 0.05;
  scheduleNote();
};

export const stopTrack = () => {
  isPlaying = false;
  if (scheduleTimer !== null) {
    clearTimeout(scheduleTimer);
    scheduleTimer = null;
  }
};
