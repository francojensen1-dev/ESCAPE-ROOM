/**
 * Victory Cinematic Modal (Cinemática de Escape)
 * Cinematic sequence shown when escaping the room through the unlocked door.
 */

import React, { useEffect, useState } from 'react';
import { Sparkles, Trophy, RotateCcw, Clock, Key, Check } from 'lucide-react';

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
    // Cinematic phase 0 -> 1 -> 2
    const t1 = setTimeout(() => setStage(1), 800);
    const t2 = setTimeout(() => setStage(2), 2200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const minutes = Math.floor(timeElapsed / 60);
  const seconds = timeElapsed % 60;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Light pouring out through open door effect */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-emerald-950 via-cyan-950 to-stone-950 transition-opacity duration-1000 ${
          stage >= 1 ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Cinematic Door Frame Animation */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
        {/* Door Opening Visual */}
        <div className="relative w-48 h-64 bg-stone-900 border-4 border-stone-700 rounded-t-lg shadow-2xl overflow-hidden mb-6 flex items-center justify-center">
          {/* Freedom Sky / Moonlit Horizon */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-600 to-emerald-900" />

          {/* Swinging Door Leaves */}
          <div
            style={{
              transform: stage >= 1 ? 'perspective(600px) rotateY(-80deg)' : 'none',
              transformOrigin: 'left center',
              transition: 'transform 1.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="absolute left-0 top-0 bottom-0 w-1/2 bg-stone-900 border-r border-stone-700"
          />
          <div
            style={{
              transform: stage >= 1 ? 'perspective(600px) rotateY(80deg)' : 'none',
              transformOrigin: 'right center',
              transition: 'transform 1.8s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            className="absolute right-0 top-0 bottom-0 w-1/2 bg-stone-900 border-l border-stone-700"
          />

          {/* Glowing Silhouette of Player Escaping */}
          {stage >= 2 && (
            <div className="relative z-20 flex flex-col items-center animate-pulse">
              <Sparkles className="w-8 h-8 text-amber-200" />
            </div>
          )}
        </div>

        {/* Victory Card */}
        <div
          className={`w-full bg-stone-900/90 border border-stone-800 rounded-2xl p-6 backdrop-blur-md shadow-2xl transition-all duration-700 ${
            stage >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-6 h-6 text-emerald-400" />
          </div>

          <h1 className="text-xl sm:text-2xl font-mono font-bold text-white uppercase tracking-wider">
            ¡HAS ESCAPADO DE LA HABITACIÓN!
          </h1>
          <p className="mt-1 text-xs text-stone-400">
            Lograste abrir los tres candados y burlar al Pibe a tiempo.
          </p>

          {/* Escape Stats */}
          <div className="mt-5 grid grid-cols-2 gap-3 text-left">
            <div className="p-3 rounded-lg bg-stone-950/70 border border-stone-800 flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] text-stone-400 uppercase font-mono">Tiempo Total</p>
                <p className="text-xs sm:text-sm font-mono font-bold text-stone-200">
                  {minutes}m {seconds}s
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-stone-950/70 border border-stone-800 flex items-center gap-2.5">
              <Key className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <p className="text-[10px] text-stone-400 uppercase font-mono">Pistas Resueltas</p>
                <p className="text-xs sm:text-sm font-mono font-bold text-stone-200">
                  3 / 3 Candados
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onRestart}
            className="mt-6 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            JUGAR DE NUEVO
          </button>
        </div>
      </div>
    </div>
  );
};
