/**
 * Victory Cinematic Video Modal (Final del Juego)
 * Plays the ending cinematic video (/videos/final.mp4) in full screen on mobile & desktop.
 */

import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Volume2, VolumeX, Play } from 'lucide-react';
import { horrorAudio } from '../audio/HorrorAudioManager';
import { getVictoryVideoUrl, preloadVictoryVideo } from '../utils/imagePreloader';

interface VictoryModalProps {
  timeElapsed: number; // in seconds
  onRestart: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  onRestart,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string>(getVictoryVideoUrl());
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasEnded, setHasEnded] = useState<boolean>(false);

  useEffect(() => {
    horrorAudio.stopAllSounds();

    // Ensure preloading is active and update videoUrl if blob URL completes
    preloadVictoryVideo().then((url) => {
      if (url && url !== videoUrl) {
        setVideoUrl(url);
      }
    });

    // Auto-play attempt on mount
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((err) => {
            console.warn('Autoplay prevented on mobile device:', err);
            setIsPlaying(false);
          });
      }
    }
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center w-screen h-[100dvh] overflow-hidden select-none font-mono">
      {/* Fullscreen Responsive Video Player with Preload */}
      <video
        ref={videoRef}
        src={videoUrl}
        preload="auto"
        autoPlay
        playsInline
        className="w-full h-full object-cover sm:object-contain bg-black cursor-pointer"
        onClick={togglePlay}
        onEnded={() => setHasEnded(true)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Tap to Play Overlay if mobile browser blocked unmuted autoplay */}
      {!isPlaying && !hasEnded && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-amber-200 cursor-pointer animate-in fade-in"
        >
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-4 shadow-[0_0_35px_rgba(251,191,36,0.6)]">
            <Play className="w-8 h-8 text-amber-300 ml-1" />
          </div>
          <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-300 px-4 text-center">
            TOCA PARA REPRODUCIR EL VIDEO FINAL
          </span>
        </div>
      )}

      {/* Top Mute/Unmute Control */}
      <div className="absolute top-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={toggleMute}
          className="p-2.5 rounded-full bg-stone-950/80 border border-stone-700/80 text-stone-300 hover:text-amber-300 active:scale-95 transition-all shadow-lg cursor-pointer"
          title={isMuted ? 'Activar sonido' : 'Silenciar'}
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-amber-400" />}
        </button>
      </div>

      {/* Bottom Floating Restart Action Button - HIDDEN UNTIL VIDEO ENDS */}
      {hasEnded && (
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-40 w-full max-w-xs sm:max-w-sm px-4 flex flex-col items-center pb-[env(safe-area-inset-bottom)] animate-in fade-in zoom-in-95 duration-500">
          <button
            onClick={onRestart}
            className="w-full py-3.5 px-6 rounded-xl bg-amber-950/95 hover:bg-amber-900 active:scale-95 border-2 border-amber-500/70 text-amber-200 font-bold text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all shadow-[0_0_50px_rgba(251,191,36,0.4)] cursor-pointer backdrop-blur-md"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            VOLVER A JUGAR // REINICIAR
          </button>
        </div>
      )}
    </div>
  );
};

