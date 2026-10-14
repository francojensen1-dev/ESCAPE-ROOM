import fs from 'fs';

function createWavBuffer(sampleRate: number, numChannels: number, samples: Float32Array[]): Buffer {
  const numSamples = samples[0].length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);

  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let s = Math.max(-1, Math.min(1, samples[ch][i]));
      const intVal = s < 0 ? s * 0x8000 : s * 0x7FFF;
      buffer.writeInt16LE(Math.floor(intVal), offset);
      offset += 2;
    }
  }

  return buffer;
}

const sampleRate = 44100;
const duration = 32.0; // 32 seconds clean, crystal-clear atmospheric loop
const totalSamples = Math.floor(sampleRate * duration);
const left = new Float32Array(totalSamples);
const right = new Float32Array(totalSamples);

// Notes for "the illuminato" clean dark ambient horror harmony (ZERO NOISE/STATIC):
// Smooth sine waves only, with organic frequency modulation and warm pads

for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;
  const loopPhase = (2 * Math.PI * i) / totalSamples;

  // 1. Warm Sub-Bass Drone (pure sine, 55Hz D1 and 55.4Hz)
  const subL = Math.sin(2 * Math.PI * 55.0 * t + Math.sin(loopPhase) * 0.8) * 0.40;
  const subR = Math.sin(2 * Math.PI * 55.5 * t + Math.cos(loopPhase) * 0.8) * 0.40;

  // 2. Warm Fundamental Bass (110Hz D2 & 82.4Hz E2)
  const midBass = (
    Math.sin(2 * Math.PI * 110.0 * t) * 0.25 +
    Math.sin(2 * Math.PI * 146.83 * t) * 0.18 * (0.7 + 0.3 * Math.sin(loopPhase))
  );

  // 3. Eerie Pad progression (Sine waves - D minor to D dim / G# tension)
  const chordShift = Math.sin(loopPhase);
  const chordFreq1 = 146.83; // D3
  const chordFreq2 = chordShift > 0 ? 174.61 : 164.81; // F3 vs E3
  const chordFreq3 = chordShift > 0.3 ? 207.65 : 220.0; // G#3 vs A3

  const pad = (
    Math.sin(2 * Math.PI * chordFreq1 * t) * 0.22 +
    Math.sin(2 * Math.PI * chordFreq2 * t) * 0.20 +
    Math.sin(2 * Math.PI * chordFreq3 * t) * 0.18
  );

  // 4. Pure sine overtones (soft bell / ethereal harmonics, NO NOISE)
  const chimeLfo1 = Math.max(0, Math.sin(loopPhase * 4));
  const chimeLfo2 = Math.max(0, Math.sin(loopPhase * 4 + Math.PI));
  const chime1 = Math.sin(2 * Math.PI * 440.0 * t) * 0.10 * chimeLfo1;
  const chime2 = Math.sin(2 * Math.PI * 415.3 * t) * 0.10 * chimeLfo2;
  const chime3 = Math.sin(2 * Math.PI * 587.3 * t) * 0.08 * (0.5 + 0.5 * Math.cos(loopPhase * 2));

  // 5. Secondary warm octave pad (D4 293.66Hz)
  const warmOctave = Math.sin(2 * Math.PI * 293.66 * t) * 0.09 * (0.6 + 0.4 * Math.sin(loopPhase * 2));

  // Mix Left & Right - 100% PURE HARMONICS, ZERO WHITE NOISE, ZERO STATIC
  const rawL = subL + midBass * 0.85 + pad * 0.9 + chime1 + chime3 * 0.6 + warmOctave;
  const rawR = subR + midBass * 0.85 + pad * 0.8 + chime2 + chime3 * 0.8 + warmOctave;

  left[i] = rawL;
  right[i] = rawR;
}

// Seamless crossfade boundary (2500 samples)
const fadeLen = 2500;
for (let i = 0; i < fadeLen; i++) {
  const w = i / fadeLen;
  const endIdx = totalSamples - fadeLen + i;
  const mixedL = left[i] * w + left[endIdx] * (1 - w);
  const mixedR = right[i] * w + right[endIdx] * (1 - w);
  left[i] = mixedL;
  right[i] = mixedR;
  left[endIdx] = mixedL;
  right[endIdx] = mixedR;
}

// Normalize cleanly to peak -1.5 dB (0.84)
let maxAmp = 0;
for (let i = 0; i < totalSamples; i++) {
  maxAmp = Math.max(maxAmp, Math.abs(left[i]), Math.abs(right[i]));
}
const normFactor = maxAmp > 0 ? 0.84 / maxAmp : 1.0;
for (let i = 0; i < totalSamples; i++) {
  left[i] *= normFactor;
  right[i] *= normFactor;
}

const wavBuf = createWavBuffer(sampleRate, 2, [left, right]);

fs.writeFileSync('public/audio/the_illuminato.wav', wavBuf);
fs.writeFileSync('public/audio/illuminato.wav', wavBuf);
fs.writeFileSync('src/audio/the_illuminato.wav', wavBuf);
fs.writeFileSync('src/audio/illuminato.wav', wavBuf);

console.log('The Illuminato generated clean (ZERO STATIC) successfully!');
