/**
 * Diary Notes Modal (Diario del Investigador Atrapado)
 * Clues and atmospheric lore found on the study desk.
 */

import React from 'react';
import { X, BookOpen, AlertCircle } from 'lucide-react';

interface NotesModalProps {
  onClose: () => void;
}

export const NotesModal: React.FC<NotesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-stone-900 border border-stone-800 rounded-xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-5 py-3 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-mono uppercase tracking-wider text-stone-200">
              PÁGINA ARRANCADA DE UN DIARIO
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paper visual */}
        <div className="p-6 bg-[#211d16] text-[#dfd7c2] border-y border-stone-800 shadow-inner relative overflow-hidden font-serif">
          {/* Blood/dirt stain */}
          <div className="absolute top-2 right-2 w-28 h-28 rounded-full bg-red-950/20 blur-xl pointer-events-none" />

          <div className="text-xs font-mono text-amber-500/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            DÍA 14 - NO PUEDO SALIR DE AQUÍ
          </div>

          <div className="space-y-3 text-sm leading-relaxed text-stone-300">
            <p>
              La <strong className="text-amber-400 font-semibold">Puerta Principal</strong> está completamente bloqueada con cadenas y tres seguros. Para abrirla necesitarás:
            </p>

            <ul className="list-disc list-inside space-y-1 text-xs text-stone-300 font-sans pl-1">
              <li>
                <span className="font-semibold text-amber-300">1. Llave Antigua:</span> La escondí dentro de la <strong className="text-amber-400 font-semibold">heladera podrida</strong>. El hedor y el moho evitaron que la encontraran.
              </li>
              <li>
                <span className="font-semibold text-amber-300">2. Candado de 4 dígitos:</span> El código es el año en que empezó esta pesadilla... está marcado en el <strong className="text-amber-400 font-semibold">calendario de la pared</strong>.
              </li>
              <li>
                <span className="font-semibold text-amber-300">3. Cortacorriente eléctrico:</span> La caja de fusibles en la pared este debe configurarse en: <strong className="text-amber-400 font-mono">[ARRIBA - ABAJO - ARRIBA]</strong>.
              </li>
            </ul>

            <p className="text-xs text-red-400/90 italic pt-2 border-t border-stone-700/50 font-sans">
              "No te demores más de 15 minutos. El Pibe merodea por el pasillo exterior. Si te acercas a la puerta, mira por la mirilla para ver qué tan cerca está..."
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono transition-colors"
          >
            GUARDAR NOTA
          </button>
        </div>
      </div>
    </div>
  );
};
