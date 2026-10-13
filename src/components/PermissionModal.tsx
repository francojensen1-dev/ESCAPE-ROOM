/**
 * Welcome & Sensor Permissions Modal
 * Provides mandatory initial user gesture for:
 * 1. Web Audio Context unlocking
 * 2. iOS 13+ DeviceOrientationEvent permission request
 * 3. Haptic API activation
 */

import React, { useState } from 'react';
import { Compass, Volume2, ShieldAlert, Play, Smartphone, Eye, Lightbulb } from 'lucide-react';

interface PermissionModalProps {
  onStartExperience: (options: { enableGyro: boolean }) => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({ onStartExperience }) => {
  const [requesting, setRequesting] = useState<boolean>(false);

  const handleStart = () => {
    setRequesting(true);
    onStartExperience({ enableGyro: true });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 overflow-y-auto">
      {/* Background Horror Ambience Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#1c1010_0%,_#050505_80%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg bg-stone-900/90 border border-stone-800 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl flex flex-col items-center text-center">
        {/* Warning Icon */}
        <div className="w-12 h-12 rounded-full bg-red-950/80 border border-red-700/60 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(220,38,38,0.4)]">
          <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-mono font-extrabold text-white tracking-widest uppercase">
          ESCAPE FROM “THE PIBE” ROOM
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-stone-300 leading-relaxed font-sans max-w-md">
          Despiertas atrapado en una habitación tétrica y descuidada. La <span className="text-amber-400 font-semibold">Puerta Principal</span> está encadenada con múltiples candados. Tienes <span className="text-red-400 font-semibold font-mono">15 minutos</span> antes de que el Pibe entre.
        </p>

        {/* Controls Card */}
        <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
          <div className="p-3 rounded-lg bg-stone-950/80 border border-stone-800 flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-xs font-mono font-bold text-stone-200 uppercase">Giroscopio Horizontal</h2>
              <p className="text-[11px] text-stone-400 leading-normal">
                Usa el celular en horizontal (Landscape). La cámara sigue el movimiento suavemente en 360°.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-stone-950/80 border border-stone-800 flex items-start gap-2.5">
            <Compass className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-xs font-mono font-bold text-stone-200 uppercase">Movimiento Táctil</h2>
              <p className="text-[11px] text-stone-400 leading-normal">
                Joystick virtual en pantalla o teclas W, A, S, D para caminar.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-stone-950/80 border border-stone-800 flex items-start gap-2.5">
            <Eye className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-xs font-mono font-bold text-stone-200 uppercase">Objetos Interactivos</h2>
              <p className="text-[11px] text-stone-400 leading-normal">
                Los objetos emiten un reflejo al acercarte. Tócalos para inspeccionarlos.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-stone-950/80 border border-stone-800 flex items-start gap-2.5">
            <Volume2 className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-xs font-mono font-bold text-stone-200 uppercase">Música & Audio 3D</h2>
              <p className="text-[11px] text-stone-400 leading-normal">
                Banda sonora "Room of Angel" en loop inmersivo con efectos y hápticos.
              </p>
            </div>
          </div>
        </div>

        {/* Tip */}
        <div className="mt-4 flex items-center gap-2 text-[11px] text-amber-400/90 font-mono">
          <Lightbulb className="w-3.5 h-3.5 shrink-0" />
          <span>Tip: Inspecciona la heladera podrida y mira por el visor de la puerta.</span>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={requesting}
          className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-red-800 via-amber-700 to-red-800 hover:from-red-700 hover:to-red-700 text-white font-mono text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(220,38,38,0.5)] active:scale-98 transition-all disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" />
          {requesting ? 'INICIALIZANDO...' : 'INICIAR EXPERIENCIA (JUGAR AHORA)'}
        </button>
      </div>
    </div>
  );
};
