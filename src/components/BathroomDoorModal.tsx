/**
 * Dividing Bathroom Door Modal (Puerta Divisoria de Habitaciones)
 * Displays only the door lock based on user PNG: /imgs/cerraduraBaño1.png
 * Respects transparency and displays with prominent sizing on screen.
 * - If user does not have key: displays red text "esta cerrado busca la llave"
 * - If user has key: displays button "insertar llave"
 * - Clean frameless design without cards or boxes
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

interface BathroomDoorModalProps {
  isUnlocked: boolean;
  hasFridgeKey: boolean;
  onUnlock: () => void;
  onClose: () => void;
}

const PRIMARY_LOCK_IMG = '/imgs/cerraduraBaño1.png';
const ENCODED_LOCK_IMG = '/imgs/cerraduraBa%C3%B1o1.png';

export const BathroomDoorModal: React.FC<BathroomDoorModalProps> = ({
  isUnlocked,
  hasFridgeKey,
  onUnlock,
  onClose,
}) => {
  const [unlocking, setUnlocking] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [imgSrc, setImgSrc] = useState(PRIMARY_LOCK_IMG);

  const handleClose = () => {
    horrorAudio.playMainDoorSound();
    onClose();
  };

  const handleUseKey = () => {
    if (isUnlocked || !hasFridgeKey || unlocking) return;

    setUnlocking(true);
    horrorAudio.playKeyCollect();
    sensorManager.vibrate([60, 40, 80]);

    setTimeout(() => {
      horrorAudio.playMainDoorSound();
      sensorManager.vibrate([100, 80, 150]);
      onUnlock();
      setJustUnlocked(true);
      setUnlocking(false);
    }, 550);
  };

  const unlockedState = isUnlocked || justUnlocked;

  return (
    <div className="fixed inset-0 z-50 bg-black/92 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none">
      {/* Floating Close Button Top Right */}
      <button
        onClick={handleClose}
        className="fixed top-4 right-4 z-40 p-2.5 rounded-full bg-stone-900/90 border border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors shadow-2xl cursor-pointer hover:scale-105 active:scale-95"
        title="Cerrar vista"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Center Lock Presentation (Transparent PNG) */}
      <div className="relative flex flex-col items-center justify-center max-w-md w-full">
        {/* Subtle blurred aura behind lock */}
        <div className="absolute w-72 h-[32rem] bg-black/80 rounded-full blur-2xl pointer-events-none -z-10" />

        {/* Lock Transparent PNG Image */}
        <img
          src={imgSrc}
          alt="Cerradura de la puerta del baño"
          onError={() => {
            if (imgSrc === PRIMARY_LOCK_IMG) {
              setImgSrc(ENCODED_LOCK_IMG);
            }
          }}
          className="max-h-[70vh] sm:max-h-[75vh] max-w-[85vw] sm:max-w-md w-auto h-auto object-contain drop-shadow-[0_25px_50px_rgba(0,0,0,0.95)] select-none pointer-events-none"
        />

        {/* Dynamic State Feedback under the Lock */}
        {!unlockedState ? (
          !hasFridgeKey ? (
            /* Player does NOT have the key: red text */
            <p className="text-red-500 font-mono text-base sm:text-lg font-bold tracking-wider mt-5 text-center drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] animate-pulse uppercase">
              esta cerrado busca la llave
            </p>
          ) : (
            /* Player HAS the key: button to insert key */
            <button
              onClick={handleUseKey}
              disabled={unlocking}
              className="mt-5 px-8 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold font-mono text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.55)] transition-all active:scale-95 cursor-pointer"
            >
              {unlocking ? 'insertando llave...' : 'insertar llave'}
            </button>
          )
        ) : (
          /* Already unlocked: Enter button */
          <button
            onClick={handleClose}
            className="mt-5 px-8 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all active:scale-95 cursor-pointer"
          >
            cerradura abierta - entrar
          </button>
        )}
      </div>
    </div>
  );
};
