import React, { useEffect, useState } from 'react';
import { X, Eye, Volume2, AlertOctagon } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

export interface PeepholeModalProps {
  pibeStage: number; // 0: lejos, 1: medio, 2: cerca (golpeando), 3: pegado a la mirilla
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
  pibeStage,
  pibeCallCount,
  onCallPibe,
  onTriggerScreamer,
  onClose,
}) => {
  // Candidate resolver with exact uploaded files
  const getPibeCandidates = (stageNumber: number): string[] => {
    return [
      `/imgs/Elpibe_${stageNumber}.jpg`,
      `/imgs/elpibe_${stageNumber}.jpg`,
      `/imgs/Elpibe${stageNumber}.jpg`,
      `/imgs/elpibe${stageNumber}.jpg`,
      `/imgs/Elpibe_${stageNumber}.png`,
      `/imgs/Elpibe_${stageNumber}.jpeg`,
    ];
  };

  const [candidateIndex, setCandidateIndex] = useState<number>(0);
  const [imageError, setImageError] = useState<boolean>(false);
  const [flickerState, setFlickerState] = useState<number>(1);
  const [knockShake, setKnockShake] = useState<boolean>(false);

  // Preload all 4 stages on mount
  useEffect(() => {
    PIBE_STAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Reset candidate index whenever pibeStage changes
  useEffect(() => {
    setCandidateIndex(0);
    setImageError(false);
  }, [pibeStage]);

  useEffect(() => {
    // Increase horror tension according to stage
    horrorAudio.updateTension(0.35 + pibeStage * 0.2);
    sensorManager.vibrate([40, 80, 40]);

    // Shake lens whenever door knock sound fires
    const unregisterKnock = horrorAudio.onDoorKnock(() => {
      setKnockShake(true);
      setTimeout(() => setKnockShake(false), 380);
    });

    // Flickering lighting
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

    return () => {
      unregisterKnock();
      clearInterval(flickerInterval);
      horrorAudio.updateTension(0.2);
    };
  }, [pibeStage]);

  // Handle calling 'El Pibe'
  const handleCallPibe = () => {
    if (pibeStage >= 3 || pibeCallCount >= 3) {
      // Deadly call limit or extreme proximity reached -> Screamer!
      horrorAudio.playDoorKnocks(1.0);
      sensorManager.vibrate([400, 100, 500]);
      setTimeout(() => {
        onTriggerScreamer('called_too_much');
      }, 350);
      return;
    }

    // Sound effect & heavy haptic feedback
    horrorAudio.playDoorKnocks(1.0);
    sensorManager.vibrate([150, 80, 200, 100, 250]);

    // Screen shake
    setKnockShake(true);
    setTimeout(() => setKnockShake(false), 450);

    // Call parent handler
    onCallPibe();
  };

  // Status message & threat level info matching exact pibeStage (0..3)
  const getStatusInfo = () => {
    switch (pibeStage) {
      case 0:
        return {
          text: 'El pasillo está en penumbra absoluta. Una silueta lejana e inmóvil acecha al fondo del corredor.',
          badge: 'Pasillo en silencio - El Pibe está lejos',
          badgeClass: 'text-stone-400',
        };
      case 1:
        return {
          text: 'Se escuchan pisadas pesadas en el pasillo. La figura avanza lentamente por el corredor.',
          badge: 'El Pibe se está aproximando...',
          badgeClass: 'text-amber-400 font-semibold',
        };
      case 2:
        return {
          text: '¡GOLPES EN LA PUERTA! El Pibe está justo del otro lado tocando y golpeando la madera.',
          badge: '¡ALERTA! El Pibe está golpeando la puerta',
          badgeClass: 'text-amber-300 font-bold animate-pulse',
        };
      case 3:
      default:
        return {
          text: '¡ESTÁ PEGADO A LA MIRILLA! Su rostro desquiciado e inquietante llena por completo el visor.',
          badge: '¡PELIGRO EXTREMO: NO LO VUELVAS A LLAMAR!',
          badgeClass: 'text-red-400 font-bold animate-pulse',
        };
    }
  };

  const statusInfo = getStatusInfo();

  // Image source based on pibeStage (0..3) -> file index 1..4
  const stageNumber = Math.min(4, Math.max(1, pibeStage + 1));
  const candidates = getPibeCandidates(stageNumber);
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
              key={`stage-${pibeStage}-${candidateIndex}`}
              src={currentImgFile}
              alt={`El Pibe en el pasillo - fase ${stageNumber}`}
              onError={handleImageError}
              className="w-full h-full object-cover transition-opacity duration-300 select-none pointer-events-none"
            />
          ) : (
            /* Fallback dark corridor view */
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-black/95 p-4 text-center">
              <Eye className="w-12 h-12 text-stone-600 animate-pulse mb-2" />
              <p className="text-stone-300 text-xs font-mono font-bold uppercase tracking-wider">
                Pasillo oscuro
              </p>
            </div>
          )}

          {/* Natural glass reflections & lens edge vignette */}
          <div className="absolute inset-0 rounded-full border-[12px] border-black/75 pointer-events-none z-30" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_55%,_rgba(0,0,0,0.6)_85%,_rgba(0,0,0,0.95)_100%)] pointer-events-none z-30" />
        </div>
      </div>

      {/* Synchronized Status Message */}
      <div className="mt-3.5 text-center max-w-sm px-4 min-h-[48px] flex items-center justify-center">
        <p className="text-xs sm:text-sm text-stone-200 font-mono italic leading-snug">
          "{statusInfo.text}"
        </p>
      </div>

      {/* Interactive Controls & "Llamar al pibe" Action Button */}
      <div className="mt-4 w-full max-w-sm flex flex-col items-center gap-2.5">
        <button
          onClick={handleCallPibe}
          className={`w-full py-3 px-4 rounded-xl font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-95 cursor-pointer ${
            pibeStage >= 3 || pibeCallCount >= 3
              ? 'bg-red-700 hover:bg-red-600 text-white shadow-[0_0_25px_rgba(220,38,38,0.7)] animate-pulse'
              : pibeStage >= 2
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
                pibeStage >= 3
                  ? 'text-red-500 animate-ping'
                  : pibeStage >= 2
                  ? 'text-amber-500'
                  : 'text-stone-500'
              }`}
            />
            <span className={statusInfo.badgeClass}>
              {statusInfo.badge}
            </span>
          </div>

          {/* Indicator pips matching pibeStage */}
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((pip) => (
              <div
                key={pip}
                className={`w-2.5 h-2.5 rounded-full border transition-all ${
                  pibeStage >= pip
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

