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
      {/* Container strictly locked to 4:5 aspect ratio (1080x1350) with no letterbox on mobile or desktop */}
      <div className="relative w-[min(94vw,calc(92dvh*0.8))] aspect-[4/5] flex items-center justify-center">
        <img
          src="/imgs/title.png"
          alt="Escape From The Pibe Room"
          className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(220,38,38,0.35)] pointer-events-none select-none"
        />

        {/* Invisible button calibrated precisely over '▶ Viví la experiencia (jugar ahora)' */}
        <button
          type="button"
          onClick={handleStart}
          disabled={requesting}
          aria-label="Viví la experiencia (jugar ahora)"
          style={{
            left: '19.5%',
            width: '61%',
            top: '70.4%',
            height: '6.8%',
          }}
          className="absolute rounded-full cursor-pointer bg-transparent hover:bg-red-500/20 active:bg-red-500/40 hover:ring-2 hover:ring-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-[0.98] transition-all focus:outline-none touch-manipulation"
        />
      </div>
    </div>
  );
};


