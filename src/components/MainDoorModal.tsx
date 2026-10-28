/**
 * Main Door Inspection Modal (Puerta Principal Encadenada)
 * Allows interacting with all 4 locks, peeking through the peephole,
 * and escaping when all 4 locks are resolved.
 */

import React from 'react';
import { X, Lock, Unlock, Key, Zap, CheckCircle2, DoorOpen, Type } from 'lucide-react';
import { LockState, InventoryItem } from '../types/game';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

interface MainDoorModalProps {
  lockState: LockState;
  inventory: InventoryItem[];
  onOpenCodeLock: () => void;
  onOpenLetterLock: () => void;
  onOpenRustedCodeLock: () => void;
  onUseToiletKey: () => void;
  onEscapeSuccess: () => void;
  onClose: () => void;
}

export const MainDoorModal: React.FC<MainDoorModalProps> = ({
  lockState,
  inventory,
  onOpenCodeLock,
  onOpenLetterLock,
  onOpenRustedCodeLock,
  onUseToiletKey,
  onEscapeSuccess,
  onClose,
}) => {
  const [knockImpact, setKnockImpact] = React.useState(false);
  const hasToiletKey = inventory.some((item) => item.id === 'key_toilet');

  const allUnlocked =
    lockState.codeLock &&
    lockState.fuseLock &&
    lockState.toiletKeyLock &&
    lockState.letterLock &&
    lockState.rustedCodeLock;

  React.useEffect(() => {
    const unregister = horrorAudio.onDoorKnock(() => {
      setKnockImpact(true);
      setTimeout(() => setKnockImpact(false), 450);
    });
    return () => unregister();
  }, []);

  const handleUseToiletKey = () => {
    if (!hasToiletKey || lockState.toiletKeyLock) return;
    horrorAudio.playUnlockClick();
    sensorManager.vibrate([70, 50, 90]);
    onUseToiletKey();
  };

  const handleEscape = () => {
    if (!allUnlocked) return;
    horrorAudio.playDoorOpen();
    sensorManager.vibrate([100, 100, 200, 200]);
    onEscapeSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div
        className={`w-full max-w-md bg-stone-900 border rounded-xl overflow-hidden shadow-2xl flex flex-col my-auto transition-all duration-75 ${
          knockImpact
            ? 'border-red-600 scale-[1.02] shadow-[0_0_40px_rgba(239,68,68,0.4)]'
            : 'border-stone-800'
        }`}
      >
        {knockImpact && (
          <div className="bg-red-950/90 border-b border-red-600/60 py-1.5 px-3 text-center text-xs font-mono text-red-300 font-bold tracking-widest animate-pulse">
            ⚠️ ¡SE ESCUCHAN GOLPES EN LA PUERTA DEL PIBE!
          </div>
        )}

        {/* Header */}
        <div className="px-5 py-3 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-mono uppercase tracking-wider text-stone-200">
              PUERTA PRINCIPAL ENCADENADA (5 CANDADOS)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual & Lock Statuses */}
        <div className="p-4 space-y-3 bg-stone-950/80 max-h-[60vh] overflow-y-auto">
          <div className="p-2 rounded-lg border border-red-900/60 bg-red-950/20 text-center">
            <span className="text-xs font-mono font-bold text-red-500 uppercase tracking-widest block">
              "Don't go out!! — Walter"
            </span>
            <span className="text-[11px] text-stone-400 mt-0.5 block">
              Cadenas masivas cruzadas. Hay 5 seguros que te separan de la libertad.
            </span>
          </div>

          {/* Lock 1: 4-digit code lock (Calendar 1986) */}
          <div className="p-2.5 rounded-lg border border-stone-800 bg-stone-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {lockState.codeLock ? (
                <Unlock className="w-4 h-4 text-emerald-400" />
              ) : (
                <Lock className="w-4 h-4 text-amber-500" />
              )}
              <div>
                <p className="text-xs font-semibold text-stone-200">1. Candado Numérico (4 Dígitos)</p>
                <p className="text-[10px] text-stone-400">
                  {lockState.codeLock ? 'Candado abierto' : 'Candado de combinación de 4 dígitos'}
                </p>
              </div>
            </div>

            {lockState.codeLock ? (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> ABIERTO
              </span>
            ) : (
              <button
                onClick={onOpenCodeLock}
                className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono text-xs transition-colors"
              >
                DIALES
              </button>
            )}
          </div>

          {/* Lock 2: Electronic breaker (Fuse Box) */}
          <div className="p-2.5 rounded-lg border border-stone-800 bg-stone-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Zap className={`w-4 h-4 ${lockState.fuseLock ? 'text-emerald-400' : 'text-amber-500'}`} />
              <div>
                <p className="text-xs font-semibold text-stone-200">2. Pestillo Electromagnético (220V)</p>
                <p className="text-[10px] text-stone-400">
                  {lockState.fuseLock ? 'Circuito desenergizado' : 'Alimentado por caja de fusibles'}
                </p>
              </div>
            </div>

            {lockState.fuseLock ? (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> APAGADO
              </span>
            ) : (
              <span className="text-xs font-mono text-stone-500">ENERGIZADO</span>
            )}
          </div>

          {/* Lock 3: Iron Lock (Toilet Key) */}
          <div className="p-2.5 rounded-lg border border-stone-800 bg-stone-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Key className={`w-4 h-4 ${lockState.toiletKeyLock ? 'text-emerald-400' : 'text-amber-500'}`} />
              <div>
                <p className="text-xs font-semibold text-stone-200">3. Candado de Hierro Herrumbroso</p>
                <p className="text-[10px] text-stone-400">
                  {lockState.toiletKeyLock
                    ? 'Candado abierto'
                    : hasToiletKey
                    ? 'Tienes una llave de hierro que coincide'
                    : 'Requiere una llave de hierro de cerrojo pesada'}
                </p>
              </div>
            </div>

            {lockState.toiletKeyLock ? (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> ABIERTO
              </span>
            ) : hasToiletKey ? (
              <button
                onClick={handleUseToiletKey}
                className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-black font-mono text-xs font-bold transition-colors"
              >
                INSERTAR
              </button>
            ) : (
              <span className="text-xs font-mono text-stone-500">BLOQUEADO</span>
            )}
          </div>

          {/* Lock 4: 5-Letter Word Lock (Tile Code) */}
          <div className="p-2.5 rounded-lg border border-stone-800 bg-stone-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Type className={`w-4 h-4 ${lockState.letterLock ? 'text-emerald-400' : 'text-amber-500'}`} />
              <div>
                <p className="text-xs font-semibold text-stone-200">4. Candado de 5 Letras</p>
                <p className="text-[10px] text-stone-400">
                  {lockState.letterLock
                    ? 'Candado abierto'
                    : 'Candado de combinación con 5 letras'}
                </p>
              </div>
            </div>

            {lockState.letterLock ? (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> ABIERTO
              </span>
            ) : (
              <button
                onClick={onOpenLetterLock}
                className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono text-xs transition-colors"
              >
                LETRAS
              </button>
            )}
          </div>

          {/* Lock 5: Rusted 4-Digit Code Lock (5413) */}
          <div className="p-2.5 rounded-lg border border-stone-800 bg-stone-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {lockState.rustedCodeLock ? (
                <Unlock className="w-4 h-4 text-emerald-400" />
              ) : (
                <Lock className="w-4 h-4 text-amber-500" />
              )}
              <div>
                <p className="text-xs font-semibold text-stone-200">5. Candado Oxidado (4 Dígitos)</p>
                <p className="text-[10px] text-stone-400">
                  {lockState.rustedCodeLock ? 'Candado abierto' : 'Candado de combinación oxidado de 4 dígitos'}
                </p>
              </div>
            </div>

            {lockState.rustedCodeLock ? (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> ABIERTO
              </span>
            ) : (
              <button
                onClick={onOpenRustedCodeLock}
                className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono text-xs transition-colors"
              >
                DIALES
              </button>
            )}
          </div>
        </div>

        {/* Footer & Escape Trigger */}
        <div className="p-4 bg-stone-950 border-t border-stone-800 flex flex-col gap-2">
          {allUnlocked ? (
            <button
              onClick={handleEscape}
              className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-sm font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.5)] animate-pulse transition-all"
            >
              <DoorOpen className="w-5 h-5" />
              ¡LOS 5 CANDADOS ABIERTOS! ABRIR Y ESCAPAR
            </button>
          ) : (
            <p className="text-center text-[11px] font-mono text-stone-400">
              Desbloquea los 5 seguros para escapar de la habitación.
            </p>
          )}

          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-400 text-xs font-mono transition-colors"
          >
            VOLVER AL CUARTO
          </button>
        </div>
      </div>
    </div>
  );
};
