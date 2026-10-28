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
      {/* Container locked to 4:5 aspect ratio (1080x1350) for maximum viewport size & exact alignment */}
      <div className="relative aspect-[4/5] h-[95vh] max-h-[96vh] max-w-[96vw] flex items-center justify-center">
        <img
          src="/imgs/title.png"
          alt="Escape From The Pibe Room"
          className="w-full h-full object-contain drop-shadow-[0_0_40px_rgba(220,38,38,0.35)] pointer-events-none select-none"
        />

        {/* Invisible button calibrated precisely over '▶ Viví la experiencia (jugar ahora)' (x: 20.2%-79.8%, y: 70.8%-77.0%) */}
        <button
          type="button"
          onClick={handleStart}
          disabled={requesting}
          aria-label="Viví la experiencia (jugar ahora)"
          style={{
            left: '20.2%',
            width: '59.6%',
            top: '70.8%',
            height: '6.2%',
          }}
          className="absolute rounded-full cursor-pointer bg-transparent hover:bg-red-500/20 active:bg-red-500/40 hover:ring-2 hover:ring-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-[0.98] transition-all focus:outline-none"
        />
      </div>
    </div>
  );
};


