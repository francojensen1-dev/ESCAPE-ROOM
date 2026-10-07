/**
 * Inventory Drawer Component
 * Displays collected keys, items, and clues with inspect details.
 */

import React from 'react';
import { X, Key, BookOpen, Package } from 'lucide-react';
import { InventoryItem } from '../types/game';

interface InventoryDrawerProps {
  items: InventoryItem[];
  onOpenNotes: () => void;
  onClose: () => void;
}

export const InventoryDrawer: React.FC<InventoryDrawerProps> = ({
  items,
  onOpenNotes,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-t-2xl sm:rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-5 py-3 border-b border-stone-800 flex items-center justify-between bg-stone-950">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-mono uppercase tracking-wider text-stone-200">
              INVENTARIO DEL JUGADOR ({items.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-stone-800 text-stone-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item List */}
        <div className="p-4 space-y-3 overflow-y-auto">
          {items.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-500 font-mono">
              Tu inventario está vacío. Explora la habitación para encontrar objetos interactivos.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-stone-800 bg-stone-950/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-amber-950/50 border border-amber-500/40 flex items-center justify-center">
                    {item.id === 'key_fridge' ? (
                      <Key className="w-5 h-5 text-amber-400" />
                    ) : (
                      <BookOpen className="w-5 h-5 text-amber-300" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-stone-200 font-mono">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-stone-400">
                      {item.description}
                    </p>
                  </div>
                </div>

                {item.id === 'note_clues' && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenNotes();
                    }}
                    className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono"
                  >
                    LEER
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-mono"
          >
            CERRAR
          </button>
        </div>
      </div>
    </div>
  );
};
