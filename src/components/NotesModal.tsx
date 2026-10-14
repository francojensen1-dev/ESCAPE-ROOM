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
              La <strong className="text-amber-400 font-semibold">Puerta Principal</strong> está bloqueada con cadenas macizas y cuatro seguros. Además, la habitación del baño está cerrada con llave:
            </p>

            <ul className="list-disc list-inside space-y-1.5 text-xs text-stone-300 font-sans pl-1">
              <li>
                <span className="font-semibold text-amber-300">🚪 Puerta del Baño:</span> Cerrada con llave. Escondí la <strong className="text-amber-400 font-semibold">llave de latón dentro de la heladera podrida</strong> para que no la encuentren.
              </li>
              <li>
                <span className="font-semibold text-amber-300">1. Candado de 4 dígitos:</span> El año que inició el horror está marcado en el <strong className="text-amber-400 font-semibold">calendario de la pared</strong>.
              </li>
              <li>
                <span className="font-semibold text-amber-300">2. Cortacorriente 220V:</span> En la caja de fusibles al lado de la puerta del baño: <strong className="text-amber-400 font-mono">[ARRIBA - ABAJO - ARRIBA]</strong>.
              </li>
              <li>
                <span className="font-semibold text-amber-300">3. Candado de hierro:</span> Una vez dentro del baño, arrojé la llave pesada al fondo del <strong className="text-amber-400 font-semibold">inodoro sucio</strong>.
              </li>
              <li>
                <span className="font-semibold text-amber-300">4. Candado de 5 letras:</span> Grabé la combinación en el hueco de la pared. Busca con atención el <strong className="text-amber-400 font-semibold">azulejo con fisuras</strong> en el baño... no resalta a simple vista.
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
