/**
 * Broken Wall Tile Puzzle Modal (Azulejo Roto del Baño)
 * Prying the cracked tile reveals the secret 5-letter combination "MORIR".
 */

import React, { useState } from 'react';
import { X, Eye, Sparkles, Check } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

interface BrokenTileModalProps {
  hasDiscoveredCode: boolean;
  onDiscoverCode: () => void;
  onClose: () => void;
}

export const BrokenTileModal: React.FC<BrokenTileModalProps> = ({
  hasDiscoveredCode,
  onDiscoverCode,
  onClose,
}) => {
  const [removed, setRemoved] = useState(hasDiscoveredCode);
  const [prying, setPrying] = useState(false);

  const handlePryTile = () => {
    if (removed || prying) return;

    setPrying(true);
    horrorAudio.playCreak();
    sensorManager.vibrate([60, 40, 100]);

    setTimeout(() => {
      setRemoved(true);
      setPrying(false);
      horrorAudio.playUnlockClick();
      sensorManager.vibrate([100, 80, 200]);
      onDiscoverCode();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-3 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-mono uppercase tracking-wider text-stone-200">
              AZULEJO AGRIETADO DE LA PARED
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Inspection */}
        <div className="p-6 bg-gradient-to-b from-stone-900 to-stone-950 flex flex-col items-center text-center">
          {/* Ceramic Tile Frame */}
          <div className="relative w-56 h-56 rounded-lg border-4 border-stone-800 bg-[#2b2722] shadow-2xl flex items-center justify-center overflow-hidden mb-5">
            {/* Tile surface */}
            {!removed ? (
              <div
                onClick={handlePryTile}
                className="w-full h-full p-4 bg-gradient-to-br from-[#dcdad1] via-[#c8c4b7] to-[#aba69a] flex flex-col items-center justify-center cursor-pointer group transition-all"
              >
                <div className="w-full h-full border border-stone-600/50 rounded flex flex-col items-center justify-center relative">
                  {/* Fine hairline cracks */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg className="w-full h-full text-stone-800/80" viewBox="0 0 100 100">
                      <path
                        d="M 15 12 L 42 42 L 32 64 L 58 78 L 88 92"
                        stroke="#3d3730"
                        strokeWidth="2"
                        fill="none"
                      />
                      <path
                        d="M 42 42 L 78 32"
                        stroke="#3d3730"
                        strokeWidth="1.5"
                        fill="none"
                      />
                      <path
                        d="M 58 78 L 82 72"
                        stroke="#3d3730"
                        strokeWidth="1.5"
                        fill="none"
                      />
                    </svg>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-300 group-hover:scale-105 transition-transform bg-black/75 px-2.5 py-1 rounded border border-amber-500/40 shadow-md">
                    AZULEJO FLOJO (TOCA PARA RETIRAR)
                  </span>
                  <span className="text-[10px] text-stone-900 font-bold mt-2 font-mono bg-stone-300/60 px-1.5 py-0.5 rounded">
                    Mortero desmoronado
                  </span>
                </div>
              </div>
            ) : (
              /* Hollow recess with carved bloody word MORIR */
              <div className="w-full h-full bg-[#0a0c0b] p-3 flex flex-col items-center justify-center border border-red-900/50">
                <div className="w-full h-full bg-stone-950 rounded border border-stone-800 flex flex-col items-center justify-center relative p-3">
                  <div className="text-[10px] font-mono text-red-500 uppercase tracking-widest font-bold mb-1">
                    HUECO TRAS EL AZULEJO
                  </div>
                  <div className="text-3xl font-mono font-extrabold tracking-[0.25em] text-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)] animate-pulse">
                    M O R I R
                  </div>
                  <div className="mt-2 text-[11px] font-mono text-stone-400">
                    Inscripción raspada con sangre seca
                  </div>
                  <div className="mt-1 text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-600/30">
                    CÓDIGO DE 5 LETRAS PARA EL CANDADO
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-stone-300 font-sans leading-relaxed max-w-sm">
            {removed
              ? 'Has retirado el azulejo suelto. En el hueco oscuro del muro de concreto se encuentra tallada la palabra "MORIR". Esta es la combinación para el candado de letras de la puerta.'
              : 'Este azulejo de cerámica blanca envejecida tiene finas grietas casi imperceptibles en la pared al lado de la bañera. Al observarlo de cerca, notas que el mortero cedió y oculta algo detrás.'}
          </p>

          {!removed ? (
            <button
              onClick={handlePryTile}
              disabled={prying}
              className="mt-5 w-full py-2.5 px-4 rounded-lg bg-emerald-800 hover:bg-emerald-700 active:scale-98 text-white font-mono text-xs font-bold uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {prying ? (
                <span>DESPRENDIENDO AZULEJO...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-300" />
                  <span>FORZAR Y QUITAR AZULEJO</span>
                </>
              )}
            </button>
          ) : (
            <div className="mt-4 p-2.5 rounded-lg bg-red-950/40 border border-red-800/40 flex items-center justify-center gap-2 text-red-400 font-mono text-xs font-bold">
              <Check className="w-4 h-4 text-red-400" />
              <span>CLAVE DESCUBIERTA: M - O - R - I - R</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono transition-colors"
          >
            VOLVER AL BAÑO
          </button>
        </div>
      </div>
    </div>
  );
};
