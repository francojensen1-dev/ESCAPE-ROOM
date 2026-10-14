/**
 * Main Door Inspection Modal (Puerta Principal Encadenada)
 * Allows interacting with each lock, peeking through the peephole,
 * and escaping when all 3 locks are resolved.
 */

import React from 'react';
import { X, Lock, Unlock, Eye, Key, Zap, CheckCircle2, DoorOpen } from 'lucide-react';
import { LockState, InventoryItem } from '../types/game';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

interface MainDoorModalProps {
  lockState: LockState;
  inventory: InventoryItem[];
  onOpenPeephole: () => void;
  onOpenCodeLock: () => void;
  onUseKey: () => void;
  onEscapeSuccess: () => void;
  onClose: () => void;
}

export const MainDoorModal: React.FC<MainDoorModalProps> = ({
  lockState,
  inventory,
  onOpenPeephole,
  onOpenCodeLock,
  onUseKey,
  onEscapeSuccess,
  onClose,
}) => {
  const [knockImpact, setKnockImpact] = React.useState(false);
  const hasKey = inventory.some((item) => item.id === 'key_fridge');
  const allUnlocked = lockState.keyLock && lockState.codeLock && lockState.fuseLock;

  React.useEffect(() => {
    const unregister = horrorAudio.onDoorKnock(() => {
      setKnockImpact(true);
      setTimeout(() => setKnockImpact(false), 450);
    });
    return () => unregister();
  }, []);

  const handleUseKey = () => {
    if (!hasKey || lockState.keyLock) return;
    horrorAudio.playUnlockClick();
    sensorManager.vibrate([60, 40, 80]);
    onUseKey();
  };

  const handleEscape = () => {
    if (!allUnlocked) return;
    horrorAudio.playDoorOpen();
    sensorManager.vibrate([100, 100, 200, 200]);
    onEscapeSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div
        className={`w-full max-w-md bg-stone-900 border rounded-xl overflow-hidden shadow-2xl flex flex-col transition-all duration-75 ${
          knockImpact
            ? 'border-red-600 scale-[1.02] shadow-[0_0_40px_rgba(239,68,68,0.4)]'
            : 'border-stone-800'
        }`}
      >
        {knockImpact && (
          <div className="bg-red-950/90 border-b border-red-600/60 py-1.5 px-3 text-center text-xs font-mono text-red-300 font-bold tracking-widest animate-pulse">
            ⚠️ ¡EL PIBE ESTÁ GOLPEANDO LA PUERTA DESDE AFUERA!
          </div>
        )}
        {/* Header */}
        <div className="px-5 py-3 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-mono uppercase tracking-wider text-stone-200">
              PUERTA PRINCIPAL ENCADENADA
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
        <div className="p-5 space-y-4 bg-stone-950/80">
          <div className="p-2.5 rounded-lg border border-red-900/60 bg-red-950/20 text-center">
            <span className="text-xs font-mono font-bold text-red-500 uppercase tracking-widest block">
              "Don't go out!! — Walter"
            </span>
            <span className="text-[11px] text-stone-400 mt-0.5 block">
              Inscripción ensangrentada debajo de la mirilla. Placas de acero y maraña de cadenas remachadas a las paredes.
            </span>
          </div>

          {/* Peephole Action Button */}
          <button
            onClick={onOpenPeephole}
            className="w-full py-2.5 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-300 text-xs font-mono font-semibold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
          >
            <Eye className="w-4 h-4 text-amber-400" />
            MIRAR POR EL VISOR (MIRILLA)
          </button>

          {/* Lock 1: Brass Key Lock */}
          <div className="p-3 rounded-lg border border-stone-800 bg-stone-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Key className={`w-4 h-4 ${lockState.keyLock ? 'text-emerald-400' : 'text-amber-500'}`} />
              <div>
                <p className="text-xs font-semibold text-stone-200">1. Candado de Latón Antiguo</p>
                <p className="text-[11px] text-stone-400">
                  {lockState.keyLock
                    ? 'Abierto con la llave del refrigerador'
                    : hasKey
                    ? 'Tienes la llave en el inventario'
                    : 'Requiere la llave escondida'}
                </p>
              </div>
            </div>

            {lockState.keyLock ? (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> ABIERTO
              </span>
            ) : hasKey ? (
              <button
                onClick={handleUseKey}
                className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-black font-mono text-xs font-bold transition-colors"
              >
                INSERTAR LLAVE
              </button>
            ) : (
              <span className="text-xs font-mono text-stone-500">BLOQUEADO</span>
            )}
          </div>

          {/* Lock 2: 4-digit code lock */}
          <div className="p-3 rounded-lg border border-stone-800 bg-stone-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {lockState.codeLock ? (
                <Unlock className="w-4 h-4 text-emerald-400" />
              ) : (
                <Lock className="w-4 h-4 text-amber-500" />
              )}
              <div>
                <p className="text-xs font-semibold text-stone-200">2. Candado Numérico (4 Dígitos)</p>
                <p className="text-[11px] text-stone-400">
                  {lockState.codeLock ? 'Combinación correcta (1986)' : 'Combinación requerida'}
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
                className="px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono text-xs transition-colors"
              >
                GIRAR DIALES
              </button>
            )}
          </div>

          {/* Lock 3: Electronic breaker */}
          <div className="p-3 rounded-lg border border-stone-800 bg-stone-900/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Zap className={`w-4 h-4 ${lockState.fuseLock ? 'text-emerald-400' : 'text-amber-500'}`} />
              <div>
                <p className="text-xs font-semibold text-stone-200">3. Pestillo Electromagnético</p>
                <p className="text-[11px] text-stone-400">
                  {lockState.fuseLock ? 'Circuito puenteado con éxito' : 'Alimentado por caja de fusibles'}
                </p>
              </div>
            </div>

            {lockState.fuseLock ? (
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" /> DESACTIVADO
              </span>
            ) : (
              <span className="text-xs font-mono text-stone-500">ENERGIZADO</span>
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
              ¡CADENAS SUELTAS! ABRIR Y ESCAPAR
            </button>
          ) : (
            <p className="text-center text-[11px] font-mono text-stone-500">
              Desbloquea los 3 seguros para liberar las cadenas de la puerta.
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
