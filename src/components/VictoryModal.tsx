/**
 * Victory Cinematic Modal (Acta Policial / Registro de Sobreviviente)
 * Cinematic sequence shown when escaping the room through the unlocked door.
 * Redesigned to fit the 90s Argentine analog horror aesthetic ("El Pibe").
 */

import React, { useEffect, useState } from 'react';
import { FileText, Clock, Key, RotateCcw, ShieldCheck, DoorOpen, Radio } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudioManager';

interface VictoryModalProps {
  timeElapsed: number; // in seconds
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  timeElapsed,
  onRestart,
}) => {
  const [stage, setStage] = useState<number>(0);

  useEffect(() => {
    horrorAudio.stopAllSounds();

    // Cinematic phase transitions: 0 (door opening) -> 1 (light flare) -> 2 (dossier reveal)
    const t1 = setTimeout(() => setStage(1), 600);
    const t2 = setTimeout(() => setStage(2), 1800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 flex flex-col items-center justify-center p-4 overflow-hidden select-none font-mono">
      {/* Cold Night Ambient Background & Scanlines */}
      <div
        className={`absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(20,30,40,0.9)_0%,_rgba(5,5,8,1)_80%)] transition-opacity duration-1000 ${
          stage >= 1 ? 'opacity-100' : 'opacity-40'
        }`}
      />

      {/* CRT Scanline and Flicker Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.85)_50%)] bg-[length:100%_4px] pointer-events-none z-30 opacity-70" />
      <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_60%,_rgba(0,0,0,0.95)_100%)] pointer-events-none z-30" />

      {/* VHS Header / Stamp metadata overlay */}
      <div className="absolute top-4 left-4 z-40 text-[10px] sm:text-xs text-amber-500/70 tracking-widest uppercase flex items-center gap-2">
        <Radio className="w-3.5 h-3.5 animate-pulse text-amber-500" />
        <span>CAM_01 // HABITACIÓN 4B // GRABACIÓN FINAL</span>
      </div>

      <div className="absolute top-4 right-4 z-40 text-[10px] sm:text-xs text-emerald-500/80 tracking-widest uppercase font-bold border border-emerald-800/60 bg-emerald-950/80 px-2.5 py-1 rounded">
        EVIDENCIA ARCHIVADA
      </div>

      {/* Main Container */}
      <div className="relative z-20 w-full max-w-lg flex flex-col items-center text-center">
        {/* Door Opening Visual Concept */}
        <div className="relative w-44 h-56 bg-neutral-900 border-2 border-stone-700/80 rounded-t shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden mb-5 flex items-center justify-center">
          {/* Dim foggy street light glowing outside */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(251,191,36,0.35)_0%,_rgba(15,23,42,0.95)_75%)]" />

          {/* Door Panels Opening */}
          <div
            style={{
              transform: stage >= 1 ? 'perspective(600px) rotateY(-82deg)' : 'none',
              transformOrigin: 'left center',
              transition: 'transform 1.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="absolute left-0 top-0 bottom-0 w-1/2 bg-stone-900 border-r border-stone-800 shadow-xl z-10"
          />
          <div
            style={{
              transform: stage >= 1 ? 'perspective(600px) rotateY(82deg)' : 'none',
              transformOrigin: 'right center',
              transition: 'transform 1.6s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="absolute right-0 top-0 bottom-0 w-1/2 bg-stone-900 border-l border-stone-800 shadow-xl z-10"
          />

          {/* Escape Silhouette */}
          {stage >= 1 && (
            <div className="relative z-0 flex flex-col items-center animate-pulse">
              <DoorOpen className="w-12 h-12 text-amber-200/90 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
              <span className="text-[9px] text-amber-300 uppercase tracking-widest mt-1">PUERTA ABIERTA</span>
            </div>
          )}
        </div>

        {/* Police Crime Scene / Survivor File Dossier */}
        <div
          className={`w-full bg-stone-900/95 border-2 border-amber-900/40 rounded-lg p-5 sm:p-6 backdrop-blur-md shadow-[0_0_60px_rgba(0,0,0,0.95)] transition-all duration-700 relative text-left overflow-hidden ${
            stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Top Paper Tape & Seal */}
          <div className="absolute -top-3 right-6 bg-amber-950/80 border border-amber-700/60 text-amber-300 text-[9px] uppercase px-3 py-0.5 tracking-widest font-bold shadow">
            EXPEDIENTE N° 1998-04
          </div>

          {/* Stenciled Red Rubber Stamp "SOBREVIVIENTE" */}
          <div className="absolute top-6 right-4 pointer-events-none transform rotate-[-12deg] border-4 border-red-600/80 px-3 py-1 text-red-600 font-extrabold text-sm sm:text-base tracking-widest uppercase opacity-85 select-none shadow-[0_0_10px_rgba(220,38,38,0.3)]">
            SOBREVIVIENTE
          </div>

          <div className="flex items-center gap-2.5 mb-2">
            <FileText className="w-5 h-5 text-amber-500 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-amber-200 uppercase tracking-wider">
              INFORME POLICIAL // CASO HABITACIÓN 4B
            </h2>
          </div>

          <p className="text-xs text-stone-400 border-b border-stone-800 pb-3 mb-4 leading-relaxed">
            El sujeto logró destrabar la puerta principal y abandonar el departamento antes de que el individuo ("El Pibe") ingresara a la propiedad.
          </p>

          {/* Key Metrics / Observations */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2.5 bg-stone-950/80 border border-stone-800 rounded">
              <span className="text-stone-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> ESTADO DEL SUJETO:
              </span>
              <span className="text-emerald-400 font-bold tracking-widest">CON VIDA / ESCAPÓ</span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-stone-950/80 border border-stone-800 rounded">
              <span className="text-stone-400 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> TIEMPO REGISTRADO:
              </span>
              <span className="text-amber-300 font-bold tracking-widest">
                {minutes}m {formattedSeconds}s
              </span>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-stone-950/80 border border-stone-800 rounded">
              <span className="text-stone-400 uppercase tracking-wider flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" /> CERROJOS DESARMADOS:
              </span>
              <span className="text-amber-200 font-bold tracking-widest">5 / 5 (COMPLETO)</span>
            </div>
          </div>

          {/* Official Footnote Note */}
          <div className="mt-4 p-2.5 bg-amber-950/20 border border-amber-900/30 rounded text-[11px] text-amber-200/80 italic">
            "Nota oficial: La investigación permanece abierta. No intente regresar al edificio bajo ninguna circunstancia."
          </div>

          {/* Restart Button */}
          <button
            onClick={onRestart}
            className="mt-5 w-full py-3.5 rounded bg-amber-900/40 hover:bg-amber-800/60 active:scale-98 border border-amber-600/60 text-amber-100 font-bold text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all shadow-[0_0_25px_rgba(217,119,6,0.15)] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            JUGAR DE NUEVO // REINICIAR
          </button>
        </div>
      </div>
    </div>
  );
};

