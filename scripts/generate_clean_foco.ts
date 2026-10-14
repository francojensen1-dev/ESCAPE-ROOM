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
const duration = 6.0;
const totalSamples = Math.floor(sampleRate * duration);
const left = new Float32Array(totalSamples);
const right = new Float32Array(totalSamples);

// Pure, warm 60Hz AC electric hum (NO NOISE, NO SPARK HISS, ZERO STATIC)
for (let i = 0; i < totalSamples; i++) {
  const t = i / sampleRate;
  const loopPhase = (2 * Math.PI * i) / totalSamples;

  // Gentle 60Hz and 120Hz sine tones
  const hum60 = Math.sin(2 * Math.PI * 60.0 * t) * 0.15;
  const hum120 = Math.sin(2 * Math.PI * 120.0 * t) * 0.08;
  const hum180 = Math.sin(2 * Math.PI * 180.0 * t) * 0.03;

  // Very gentle amplitude swell
  const mod = 0.85 + 0.15 * Math.sin(loopPhase * 3);

  const sample = (hum60 + hum120 + hum180) * mod * 0.25;
  left[i] = sample;
  right[i] = sample;
}

// Fade edges
const fadeLen = 1000;
for (let i = 0; i < fadeLen; i++) {
  const w = i / fadeLen;
  const endIdx = totalSamples - fadeLen + i;
  const m = left[i] * w + left[endIdx] * (1 - w);
  left[i] = m;
  right[i] = m;
  left[endIdx] = m;
  right[endIdx] = m;
}

const wavBuf = createWavBuffer(sampleRate, 2, [left, right]);

fs.writeFileSync('public/audio/sonido_foco.wav', wavBuf);
fs.writeFileSync('public/audio/foco.wav', wavBuf);
fs.writeFileSync('src/audio/sonido_foco.wav', wavBuf);
fs.writeFileSync('src/audio/foco.wav', wavBuf);

console.log('Clean low-hum foco generated successfully!');
