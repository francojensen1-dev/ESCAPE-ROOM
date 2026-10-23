/**
 * Door Peephole (Visor de la Puerta del Pibe) Modal
 * Shows the approaching sequence images of 'El Pibe' through a circular fisheye lens.
 * Includes a "Llamar al pibe" button. If the user calls him repeatedly,
 * the sequence advances until triggering an immediate screamer game-over.
 */

import React, { useEffect, useState } from 'react';
import { X, Eye, Volume2, AlertOctagon, Skull } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

export interface PeepholeModalProps {
  pibeCallCount: number;
  onCallPibe: () => void;
  onTriggerScreamer: (reason: 'called_too_much') => void;
  onClose: () => void;
}

const PIBE_STAGES: readonly string[] = [
  '/imgs/Elpibe_1.jpg',
  '/imgs/Elpibe_2.jpg',
  '/imgs/Elpibe_3.jpg',
  '/imgs/Elpibe_4.jpg',
];

export const PeepholeModal: React.FC<PeepholeModalProps> = ({
  pibeCallCount,
  onCallPibe,
  onTriggerScreamer,
  onClose,
}) => {
  // Candidate resolver with exact uploaded files first
  const getPibeCandidates = (stage: number): string[] => {
    return [
      `/imgs/Elpibe_${stage}.jpg`,
      `/imgs/elpibe_${stage}.jpg`,
      `/imgs/Elpibe${stage}.jpg`,
      `/imgs/elpibe${stage}.jpg`,
      `/imgs/Elpibe_${stage}.png`,
      `/imgs/Elpibe_${stage}.jpeg`,
    ];
  };

  // Sequence index: 0 (distant), 1 (mid), 2 (near), 3 (extreme close)
  const [sequenceIndex, setSequenceIndex] = useState<number>(() => {
    return Math.min(3, Math.max(0, pibeCallCount));
  });

  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const [imageError, setImageError] = useState<boolean>(false);
  const [flickerState, setFlickerState] = useState<number>(1);
  const [knockShake, setKnockShake] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>(() => {
    if (pibeCallCount === 0) return 'El pasillo está en penumbra absoluta. Una silueta inmóvil acecha a lo lejos.';
    if (pibeCallCount === 1) return 'Golpeaste la puerta. La figura avanzó lentamente por el corredor.';
    if (pibeCallCount === 2) return '¡Se escuchan pisadas pesadas y apresuradas! Está a pocos metros.';
    return '¡ESTÁ PEGADO A LA PUERTA! Una sonrisa desquiciada llena el visor.';
  });

  // Preload all 4 stages on mount
  useEffect(() => {
    PIBE_STAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Sync sequence index with pibeCallCount & reset candidate search
  useEffect(() => {
    const nextIdx = Math.min(3, pibeCallCount);
    setSequenceIndex(nextIdx);
    setCandidateIndex(0);
    setImageError(false);
  }, [pibeCallCount]);

  useEffect(() => {
    // Increase atmospheric horror tension
    horrorAudio.updateTension(0.85);
    sensorManager.vibrate([40, 80, 40]);

    // Shake lens whenever door knock sounds fire
    const unregisterKnock = horrorAudio.onDoorKnock(() => {
      setKnockShake(true);
      setTimeout(() => setKnockShake(false), 360);
    });

    // Flickering fluorescent lighting interval
    const flickerInterval = setInterval(() => {
      const rand = Math.random();
      if (rand > 0.65) {
        setFlickerState(0.15);
        setTimeout(() => setFlickerState(0.9), 70);
      } else if (rand > 0.45) {
        setFlickerState(0.4);
        setTimeout(() => setFlickerState(1.0), 120);
      } else {
        setFlickerState(1.0);
      }
    }, 420);

    // Passive creep progression: if player just stares without calling, sequence naturally creeps closer
    const naturalCreepTimer1 = setTimeout(() => {
      setSequenceIndex((prev) => {
        if (prev < 1) {
          horrorAudio.playHeartbeatSound();
          sensorManager.vibrate([80, 40, 80]);
          return 1;
        }
        return prev;
      });
    }, 4500);

    const naturalCreepTimer2 = setTimeout(() => {
      setSequenceIndex((prev) => {
        if (prev < 2) {
          horrorAudio.playDoorKnocks(0.5);
          sensorManager.vibrate([120, 60, 120]);
          return 2;
        }
        return prev;
      });
    }, 9500);

    return () => {
      unregisterKnock();
      clearInterval(flickerInterval);
      clearTimeout(naturalCreepTimer1);
      clearTimeout(naturalCreepTimer2);
      horrorAudio.updateTension(0.2);
    };
  }, []);

  // Handle calling 'El Pibe'
  const handleCallPibe = () => {
    const newCount = pibeCallCount + 1;
    onCallPibe();

    // Sound effect & heavy haptic feedback
    horrorAudio.playDoorKnocks(1.0);
    sensorManager.vibrate([150, 80, 200, 100, 250]);

    // Violent screen shake
    setKnockShake(true);
    setTimeout(() => setKnockShake(false), 450);

    // Advance sequence image
    const newIdx = Math.min(3, newCount);
    setSequenceIndex(newIdx);

    if (newCount === 1) {
      setStatusMessage('Gritaste al pasillo: "¿Quién anda ahí?". Un eco áspero responde a lo lejos.');
      horrorAudio.playCreak();
    } else if (newCount === 2) {
      setStatusMessage('¡Llamaste otra vez! Pasos frenéticos se acercan a toda velocidad.');
      horrorAudio.playHeartbeatSound();
    } else if (newCount === 3) {
      setStatusMessage('¡EL PIBE ESTÁ JUSTO AL FRENTE! Su respiración helada empaña la mirilla.');
      horrorAudio.playCreak();
      sensorManager.vibrate([250, 100, 300]);
    } else if (newCount >= 4) {
      // Deadly call limit reached: trigger jumpscare screamer!
      setStatusMessage('¡LO LLAMASTE DEMASIADO! La puerta tiembla...');
      horrorAudio.playCreak();
      sensorManager.vibrate([400, 100, 500]);
      setTimeout(() => {
        onTriggerScreamer('called_too_much');
      }, 400);
    }
  };

  // Image source based on sequence index & candidate variants
  const candidates = getPibeCandidates(sequenceIndex + 1);
  const currentImgFile = candidates[candidateIndex] || candidates[0];

  const handleImageError = () => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((prev) => prev + 1);
    } else {
      setImageError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 select-none backdrop-blur-sm">
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
          className="p-1.5 rounded-lg bg-stone-900 border border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          title="Alejarse de la mirilla"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Fisheye Peephole Vignette Frame */}
      <div
        className={`relative w-72 h-72 sm:w-96 sm:h-96 rounded-full overflow-hidden border-[8px] border-[#362717] ring-2 ring-[#a88644]/50 shadow-[0_0_80px_rgba(0,0,0,1),inset_0_0_60px_rgba(0,0,0,0.9)] bg-black flex items-center justify-center transition-transform duration-75 ${
          knockShake ? 'scale-105 translate-x-1.5 -translate-y-1.5 rotate-1' : 'scale-100'
        }`}
      >
        {/* Hallway Perspective Container */}
        <div
          style={{
            filter: `brightness(${flickerState * 0.95 + 0.05}) contrast(115%)`,
            transition: 'filter 0.04s ease-out',
          }}
          className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden"
        >
          {/* Sequence Image of El Pibe */}
          {!imageError ? (
            <img
              key={`${sequenceIndex}-${candidateIndex}`}
              src={currentImgFile}
              alt={`El Pibe en el pasillo - fase ${sequenceIndex + 1}`}
              onError={handleImageError}
              className="w-full h-full object-cover transition-opacity duration-300 select-none pointer-events-none"
            />
          ) : (
            /* Fallback dark corridor view if user image is not uploaded */
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-black/95 p-4 text-center">
              <Eye className="w-12 h-12 text-stone-600 animate-pulse mb-2" />
              <p className="text-stone-300 text-xs font-mono font-bold uppercase tracking-wider">
                Pasillo oscuro
              </p>
            </div>
          )}

          {/* Subtle natural glass reflections & lens edge vignette */}
          <div className="absolute inset-0 rounded-full border-[12px] border-black/75 pointer-events-none z-30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_55%,_rgba(0,0,0,0.6)_85%,_rgba(0,0,0,0.95)_100%)] pointer-events-none z-30" />
        </div>
      </div>

      {/* Atmospheric Hint & Feedback */}
      <div className="mt-3.5 text-center max-w-sm px-4 min-h-[44px] flex items-center justify-center">
        <p className="text-xs sm:text-sm text-stone-300 font-mono italic leading-snug">
          "{statusMessage}"
        </p>
      </div>

      {/* Interactive Controls & "Llamar al pibe" Action Button */}
      <div className="mt-4 w-full max-w-sm flex flex-col items-center gap-2.5">
        <button
          onClick={handleCallPibe}
          className={`w-full py-3 px-4 rounded-xl font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-95 cursor-pointer ${
            pibeCallCount >= 3
              ? 'bg-red-700 hover:bg-red-600 text-white shadow-[0_0_25px_rgba(220,38,38,0.7)] animate-pulse'
              : pibeCallCount >= 2
              ? 'bg-amber-700 hover:bg-amber-600 text-amber-50 shadow-[0_0_18px_rgba(217,119,6,0.5)]'
              : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600'
          }`}
        >
          <Volume2 className="w-4 h-4 animate-bounce" />
          <span>LLAMAR AL PIBE</span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-black/40 font-mono">
            {pibeCallCount} / 4
          </span>
        </button>

        {/* Threat Level Meter */}
        <div className="w-full flex items-center justify-between px-1 text-[11px] font-mono text-stone-400">
          <div className="flex items-center gap-1.5">
            <AlertOctagon
              className={`w-3.5 h-3.5 ${
                pibeCallCount >= 3
                  ? 'text-red-500 animate-ping'
                  : pibeCallCount >= 2
                  ? 'text-amber-500'
                  : 'text-stone-500'
              }`}
            />
            <span className={pibeCallCount >= 3 ? 'text-red-400 font-bold' : ''}>
              {pibeCallCount === 0 && 'Pasillo en silencio'}
              {pibeCallCount === 1 && 'El Pibe escuchó tu voz'}
              {pibeCallCount === 2 && 'El Pibe se aproxima rápido'}
              {pibeCallCount >= 3 && '¡PELIGRO EXTREMO: NO LO VUELVAS A LLAMAR!'}
            </span>
          </div>

          {/* Indicator pips */}
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((pip) => (
              <div
                key={pip}
                className={`w-2.5 h-2.5 rounded-full border transition-all ${
                  pibeCallCount > pip
                    ? pip === 3
                      ? 'bg-red-600 border-red-500 shadow-[0_0_8px_#ff0000]'
                      : 'bg-amber-500 border-amber-400 shadow-[0_0_6px_#f59e0b]'
                    : 'bg-stone-900 border-stone-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Back / Disengage Button */}
        <button
          onClick={onClose}
          className="mt-1 text-xs font-mono text-stone-400 hover:text-stone-200 tracking-wider underline cursor-pointer"
        >
          [ Dejar de mirar por la mirilla ]
        </button>
      </div>
    </div>
  );
};
