/**
 * Procedural Texture Generator
 * Creates high-detail horror textures using HTML Canvas2D.
 * Guarantees zero broken external image dependencies and instant loading.
 */

import * as THREE from 'three';

export class TextureGenerator {
  /**
   * Peeling dirty wallpaper with water damage and grime
   */
  public static createWallpaperTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base decaying greenish-brown plaster
    ctx.fillStyle = '#262922';
    ctx.fillRect(0, 0, 512, 512);

    // Grunge pattern
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = Math.random() * 20;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(15, 18, 12, 0.08)' : 'rgba(55, 48, 32, 0.06)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Peeling wallpaper stripes / vintage pattern
    ctx.strokeStyle = 'rgba(45, 50, 38, 0.25)';
    ctx.lineWidth = 12;
    for (let x = 0; x < 512; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }

    // Dirt and water leaks coming from the top
    const grad = ctx.createLinearGradient(0, 0, 0, 300);
    grad.addColorStop(0, 'rgba(15, 12, 8, 0.6)');
    grad.addColorStop(0.4, 'rgba(25, 20, 14, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 300);

    // Cracks
    ctx.strokeStyle = 'rgba(10, 10, 10, 0.4)';
    ctx.lineWidth = 1.5;
    for (let c = 0; c < 5; c++) {
      let cx = Math.random() * 512;
      let cy = Math.random() * 300;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 6; s++) {
        cx += (Math.random() - 0.5) * 40;
        cy += Math.random() * 30;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 2);
    return texture;
  }

  /**
   * Weathered rustic wooden floor planks (matching user reference image)
   * - Rich amber/caramel wood with dark natural knots
   * - Peeling distressed sage/olive green paint flaking across grain ridges
   * - Rusted iron nails on plank edges and dark joint seams
   */
  public static createWoodFloorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base rich warm amber/caramel wood tone (like reference photo)
    ctx.fillStyle = '#874b1c';
    ctx.fillRect(0, 0, 1024, 1024);

    const plankCount = 6;
    const plankH = 1024 / plankCount;

    for (let p = 0; p < plankCount; p++) {
      const y = p * plankH;

      // Slight individual plank color tone variation
      const warmVar = (Math.random() - 0.5) * 20;
      const r = Math.min(255, Math.max(0, Math.floor(140 + warmVar)));
      const g = Math.min(255, Math.max(0, Math.floor(75 + warmVar * 0.7)));
      const b = Math.min(255, Math.max(0, Math.floor(28 + warmVar * 0.3)));
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(0, y, 1024, plankH - 4);

      // Fine wood grain lines (rippling horizontally)
      ctx.strokeStyle = 'rgba(70, 28, 8, 0.45)';
      ctx.lineWidth = 1.5;
      for (let gIdx = 0; gIdx < 35; gIdx++) {
        const gy = y + Math.random() * plankH;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(
          260, gy + (Math.random() - 0.5) * 8,
          740, gy + (Math.random() - 0.5) * 8,
          1024, gy
        );
        ctx.stroke();
      }

      // Darker rich burnt sienna streaks in grain
      ctx.strokeStyle = 'rgba(120, 48, 12, 0.35)';
      ctx.lineWidth = 2.5;
      for (let sIdx = 0; sIdx < 15; sIdx++) {
        const sy = y + Math.random() * plankH;
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(1024, sy + (Math.random() - 0.5) * 6);
        ctx.stroke();
      }

      // Prominent natural wood knots (circular rings with dark green/brown center, exactly as in image)
      if (p % 2 === 0 || Math.random() > 0.4) {
        const knotX = 180 + Math.random() * 650;
        const knotY = y + plankH * 0.5 + (Math.random() - 0.5) * (plankH * 0.3);
        const knotR = 25 + Math.random() * 30;

        // Concentric grain bending around knot
        for (let kr = knotR * 1.8; kr >= knotR * 0.4; kr -= 5) {
          ctx.strokeStyle = 'rgba(50, 20, 6, 0.55)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(knotX, knotY, kr * 1.3, kr, 0.1, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Dark center of the knot
        const knotGrad = ctx.createRadialGradient(knotX, knotY, 2, knotX, knotY, knotR * 0.6);
        knotGrad.addColorStop(0, '#1c2414'); // deep greenish-black center
        knotGrad.addColorStop(0.6, '#3a200e');
        knotGrad.addColorStop(1, '#663212');
        ctx.fillStyle = knotGrad;
        ctx.beginPath();
        ctx.arc(knotX, knotY, knotR * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Peeling distressed sage/olive green paint flaking across grain (distinctive feature from reference image)
      // Clings to the wood in patchy weathered horizontal bands
      for (let band = 0; band < 40; band++) {
        const px = Math.random() * 1024;
        const py = y + Math.random() * (plankH - 12);
        const pw = 40 + Math.random() * 140;
        const ph = 6 + Math.random() * 22;

        const greenTones = ['#62764b', '#7a8c5e', '#52643e', '#88986c', '#435431'];
        ctx.fillStyle = greenTones[Math.floor(Math.random() * greenTones.length)];
        ctx.globalAlpha = 0.55 + Math.random() * 0.35;

        // Ragged flaking paint patch
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + pw * 0.6, py + (Math.random() - 0.5) * 4);
        ctx.lineTo(px + pw, py + ph * 0.4);
        ctx.lineTo(px + pw * 0.8, py + ph);
        ctx.lineTo(px + pw * 0.2, py + ph * 0.9);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 1.0;
      }

      // Weathered wood micro-crack striations over green paint
      ctx.strokeStyle = 'rgba(40, 16, 5, 0.4)';
      ctx.lineWidth = 1;
      for (let c = 0; c < 20; c++) {
        const cx = Math.random() * 950;
        const cy = y + Math.random() * plankH;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 30 + Math.random() * 50, cy);
        ctx.stroke();
      }

      // Rusted iron square-head nails near left & right edges (like in photo)
      const nailMatPositions = [25, 45, 980, 1000];
      nailMatPositions.forEach((nx) => {
        const ny = y + 16 + (p % 2 === 0 ? 8 : -4);
        // Rust stain halo
        const halo = ctx.createRadialGradient(nx, ny, 1, nx, ny, 10);
        halo.addColorStop(0, 'rgba(80, 25, 8, 0.65)');
        halo.addColorStop(1, 'rgba(80, 25, 8, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(nx, ny, 10, 0, Math.PI * 2);
        ctx.fill();

        // Dark iron nail head
        ctx.fillStyle = '#18120c';
        ctx.fillRect(nx - 3, ny - 3, 6, 6);
      });

      // Deep dark recessed plank gap / shadow
      ctx.fillStyle = '#0a0604';
      ctx.fillRect(0, y + plankH - 4, 1024, 4);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 9);
    return texture;
  }

  /**
   * Blood-red frantic graffiti: "NO MIRES ATRÁS"
   */
  public static createGraffitiTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 512, 256);

    const subtext = '15 MINUTOS... EL PIBE YA VIENE';
    const mainText = 'NO MIRES ATRÁS';

    // Measure subtext width
    ctx.font = '20px "JetBrains Mono", monospace';
    const targetWidth = ctx.measureText(subtext).width;

    // Scale main text to have the exact same width as the subtext
    let mainFontSize = 40;
    ctx.font = `bold ${mainFontSize}px "Creepster", cursive, "Impact", sans-serif`;
    const initialMainWidth = ctx.measureText(mainText).width;
    if (initialMainWidth > 0) {
      mainFontSize = Math.round(mainFontSize * (targetWidth / initialMainWidth));
      ctx.font = `bold ${mainFontSize}px "Creepster", cursive, "Impact", sans-serif`;
    }

    ctx.textAlign = 'center';

    // Main text: "NO MIRES ATRÁS" (same width as subtext, no blood drips)
    ctx.fillStyle = '#8a0d0d';
    ctx.shadowColor = '#420404';
    ctx.shadowBlur = 8;
    ctx.fillText(mainText, 256, 100);

    // Subtext: "15 MINUTOS... EL PIBE YA VIENE" (no tally day marks)
    ctx.font = '20px "JetBrains Mono", monospace';
    ctx.fillStyle = '#a62424';
    ctx.shadowBlur = 4;
    ctx.fillText(subtext, 256, 175);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Room 302 Silent Hill 4 reference style chained door texture:
   * Peeling off-white paint, two recessed beveled panels,
   * bloody scrawled "Don't go out!! Walter", deadbolt latch plate,
   * and chain scrape marks.
   */
  public static createDoorTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d')!;

    // 1. Base decaying yellowed off-white / plaster paint
    ctx.fillStyle = '#b8aa94';
    ctx.fillRect(0, 0, 1024, 2048);

    // Grunge & mottled dirt layer
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 2048;
      const r = Math.random() * 25;
      ctx.fillStyle = Math.random() > 0.6
        ? 'rgba(40, 28, 18, 0.08)'
        : Math.random() > 0.3
        ? 'rgba(80, 50, 25, 0.05)'
        : 'rgba(20, 15, 10, 0.06)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Heavy rust and grime wash from top & edges
    const topGrime = ctx.createLinearGradient(0, 0, 0, 600);
    topGrime.addColorStop(0, 'rgba(45, 25, 12, 0.85)');
    topGrime.addColorStop(0.3, 'rgba(65, 40, 20, 0.5)');
    topGrime.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topGrime;
    ctx.fillRect(0, 0, 1024, 600);

    const bottomGrime = ctx.createLinearGradient(0, 1600, 0, 2048);
    bottomGrime.addColorStop(0, 'rgba(0, 0, 0, 0)');
    bottomGrime.addColorStop(0.7, 'rgba(30, 20, 12, 0.6)');
    bottomGrime.addColorStop(1, 'rgba(15, 8, 4, 0.95)');
    ctx.fillStyle = bottomGrime;
    ctx.fillRect(0, 1600, 1024, 448);

