/**
 * Preloads all interface and game asset images into browser cache
 * to eliminate loading delays when user interacts with modals and items.
 */

export const GAME_IMAGES_TO_PRELOAD: string[] = [
  '/imgs/title.png',
  '/imgs/Puerta.png',
  '/imgs/inodoro.png',
  '/imgs/llave.png',
  '/imgs/nota.jpg',
  '/imgs/nota.png',
  '/imgs/papel.png',
  '/imgs/refrijerador_1.png',
  '/imgs/refrijerador_2.png',
  '/imgs/screamer.jpg',
  '/imgs/cerraduraBaño1.png',
  '/imgs/Elpibe_1.jpg',
  '/imgs/Elpibe_2.jpg',
  '/imgs/Elpibe_3.jpg',
  '/imgs/Elpibe_4.jpg',
  '/imgs/textura_madera1.jpg',
  '/imgs/textura_madera3.jpg',
  '/imgs/textura_madera4.jpg',
  '/imgs/textura_madera6.jpg',
];

const preloadedCache: HTMLImageElement[] = [];

export function preloadAllGameImages(): Promise<void[]> {
  const promises = GAME_IMAGES_TO_PRELOAD.map((src) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve();
      img.onerror = () => resolve(); // Resolve on error too so preloading doesn't block
      preloadedCache.push(img);
    });
  });

  return Promise.all(promises);
}
