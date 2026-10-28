/**
 * Main Door Inspection Modal (Puerta Principal Encadenada)
 * Renders ONLY the door PNG (/imgs/Puerta.png) with INVISIBLE clickable touch targets
 * over the text banners and padlocks in the image, preserving full visibility of the image text.
 */

import React, { useState } from 'react';
import { X, Lock, CheckCircle2, DoorOpen, Info } from 'lucide-react';
import { LockState, InventoryItem } from '../types/game';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { sensorManager } from '../sensors/SensorManager';

interface MainDoorModalProps {
  lockState: LockState;
  inventory: InventoryItem[];
  onOpenCodeLock: () => void;
  onOpenLetterLock: () => void;
  onOpenRustedCodeLock: () => void;
  onUseToiletKey: () => void;
  onEscapeSuccess: () => void;
  onClose: () => void;
}

export const MainDoorModal: React.FC<MainDoorModalProps> = ({
  lockState,
  inventory,
  onOpenCodeLock,
  onOpenLetterLock,
  onOpenRustedCodeLock,
  onUseToiletKey,
  onEscapeSuccess,
  onClose,
}) => {
  const [knockImpact, setKnockImpact] = useState(false);
  const [activeNotice, setActiveNotice] = useState<string | null>(null);
  const hasToiletKey = inventory.some((item) => item.id === 'key_toilet');

  const unlockedCount = [
    lockState.codeLock,
    lockState.fuseLock,
    lockState.toiletKeyLock,
    lockState.letterLock,
    lockState.rustedCodeLock,
  ].filter(Boolean).length;

  const allUnlocked = unlockedCount === 5;

  React.useEffect(() => {
    const unregister = horrorAudio.onDoorKnock(() => {
      setKnockImpact(true);
      setTimeout(() => setKnockImpact(false), 450);
    });
    return () => unregister();
  }, []);

  const handleUseToiletKey = () => {
    if (!hasToiletKey || lockState.toiletKeyLock) return;
    horrorAudio.playUnlockClick();
    sensorManager.vibrate([70, 50, 90]);
    onUseToiletKey();
    setActiveNotice('¡Pestillo de hierro abierto con la llave!');
  };

  const handleFuseLockClick = () => {
    if (lockState.fuseLock) {
      setActiveNotice('El cerrojo electromagnético ya está desenergizado.');
      return;
    }
    horrorAudio.playDoorKnocks(0.2);
    sensorManager.vibrate([40, 30, 40]);
    setActiveNotice('⚡ Candado Electrónico (220V): Desconéctalo desde la caja de fusibles en la cocina.');
  };

  const handleEscape = () => {
    if (!allUnlocked) return;
    horrorAudio.playDoorOpen();
    sensorManager.vibrate([100, 100, 200, 200]);
    onEscapeSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex flex-col items-center justify-center p-2 sm:p-4 select-none overflow-hidden">
      {/* Floating Close Button Top Right */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-40 px-3.5 py-2 rounded-full bg-stone-900/90 hover:bg-red-950 border border-stone-700 hover:border-red-600 text-stone-300 hover:text-white font-mono text-xs flex items-center gap-1.5 shadow-xl transition-all cursor-pointer backdrop-blur-md"
      >
        <X className="w-4 h-4" />
        <span>VOLVER AL CUARTO</span>
      </button>

      {/* Floating Status Indicator Top Left */}
      <div className="fixed top-4 left-4 z-40 px-3.5 py-2 rounded-full bg-stone-900/90 border border-stone-800 text-stone-300 font-mono text-xs flex items-center gap-2 shadow-xl backdrop-blur-md">
        <Lock className={`w-4 h-4 ${allUnlocked ? 'text-emerald-400' : 'text-amber-400'}`} />
        <span className="font-bold tracking-wider">
          {unlockedCount}/5 CANDADOS RETIRADOS
        </span>
      </div>

      {/* Knock Impact Banner */}
      {knockImpact && (
        <div className="fixed top-16 z-40 bg-red-950/90 border border-red-600 py-1.5 px-4 rounded-full text-xs font-mono text-red-300 font-bold tracking-widest animate-pulse shadow-2xl">
          ⚠️ ¡SE ESCUCHAN GOLPES VIOLENTOS EN LA PUERTA!
        </div>
      )}

      {/* Interactive Notice Bar */}
      {activeNotice && !knockImpact && (
        <div className="fixed top-16 z-40 bg-amber-950/90 border border-amber-600/80 py-1.5 px-4 rounded-full text-xs font-mono text-amber-200 font-semibold flex items-center gap-2 shadow-2xl animate-fadeIn backdrop-blur-md">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{activeNotice}</span>
          <button onClick={() => setActiveNotice(null)} className="ml-2 text-amber-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Pure Door PNG with INVISIBLE Clickable Overlays */}
      <div className="relative w-full max-w-5xl aspect-[16/9] flex items-center justify-center my-auto">
        <img
          src="/imgs/Puerta.png"
          alt="Puerta Principal"
          className={`w-full h-full object-contain pointer-events-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.95)] transition-transform duration-75 ${
            knockImpact ? 'scale-[1.015]' : ''
          }`}
        />

        {/* ------------------------------------------------------------- */}
        {/* INVISIBLE BUTTON 1: Top Left - 1. CANDADO DE COMBINACIÓN       */}
        {/* ------------------------------------------------------------- */}
        <div
          className="absolute flex items-center justify-center"
          style={{ top: '10%', left: '10.5%', width: '29.5%', height: '11.5%' }}
        >
          {lockState.codeLock ? (
            <div className="w-full h-full rounded-lg border border-emerald-500/80 bg-emerald-950/80 backdrop-blur-xs flex items-center justify-center gap-1.5 text-emerald-400 font-mono text-[10px] sm:text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>✓ ABIERTO</span>
            </div>
          ) : (
            <button
              onClick={onOpenCodeLock}
              title="1 - Candado de Combinación"
              className="w-full h-full rounded-lg bg-transparent hover:bg-amber-400/20 active:bg-amber-400/35 border border-transparent hover:border-amber-400/60 shadow-none hover:shadow-[0_0_15px_rgba(251,191,36,0.4)] transition-all cursor-pointer"
            />
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* INVISIBLE BUTTON 4: Top Right - 4. CANDADO DE 5 LETRAS        */}
        {/* ------------------------------------------------------------- */}
        <div
          className="absolute flex items-center justify-center"
          style={{ top: '10%', left: '66.5%', width: '28.5%', height: '11.5%' }}
        >
          {lockState.letterLock ? (
            <div className="w-full h-full rounded-lg border border-emerald-500/80 bg-emerald-950/80 backdrop-blur-xs flex items-center justify-center gap-1.5 text-emerald-400 font-mono text-[10px] sm:text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>✓ ABIERTO</span>
            </div>
          ) : (
            <button
              onClick={onOpenLetterLock}
              title="4 - Candado de 5 Letras"
              className="w-full h-full rounded-lg bg-transparent hover:bg-amber-400/20 active:bg-amber-400/35 border border-transparent hover:border-amber-400/60 shadow-none hover:shadow-[0_0_15px_rgba(251,191,36,0.4)] transition-all cursor-pointer"
            />
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* INVISIBLE BUTTON 3: Middle Right - 3. CANDADO OXIDADO          */}
        {/* ------------------------------------------------------------- */}
        <div
          className="absolute flex items-center justify-center"
          style={{ top: '40.5%', left: '72.5%', width: '26.5%', height: '11.5%' }}
        >
          {lockState.toiletKeyLock ? (
            <div className="w-full h-full rounded-lg border border-emerald-500/80 bg-emerald-950/80 backdrop-blur-xs flex items-center justify-center gap-1.5 text-emerald-400 font-mono text-[10px] sm:text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>✓ ABIERTO</span>
            </div>
          ) : (
            <button
              onClick={() => {
                if (hasToiletKey) {
                  handleUseToiletKey();
                } else {
                  setActiveNotice('🔑 Candado Oxidado: Necesitas una llave pesada de hierro.');
                }
              }}
              title="3 - Candado Oxidado"
              className="w-full h-full rounded-lg bg-transparent hover:bg-amber-400/20 active:bg-amber-400/35 border border-transparent hover:border-amber-400/60 shadow-none hover:shadow-[0_0_15px_rgba(251,191,36,0.4)] transition-all cursor-pointer"
            />
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* INVISIBLE BUTTON 5: Bottom Left - 5. CANDADO COMB. OXIDADO    */}
        {/* ------------------------------------------------------------- */}
        <div
          className="absolute flex items-center justify-center"
          style={{ top: '58%', left: '4%', width: '30.5%', height: '11.5%' }}
        >
          {lockState.rustedCodeLock ? (
            <div className="w-full h-full rounded-lg border border-emerald-500/80 bg-emerald-950/80 backdrop-blur-xs flex items-center justify-center gap-1.5 text-emerald-400 font-mono text-[10px] sm:text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>✓ ABIERTO</span>
            </div>
          ) : (
            <button
              onClick={onOpenRustedCodeLock}
              title="5 - Candado de Combinación Oxidado"
              className="w-full h-full rounded-lg bg-transparent hover:bg-amber-400/20 active:bg-amber-400/35 border border-transparent hover:border-amber-400/60 shadow-none hover:shadow-[0_0_15px_rgba(251,191,36,0.4)] transition-all cursor-pointer"
            />
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* INVISIBLE BUTTON 2: Bottom Right - 2. CANDADO ELECTRÓNICO     */}
        {/* ------------------------------------------------------------- */}
        <div
          className="absolute flex items-center justify-center"
          style={{ top: '71.5%', left: '65.5%', width: '28.5%', height: '11.5%' }}
        >
          {lockState.fuseLock ? (
            <div className="w-full h-full rounded-lg border border-emerald-500/80 bg-emerald-950/80 backdrop-blur-xs flex items-center justify-center gap-1.5 text-emerald-400 font-mono text-[10px] sm:text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.5)]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>✓ DESENERGIZADO</span>
            </div>
          ) : (
            <button
              onClick={handleFuseLockClick}
              title="2 - Candado Electrónico"
              className="w-full h-full rounded-lg bg-transparent hover:bg-amber-400/20 active:bg-amber-400/35 border border-transparent hover:border-amber-400/60 shadow-none hover:shadow-[0_0_15px_rgba(251,191,36,0.4)] transition-all cursor-pointer"
            />
          )}
        </div>

        {/* Invisible hotspots directly on padlocks in image */}
        <button
          onClick={() => (!lockState.codeLock ? onOpenCodeLock() : null)}
          title="1 - Candado de Combinación"
          style={{ top: '30%', left: '43.5%', width: '7%', height: '12%' }}
          className={`absolute rounded-full border border-dashed transition-all ${
            lockState.codeLock ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-transparent hover:border-amber-400/60 hover:bg-amber-400/20 cursor-pointer'
          }`}
        />
        <button
          onClick={() => (!lockState.letterLock ? onOpenLetterLock() : null)}
          title="4 - Candado de 5 Letras"
          style={{ top: '28%', left: '53.5%', width: '7%', height: '12%' }}
          className={`absolute rounded-full border border-dashed transition-all ${
            lockState.letterLock ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-transparent hover:border-amber-400/60 hover:bg-amber-400/20 cursor-pointer'
          }`}
        />
        <button
          onClick={() => (!lockState.rustedCodeLock ? onOpenRustedCodeLock() : null)}
          title="5 - Candado Combinación Oxidada"
          style={{ top: '49%', left: '42.5%', width: '7%', height: '12%' }}
          className={`absolute rounded-full border border-dashed transition-all ${
            lockState.rustedCodeLock ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-transparent hover:border-amber-400/60 hover:bg-amber-400/20 cursor-pointer'
          }`}
        />
        <button
          onClick={handleFuseLockClick}
          title="2 - Candado Electrónico"
          style={{ top: '45%', left: '55.5%', width: '6.5%', height: '15%' }}
          className={`absolute rounded-full border border-dashed transition-all ${
            lockState.fuseLock ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-transparent hover:border-amber-400/60 hover:bg-amber-400/20 cursor-pointer'
          }`}
        />
        <button
          onClick={() => (hasToiletKey && !lockState.toiletKeyLock ? handleUseToiletKey() : setActiveNotice('🔑 Candado Oxidado: Necesitas una llave pesada de hierro.'))}
          title="3 - Candado Oxidado"
          style={{ top: '44%', left: '61.5%', width: '4%', height: '8%' }}
          className={`absolute rounded-full border border-dashed transition-all ${
            lockState.toiletKeyLock ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-transparent hover:border-amber-400/60 hover:bg-amber-400/20 cursor-pointer'
          }`}
        />
      </div>

      {/* Floating Escape Button (When all 5 locks unlocked) */}
      {allUnlocked && (
        <button
          onClick={handleEscape}
          className="fixed bottom-6 z-40 px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-sm font-extrabold flex items-center gap-2.5 shadow-[0_0_30px_rgba(16,185,129,0.8)] animate-bounce transition-all cursor-pointer border border-emerald-400"
        >
          <DoorOpen className="w-6 h-6" />
          <span>¡ABRIR PUERTA Y ESCAPAR!</span>
        </button>
      )}
    </div>
  );
};
