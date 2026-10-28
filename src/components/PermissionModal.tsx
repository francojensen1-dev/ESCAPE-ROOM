import React, { useState } from 'react';

interface PermissionModalProps {
  onStartExperience: (options: { enableGyro: boolean }) => void;
}

export const PermissionModal: React.FC<PermissionModalProps> = ({ onStartExperience }) => {
  const [requesting, setRequesting] = useState<boolean>(false);

  const handleStart = () => {
    if (requesting) return;
    setRequesting(true);
    onStartExperience({ enableGyro: true });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-2 sm:p-4 overflow-hidden select-none">
      {/* Main title image container */}
      <div className="relative max-w-xl w-full max-h-[92vh] flex items-center justify-center">
        <img
          src="/imgs/title.png"
          alt="Escape From The Pibe Room"
          className="w-full h-auto max-h-[92vh] object-contain drop-shadow-[0_0_35px_rgba(220,38,38,0.25)] pointer-events-none"
        />

        {/* Invisible interactive button placed over the red 'Viví la experiencia (jugar ahora)' graphic */}
        <button
          type="button"
          onClick={handleStart}
          disabled={requesting}
          aria-label="Viví la experiencia (jugar ahora)"
          className="absolute left-[8%] right-[8%] bottom-[3%] h-[14%] rounded-full cursor-pointer bg-transparent hover:bg-red-500/20 active:bg-red-500/40 border border-transparent hover:border-red-500/40 transition-all focus:outline-none"
        />
      </div>
    </div>
  );
};