    // 3. Recessed Panels (Upper & Lower)
    const drawRecessedPanel = (x: number, y: number, w: number, h: number) => {
      // Outer shadow bevel (top and left dark, bottom and right highlight)
      ctx.fillStyle = 'rgba(25, 15, 8, 0.65)';
      ctx.fillRect(x - 12, y - 12, w + 24, 16); // top outer shadow
      ctx.fillRect(x - 12, y - 12, 16, h + 24); // left outer shadow

      ctx.fillStyle = 'rgba(240, 230, 215, 0.25)';
      ctx.fillRect(x - 12, y + h - 4, w + 24, 16); // bottom outer rim
      ctx.fillRect(x + w - 4, y - 12, 16, h + 24); // right outer rim

      // Panel background (slightly darker, peeling)
      ctx.fillStyle = '#9e8f7a';
      ctx.fillRect(x, y, w, h);

      // Inner shadow
      const innerShadow = ctx.createLinearGradient(x, y, x, y + 100);
      innerShadow.addColorStop(0, 'rgba(15, 8, 4, 0.7)');
      innerShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = innerShadow;
      ctx.fillRect(x, y, w, 100);

      // Inner left shadow
      const innerLeftShadow = ctx.createLinearGradient(x, y, x + 80, y);
      innerLeftShadow.addColorStop(0, 'rgba(15, 8, 4, 0.6)');
      innerLeftShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = innerLeftShadow;
      ctx.fillRect(x, y, 80, h);

      // Peeling paint patches exposing raw dark wood/rust inside panel
      for (let p = 0; p < 8; p++) {
        const px = x + 30 + Math.random() * (w - 120);
        const py = y + 30 + Math.random() * (h - 120);
        const pw = 40 + Math.random() * 90;
        const ph = 30 + Math.random() * 80;

        ctx.fillStyle = 'rgba(40, 22, 12, 0.85)';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + pw, py + (Math.random() - 0.5) * 15);
        ctx.lineTo(px + pw - 10, py + ph);
        ctx.lineTo(px + 10, py + ph + 8);
        ctx.closePath();
        ctx.fill();

        // Edge curl highlight
        ctx.strokeStyle = 'rgba(230, 215, 190, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    // Upper recessed panel (Y: 160 to 860)
    drawRecessedPanel(120, 160, 784, 700);

    // Lower recessed panel (Y: 1140 to 1880)
    drawRecessedPanel(120, 1140, 784, 740);

    // 4. Center Peephole (Y: 960)
    const peepholeY = 960;
    // Outer brass trim
    ctx.fillStyle = '#614922';
    ctx.beginPath();
    ctx.arc(512, peepholeY, 36, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#c29b47';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(512, peepholeY, 32, 0, Math.PI * 2);
    ctx.stroke();

    // Dark peephole glass lens
    ctx.fillStyle = '#060608';
    ctx.beginPath();
    ctx.arc(512, peepholeY, 24, 0, Math.PI * 2);
    ctx.fill();

    // Lens glare reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(504, peepholeY - 8, 8, 0, Math.PI * 2);
    ctx.fill();

    // 5. Scrawled Blood Message under Peephole: "Don't go out!!" and "Walter"
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = 'bold 44px "Creepster", cursive, "Comic Sans MS", cursive, sans-serif';
    ctx.fillStyle = '#8f0d0d';
    ctx.shadowColor = '#380404';
    ctx.shadowBlur = 6;
    ctx.fillText("Don't go Out!!", 512, 1040);

    // Secondary line: "Walter" (and subtle "El Pibe")
    ctx.font = 'italic bold 28px serif';
    ctx.fillStyle = '#7a0b0b';
    ctx.fillText('Walter', 512, 1085);

    // Blood drips from letters
    ctx.strokeStyle = '#800a0a';
    ctx.lineWidth = 3;
    const dripPositions = [385, 450, 520, 590, 640];
    dripPositions.forEach((dx) => {
      ctx.beginPath();
      ctx.moveTo(dx, 1040);
      ctx.lineTo(dx + (Math.random() - 0.5) * 6, 1040 + 20 + Math.random() * 35);
      ctx.stroke();
    });
    ctx.restore();

    // 6. Deadbolt latch plate on the right middle edge
    ctx.fillStyle = '#2b2a29';
    ctx.fillRect(860, 930, 90, 48);
    ctx.strokeStyle = '#4a4845';
    ctx.lineWidth = 3;
    ctx.strokeRect(860, 930, 90, 48);

    // Screws in latch plate
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(875, 954, 4, 0, Math.PI * 2);
    ctx.arc(935, 954, 4, 0, Math.PI * 2);
    ctx.fill();

    // 7. Chain Scrape Marks & Rust Abrasions across the door
    // Diagonal scrape where chains rub
    ctx.strokeStyle = 'rgba(30, 18, 10, 0.45)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(80, 780);
    ctx.lineTo(950, 1250);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(80, 920);
    ctx.lineTo(950, 880);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(80, 1500);
    ctx.lineTo(950, 1420);
    ctx.stroke();

    // Metallic silver friction streaks in center of scrapes
    ctx.strokeStyle = 'rgba(180, 175, 170, 0.15)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(90, 785);
    ctx.lineTo(940, 1245);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  /**
   * Heavy rusted cast steel bracket plate texture for the wall/door anchors
   */
  public static createRustedBracketTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Dark pitted cast iron
    ctx.fillStyle = '#2b2824';
    ctx.fillRect(0, 0, 256, 256);

    // Rust specks and corrosion
    for (let i = 0; i < 1500; i++) {
      const rx = Math.random() * 256;
      const ry = Math.random() * 256;
      ctx.fillStyle = Math.random() > 0.4 ? 'rgba(92, 45, 18, 0.4)' : 'rgba(30, 20, 15, 0.5)';
      ctx.beginPath();
      ctx.arc(rx, ry, Math.random() * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Heavy beveled plate edge
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, 244, 244);

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = 6;
    ctx.strokeRect(14, 14, 228, 228);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  /**
   * Retro 1950s/60s Mint-Cream Refrigerator Texture (matching user reference image)
   * Pale distressed sage/mint-cream enamel with rounded corner highlights,
   * vintage chrome handle, rust streaks from hinges, and attached clue note.
   */
  public static createRottenFridgeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext('2d')!;

    // 1. Base vintage 1950s pale sage / mint-cream enamel (matching photo)
    const baseGrad = ctx.createLinearGradient(0, 0, 512, 768);
    baseGrad.addColorStop(0, '#c7d3c4');
    baseGrad.addColorStop(0.5, '#b9c7b5');
    baseGrad.addColorStop(1, '#a6b5a1');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 512, 768);

    // Weathered enamel grime and discoloration mottling
    for (let i = 0; i < 2200; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 768;
      const rad = 2 + Math.random() * 16;
      ctx.fillStyle = Math.random() > 0.6
        ? 'rgba(75, 85, 70, 0.08)'
        : Math.random() > 0.3
        ? 'rgba(120, 95, 60, 0.05)'
        : 'rgba(50, 40, 30, 0.06)';
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rounded corner edge shading for authentic vintage curvature
    const edgeShadeL = ctx.createLinearGradient(0, 0, 40, 0);
    edgeShadeL.addColorStop(0, 'rgba(40, 50, 38, 0.55)');
    edgeShadeL.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = edgeShadeL;
    ctx.fillRect(0, 0, 40, 768);

    const edgeShadeR = ctx.createLinearGradient(512, 0, 472, 0);
    edgeShadeR.addColorStop(0, 'rgba(40, 50, 38, 0.45)');
    edgeShadeR.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = edgeShadeR;
    ctx.fillRect(472, 0, 40, 768);

    // Top crown rounded highlight
    const topHighlight = ctx.createLinearGradient(0, 0, 0, 35);
    topHighlight.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    topHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = topHighlight;
    ctx.fillRect(0, 0, 512, 35);

    // 2. Freezer compartment horizontal seam (Y = 220)
    ctx.fillStyle = '#1c221a';
    ctx.fillRect(10, 218, 492, 6);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(10, 224, 492, 2);

    // Dark rubber gasket shadow
    ctx.fillStyle = 'rgba(10, 15, 10, 0.4)';
    ctx.fillRect(15, 214, 482, 4);

    // 3. Vintage Refrigerator Chrome Brand Badge ("KELVINATOR / FRIGIDAIRE" style)
    ctx.fillStyle = '#d0d8dc';
    ctx.fillRect(216, 65, 80, 16);
    ctx.strokeStyle = '#3a444a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(216, 65, 80, 16);
    ctx.fillStyle = '#1e282d';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FRIGIDAIRE', 256, 77);

    // 4. Vintage Chrome Heavy Latch Handle (with keyhole lock)
    // Vertical mounting plate
    ctx.fillStyle = '#8f9a9e';
    ctx.fillRect(48, 250, 26, 170);
    // Metallic chrome highlight
    const chromeGrad = ctx.createLinearGradient(48, 0, 74, 0);
    chromeGrad.addColorStop(0, '#5a6266');
    chromeGrad.addColorStop(0.35, '#d6e0e4');
    chromeGrad.addColorStop(0.7, '#8f9a9e');
    chromeGrad.addColorStop(1, '#444a4e');
    ctx.fillStyle = chromeGrad;
    ctx.fillRect(50, 252, 22, 166);

    // Latch lever arm
    ctx.fillStyle = '#b0bcc2';
    ctx.fillRect(66, 310, 36, 16);
    ctx.strokeStyle = '#22282c';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(66, 310, 36, 16);

    // Chrome handle screw bolts
    ctx.fillStyle = '#2a3236';
    ctx.beginPath();
    ctx.arc(61, 266, 3.5, 0, Math.PI * 2);
    ctx.arc(61, 404, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 5. Heavy Rust streaks trailing down from latch handle and bottom seams (from photo)
    const rustDrips = [52, 64, 88, 120, 210, 380, 460];
    rustDrips.forEach((rx) => {
      const startY = 220 + Math.random() * 60;
      const dripLen = 80 + Math.random() * 200;
      const dripGrad = ctx.createLinearGradient(rx, startY, rx, startY + dripLen);
      dripGrad.addColorStop(0, 'rgba(110, 48, 18, 0.75)');
      dripGrad.addColorStop(0.4, 'rgba(85, 38, 14, 0.45)');
      dripGrad.addColorStop(1, 'rgba(50, 20, 8, 0)');
      ctx.fillStyle = dripGrad;
      ctx.fillRect(rx - 2, startY, 5, dripLen);
    });

    // Heavy corroded bottom rust apron (matching photo)
    const bottomRust = ctx.createLinearGradient(0, 600, 0, 768);
    bottomRust.addColorStop(0, 'rgba(70, 32, 12, 0)');
    bottomRust.addColorStop(0.3, 'rgba(105, 45, 16, 0.65)');
    bottomRust.addColorStop(0.8, 'rgba(65, 24, 8, 0.92)');
    bottomRust.addColorStop(1, 'rgba(30, 10, 4, 0.98)');
    ctx.fillStyle = bottomRust;
    ctx.fillRect(0, 600, 512, 168);

    // Flaking rust blisters
    for (let b = 0; b < 120; b++) {
      const bx = Math.random() * 512;
      const by = 620 + Math.random() * 140;
      ctx.fillStyle = Math.random() > 0.5 ? '#421a08' : '#732e10';
      ctx.beginPath();
      ctx.arc(bx, by, 1 + Math.random() * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 6. Yellowed Clue Note taped to the door: "HAY ALGO EN EL CONGELADOR"
    ctx.save();
    ctx.translate(210, 340);
    ctx.rotate(0.06);

    // Drop shadow
    ctx.fillStyle = 'rgba(20, 25, 18, 0.4)';
    ctx.fillRect(3, 3, 140, 105);

    // Weathered paper
    ctx.fillStyle = '#b8aa62';
    ctx.fillRect(0, 0, 140, 105);

    // Cellophane tape strip at top
    ctx.fillStyle = 'rgba(240, 235, 200, 0.45)';
    ctx.fillRect(45, -8, 50, 18);

    // Handwritten message
    ctx.fillStyle = '#1c1608';
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('LLAVE OXIDADA', 12, 32);
    ctx.fillText('ADENTRO...', 12, 54);
    ctx.font = 'italic 11px sans-serif';
    ctx.fillStyle = '#4a1212';
    ctx.fillText('(NO COMER)', 12, 78);

    ctx.restore();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Weathered Rustic Dark Dining Tabletop Texture (matching user reference image)
   * Deep aged walnut wood planks with worn varnish, grease stains, knife scratches, and ring marks.
   */
  public static createRusticDiningTableTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base rich dark aged timber tone (like reference photo)
    ctx.fillStyle = '#2e2016';
    ctx.fillRect(0, 0, 1024, 1024);

    const plankCount = 5;
    const plankH = 1024 / plankCount;

    for (let p = 0; p < plankCount; p++) {
      const y = p * plankH;

      // Subtle plank variation
      const v = (Math.random() - 0.5) * 16;
      ctx.fillStyle = `rgb(${46 + v}, ${32 + v * 0.7}, ${22 + v * 0.5})`;
      ctx.fillRect(0, y, 1024, plankH - 3);

      // Fine longitudinal wood grain
      ctx.strokeStyle = 'rgba(20, 12, 8, 0.45)';
      ctx.lineWidth = 1.6;
      for (let g = 0; g < 40; g++) {
        const gy = y + Math.random() * plankH;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(340, gy + (Math.random() - 0.5) * 6, 680, gy + (Math.random() - 0.5) * 6, 1024, gy);
        ctx.stroke();
      }

      // Worn lighter grain ridges
      ctx.strokeStyle = 'rgba(70, 50, 36, 0.3)';
      ctx.lineWidth = 1.2;
      for (let g = 0; g < 20; g++) {
        const gy = y + Math.random() * plankH;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(1024, gy);
        ctx.stroke();
      }

      // Plank gap shadow
      ctx.fillStyle = '#0f0a07';
      ctx.fillRect(0, y + plankH - 3, 1024, 3);
    }

    // Water rings and old cup stains (characteristic of old dining table in photo)
    for (let r = 0; r < 4; r++) {
      const rx = 200 + Math.random() * 624;
      const ry = 150 + Math.random() * 724;
      const rad = 25 + Math.random() * 15;
      ctx.strokeStyle = 'rgba(16, 10, 6, 0.4)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Scratches and fork marks
    ctx.strokeStyle = 'rgba(90, 65, 45, 0.4)';
    ctx.lineWidth = 1.2;
    for (let s = 0; s < 30; s++) {
      const sx = Math.random() * 1024;
      const sy = Math.random() * 1024;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (Math.random() - 0.5) * 50, sy + (Math.random() - 0.5) * 20);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Distressed Kitchen Credenza / Countertop Texture (matching user reference image)
   * Chipped pale cream/mint paint over aged wood, drawer divisions, and grease patina.
   */
  public static createKitchenCredenzaTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Distressed antique cream-white paint
    ctx.fillStyle = '#ded9cc';
    ctx.fillRect(0, 0, 512, 512);

    // Weathered wood grain peeking through chipped paint
    for (let i = 0; i < 1500; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(70, 55, 38, 0.08)' : 'rgba(190, 180, 160, 0.15)';
      ctx.fillRect(rx, ry, 2 + Math.random() * 4, 1);
    }

    // 3 Drawer front sections (horizontal divisions)
    for (let d = 0; d < 3; d++) {
      const dy = 30 + d * 140;
      // Recessed bevel
      ctx.strokeStyle = '#5a5245';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, dy, 452, 115);
      // Chipped paint corner accents
      ctx.fillStyle = '#403020';
      ctx.fillRect(28, dy + 20, 5, 25);
      ctx.fillRect(478, dy + 60, 6, 20);

      // Brass cup pull handle in center of drawer
      const hx = 256;
      const hy = dy + 57;
      ctx.fillStyle = '#6e5a32';
      ctx.beginPath();
      ctx.arc(hx, hy, 18, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#382a14';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Grease & grime wash near bottom
    const bottomGrime = ctx.createLinearGradient(0, 420, 0, 512);
    bottomGrime.addColorStop(0, 'rgba(40, 30, 20, 0)');
    bottomGrime.addColorStop(1, 'rgba(35, 25, 15, 0.6)');
    ctx.fillStyle = bottomGrime;
    ctx.fillRect(0, 420, 512, 92);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Retro 1970s Countertop Microwave / Appliance Texture (matching user reference image)
   */
  public static createRetroMicrowaveTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 340;
    const ctx = canvas.getContext('2d')!;

    // Outer off-white retro steel casing
    ctx.fillStyle = '#d5cebe';
    ctx.fillRect(0, 0, 512, 340);

    // Left: Smoked dark glass oven door
    ctx.fillStyle = '#16191c';
    ctx.fillRect(24, 24, 330, 292);

    // Interior grill mesh pattern behind glass
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 32; x < 346; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x, 32);
      ctx.lineTo(x, 308);
      ctx.stroke();
    }
    for (let y = 32; y < 308; y += 8) {
      ctx.beginPath();
      ctx.moveTo(32, y);
      ctx.lineTo(346, y);
      ctx.stroke();
    }

    // Chrome frame around door
    ctx.strokeStyle = '#9ea8af';
    ctx.lineWidth = 4;
    ctx.strokeRect(24, 24, 330, 292);

    // Right: Control Panel
    ctx.fillStyle = '#282b30';
    ctx.fillRect(372, 24, 116, 292);

    // Analog rotary dials
    for (let i = 0; i < 2; i++) {
      const dy = 90 + i * 90;
      // Chrome dial rim
      ctx.fillStyle = '#8f9a9e';
      ctx.beginPath();
      ctx.arc(430, dy, 26, 0, Math.PI * 2);
      ctx.fill();
      // Dial knob center
      ctx.fillStyle = '#1c2024';
      ctx.beginPath();
      ctx.arc(430, dy, 20, 0, Math.PI * 2);
      ctx.fill();
      // Indicator notch
      ctx.fillStyle = '#dbe4e8';
      ctx.fillRect(428, dy - 18, 4, 12);
    }

    // Ventilation louvers at bottom
    ctx.fillStyle = '#111416';
    for (let v = 0; v < 6; v++) {
      ctx.fillRect(384, 265 + v * 7, 92, 3);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Distressed Galvanized Steel Utility Cart Texture (matching user reference image)
   */
  public static createUtilityCartTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Galvanized sheet steel base
    ctx.fillStyle = '#5c6366';
    ctx.fillRect(0, 0, 512, 512);

    // Mottled oxidation and zinc spangles
    for (let i = 0; i < 3000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.fillStyle = Math.random() > 0.6
        ? 'rgba(160, 175, 180, 0.12)'
        : Math.random() > 0.3
        ? 'rgba(40, 48, 52, 0.15)'
        : 'rgba(95, 60, 30, 0.08)';
      ctx.fillRect(x, y, 4 + Math.random() * 8, 3 + Math.random() * 6);
    }

    // Rust specks along rim edges
    for (let r = 0; r < 250; r++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      ctx.fillStyle = 'rgba(105, 45, 15, 0.35)';
      ctx.beginPath();
      ctx.arc(rx, ry, 1 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Weathered Wooden Venetian Blinds Texture (matching user reference image)
   */
  public static createVenetianBlindsTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dark window opening backdrop
    ctx.fillStyle = '#0a0d10';
    ctx.fillRect(0, 0, 512, 512);

    // Horizontal wooden slats with dust and angled tilt
    const slatCount = 28;
    const slatH = 512 / slatCount;

    for (let s = 0; s < slatCount; s++) {
      const y = s * slatH;
      // Crooked/broken slats like in photo
      const tilt = (s === 12 || s === 13 || s === 18) ? (Math.random() - 0.5) * 8 : 0;

      // Wood slat tone
      ctx.fillStyle = s % 2 === 0 ? '#584938' : '#4b3e30';
      ctx.fillRect(15, y + 2 + tilt, 482, slatH - 5);

      // Top edge highlight (slat catching sunlight)
      ctx.fillStyle = 'rgba(235, 220, 190, 0.35)';
      ctx.fillRect(15, y + 2 + tilt, 482, 2);

      // Bottom shadow
      ctx.fillStyle = 'rgba(10, 8, 6, 0.7)';
      ctx.fillRect(15, y + slatH - 4 + tilt, 482, 3);
    }

    // Vertical blind ladder cords
    ctx.strokeStyle = '#c4b89c';
    ctx.lineWidth = 2.5;
    [130, 382].forEach((cordX) => {
      ctx.beginPath();
      ctx.moveTo(cordX, 0);
      ctx.lineTo(cordX, 512);
      ctx.stroke();
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  /**
   * Wall Calendar texture displaying the year "1986" clue
   */
  public static createCalendarTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 320;
    const ctx = canvas.getContext('2d')!;

    // Yellowed vintage paper
    ctx.fillStyle = '#968c72';
    ctx.fillRect(0, 0, 256, 320);

    // Header bar
    ctx.fillStyle = '#612424';
    ctx.fillRect(0, 0, 256, 60);

    ctx.fillStyle = '#f0eae1';
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('AÑO 1986', 128, 42);

    // Month title
    ctx.fillStyle = '#3a3427';
    ctx.font = 'bold 14px "JetBrains Mono", monospace';
    ctx.fillText('OCTUBRE', 128, 92);

    // Days of week header
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#5c5240';
    const dayHeaders = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
    dayHeaders.forEach((dh, i) => {
      ctx.fillText(dh, 36 + i * 29, 118);
    });

    // Calendar day numbers grid (October 1986 started on Wednesday)
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#40382b';
    let dayNum = 1;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 7; col++) {
        if (row === 0 && col < 3) continue;
        if (dayNum <= 31) {
          ctx.fillText(dayNum.toString(), 36 + col * 29, 145 + row * 26);
          dayNum++;
        }
      }
    }

    // Red text at bottom scaled to exactly 75% of the calendar width, without shadow, drips or stains
    ctx.save();
    const textMsg = 'NUNCA ESCAPARÁS';
    const targetWidth = canvas.width * 0.75; // 75% of full width (192px)
    let fontSize = 20;
    ctx.font = `bold ${fontSize}px "Creepster", cursive, "Impact", sans-serif`;
    const measuredWidth = ctx.measureText(textMsg).width;
    if (measuredWidth > 0) {
      fontSize = Math.round(fontSize * (targetWidth / measuredWidth));
      ctx.font = `bold ${fontSize}px "Creepster", cursive, "Impact", sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#9e1212';
    ctx.fillText(textMsg, 128, 298);
    ctx.restore();

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Decaying moldy bathroom tile texture (East room bathroom)
   */
  public static createBathroomTileTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base dirty porcelain / sickly cyan-gray
    ctx.fillStyle = '#2a3b38';
    ctx.fillRect(0, 0, 512, 512);

    const tileSize = 64;
    for (let x = 0; x < 512; x += tileSize) {
      for (let y = 0; y < 512; y += tileSize) {
        // Tile gradient
        const tGrad = ctx.createLinearGradient(x, y, x + tileSize, y + tileSize);
        const hueVar = (Math.sin(x * 0.1) + Math.cos(y * 0.1)) * 10;
        tGrad.addColorStop(0, `rgb(${45 + hueVar}, ${65 + hueVar}, ${62 + hueVar})`);
        tGrad.addColorStop(1, `rgb(${30 + hueVar}, ${48 + hueVar}, ${45 + hueVar})`);
        ctx.fillStyle = tGrad;
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

        // Mold & water stain splatter on some tiles
        if (Math.random() > 0.6) {
          ctx.fillStyle = 'rgba(15, 30, 25, 0.45)';
          ctx.beginPath();
          ctx.arc(x + tileSize * 0.5, y + tileSize * 0.5, Math.random() * 20 + 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Dark dirty moldy grout grid
    ctx.strokeStyle = '#0e1715';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 512; i += tileSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    // Dripping vertical dark sludge streaks
    for (let s = 0; s < 8; s++) {
      const sx = Math.random() * 512;
      const sGrad = ctx.createLinearGradient(sx, 0, sx, 400);
      sGrad.addColorStop(0, 'rgba(10, 20, 15, 0.8)');
      sGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sGrad;
      ctx.fillRect(sx, 0, Math.random() * 14 + 6, 400);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  /**
   * Broken wall tile displaying carved code "MORIR"
   */
  public static createBrokenTileTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Cracked tile background
    ctx.fillStyle = '#1c2825';
    ctx.fillRect(0, 0, 512, 512);

    // Surrounding intact tile borders
    ctx.strokeStyle = '#0e1715';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 504, 504);

    // Deep jagged broken recess in plaster
    ctx.fillStyle = '#080808';
    ctx.beginPath();
    ctx.moveTo(60, 80);
    ctx.lineTo(440, 60);
    ctx.lineTo(470, 360);
    ctx.lineTo(380, 450);
    ctx.lineTo(120, 460);
    ctx.lineTo(50, 280);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#351818';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Jagged cracks spreading
    ctx.strokeStyle = '#111816';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(60, 80); ctx.lineTo(10, 10);
    ctx.moveTo(440, 60); ctx.lineTo(500, 20);
    ctx.moveTo(380, 450); ctx.lineTo(480, 500);
    ctx.moveTo(120, 460); ctx.lineTo(20, 500);
    ctx.stroke();

    // Bloody, desperate fingernail carving: "M O R I R"
    ctx.fillStyle = '#ba1e1e';
    ctx.font = 'bold 52px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 12;
    ctx.fillText('M O R I R', 256, 260);

    // Blood drips down from the letters
    ctx.fillStyle = '#800e0e';
    ctx.shadowBlur = 0;
    for (let d = 0; d < 5; d++) {
      const dx = 130 + d * 64;
      ctx.fillRect(dx, 275, 4, Math.random() * 50 + 20);
    }

    ctx.font = 'italic 16px sans-serif';
    ctx.fillStyle = '#6e5e5e';
    ctx.fillText('(CÓDIGO DE 5 LETRAS)', 256, 340);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * White Square Ceramic Tiles matching the photo reference
   * Dirty off-white porcelain, dark dirty grout, mold, water leaks, and crawling roaches
   */
  public static createWhiteTileTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base dirty wall
    ctx.fillStyle = '#22201d';
    ctx.fillRect(0, 0, 512, 512);

    const tileSize = 64; // 8x8 grid of square tiles
    for (let x = 0; x < 512; x += tileSize) {
      for (let y = 0; y < 512; y += tileSize) {
        // Individual tile shading (subtle variations in off-white / light beige)
        const shade = 210 + Math.floor((Math.sin(x * 12.3 + y * 7.1) + Math.cos(x * 3.4)) * 14);
        const redShade = Math.min(245, shade + 2);
        const greenShade = Math.min(240, shade);
        const blueShade = Math.max(180, shade - 10);

        ctx.fillStyle = `rgb(${redShade}, ${greenShade}, ${blueShade})`;
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

        // Dirty water smudge or mold on some tiles
        if (Math.random() > 0.5) {
          ctx.fillStyle = 'rgba(70, 60, 48, 0.18)';
          ctx.beginPath();
          ctx.arc(x + tileSize * (0.3 + Math.random() * 0.4), y + tileSize * (0.3 + Math.random() * 0.4), Math.random() * 14 + 6, 0, Math.PI * 2);
          ctx.fill();
        }

        // Small grime spots in tile corners
        ctx.fillStyle = 'rgba(30, 24, 18, 0.35)';
        ctx.fillRect(x + 2, y + 2, 6, 6);
      }
    }

    // Dark dirty grout lines
    ctx.strokeStyle = '#2b2722';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 512; i += tileSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
    }

    // Cockroach / insect silhouettes scattered on tiles (matching the reference photo!)
    const roachSpots = [
      { x: 95, y: 130, angle: 0.6 },
      { x: 260, y: 75, angle: -0.8 },
      { x: 395, y: 190, angle: 1.4 },
      { x: 180, y: 310, angle: -0.3 },
      { x: 440, y: 380, angle: 0.9 },
      { x: 110, y: 440, angle: -1.2 },
      { x: 320, y: 470, angle: 2.1 },
    ];

    roachSpots.forEach((r) => {
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.angle);

      // Body (oval)
      ctx.fillStyle = '#1c1008';
      ctx.beginPath();
      ctx.ellipse(0, 0, 5, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.beginPath();
      ctx.arc(0, -11, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Legs
      ctx.strokeStyle = '#180d06';
      ctx.lineWidth = 1.2;
      for (let leg = -1; leg <= 1; leg++) {
        // Left legs
        ctx.beginPath();
        ctx.moveTo(-4, leg * 6);
        ctx.lineTo(-12, leg * 7 - 2);
        ctx.stroke();
        // Right legs
        ctx.beginPath();
        ctx.moveTo(4, leg * 6);
        ctx.lineTo(12, leg * 7 - 2);
        ctx.stroke();
      }

      // Antennae
      ctx.beginPath();
      ctx.moveTo(-2, -13);
      ctx.lineTo(-9, -24);
      ctx.moveTo(2, -13);
      ctx.lineTo(9, -24);
      ctx.stroke();

      ctx.restore();
    });

    // Dark water drippings / streaks from ceiling
    for (let s = 0; s < 6; s++) {
      const sx = 60 + s * 75 + Math.random() * 20;
      const grad = ctx.createLinearGradient(sx, 0, sx, 320);
      grad.addColorStop(0, 'rgba(40, 32, 22, 0.7)');
      grad.addColorStop(0.6, 'rgba(60, 48, 35, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(sx, 0, 8, 320);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  /**
   * Vintage Black and White Mosaic Floor Tile (matching reference photo)
   */
  public static createBathroomFloorMosaicTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base dirty grout
    ctx.fillStyle = '#22201e';
    ctx.fillRect(0, 0, 512, 512);

    const step = 32;
    for (let x = 0; x < 512; x += step) {
      for (let y = 0; y < 512; y += step) {
        // White octagonal / square mosaic tile
        const isBlackDot = (x / step) % 2 === 0 && (y / step) % 2 === 0;

        if (isBlackDot) {
          // Small black accent dot
          ctx.fillStyle = '#141416';
          ctx.fillRect(x + 4, y + 4, step - 8, step - 8);
        } else {
          // Off-white mosaic tile with grunge
          const w = 215 + Math.floor((Math.random() - 0.5) * 16);
          ctx.fillStyle = `rgb(${w}, ${w - 4}, ${w - 10})`;
          ctx.fillRect(x + 2, y + 2, step - 4, step - 4);
        }
      }
    }

    // Water stains and muddy footsteps on the floor
    for (let p = 0; p < 8; p++) {
      ctx.fillStyle = 'rgba(25, 18, 12, 0.4)';
      ctx.beginPath();
      ctx.ellipse(
        Math.random() * 512,
        Math.random() * 512,
        30 + Math.random() * 50,
        20 + Math.random() * 30,
        Math.random() * Math.PI,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  /**
   * Water heater / Boiler label ("Postmeslip")
   */
  public static createWaterHeaterTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Enameled off-white metal
    ctx.fillStyle = '#dedacf';
    ctx.fillRect(0, 0, 512, 512);

    // Rust & grime stains
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = 'rgba(120, 80, 50, 0.05)';
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, Math.random() * 15, 0, Math.PI * 2);
      ctx.fill();
    }

    // Brand "Postmeslip" script on upper right (from reference photo)
    ctx.font = 'italic bold 28px sans-serif';
    ctx.fillStyle = '#3a3834';
    ctx.fillText('Postmeslip', 310, 110);

    // Temperature panel (black oval with dials)
    ctx.fillStyle = '#1c1c1e';
    ctx.beginPath();
    ctx.roundRect(380, 240, 75, 140, 20);
    ctx.fill();
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Two dial knobs
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(417, 280, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(417, 340, 18, 0, Math.PI * 2);
    ctx.fill();

    // Red LED
    ctx.fillStyle = '#ff2222';
    ctx.beginPath();
    ctx.arc(417, 252, 4, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  /**
   * Moldy shower curtain texture
   */
  public static createShowerCurtainTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dirty plastic translucent tone
    ctx.fillStyle = '#9c9a92';
    ctx.fillRect(0, 0, 512, 512);

    // Vertical curtain folds / shadow wrinkles
    for (let x = 0; x < 512; x += 32) {
      const grad = ctx.createLinearGradient(x, 0, x + 32, 0);
      grad.addColorStop(0, 'rgba(40, 40, 36, 0.6)');
      grad.addColorStop(0.5, 'rgba(180, 178, 170, 0.3)');
      grad.addColorStop(1, 'rgba(30, 30, 26, 0.7)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, 32, 512);
    }

    // Mildew and mold at the bottom
    const moldGrad = ctx.createLinearGradient(0, 300, 0, 512);
    moldGrad.addColorStop(0, 'rgba(20, 35, 25, 0.0)');
    moldGrad.addColorStop(0.7, 'rgba(25, 45, 30, 0.6)');
    moldGrad.addColorStop(1, 'rgba(15, 30, 20, 0.9)');
    ctx.fillStyle = moldGrad;
    ctx.fillRect(0, 300, 512, 212);

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Subtle broken tile texture that blends seamlessly with the white tiled wall
   * Realistic Broken Wall Tile Texture (Azulejo fisurado y descascarado natural)
   * Clearly visible crack fracture lines, chipped ceramic edge exposing dark void,
   * natural grime and moisture stains, NO artificial red markers or red squares.
   */
  public static createSubtleBrokenTileTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // 1. Base aged porcelain glaze (matching surrounding bathroom tiles)
    ctx.fillStyle = '#dcd7cb';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle glaze variation & grime gradient
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, 'rgba(245, 242, 235, 0.4)');
    grad.addColorStop(0.5, 'rgba(215, 208, 195, 0.2)');
    grad.addColorStop(1, 'rgba(165, 155, 140, 0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // 2. Dirty dark grout border around tile
    ctx.strokeStyle = '#231f1a';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, 502, 502);

    // 3. Mold & water seepage streaks spreading from edges and cracks
    ctx.fillStyle = 'rgba(45, 38, 28, 0.28)';
    ctx.beginPath();
    ctx.moveTo(120, 10);
    ctx.bezierCurveTo(140, 100, 110, 180, 160, 290);
    ctx.lineTo(210, 310);
    ctx.bezierCurveTo(170, 200, 180, 100, 150, 10);
    ctx.closePath();
    ctx.fill();

    // 4. Exposed broken hollow gap / missing shard in the bottom-right corner
    // Dark void/plaster cavity where the tile is broken and loosened
    ctx.fillStyle = '#14110e';
    ctx.beginPath();
    ctx.moveTo(340, 506);
    ctx.lineTo(390, 440);
    ctx.lineTo(440, 460);
    ctx.lineTo(460, 410);
    ctx.lineTo(506, 360);
    ctx.lineTo(506, 506);
    ctx.closePath();
    ctx.fill();

    // Rough plaster rubble inside the gap
    ctx.fillStyle = '#2a241c';
    for (let p = 0; p < 35; p++) {
      const rx = 360 + Math.random() * 140;
      const ry = 380 + Math.random() * 120;
      ctx.beginPath();
      ctx.arc(rx, ry, 2 + Math.random() * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Chipped ceramic edge highlight along the broken void
    ctx.strokeStyle = '#fff8ee';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(340, 506);
    ctx.lineTo(390, 440);
    ctx.lineTo(440, 460);
    ctx.lineTo(460, 410);
    ctx.lineTo(506, 360);
    ctx.stroke();

    // 5. Distinct prominent fracture lines (split across the tile)
    // Main deep fracture running across the tile
    const drawFracture = (
      points: [number, number][],
      mainWidth: number,
      highlightOffset: [number, number]
    ) => {
      // White bevel highlight on one side (makes crack look 3D and catch light)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = mainWidth + 1.5;
      ctx.beginPath();
      ctx.moveTo(points[0][0] + highlightOffset[0], points[0][1] + highlightOffset[1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0] + highlightOffset[0], points[i][1] + highlightOffset[1]);
      }
      ctx.stroke();

      // Deep dark crack
      ctx.strokeStyle = '#120f0c';
      ctx.lineWidth = mainWidth;
      ctx.beginPath();
      ctx.moveTo(points[0][0], points[0][1]);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i][0], points[i][1]);
      }
      ctx.stroke();
    };

    // Primary fracture diagonally across
    drawFracture(
      [
        [80, 8],
        [120, 80],
        [160, 130],
        [190, 210],
        [240, 270],
        [310, 340],
        [390, 440],
      ],
      4.5,
      [1.5, 1.5]
    );

    // Secondary branched crack 1
    drawFracture(
      [
        [190, 210],
        [140, 280],
        [110, 370],
        [80, 440],
        [70, 506],
      ],
      3.2,
      [-1.5, 1.0]
    );

    // Secondary branched crack 2
    drawFracture(
      [
        [240, 270],
        [320, 260],
        [410, 280],
        [506, 250],
      ],
      3.0,
      [1.0, -1.5]
    );

    // Fine spiderweb micro-fractures
    drawFracture(
      [
        [160, 130],
        [220, 105],
        [290, 95],
      ],
      1.8,
      [1.0, 1.0]
    );

    drawFracture(
      [
        [140, 280],
        [180, 330],
        [220, 360],
      ],
      1.8,
      [1.0, -1.0]
    );

    // 6. Surface grime stippling and micro scratches
    for (let s = 0; s < 400; s++) {
      const sx = 20 + Math.random() * 470;
      const sy = 20 + Math.random() * 470;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(30, 25, 20, 0.18)' : 'rgba(255, 255, 255, 0.12)';
      ctx.fillRect(sx, sy, 1.5 + Math.random() * 2, 1.5 + Math.random() * 2);
    }

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * Bump Map for Broken Wall Tile (Creates real physical relief under flashlight)
   */
  public static createBrokenTileBumpTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Neutral gray base
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 512, 512);

    // Depressed grout border
    ctx.strokeStyle = '#202020';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 500, 500);

    // Deep broken void
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.moveTo(340, 506);
    ctx.lineTo(390, 440);
    ctx.lineTo(440, 460);
    ctx.lineTo(460, 410);
    ctx.lineTo(506, 360);
    ctx.lineTo(506, 506);
    ctx.closePath();
    ctx.fill();

    // Raised chipped edge
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(340, 506);
    ctx.lineTo(390, 440);
    ctx.lineTo(440, 460);
    ctx.lineTo(460, 410);
    ctx.lineTo(506, 360);
    ctx.stroke();

    // Deep fracture grooves
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(80, 8);
    ctx.lineTo(120, 80);
    ctx.lineTo(160, 130);
    ctx.lineTo(190, 210);
    ctx.lineTo(240, 270);
    ctx.lineTo(310, 340);
    ctx.lineTo(390, 440);
    ctx.stroke();

    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(190, 210);
    ctx.lineTo(140, 280);
    ctx.lineTo(110, 370);
    ctx.lineTo(80, 440);
    ctx.lineTo(70, 506);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(240, 270);
    ctx.lineTo(320, 260);
    ctx.lineTo(410, 280);
    ctx.lineTo(506, 250);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
  }

  /**
   * North Wall (Door Wall) - Silent Hill / RE industrial horror decay
   * Custom mapped 1:1 across 10m x 3.4m.
   * Features intense wear and tear flanking the central door:
   * - Peeling plaster exposing dark brick/lath and rusted iron
   * - Frantic nail/claw scratch gouges etched beside the door frame
   * - Dark grease/body rub smudges and soot impact marks
   * - Heavy rust and water stains dripping from the ceiling joints
   */
  public static createNorthDoorWallTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
    const w = 1024;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = w;
    bumpCanvas.height = h;
    const bctx = bumpCanvas.getContext('2d')!;

    // Base decaying greenish-brown concrete/plaster (matching references)
    ctx.fillStyle = '#22201b';
    ctx.fillRect(0, 0, w, h);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, w, h);

    // Micro-grunge noise and weathered stippling
    for (let i = 0; i < 7000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = 1 + Math.random() * 5;
      const dark = Math.random() > 0.45;
      ctx.fillStyle = dark ? 'rgba(12, 10, 8, 0.22)' : 'rgba(56, 46, 32, 0.16)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      bctx.fillStyle = dark ? 'rgba(30, 30, 30, 0.3)' : 'rgba(210, 210, 210, 0.2)';
      bctx.beginPath();
      bctx.arc(x, y, r, 0, Math.PI * 2);
      bctx.fill();
    }

    // Peeling paint layer (decaying ochre and faded off-white plaster flakes)
    ctx.fillStyle = 'rgba(64, 58, 48, 0.65)';
    for (let i = 0; i < 45; i++) {
      const px = Math.random() * w;
      const py = Math.random() * h;
      const pw = 40 + Math.random() * 80;
      const ph = 30 + Math.random() * 60;
      ctx.fillRect(px, py, pw, ph);

      bctx.fillStyle = '#b0b0b0';
      bctx.fillRect(px, py, pw, ph);
    }

    // Heavy water & rust drip stains running down from ceiling
    for (let d = 0; d < 35; d++) {
      const dx = Math.random() * w;
      const dlen = 100 + Math.random() * 320;
      const dgrad = ctx.createLinearGradient(dx, 0, dx, dlen);
      dgrad.addColorStop(0, 'rgba(38, 18, 8, 0.85)');
      dgrad.addColorStop(0.3, 'rgba(55, 30, 14, 0.55)');
      dgrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = dgrad;
      ctx.fillRect(dx - 3 - Math.random() * 4, 0, 6 + Math.random() * 8, dlen);
    }

    // --- DETALLES DE GASTADO CERCANOS A LA PUERTA (Central region: x: 300 to 724) ---
    // Door sits at x: 410 to 614.
    // LEFT OF DOOR WEAR (x: 290 to 415):
    // 1. Massive crumbling plaster breakout exposing dark rusted steel / brick behind
    ctx.fillStyle = '#141210';
    ctx.beginPath();
    ctx.moveTo(330, 90);
    ctx.lineTo(395, 75);
    ctx.lineTo(412, 180);
    ctx.lineTo(405, 340);
    ctx.lineTo(350, 360);
    ctx.lineTo(315, 270);
    ctx.lineTo(330, 160);
    ctx.closePath();
    ctx.fill();

    bctx.fillStyle = '#1a1a1a';
    bctx.beginPath();
    bctx.moveTo(330, 90);
    bctx.lineTo(395, 75);
    bctx.lineTo(412, 180);
    bctx.lineTo(405, 340);
    bctx.lineTo(350, 360);
    bctx.lineTo(315, 270);
    bctx.lineTo(330, 160);
    bctx.closePath();
    bctx.fill();

    // Jagged white/ochre plaster chipping border around the breakout
    ctx.strokeStyle = '#635948';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Exposed horizontal lath board stripes inside the hole
    ctx.strokeStyle = '#2d241c';
    ctx.lineWidth = 7;
    for (let ly = 100; ly < 350; ly += 18) {
      ctx.beginPath();
      ctx.moveTo(320, ly);
      ctx.lineTo(410, ly);
      ctx.stroke();
    }

    // 2. Frantic desperation claw scratch marks beside the left door frame
    ctx.strokeStyle = '#4a1210';
    ctx.lineWidth = 2.5;
    for (let set = 0; set < 4; set++) {
      const startX = 350 + set * 14;
      const startY = 170 + set * 22;
      for (let finger = 0; finger < 4; finger++) {
        ctx.beginPath();
        ctx.moveTo(startX + finger * 5, startY);
        ctx.bezierCurveTo(
          startX + finger * 6 + 10,
          startY + 35,
          startX + finger * 5 + 5,
          startY + 70,
          startX + finger * 7 + 15,
          startY + 110
        );
        ctx.stroke();
      }
    }

    // Claw scratch bump depth
    bctx.strokeStyle = '#050505';
    bctx.lineWidth = 3;
    for (let set = 0; set < 4; set++) {
      const startX = 350 + set * 14;
      const startY = 170 + set * 22;
      for (let finger = 0; finger < 4; finger++) {
        bctx.beginPath();
        bctx.moveTo(startX + finger * 5, startY);
        bctx.bezierCurveTo(
          startX + finger * 6 + 10,
          startY + 35,
          startX + finger * 5 + 5,
          startY + 70,
          startX + finger * 7 + 15,
          startY + 110
        );
        bctx.stroke();
      }
    }

    // 3. Dark grease and grime hand smudges from people pounding on the door
    for (let h = 0; h < 6; h++) {
      const hx = 360 + Math.random() * 45;
      const hy = 220 + Math.random() * 80;
      ctx.fillStyle = 'rgba(10, 8, 6, 0.45)';
      ctx.beginPath();
      ctx.ellipse(hx, hy, 16, 28, -0.3 + Math.random() * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // RIGHT OF DOOR WEAR (x: 608 to 740):
    // 1. Peeling blistered plaster slab with rust leakage
    ctx.fillStyle = '#171412';
    ctx.beginPath();
    ctx.moveTo(612, 110);
    ctx.lineTo(685, 130);
    ctx.lineTo(705, 280);
    ctx.lineTo(650, 390);
    ctx.lineTo(610, 370);
    ctx.closePath();
    ctx.fill();

    bctx.fillStyle = '#151515';
    bctx.beginPath();
    bctx.moveTo(612, 110);
    bctx.lineTo(685, 130);
    bctx.lineTo(705, 280);
    bctx.lineTo(650, 390);
    bctx.lineTo(610, 370);
    bctx.closePath();
    bctx.fill();

    // Peeling ragged rim
    ctx.strokeStyle = '#5a5040';
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Vivid oxidized orange-brown rust crust bubbling in the breakout
    for (let r = 0; r < 25; r++) {
      const rx = 620 + Math.random() * 70;
      const ry = 140 + Math.random() * 220;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(128, 48, 18, 0.65)' : 'rgba(78, 28, 12, 0.75)';
      ctx.beginPath();
      ctx.arc(rx, ry, 6 + Math.random() * 14, 0, Math.PI * 2);
      ctx.fill();

      bctx.fillStyle = '#e0e0e0';
      bctx.beginPath();
      bctx.arc(rx, ry, 4 + Math.random() * 8, 0, Math.PI * 2);
      bctx.fill();
    }

    // Violent gouges and tool scrape marks on right side
    ctx.strokeStyle = '#2b100e';
    ctx.lineWidth = 3;
    for (let g = 0; g < 6; g++) {
      ctx.beginPath();
      const gx = 630 + g * 12;
      ctx.moveTo(gx, 180 + Math.random() * 30);
      ctx.lineTo(gx + 25, 290 + Math.random() * 40);
      ctx.stroke();
    }

    // Baseboard dampness & mold along bottom of North wall
    const baseGrad = ctx.createLinearGradient(0, 430, 0, 512);
    baseGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    baseGrad.addColorStop(0.5, 'rgba(12, 16, 10, 0.55)');
    baseGrad.addColorStop(1, 'rgba(6, 8, 5, 0.9)');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 430, w, 82);

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.ClampToEdgeWrapping;
    map.wrapT = THREE.ClampToEdgeWrapping;

    const bump = new THREE.CanvasTexture(bumpCanvas);
    bump.wrapS = THREE.ClampToEdgeWrapping;
    bump.wrapT = THREE.ClampToEdgeWrapping;

    return { map, bump };
  }

  /**
   * South Wall (Opposite to door) - Decayed horizontal wood planking & damp stained concrete
   * Distinct aesthetic referencing Image 2:
   * - Weathered, water-logged dark timber boards
   * - Peeling blistered greenish-gray paint remnants
   * - Dark vertical leak trails and mold bloom
   */
  public static createSouthWoodWallTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
    const w = 1024;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = w;
    bumpCanvas.height = h;
    const bctx = bumpCanvas.getContext('2d')!;

    // Dark rustic aged wood base (burnt umber/warm brown)
    ctx.fillStyle = '#2e1c12';
    ctx.fillRect(0, 0, w, h);
    bctx.fillStyle = '#606060';
    bctx.fillRect(0, 0, w, h);

    // Vertical aged wood planks matching user's reference image textura_madera1
    const plankCount = 14;
    const plankW = w / plankCount;

    for (let p = 0; p < plankCount; p++) {
      const x = p * plankW;
      const toneVar = (Math.random() - 0.5) * 16;
      const r = Math.min(255, Math.max(0, Math.floor(65 + toneVar)));
      const g = Math.min(255, Math.max(0, Math.floor(42 + toneVar * 0.7)));
      const b = Math.min(255, Math.max(0, Math.floor(25 + toneVar * 0.5)));

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillRect(x, 0, plankW - 3, h);

      bctx.fillStyle = `rgb(${110 + (Math.random() - 0.5) * 30}, 110, 110)`;
      bctx.fillRect(x, 0, plankW - 3, h);

      // Vertical wood grain fibers
      ctx.strokeStyle = 'rgba(25, 12, 6, 0.45)';
      ctx.lineWidth = 1.2;
      for (let gIdx = 0; gIdx < 12; gIdx++) {
        const gx = x + Math.random() * (plankW - 4);
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.bezierCurveTo(
          gx + (Math.random() - 0.5) * 4,
          h * 0.35,
          gx + (Math.random() - 0.5) * 4,
          h * 0.75,
          gx,
          h
        );
        ctx.stroke();
      }

      // Vertical crack seams and dark gap between adjacent planks
      ctx.fillStyle = '#0a0604';
      ctx.fillRect(x + plankW - 3, 0, 3, h);
      bctx.fillStyle = '#080808';
      bctx.fillRect(x + plankW - 3, 0, 3, h);

      // Distressed flaking light-cyan / pale-blue paint patches (exact palette from user's photo)
      const cyanTones = ['#729e9f', '#5e8e91', '#8bb4b5', '#4d7d81', '#9bc0c1'];
      for (let flake = 0; flake < 25; flake++) {
        const fx = x + Math.random() * (plankW - 10);
        const fy = Math.random() * (h - 25);
        const fw = 4 + Math.random() * (plankW * 0.65);
        const fh = 6 + Math.random() * 45;

        ctx.fillStyle = cyanTones[Math.floor(Math.random() * cyanTones.length)];
        ctx.globalAlpha = 0.75 + Math.random() * 0.25;

        // Ragged peeling paint edge
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + fw, fy + (Math.random() - 0.5) * 3);
        ctx.lineTo(fx + fw * 0.9, fy + fh);
        ctx.lineTo(fx + (Math.random() - 0.5) * 2, fy + fh * 0.85);
        ctx.closePath();
        ctx.fill();

        bctx.fillStyle = '#d8d8d8';
        bctx.fillRect(fx, fy, fw, fh);
      }
      ctx.globalAlpha = 1.0;
    }

    // Grimy edge dirt and subtle vignette
    const topVignette = ctx.createLinearGradient(0, 0, 0, 70);
    topVignette.addColorStop(0, 'rgba(10, 8, 6, 0.75)');
    topVignette.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topVignette;
    ctx.fillRect(0, 0, w, 70);

    const botVignette = ctx.createLinearGradient(0, h - 90, 0, h);
    botVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    botVignette.addColorStop(1, 'rgba(8, 6, 4, 0.85)');
    ctx.fillStyle = botVignette;
    ctx.fillRect(0, h - 90, w, 90);

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;

    const bump = new THREE.CanvasTexture(bumpCanvas);
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.RepeatWrapping;

    return { map, bump };
  }

  /**
   * West Wall (Left Wall: Desk & Calendar side) - Decrepit damp soot-stained concrete & flaking plaster
   * Matches user's reference photo (23bbebee42c774833f1ef951f3d2155f_64cb3b67.jpg):
   * - Grim cold desaturated concrete background (dusty grays, off-white)
   * - Heavy black soot, mold clusters, and damp water runoff streaks
   * - Chipped spalling plaster pits and horizontal construction joint seam
   */
  public static createWestPlasterWallTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
    const w = 1024;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = w;
    bumpCanvas.height = h;
    const bctx = bumpCanvas.getContext('2d')!;

    // Base aged timber (warm gray-brown)
    ctx.fillStyle = '#423a32';
    ctx.fillRect(0, 0, w, h);
    bctx.fillStyle = '#707070';
    bctx.fillRect(0, 0, w, h);

    // Vertical aged wood planks with seafoam turquoise peeling paint (matching user reference image textura_madera4)
    const plankCount = 16;
    const plankW = w / plankCount;

    for (let p = 0; p < plankCount; p++) {
      const x = p * plankW;
      const toneVar = (Math.random() - 0.5) * 16;
      const baseR = Math.min(255, Math.max(0, Math.floor(75 + toneVar)));
      const baseG = Math.min(255, Math.max(0, Math.floor(66 + toneVar * 0.8)));
      const baseB = Math.min(255, Math.max(0, Math.floor(54 + toneVar * 0.6)));
      ctx.fillStyle = `rgb(${baseR}, ${baseG}, ${baseB})`;
      ctx.fillRect(x, 0, plankW - 2, h);

      bctx.fillStyle = `rgb(${110 + (Math.random() - 0.5) * 25}, 110, 110)`;
      bctx.fillRect(x, 0, plankW - 2, h);

      // Fine vertical wood grain ridges
      ctx.strokeStyle = 'rgba(30, 24, 18, 0.45)';
      ctx.lineWidth = 1.1;
      for (let g = 0; g < 14; g++) {
        const gx = x + Math.random() * (plankW - 4);
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.bezierCurveTo(
          gx + (Math.random() - 0.5) * 3,
          h * 0.33,
          gx + (Math.random() - 0.5) * 3,
          h * 0.67,
          gx,
          h
        );
        ctx.stroke();
      }

      // Vertical plank seam gap and dark shadow
      ctx.fillStyle = '#110e0a';
      ctx.fillRect(x + plankW - 2, 0, 2, h);
      bctx.fillStyle = '#080808';
      bctx.fillRect(x + plankW - 2, 0, 2, h);

      // Distressed flaking seafoam green / turquoise paint patches (exact palette from user's photo)
      const seafoamTones = ['#6ba398', '#589186', '#7cb3a9', '#4d8278', '#86c2b7', '#5f8f82'];
      for (let f = 0; f < 30; f++) {
        const fx = x + Math.random() * (plankW - 6);
        const fy = Math.random() * (h - 20);
        const fw = 3 + Math.random() * (plankW * 0.7);
        const fh = 6 + Math.random() * 45;

        ctx.fillStyle = seafoamTones[Math.floor(Math.random() * seafoamTones.length)];
        ctx.globalAlpha = 0.75 + Math.random() * 0.25;

        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + fw, fy + (Math.random() - 0.5) * 2);
        ctx.lineTo(fx + fw * 0.9, fy + fh);
        ctx.lineTo(fx, fy + fh * 0.9);
        ctx.closePath();
        ctx.fill();

        bctx.fillStyle = '#cecece';
        bctx.fillRect(fx, fy, fw, fh);
      }
      ctx.globalAlpha = 1.0;

      // Dark round rusted iron nail heads along the plank (Image detail)
      if (Math.random() > 0.2) {
        const nailY = 60 + Math.random() * (h - 120);
        const nailX = x + plankW * 0.5 + (Math.random() - 0.5) * 6;

        // Rust stain halo around nail
        const halo = ctx.createRadialGradient(nailX, nailY, 1, nailX, nailY, 8);
        halo.addColorStop(0, 'rgba(90, 45, 15, 0.6)');
        halo.addColorStop(1, 'rgba(90, 45, 15, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(nailX, nailY, 8, 0, Math.PI * 2);
        ctx.fill();

        // Dark iron nail head
        ctx.fillStyle = '#141210';
        ctx.beginPath();
        ctx.arc(nailX, nailY, 2.8, 0, Math.PI * 2);
        ctx.fill();

        bctx.fillStyle = '#e8e8e8';
        bctx.beginPath();
        bctx.arc(nailX, nailY, 2.8, 0, Math.PI * 2);
        bctx.fill();
      }
    }

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;

    const bump = new THREE.CanvasTexture(bumpCanvas);
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.RepeatWrapping;

    return { map, bump };
  }

  /**
   * East Wall (Partition around Bathroom & Fuse Box) - Silent Hill Industrial Oxidized Rust
   * Distinct aesthetic referencing Image 1:
   * - Corroded steel plates with heavy oxidized orange-red rust
   * - Riveted structural seams and vertical angle irons
   * - Electrical burn/soot stains near the electrical fuse box
   */
  public static createEastIndustrialWallTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
    const w = 1024;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = w;
    bumpCanvas.height = h;
    const bctx = bumpCanvas.getContext('2d')!;

    // Pale weathered whitewashed wood base (grayish off-white with cool blue-gray undertones)
    ctx.fillStyle = '#b5bcc2';
    ctx.fillRect(0, 0, w, h);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, w, h);

    // Vertical weathered wood planks (matching user reference image textura_madera3)
    const plankCount = 14;
    const plankW = w / plankCount;

    for (let p = 0; p < plankCount; p++) {
      const x = p * plankW;
      const toneVar = (Math.random() - 0.5) * 18;
      const baseLuma = Math.min(235, Math.max(160, Math.floor(190 + toneVar)));
      ctx.fillStyle = `rgb(${baseLuma - 4}, ${baseLuma}, ${baseLuma + 4})`;
      ctx.fillRect(x, 0, plankW - 3, h);

      bctx.fillStyle = `rgb(${120 + (Math.random() - 0.5) * 30}, 120, 120)`;
      bctx.fillRect(x, 0, plankW - 3, h);

      // Vertical weathered wood grain lines & fissures
      ctx.strokeStyle = 'rgba(75, 82, 88, 0.45)';
      ctx.lineWidth = 1.2;
      for (let g = 0; g < 15; g++) {
        const gx = x + Math.random() * (plankW - 4);
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.bezierCurveTo(
          gx + (Math.random() - 0.5) * 4,
          h * 0.35,
          gx + (Math.random() - 0.5) * 4,
          h * 0.75,
          gx,
          h
        );
        ctx.stroke();
      }

      // Deeper aged fissures and crack fissures along planks
      ctx.strokeStyle = 'rgba(45, 50, 55, 0.65)';
      ctx.lineWidth = 1.8;
      for (let f = 0; f < 3; f++) {
        const fx = x + Math.random() * (plankW - 4);
        const fy = Math.random() * (h * 0.6);
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx + (Math.random() - 0.5) * 2, fy + 40 + Math.random() * 80);
        ctx.stroke();
      }

      // Dark joint seam and shadow groove between planks
      ctx.fillStyle = '#22252a';
      ctx.fillRect(x + plankW - 3, 0, 3, h);
      bctx.fillStyle = '#101010';
      bctx.fillRect(x + plankW - 3, 0, 3, h);

      // Pale greenish-yellow moss / lichen patches (matching reference photo)
      const lichenTones = ['#a2ab82', '#b3bd91', '#939e72', '#c1caa2', '#889467'];
      for (let l = 0; l < 20; l++) {
        const lx = x + Math.random() * (plankW - 8);
        const ly = Math.random() * (h - 20);
        const lw = 4 + Math.random() * (plankW * 0.6);
        const lh = 8 + Math.random() * 35;

        ctx.fillStyle = lichenTones[Math.floor(Math.random() * lichenTones.length)];
        ctx.globalAlpha = 0.55 + Math.random() * 0.35;

        ctx.beginPath();
        ctx.arc(lx, ly, Math.min(lw, lh) * 0.5, 0, Math.PI * 2);
        ctx.fill();

        bctx.fillStyle = '#d5d5d5';
        bctx.fillRect(lx - 2, ly - 2, 4, 4);
      }
      ctx.globalAlpha = 1.0;
    }

    // Weathered rotting dark base at bottom of planks (Y near floor)
    const rotGrad = ctx.createLinearGradient(0, h - 85, 0, h);
    rotGrad.addColorStop(0, 'rgba(40, 42, 40, 0)');
    rotGrad.addColorStop(0.5, 'rgba(28, 30, 26, 0.7)');
    rotGrad.addColorStop(1, 'rgba(15, 16, 14, 0.95)');
    ctx.fillStyle = rotGrad;
    ctx.fillRect(0, h - 85, w, 85);

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;

    const bump = new THREE.CanvasTexture(bumpCanvas);
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.RepeatWrapping;

    return { map, bump };
  }

  /**
   * Horror Bedroom Wall Texture (Faithful to Image 2: Silent Hill Room 302 aesthetic)
   * - Mottled decayed sepia/tan plaster with heavy upper damp/rot decay
   * - Peeling distressed wallpaper sections and water stain drippings
   * - Deep plaster fissures, grime, and mold spots
   */
  public static createHorrorBedroomWallTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
    const w = 1024;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = w;
    bumpCanvas.height = h;
    const bctx = bumpCanvas.getContext('2d')!;

    // 1. Base aged mottled tan/ochre plaster (Image 2 reference)
    ctx.fillStyle = '#4a3d2e';
    ctx.fillRect(0, 0, w, h);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, w, h);

    // Random plaster noise & texture grain
    for (let i = 0; i < 7000; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      const rad = 2 + Math.random() * 12;
      const isDark = Math.random() > 0.45;
      ctx.fillStyle = isDark ? 'rgba(35, 28, 20, 0.12)' : 'rgba(110, 95, 70, 0.08)';
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.fill();

      bctx.fillStyle = isDark ? 'rgba(40, 40, 40, 0.1)' : 'rgba(210, 210, 210, 0.08)';
      bctx.beginPath();
      bctx.arc(rx, ry, rad, 0, Math.PI * 2);
      bctx.fill();
    }

    // 2. Heavy dark mold, soot, and damp decay along top ceiling edge (Image 2)
    const topDampGrad = ctx.createLinearGradient(0, 0, 0, 180);
    topDampGrad.addColorStop(0, 'rgba(18, 14, 10, 0.95)');
    topDampGrad.addColorStop(0.4, 'rgba(28, 22, 16, 0.75)');
    topDampGrad.addColorStop(0.8, 'rgba(45, 36, 26, 0.35)');
    topDampGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = topDampGrad;
    ctx.fillRect(0, 0, w, 180);

    // Matching bump gradient for top damp
    const topBumpGrad = bctx.createLinearGradient(0, 0, 0, 180);
    topBumpGrad.addColorStop(0, 'rgba(30, 30, 30, 0.8)');
    topBumpGrad.addColorStop(1, 'rgba(128, 128, 128, 0)');
    bctx.fillStyle = topBumpGrad;
    bctx.fillRect(0, 0, w, 180);

    // 3. Vertical water dripping trails running down from ceiling
    ctx.strokeStyle = 'rgba(20, 16, 12, 0.35)';
    for (let d = 0; d < 32; d++) {
      const dx = Math.random() * w;
      const dripLen = 120 + Math.random() * 280;
      ctx.lineWidth = 1 + Math.random() * 3.5;
      ctx.beginPath();
      ctx.moveTo(dx, 0);
      let curX = dx;
      for (let dy = 10; dy < dripLen; dy += 20) {
        curX += (Math.random() - 0.5) * 6;
        ctx.lineTo(curX, dy);
      }
      ctx.stroke();
    }

    // 4. Peeling vintage wallpaper patches with torn ragged edges (Image 2)
    for (let p = 0; p < 8; p++) {
      const px = 40 + Math.random() * (w - 180);
      const py = 60 + Math.random() * (h - 180);
      const pw = 80 + Math.random() * 120;
      const ph = 60 + Math.random() * 100;

      // Dark shadow edge of torn paper
      ctx.fillStyle = 'rgba(14, 12, 9, 0.6)';
      ctx.fillRect(px - 3, py - 3, pw + 6, ph + 6);

      // Torn patch inner raw plaster
      ctx.fillStyle = 'rgba(72, 60, 46, 0.9)';
      ctx.fillRect(px, py, pw, ph);

      // Faded floral or vertical stripe wallpaper remnants
      ctx.strokeStyle = 'rgba(38, 32, 24, 0.25)';
      ctx.lineWidth = 3;
      for (let sx = px + 8; sx < px + pw; sx += 14) {
        ctx.beginPath();
        ctx.moveTo(sx, py);
        ctx.lineTo(sx, py + ph);
        ctx.stroke();
      }

      // Bump indentation
      bctx.fillStyle = 'rgba(40, 40, 40, 0.4)';
      bctx.fillRect(px, py, pw, ph);
    }

    // 5. Plaster fissure cracks
    ctx.strokeStyle = 'rgba(12, 10, 8, 0.55)';
    bctx.strokeStyle = '#101010';
    for (let c = 0; c < 8; c++) {
      let cx = Math.random() * w;
      let cy = Math.random() * h;
      const crackWidth = 1 + Math.random() * 1.5;
      ctx.lineWidth = crackWidth;
      bctx.lineWidth = crackWidth + 1;
      ctx.beginPath();
      bctx.beginPath();
      ctx.moveTo(cx, cy);
      bctx.moveTo(cx, cy);
      for (let s = 0; s < 7; s++) {
        cx += (Math.random() - 0.5) * 45;
        cy += (Math.random() - 0.2) * 35;
        ctx.lineTo(cx, cy);
        bctx.lineTo(cx, cy);
      }
      ctx.stroke();
      bctx.stroke();
    }

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;

    const bump = new THREE.CanvasTexture(bumpCanvas);
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.RepeatWrapping;

    return { map, bump };
  }

  /**
   * CRT TV Screen Texture with Animated Static & Scanlines
   */
  public static createCrtTvScreenTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Dark cyan-green phosphorous background
    ctx.fillStyle = '#0a1418';
    ctx.fillRect(0, 0, 256, 256);

    // Phosphor static noise dots
    const imgData = ctx.getImageData(0, 0, 256, 256);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random();
      if (noise > 0.65) {
        const val = Math.floor(Math.random() * 180 + 40);
        data[i] = Math.floor(val * 0.7);     // R
        data[i + 1] = Math.floor(val * 1.1); // G
        data[i + 2] = val;                   // B
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Horizontal CRT scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    for (let y = 0; y < 256; y += 4) {
      ctx.fillRect(0, y, 256, 2);
    }

    // Faint eerie central static disturbance / channel noise band
    const noiseGrad = ctx.createLinearGradient(0, 90, 0, 160);
    noiseGrad.addColorStop(0, 'rgba(100, 220, 240, 0)');
    noiseGrad.addColorStop(0.5, 'rgba(120, 240, 255, 0.22)');
    noiseGrad.addColorStop(1, 'rgba(100, 220, 240, 0)');
    ctx.fillStyle = noiseGrad;
    ctx.fillRect(0, 90, 256, 70);

    // Subtle vignette curve
    const vigGrad = ctx.createRadialGradient(128, 128, 60, 128, 128, 140);
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, 256, 256);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * Distressed Dark Wood Furniture Texture (For Cajonera & Mesita de Luz, matching Image 2)
   */
  public static createDarkWoodFurnitureTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Rich dark walnut / stained mahogany base (Image 2)
    ctx.fillStyle = '#261912';
    ctx.fillRect(0, 0, 512, 512);

    // Longitudinal wood grain lines
    for (let x = 0; x < 512; x += 3) {
      const grainVar = (Math.random() - 0.5) * 16;
      ctx.strokeStyle = Math.random() > 0.4 ? 'rgba(22, 14, 10, 0.5)' : 'rgba(54, 38, 28, 0.35)';
      ctx.lineWidth = 1 + Math.random() * 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      let cx = x;
      for (let y = 0; y < 512; y += 40) {
        cx += (Math.random() - 0.5) * 3;
        ctx.lineTo(cx, y);
      }
      ctx.stroke();
    }

    // Wood knots
    for (let k = 0; k < 4; k++) {
      const kx = 60 + Math.random() * 400;
      const ky = 60 + Math.random() * 400;
      const kGrad = ctx.createRadialGradient(kx, ky, 2, kx, ky, 25);
      kGrad.addColorStop(0, '#100a06');
      kGrad.addColorStop(0.5, '#2e1e16');
      kGrad.addColorStop(1, 'rgba(38, 25, 18, 0)');
      ctx.fillStyle = kGrad;
      ctx.beginPath();
      ctx.ellipse(kx, ky, 18, 32, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Scratches and distressed worn edge marks
    ctx.strokeStyle = 'rgba(100, 75, 55, 0.4)';
    ctx.lineWidth = 1;
    for (let s = 0; s < 20; s++) {
      const sx = Math.random() * 512;
      const sy = Math.random() * 512;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (Math.random() - 0.5) * 35, sy + (Math.random() - 0.5) * 20);
      ctx.stroke();
    }

    // Dirt accumulation in corners and recesses
    const vignette = ctx.createRadialGradient(256, 256, 160, 256, 256, 280);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(10, 6, 4, 0.5)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, 512, 512);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * Stained Dirty Mattress Texture (Matching Image 2 vintage bed)
   */
  public static createDirtyMattressTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Faded aged cream linen fabric base
    ctx.fillStyle = '#b5ac9d';
    ctx.fillRect(0, 0, 512, 512);

    // Fine fabric weave
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(120, 110, 95, 0.12)' : 'rgba(215, 205, 190, 0.1)';
      ctx.fillRect(x, y, 2, 2);
    }

    // Quilted diamond stitch pattern
    ctx.strokeStyle = 'rgba(90, 80, 70, 0.25)';
    ctx.lineWidth = 1.5;
    for (let d = -512; d < 1024; d += 48) {
      ctx.beginPath();
      ctx.moveTo(d, 0);
      ctx.lineTo(d + 512, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(d, 512);
      ctx.lineTo(d + 512, 0);
      ctx.stroke();
    }

    // Large brownish-yellow water and sweat stain rings (Silent Hill hallmark)
    for (let s = 0; s < 6; s++) {
      const sx = 80 + Math.random() * 350;
      const sy = 80 + Math.random() * 350;
      const rad = 35 + Math.random() * 65;

      const stainGrad = ctx.createRadialGradient(sx, sy, rad * 0.4, sx, sy, rad);
      stainGrad.addColorStop(0, 'rgba(115, 95, 65, 0.35)');
      stainGrad.addColorStop(0.7, 'rgba(135, 110, 75, 0.5)');
      stainGrad.addColorStop(0.9, 'rgba(85, 65, 45, 0.65)'); // Dark stain rim
      stainGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = stainGrad;
      ctx.beginPath();
      ctx.arc(sx, sy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dried blood blotches
    for (let b = 0; b < 3; b++) {
      const bx = 120 + Math.random() * 280;
      const by = 120 + Math.random() * 280;
      const bRad = 15 + Math.random() * 30;
      const bloodGrad = ctx.createRadialGradient(bx, by, 3, bx, by, bRad);
      bloodGrad.addColorStop(0, 'rgba(65, 18, 14, 0.75)');
      bloodGrad.addColorStop(0.7, 'rgba(50, 14, 10, 0.55)');
      bloodGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bloodGrad;
      ctx.beginPath();
      ctx.ellipse(bx, by, bRad, bRad * 0.7, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * Decayed Patterned Bedroom Area Rug (Matching Image 2)
   */
  public static createBedroomRugTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Faded crimson-brown vintage carpet base
    ctx.fillStyle = '#3a201c';
    ctx.fillRect(0, 0, 512, 512);

    // Decorative ornate border
    ctx.strokeStyle = '#63392a';
    ctx.lineWidth = 18;
    ctx.strokeRect(20, 20, 472, 472);

    ctx.strokeStyle = '#2b1512';
    ctx.lineWidth = 6;
    ctx.strokeRect(36, 36, 440, 440);

    // Inner geometric motif
    ctx.strokeStyle = '#4e2d22';
    ctx.lineWidth = 3;
    for (let x = 60; x < 460; x += 40) {
      for (let y = 60; y < 460; y += 40) {
        ctx.strokeRect(x, y, 28, 28);
      }
    }

    // Heavy dirt & wear patches
    for (let i = 0; i < 50; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 512;
      const r = 20 + Math.random() * 50;
      const grad = ctx.createRadialGradient(rx, ry, 2, rx, ry, r);
      grad.addColorStop(0, 'rgba(15, 10, 8, 0.6)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(rx, ry, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  /**
   * Decaying Collapsed Ceiling Texture (Inspired directly by Image 3: Resident Evil / Silent Hill style)
   * - Peeling plaster slabs breaking away to expose wooden lath slats underneath
   * - Dark damp water rot rings, mold colonies, and peeling paint fringes
   */
  public static createHorrorDecayCeilingTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
    const w = 1024;
    const h = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = w;
    bumpCanvas.height = h;
    const bctx = bumpCanvas.getContext('2d')!;

    // 1. Base dark weathered plaster
    ctx.fillStyle = '#2b2926';
    ctx.fillRect(0, 0, w, h);
    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, w, h);

    // Fine plaster noise
    for (let i = 0; i < 9000; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      const rad = 1 + Math.random() * 6;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(18, 16, 14, 0.22)' : 'rgba(75, 70, 64, 0.18)';
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.fill();

      bctx.fillStyle = Math.random() > 0.5 ? 'rgba(30, 30, 30, 0.25)' : 'rgba(200, 200, 200, 0.2)';
      bctx.beginPath();
      bctx.arc(rx, ry, rad, 0, Math.PI * 2);
      bctx.fill();
    }

    // 2. Giant collapsed ceiling holes with exposed horizontal wooden laths (Image 3 reference!)
    const holeAreas = [
      { x: 180, y: 220, rx: 140, ry: 90 },
      { x: 680, y: 340, rx: 160, ry: 110 },
      { x: 420, y: 720, rx: 200, ry: 120 },
      { x: 820, y: 800, rx: 130, ry: 85 },
    ];

    holeAreas.forEach((h) => {
      // Dark hollow cavity behind plaster
      ctx.fillStyle = '#100e0c';
      ctx.beginPath();
      ctx.ellipse(h.x, h.y, h.rx, h.ry, 0.15, 0, Math.PI * 2);
      ctx.fill();

      bctx.fillStyle = '#1a1a1a';
      bctx.beginPath();
      bctx.ellipse(h.x, h.y, h.rx, h.ry, 0.15, 0, Math.PI * 2);
      bctx.fill();

      // Exposed horizontal wooden lath slats inside the hole (Image 3!)
      const slatH = 14;
      const startY = Math.max(0, h.y - h.ry);
      const endY = Math.min(1024, h.y + h.ry);
      for (let ly = startY; ly < endY; ly += slatH + 5) {
        ctx.fillStyle = '#2e241b';
        ctx.fillRect(h.x - h.rx, ly, h.rx * 2, slatH);

        bctx.fillStyle = '#505050';
        bctx.fillRect(h.x - h.rx, ly, h.rx * 2, slatH);

        // Gap shadow between slats
        ctx.fillStyle = '#080706';
        ctx.fillRect(h.x - h.rx, ly + slatH, h.rx * 2, 5);
        bctx.fillStyle = '#0a0a0a';
        bctx.fillRect(h.x - h.rx, ly + slatH, h.rx * 2, 5);
      }

      // Jagged peeling plaster rim around the hole
      ctx.strokeStyle = '#4e483e';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.ellipse(h.x, h.y, h.rx + 4, h.ry + 4, 0.15, 0, Math.PI * 2);
      ctx.stroke();

      bctx.strokeStyle = '#d0d0d0';
      bctx.lineWidth = 6;
      bctx.beginPath();
      bctx.ellipse(h.x, h.y, h.rx + 4, h.ry + 4, 0.15, 0, Math.PI * 2);
      bctx.stroke();
    });

    // 3. Water damage rings and damp dark rot bloom (Image 3!)
    for (let r = 0; r < 8; r++) {
      const rx = 80 + Math.random() * (w - 160);
      const ry = 80 + Math.random() * (h - 160);
      const rad = 50 + Math.random() * 120;
      const grad = ctx.createRadialGradient(rx, ry, rad * 0.3, rx, ry, rad);
      grad.addColorStop(0, 'rgba(15, 12, 10, 0.85)');
      grad.addColorStop(0.7, 'rgba(32, 26, 20, 0.55)');
      grad.addColorStop(0.95, 'rgba(65, 52, 38, 0.7)'); // Dark damp tide ring
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.fill();

      bctx.fillStyle = 'rgba(40, 40, 40, 0.4)';
      bctx.beginPath();
      bctx.arc(rx, ry, rad, 0, Math.PI * 2);
      bctx.fill();
    }

    // 4. Plaster fissures and spiderweb cracks
    ctx.strokeStyle = 'rgba(10, 8, 6, 0.7)';
    bctx.strokeStyle = '#050505';
    for (let c = 0; c < 12; c++) {
      let cx = Math.random() * w;
      let cy = Math.random() * h;
      ctx.lineWidth = 1.5;
      bctx.lineWidth = 2.5;
      ctx.beginPath();
      bctx.beginPath();
      ctx.moveTo(cx, cy);
      bctx.moveTo(cx, cy);
      for (let s = 0; s < 8; s++) {
        cx += (Math.random() - 0.5) * 55;
        cy += (Math.random() - 0.5) * 45;
        ctx.lineTo(cx, cy);
        bctx.lineTo(cx, cy);
      }
      ctx.stroke();
      bctx.stroke();
    }

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;

    const bump = new THREE.CanvasTexture(bumpCanvas);
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.RepeatWrapping;

    return { map, bump };
  }

  /**
   * Asylum / Hospital Horror Wall Texture (Directly inspired by Image 2: IMG-20261021-WA0017.jpg)
   * - Bottom 58%: Dirty institutional pale green-gray tiles with moldy black grout, cracks & blood
   * - Top 42%: Flaking, peeling mustard/ochre yellow paint exposing crumbling dark concrete behind
   */
  public static createAsylumBathroomWallTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
    const w = 1024;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = w;
    bumpCanvas.height = h;
    const bctx = bumpCanvas.getContext('2d')!;

    // 1. TOP SECTION (y: 0 to 220): Peeling mustard-yellow / ochre paint over damp gray concrete (Image 2!)
    // Base dark pitted damp concrete
    ctx.fillStyle = '#222524';
    ctx.fillRect(0, 0, w, 220);
    bctx.fillStyle = '#505050';
    bctx.fillRect(0, 0, w, 220);

    // Decaying mustard-yellow chipped paint layer (Image 2!)
    ctx.fillStyle = '#7a6528';
    ctx.fillRect(0, 0, w, 205);
    bctx.fillStyle = '#b0b0b0';
    bctx.fillRect(0, 0, w, 205);

    // Chipped peeling patches where yellow paint has fallen off (exposing concrete)
    for (let p = 0; p < 35; p++) {
      const px = Math.random() * (w - 80);
      const py = Math.random() * 180;
      const pw = 30 + Math.random() * 90;
      const ph = 25 + Math.random() * 70;

      ctx.fillStyle = '#2a2e2b';
      ctx.beginPath();
      ctx.ellipse(px + pw / 2, py + ph / 2, pw / 2, ph / 2, Math.random() * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Dark shadow edge of peeling curled paint
      ctx.strokeStyle = '#181a18';
      ctx.lineWidth = 3;
      ctx.stroke();

      bctx.fillStyle = '#303030';
      bctx.beginPath();
      bctx.ellipse(px + pw / 2, py + ph / 2, pw / 2, ph / 2, Math.random() * 0.4, 0, Math.PI * 2);
      bctx.fill();
    }

    // 2. BOTTOM SECTION (y: 205 to 512): Grimy Institutional Tile Wall (Image 2!)
    // Base tile color: worn dirty greenish/cream institutional porcelain
    ctx.fillStyle = '#1c201e';
    ctx.fillRect(0, 205, w, 307);
    bctx.fillStyle = '#303030';
    bctx.fillRect(0, 205, w, 307);

    const tileSize = 48; // Crisp 48px square institutional tiles
    for (let x = 0; x < w; x += tileSize) {
      for (let y = 205; y < 512; y += tileSize) {
        // Subtle tile-to-tile tonal variation
        const toneVar = (Math.sin(x * 0.1) + Math.cos(y * 0.15)) * 10;
        const r = Math.min(255, Math.max(0, Math.floor(95 + toneVar)));
        const g = Math.min(255, Math.max(0, Math.floor(115 + toneVar * 1.1)));
        const b = Math.min(255, Math.max(0, Math.floor(105 + toneVar * 0.9)));

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

        bctx.fillStyle = '#a8a8a8';
        bctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);

        // Slime, water smudges, and dirt on some tiles
        if (Math.random() > 0.55) {
          ctx.fillStyle = 'rgba(30, 42, 35, 0.4)';
          ctx.beginPath();
          ctx.arc(x + tileSize / 2, y + tileSize / 2, 8 + Math.random() * 12, 0, Math.PI * 2);
          ctx.fill();
        }

        // Cracked tile fissures
        if (Math.random() > 0.82) {
          ctx.strokeStyle = '#181c1a';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(x + 4, y + 4);
          ctx.lineTo(x + tileSize - 8, y + tileSize - 6);
          ctx.stroke();

          bctx.strokeStyle = '#101010';
          bctx.lineWidth = 2.5;
          bctx.beginPath();
          bctx.moveTo(x + 4, y + 4);
          bctx.lineTo(x + tileSize - 8, y + tileSize - 6);
          bctx.stroke();
        }
      }
    }

    // Blackened moldy grout grid (Image 2!)
    ctx.strokeStyle = '#121514';
    ctx.lineWidth = 3;
    bctx.strokeStyle = '#050505';
    bctx.lineWidth = 4;
    for (let x = 0; x <= w; x += tileSize) {
      ctx.beginPath(); ctx.moveTo(x, 205); ctx.lineTo(x, 512); ctx.stroke();
      bctx.beginPath(); bctx.moveTo(x, 205); bctx.lineTo(x, 512); bctx.stroke();
    }
    for (let y = 205; y <= 512; y += tileSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      bctx.beginPath(); bctx.moveTo(0, y); bctx.lineTo(w, y); bctx.stroke();
    }

    // 3. Transition border: peeling ragged paint border dividing yellow upper wall & tile lower wall
    ctx.fillStyle = '#101210';
    ctx.fillRect(0, 202, w, 5);
    bctx.fillStyle = '#050505';
    bctx.fillRect(0, 202, w, 5);

    // 4. Vertical dark water seepage and rust drip lines running all the way down
    for (let d = 0; d < 30; d++) {
      const dx = Math.random() * w;
      const dlen = 140 + Math.random() * 320;
      const grad = ctx.createLinearGradient(dx, 0, dx, dlen);
      grad.addColorStop(0, 'rgba(25, 18, 12, 0.85)');
      grad.addColorStop(0.5, 'rgba(38, 30, 20, 0.55)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(dx - 2, 0, 4 + Math.random() * 5, dlen);
    }

    // 5. Dried blood splatters & hand dragging marks
    for (let b = 0; b < 6; b++) {
      const bx = 80 + Math.random() * (w - 160);
      const by = 220 + Math.random() * 240;
      ctx.fillStyle = 'rgba(75, 14, 10, 0.75)';
      ctx.beginPath();
      ctx.ellipse(bx, by, 12 + Math.random() * 20, 8 + Math.random() * 12, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;

    const bump = new THREE.CanvasTexture(bumpCanvas);
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.RepeatWrapping;

    return { map, bump };
  }

  /**
   * Asylum / Hospital Grimy Floor Tile Texture (Directly inspired by Image 2: IMG-20261021-WA0017.jpg)
   * - Stained, grimy institutional square floor tiles
   * - Heavy dark dirty water puddles, blood/soot spots, and debris caked in grout
   */
  public static createAsylumBathroomFloorTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
    const w = 1024;
    const h = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = w;
    bumpCanvas.height = h;
    const bctx = bumpCanvas.getContext('2d')!;

    // Base dark dirty concrete underfloor
    ctx.fillStyle = '#181b19';
    ctx.fillRect(0, 0, w, h);
    bctx.fillStyle = '#202020';
    bctx.fillRect(0, 0, w, h);

    const step = 64; // Large square floor tiles matching Image 2
    for (let x = 0; x < w; x += step) {
      for (let y = 0; y < h; y += step) {
        // Dirty greenish-gray / cement floor tiles with heavy grime
        const varTone = (Math.sin(x * 0.05 + y * 0.08) + Math.cos(x * 0.1)) * 14;
        const r = Math.min(255, Math.max(0, Math.floor(65 + varTone)));
        const g = Math.min(255, Math.max(0, Math.floor(82 + varTone * 1.1)));
        const b = Math.min(255, Math.max(0, Math.floor(78 + varTone * 0.95)));

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x + 2, y + 2, step - 4, step - 4);

        bctx.fillStyle = '#858585';
        bctx.fillRect(x + 2, y + 2, step - 4, step - 4);

        // Grime & soot accumulation on tile surface
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = 'rgba(15, 20, 18, 0.45)';
          ctx.beginPath();
          ctx.arc(x + Math.random() * step, y + Math.random() * step, 4 + Math.random() * 12, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Blackened, caked grout lines
    ctx.strokeStyle = '#0e1110';
    ctx.lineWidth = 4;
    bctx.strokeStyle = '#050505';
    bctx.lineWidth = 5;
    for (let x = 0; x <= w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      bctx.beginPath(); bctx.moveTo(x, 0); bctx.lineTo(x, h); bctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      bctx.beginPath(); bctx.moveTo(0, y); bctx.lineTo(w, y); bctx.stroke();
    }

    // Massive murky puddles and dried blood stains on floor (Image 2!)
    for (let p = 0; p < 10; p++) {
      const px = 100 + Math.random() * (w - 200);
      const py = 100 + Math.random() * (h - 200);
      const pr = 40 + Math.random() * 95;
      const isBlood = Math.random() > 0.4;

      const pGrad = ctx.createRadialGradient(px, py, pr * 0.2, px, py, pr);
      if (isBlood) {
        pGrad.addColorStop(0, 'rgba(48, 10, 8, 0.85)');
        pGrad.addColorStop(0.7, 'rgba(32, 8, 6, 0.65)');
        pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      } else {
        pGrad.addColorStop(0, 'rgba(12, 16, 14, 0.85)');
        pGrad.addColorStop(0.7, 'rgba(20, 26, 22, 0.55)');
        pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      }
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.ellipse(px, py, pr, pr * (0.6 + Math.random() * 0.4), Math.random() * Math.PI, 0, Math.PI * 2);
      ctx.fill();

      // Puddle roughness/bump reflection
      bctx.fillStyle = 'rgba(20, 20, 20, 0.5)';
      bctx.beginPath();
      bctx.ellipse(px, py, pr, pr * 0.7, 0, 0, Math.PI * 2);
      bctx.fill();
    }

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;

    const bump = new THREE.CanvasTexture(bumpCanvas);
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.RepeatWrapping;

    return { map, bump };
  }

  /**
   * Distressed Horror Wooden Plank Floor (Directly inspired by Image 1 & Image 3)
   * - Decayed, water-damaged dark wood planks with deep grooves
   * - Blood smear dragging marks (Image 1!), dust, and heavy wear
   */
  public static createHorrorDistressedFloorTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
    const w = 1024;
    const h = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = w;
    bumpCanvas.height = h;
    const bctx = bumpCanvas.getContext('2d')!;

    // 1. Base dark walnut/oak weathered wood (Image 1 & 3 reference!)
    ctx.fillStyle = '#221912';
    ctx.fillRect(0, 0, w, h);
    bctx.fillStyle = '#606060';
    bctx.fillRect(0, 0, w, h);

    const plankCount = 12;
    const plankH = 1024 / plankCount;

    for (let p = 0; p < plankCount; p++) {
      const y = p * plankH;

      // Individual plank wood tone
      const tone = 28 + Math.floor((Math.random() - 0.5) * 14);
      ctx.fillStyle = `rgb(${tone + 8}, ${tone + 2}, ${Math.max(6, tone - 4)})`;
      ctx.fillRect(0, y + 2, w, plankH - 4);

      bctx.fillStyle = `rgb(${110 + (Math.random() - 0.5) * 30}, 110, 110)`;
      bctx.fillRect(0, y + 2, w, plankH - 4);

      // Longitudinal fine wood grain
      ctx.strokeStyle = 'rgba(12, 8, 6, 0.4)';
      ctx.lineWidth = 1.2;
      for (let g = 0; g < 8; g++) {
        const gy = y + Math.random() * plankH;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(300, gy + (Math.random() - 0.5) * 4, 700, gy + (Math.random() - 0.5) * 4, w, gy);
        ctx.stroke();
      }

      // Deep dark gap shadow between planks
      ctx.fillStyle = '#0a0705';
      ctx.fillRect(0, y + plankH - 3, w, 3);
      bctx.fillStyle = '#050505';
      bctx.fillRect(0, y + plankH - 3, w, 3);
    }

    // 2. Worn patches where foot traffic occurs (Image 3!)
    for (let wp = 0; wp < 6; wp++) {
      const wx = 120 + Math.random() * (w - 240);
      const wy = 120 + Math.random() * (h - 240);
      const wGrad = ctx.createRadialGradient(wx, wy, 10, wx, wy, 120);
      wGrad.addColorStop(0, 'rgba(80, 60, 42, 0.45)');
      wGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = wGrad;
      ctx.beginPath();
      ctx.ellipse(wx, wy, 140, 70, Math.random() * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Blood smear drag trails & blood pools (Matching Image 1 horror scene!)
    for (let b = 0; b < 5; b++) {
      const bx = 150 + Math.random() * (w - 300);
      const by = 150 + Math.random() * (h - 300);

      // Blood pool
      const bGrad = ctx.createRadialGradient(bx, by, 5, bx, by, 65);
      bGrad.addColorStop(0, 'rgba(58, 10, 8, 0.88)');
      bGrad.addColorStop(0.7, 'rgba(42, 8, 6, 0.65)');
      bGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bGrad;
      ctx.beginPath();
      ctx.ellipse(bx, by, 70, 45, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Drag trail smeared across floorboards (Image 1!)
      ctx.strokeStyle = 'rgba(48, 10, 8, 0.65)';
      ctx.lineWidth = 14 + Math.random() * 12;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.bezierCurveTo(bx + 80, by + 30, bx + 160, by - 20, bx + 240, by + 40);
      ctx.stroke();

      bctx.fillStyle = 'rgba(25, 25, 25, 0.4)';
      bctx.beginPath();
      bctx.ellipse(bx, by, 70, 45, 0.3, 0, Math.PI * 2);
      bctx.fill();
    }

    // 4. Dust, grime & flaking debris along board seams
    for (let i = 0; i < 5000; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(10, 8, 6, 0.35)' : 'rgba(95, 85, 70, 0.15)';
      ctx.fillRect(rx, ry, 2, 2);
    }

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;

    const bump = new THREE.CanvasTexture(bumpCanvas);
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.RepeatWrapping;

    return { map, bump };
  }

  /**
   * Asylum Ceiling Grid Texture (Directly inspired by Image 2: IMG-20261021-WA0017.jpg)
   * - Acoustic drop ceiling tiles with dark damp water stain rings and oxidized T-bar grid
   */
  public static createAsylumCeilingTexture(): { map: THREE.CanvasTexture; bump: THREE.CanvasTexture } {
    const w = 512;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = w;
    bumpCanvas.height = h;
    const bctx = bumpCanvas.getContext('2d')!;

    // Base dirty acoustic tile
    ctx.fillStyle = '#242624';
    ctx.fillRect(0, 0, w, h);
    bctx.fillStyle = '#606060';
    bctx.fillRect(0, 0, w, h);

    const gridSize = 64;
    for (let x = 0; x < w; x += gridSize) {
      for (let y = 0; y < h; y += gridSize) {
        ctx.fillStyle = '#2f3330';
        ctx.fillRect(x + 2, y + 2, gridSize - 4, gridSize - 4);

        bctx.fillStyle = '#909090';
        bctx.fillRect(x + 2, y + 2, gridSize - 4, gridSize - 4);

        // Acoustic tile micro stippling pinholes
        ctx.fillStyle = 'rgba(10, 12, 10, 0.4)';
        for (let p = 0; p < 8; p++) {
          ctx.fillRect(x + 6 + Math.random() * (gridSize - 12), y + 6 + Math.random() * (gridSize - 12), 2, 2);
        }
      }
    }

    // Metal T-bar grid frame
    ctx.strokeStyle = '#141715';
    ctx.lineWidth = 3;
    bctx.strokeStyle = '#202020';
    bctx.lineWidth = 4;
    for (let x = 0; x <= w; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      bctx.beginPath(); bctx.moveTo(x, 0); bctx.lineTo(x, h); bctx.stroke();
    }
    for (let y = 0; y <= h; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      bctx.beginPath(); bctx.moveTo(0, y); bctx.lineTo(w, y); bctx.stroke();
    }

    // Heavy water leak rings (Image 2!)
    for (let r = 0; r < 5; r++) {
      const rx = 60 + Math.random() * (w - 120);
      const ry = 60 + Math.random() * (h - 120);
      const rad = 30 + Math.random() * 60;
      const grad = ctx.createRadialGradient(rx, ry, rad * 0.2, rx, ry, rad);
      grad.addColorStop(0, 'rgba(15, 12, 8, 0.85)');
      grad.addColorStop(0.7, 'rgba(45, 36, 22, 0.6)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.colorSpace = THREE.SRGBColorSpace;

    const bump = new THREE.CanvasTexture(bumpCanvas);
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.RepeatWrapping;

    return { map, bump };
  }
}


