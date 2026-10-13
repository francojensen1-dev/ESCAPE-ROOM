/**
 * Rotate Phone Prompt Component
 * Subtle, non-intrusive notification reminding the user to hold the phone
 * in landscape mode for optimal horror immersion and gyroscope controls.
 * Auto-hides when held horizontally.
 */

import React from 'react';
import { Smartphone, RotateCw } from 'lucide-react';

interface RotatePhonePromptProps {
  isPortrait: boolean;
  onDismiss?: () => void;
}

export const RotatePhonePrompt: React.FC<RotatePhonePromptProps> = ({ isPortrait, onDismiss }) => {
  if (!isPortrait) return null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-auto max-w-sm px-4 w-full animate-fade-in">
      <div className="bg-stone-900/95 border border-amber-500/50 rounded-xl p-3 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3 text-stone-200">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Smartphone className="w-5 h-5 -rotate-90 animate-pulse" />
            <RotateCw className="w-3.5 h-3.5 absolute -top-1 -right-1 text-amber-300" />
          </div>
          <div className="text-left">
            <p className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wide">
              MODO HORIZONTAL RECOMENDADO
            </p>
            <p className="text-[11px] text-stone-400 leading-tight">
              Gira tu celular de lado para que el giroscopio siga la vista naturalmente.
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-[10px] font-mono text-stone-500 hover:text-stone-300 px-2 py-1 rounded border border-stone-800"
          >
            OK
          </button>
        )}
      </div>
    </div>
  );
};
