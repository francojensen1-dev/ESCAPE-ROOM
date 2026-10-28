/**
 * Broken Wall Tile Puzzle Modal (Azulejo Roto del Baño)
 * Displays the paper clue image directly without any framing or boxes.
 */

import React, { useEffect } from 'react';

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
  useEffect(() => {
    if (!hasDiscoveredCode) {
      onDiscoverCode();
    }
  }, [hasDiscoveredCode, onDiscoverCode]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
    >
      <img
        src="/imgs/papel.png"
        alt="Papel del azulejo"
        className="max-w-[90vw] max-h-[85vh] object-contain drop-shadow-2xl select-none pointer-events-auto"
      />
    </div>
  );
};

