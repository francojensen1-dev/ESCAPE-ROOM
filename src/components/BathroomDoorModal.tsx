/**
 * Dividing Bathroom Door Modal (Puerta Divisoria de Habitaciones)
 * Requires the brass key found inside the rotten refrigerator to unlock.
 * Separates the main room from the bathroom.
 */

import React, { useState } from 'react';
import { X, Lock, Unlock, Key, DoorOpen, AlertCircle, ArrowRight } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

interface BathroomDoorModalProps {
  isUnlocked: boolean;
  hasFridgeKey: boolean;
  onUnlock: () => void;
  onClose: () => void;
}

export const BathroomDoorModal: React.FC<BathroomDoorModalProps> = ({
  isUnlocked,
  hasFridgeKey,
  onUnlock,
  onClose,
}) => {
  const [unlocking, setUnlocking] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);

  const handleUseKey = () => {
    if (isUnlocked || !hasFridgeKey || unlocking) return;

    setUnlocking(true);
    horrorAudio.playUnlockClick();
    sensorManager.vibrate([60, 40, 80]);

    setTimeout(() => {
      horrorAudio.playCreak();
      sensorManager.vibrate([100, 80, 150]);
      onUnlock();
      setJustUnlocked(true);
      setUnlocking(false);
    }, 600);
  };

  const unlockedState = isUnlocked || justUnlocked;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-3 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-2">
            <DoorOpen className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-mono uppercase tracking-wider text-stone-200">
              PUERTA DEL BAÑO (DIVISIÓN)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-stone-800 text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Inspection of the Door & Brass Lock */}
        <div className="p-6 bg-gradient-to-b from-stone-900 to-stone-950 flex flex-col items-center text-center">
          {/* Door Frame & Lockplate Graphic */}
          <div className="relative w-48 h-48 rounded-xl border-4 border-stone-800 bg-[#1e1712] shadow-2xl flex flex-col items-center justify-center overflow-hidden mb-5">
            {/* Wood panel background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(45,32,22,0.9),_#100c09)]" />

            {/* Brass escutcheon plate & keyhole */}
            <div className="relative z-10 w-24 h-36 bg-gradient-to-b from-[#b89542] via-[#856525] to-[#594215] rounded-md border-2 border-[#d9b15b] shadow-lg flex flex-col items-center justify-between py-3">
              {/* Top screw */}
              <div className="w-2 h-2 rounded-full bg-stone-900 border border-amber-900" />

              {/* Brass Lever Handle */}
              <div className="relative w-16 h-3 bg-gradient-to-r from-[#d9b15b] to-[#6d511a] rounded-sm shadow-md flex items-center justify-end pr-1">
                <div className="w-2.5 h-4 bg-[#b89542] rounded-full border border-stone-900" />
              </div>

              {/* Keyhole */}
              <div className="flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-black border border-stone-950" />
                <div className="w-1.5 h-4 bg-black -mt-1 rounded-b-sm border-x border-b border-stone-950" />
              </div>

              {/* Bottom screw */}
              <div className="w-2 h-2 rounded-full bg-stone-900 border border-amber-900" />
            </div>

            {/* Lock Status Badge */}
            <div className="absolute bottom-2 z-20">
              {unlockedState ? (
                <span className="px-2.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/60 text-emerald-400 font-mono text-[10px] font-bold flex items-center gap-1">
                  <Unlock className="w-3 h-3" /> DESTRABADA
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded bg-red-950/90 border border-red-500/60 text-red-400 font-mono text-[10px] font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> CERRADA CON LLAVE
                </span>
              )}
            </div>
          </div>

          {/* Description & Status */}
          <div className="space-y-2 max-w-sm">
            {unlockedState ? (
              <p className="text-xs text-emerald-300 font-sans leading-relaxed">
                El cerrojo de latón ha cedido. La puerta divisoria está abierta y puedes acceder a la segunda habitación: el baño decrépito.
              </p>
            ) : hasFridgeKey ? (
              <div className="space-y-2">
                <p className="text-xs text-stone-300 font-sans leading-relaxed">
                  Tienes en tu poder la <strong className="text-amber-400">Llave Antigua de Latón</strong> encontrada congelada en la heladera podrida. El perfil de la llave coincide con este cerrojo.
                </p>
                <div className="p-2 rounded bg-amber-950/40 border border-amber-600/40 text-amber-300 text-[11px] font-mono flex items-center justify-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>LLAVE DE LA HELADERA LISTA PARA USAR</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-stone-300 font-sans leading-relaxed">
                  Esta puerta de madera maciza divide la habitación principal del baño contiguo. La cerradura de latón está firmemente trabada.
                </p>
                <div className="p-2.5 rounded bg-stone-950 border border-red-900/40 text-[11px] font-mono text-stone-400 flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-stone-300">Pista:</strong> Busca la llave de latón en la heladera podrida de la habitación principal.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          {!unlockedState && hasFridgeKey && (
            <button
              onClick={handleUseKey}
              disabled={unlocking}
              className="mt-5 w-full py-3 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 active:scale-98 text-black font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4 text-black" />
              {unlocking ? 'DESTABRANDO CERROJO...' : 'USAR LLAVE DE LA HELADERA Y ABRIR'}
            </button>
          )}

          {unlockedState && (
            <button
              onClick={onClose}
              className="mt-5 w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-600 active:scale-98 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
            >
              <span>ENTRAR AL BAÑO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono transition-colors"
          >
            VOLVER
          </button>
        </div>
      </div>
    </div>
  );
};
