/**
 * Door Peephole (Visor de la Puerta) Modal
 * Shows a terrifying fisheye view into the dark hallway outside the room.
 * Flickering lighting, distant shadow silhouette of 'El Pibe', and tension audio.
 */

import React, { useEffect, useState } from 'react';
import { X, Eye } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

interface PeepholeModalProps {
  onClose: () => void;
}

export const PeepholeModal: React.FC<PeepholeModalProps> = ({ onClose }) => {
  const [flickerState, setFlickerState] = useState<number>(1);
  const [shadowDistance, setShadowDistance] = useState<number>(3); // 3: far, 2: medium, 1: terrifyingly close
  const [jumpscareTwitch, setJumpscareTwitch] = useState<boolean>(false);

  const [knockShake, setKnockShake] = useState<boolean>(false);

  useEffect(() => {
    // Heighten tension audio and heartbeat
    horrorAudio.updateTension(0.75);
    sensorManager.vibrate([40, 80, 40]);

    // Listen for door knocks to shake the lens
    const unregisterKnock = horrorAudio.onDoorKnock(() => {
      setKnockShake(true);
      setTimeout(() => setKnockShake(false), 380);
    });

    // Hallway light flicker & shadow progression intervals
    const interval = setInterval(() => {
      // Random flicker
      const rand = Math.random();
      if (rand > 0.6) {
        setFlickerState(0.1);
        setTimeout(() => setFlickerState(0.8), 60);
      } else if (rand > 0.4) {
        setFlickerState(0.4);
        setTimeout(() => setFlickerState(1.0), 120);
      } else {
        setFlickerState(1.0);
      }
    }, 450);

    // Shadow moves closer after 3.2 seconds
    const shadowTimer = setTimeout(() => {
      setShadowDistance(2);
      horrorAudio.playHeartbeatSound();
      horrorAudio.playDoorKnocks(0.85);
      sensorManager.vibrate([100, 50, 100]);
    }, 3200);

    const twitchTimer = setTimeout(() => {
      setShadowDistance(1);
      setJumpscareTwitch(true);
      horrorAudio.playCreak();
      horrorAudio.playDoorKnocks(1.0);
      sensorManager.vibrate([200, 100, 300]);
    }, 6200);

    return () => {
      unregisterKnock();
      clearInterval(interval);
      clearTimeout(shadowTimer);
      clearTimeout(twitchTimer);
      horrorAudio.updateTension(0.2);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
      {/* Top Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-3 text-stone-300">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-red-500 animate-pulse" />
          <span className="text-sm font-mono tracking-wider text-red-400 uppercase font-bold">
            LA PUERTA DEL PIBE (MIRILLA)
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-300 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Fisheye Peephole Vignette Frame */}
      <div className={`relative w-72 h-72 sm:w-96 sm:h-96 rounded-full overflow-hidden border-8 border-stone-800 shadow-[0_0_60px_rgba(0,0,0,0.9),inset_0_0_80px_rgba(0,0,0,1)] bg-stone-950 flex items-center justify-center transition-transform duration-75 ${
        knockShake ? 'scale-105 translate-x-1 -translate-y-1' : 'scale-100'
      }`}>
        {/* Hallway Perspective Container */}
        <div
          style={{
            filter: `brightness(${flickerState}) contrast(135%)`,
            transition: 'filter 0.05s ease-out',
          }}
          className="relative w-full h-full bg-[#0d0f12] flex items-center justify-center overflow-hidden"
        >
          {/* Hallway walls perspective lines */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_20%,_rgba(0,0,0,0.9)_80%)] z-10 pointer-events-none" />

          {/* Perspective walls */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#1c1813] to-[#090a0d] border-r border-stone-800/40" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#1c1813] to-[#090a0d] border-l border-stone-800/40" />
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#15171c] to-[#07080a] border-b border-stone-800/40" />
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#15100a] to-[#07080a] border-t border-stone-800/40" />

          {/* Flickering fluorescent fixture in hallway ceiling */}
          <div
            style={{ opacity: flickerState }}
            className="absolute top-8 w-20 h-2 bg-amber-100 rounded-full shadow-[0_0_25px_rgba(255,230,170,0.8)] z-10"
          />

          {/* Distant Hallway Doors */}
          <div className="absolute left-10 top-20 bottom-16 w-8 border border-stone-900 bg-[#0e0a08]" />
          <div className="absolute right-10 top-20 bottom-16 w-8 border border-stone-900 bg-[#0e0a08]" />

          {/* The Pibe Creepy Shadow Figure */}
          <div
            style={{
              transform: `scale(${
                shadowDistance === 3 ? 0.7 : shadowDistance === 2 ? 1.25 : 2.2
              }) translateY(${shadowDistance === 1 ? '10px' : '0px'})`,
              transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="relative z-20 flex flex-col items-center select-none pointer-events-none"
          >
            {/* Silhouette Body */}
            <div className={`w-8 h-10 rounded-full bg-black/95 shadow-[0_0_15px_rgba(0,0,0,0.9)] relative ${jumpscareTwitch ? 'animate-bounce' : ''}`}>
              {/* Hollow Glowing Eye Dots */}
              <div className="absolute top-3 left-1.5 w-1.5 h-1.5 rounded-full bg-red-600/90 shadow-[0_0_8px_#ff0000]" />
              <div className="absolute top-3 right-1.5 w-1.5 h-1.5 rounded-full bg-red-600/90 shadow-[0_0_8px_#ff0000]" />
            </div>
            {/* Silhouette Torso & Arms */}
            <div className="w-14 h-24 bg-black/95 rounded-t-lg -mt-1 relative">
              {shadowDistance === 1 && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-red-500 uppercase tracking-widest whitespace-nowrap animate-pulse">
                  ESTÁ AFUERA...
                </div>
              )}
            </div>
          </div>

          {/* Grimy lens scratches & fisheye vignette overlay */}
          <div className="absolute inset-0 rounded-full border-[18px] border-black/80 pointer-events-none z-30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_40%,_rgba(0,0,0,0.85)_95%)] pointer-events-none z-30" />
        </div>
      </div>

      {/* Atmospheric Hint */}
      <div className="mt-4 text-center max-w-xs text-xs text-stone-400 font-mono">
        {shadowDistance === 3 && 'El pasillo está oscuro. Parece que no hay nadie... todavía.'}
        {shadowDistance === 2 && 'Se escuchan pasos apagados acercándose por la alfombra.'}
        {shadowDistance === 1 && '¡UNA SILUETA SE DETUVO JUSTO AL FRENTE DE LA PUERTA!'}
      </div>

      <button
        onClick={onClose}
        className="mt-4 px-6 py-2.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-200 hover:bg-stone-800 text-sm font-medium transition-colors"
      >
        Alejarse de la puerta
      </button>
    </div>
  );
};
