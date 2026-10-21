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

    // Bloody dripping text
    ctx.font = 'bold 38px "Creepster", cursive, "Impact", sans-serif';
    ctx.fillStyle = '#8a0d0d';
    ctx.shadowColor = '#420404';
    ctx.shadowBlur = 8;
    ctx.fillText('NO MIRES ATRÁS', 40, 90);

    // Drips
    ctx.strokeStyle = '#780a0a';
    ctx.lineWidth = 3;
    const dripXs = [70, 140, 210, 290, 360, 420];
    dripXs.forEach((dx) => {
      ctx.beginPath();
      ctx.moveTo(dx, 90);
      ctx.lineTo(dx + (Math.random() - 0.5) * 4, 90 + 35 + Math.random() * 40);
      ctx.stroke();
    });

    // Subtext
    ctx.font = '20px "JetBrains Mono", monospace';
    ctx.fillStyle = '#a62424';
    ctx.fillText('15 MINUTOS... EL PIBE YA VIENE', 45, 175);

    // Scratch marks
    ctx.strokeStyle = '#520606';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(380 + i * 14, 130);
      ctx.lineTo(375 + i * 14, 180);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(370, 145);
    ctx.lineTo(435, 165);
    ctx.stroke();

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
   * Rotten vintage refrigerator front with rust & grime
   */
  public static createRottenFridgeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 768;
    const ctx = canvas.getContext('2d')!;

    // Decaying yellowish off-white enamel
    ctx.fillStyle = '#454a3e';
    ctx.fillRect(0, 0, 512, 768);

    // Rust spots and corrosion
    for (let i = 0; i < 800; i++) {
      const rx = Math.random() * 512;
      const ry = Math.random() * 768;
      const rad = 2 + Math.random() * 18;
      ctx.fillStyle = Math.random() > 0.4 ? 'rgba(102, 51, 17, 0.25)' : 'rgba(35, 45, 25, 0.3)';
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Large rusty bottom base
    const rustGrad = ctx.createLinearGradient(0, 550, 0, 768);
    rustGrad.addColorStop(0, 'rgba(80, 35, 10, 0.4)');
    rustGrad.addColorStop(1, 'rgba(50, 20, 5, 0.95)');
    ctx.fillStyle = rustGrad;
    ctx.fillRect(0, 550, 512, 218);

    // Freezer seam
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 240, 512, 10);

    // Handle
    ctx.fillStyle = '#6e7075';
    ctx.fillRect(38, 270, 22, 140);
    ctx.fillStyle = '#222';
    ctx.fillRect(42, 275, 14, 130);

    // Creepy yellow sticky note: "HAY ALGO EN EL CONGELADOR"
    ctx.fillStyle = '#9e924a';
    ctx.fillRect(160, 320, 110, 90);
    ctx.fillStyle = '#1c1808';
    ctx.font = '11px sans-serif';
    ctx.fillText('LLAVE OXIDADA', 170, 345);
    ctx.fillText('ADENTRO...', 170, 365);
    ctx.fillText('(NO COMER)', 170, 385);

    return new THREE.CanvasTexture(canvas);
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

    // Months grid mock
    ctx.fillStyle = '#3a3427';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText('OCTUBRE', 128, 90);

    // Circle clue in red ink: "1986"
    ctx.strokeStyle = '#b31212';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(128, 38, 80, 24, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Frantic note scribbled
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#7a0e0e';
    ctx.fillText('CÓDIGO CANDADO: 1986', 128, 260);

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
   * Has fine hairline cracks and a chipped corner, NOT obvious from across the room!
   */
  public static createSubtleBrokenTileTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Same dirty white porcelain as the surrounding tiles
    ctx.fillStyle = '#dcdad1';
    ctx.fillRect(0, 0, 256, 256);

    // Dark dirty grout border around the tile
    ctx.strokeStyle = '#2b2722';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 250, 250);

    // Subtle fine spiderweb cracks (realistic hairline fractures)
    ctx.strokeStyle = '#3d3730';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(40, 30);
    ctx.lineTo(95, 110);
    ctx.lineTo(145, 135);
    ctx.lineTo(215, 220);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(95, 110);
    ctx.lineTo(60, 185);
    ctx.lineTo(40, 230);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(145, 135);
    ctx.lineTo(220, 120);
    ctx.stroke();

    // Chipped corner with exposed dark plaster
    ctx.fillStyle = '#1c1916';
    ctx.beginPath();
    ctx.moveTo(190, 256);
    ctx.lineTo(256, 190);
    ctx.lineTo(256, 256);
    ctx.closePath();
    ctx.fill();

    // Dried blood stain around the crack
    ctx.fillStyle = 'rgba(100, 20, 20, 0.25)';
    ctx.beginPath();
    ctx.ellipse(140, 140, 45, 25, 0.4, 0, Math.PI * 2);
    ctx.fill();

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

    ctx.fillStyle = '#171410';
    ctx.fillRect(0, 0, w, h);
    bctx.fillStyle = '#707070';
    bctx.fillRect(0, 0, w, h);

    // Horizontal decaying wooden planks (plank height ~32px)
    const plankH = 32;
    for (let y = 0; y < h; y += plankH) {
      const plankTone = 20 + Math.floor((Math.random() - 0.5) * 10);
      ctx.fillStyle = `rgb(${plankTone + 6}, ${plankTone + 2}, ${Math.max(8, plankTone - 4)})`;
      ctx.fillRect(0, y, w, plankH - 2);

      bctx.fillStyle = `rgb(${110 + (Math.random() - 0.5) * 40}, 110, 110)`;
      bctx.fillRect(0, y, w, plankH - 2);

      // Wood grain ripples
      ctx.strokeStyle = 'rgba(8, 6, 4, 0.35)';
      ctx.lineWidth = 1.2;
      for (let g = 0; g < 6; g++) {
        ctx.beginPath();
        const gy = y + Math.random() * plankH;
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(250, gy + (Math.random() - 0.5) * 6, 750, gy + (Math.random() - 0.5) * 6, w, gy);
        ctx.stroke();
      }

      // Deep dark gap shadow between boards
      ctx.fillStyle = '#080605';
      ctx.fillRect(0, y + plankH - 3, w, 3);
      bctx.fillStyle = '#101010';
      bctx.fillRect(0, y + plankH - 3, w, 3);
    }

    // Peeling greenish-gray flaking paint on select boards (like Image 2)
    ctx.fillStyle = 'rgba(52, 60, 50, 0.45)';
    for (let p = 0; p < 35; p++) {
      const px = Math.random() * (w - 120);
      const py = Math.floor(Math.random() * (h / plankH)) * plankH;
      ctx.fillRect(px, py, 60 + Math.random() * 120, plankH - 4);
      bctx.fillStyle = '#c0c0c0';
      bctx.fillRect(px, py, 60 + Math.random() * 120, plankH - 4);
    }

    // Heavy water leaks pooling from ceiling downwards
    for (let l = 0; l < 25; l++) {
      const lx = Math.random() * w;
      const lw = 8 + Math.random() * 20;
      const lh = 120 + Math.random() * 260;
      const grad = ctx.createLinearGradient(lx, 0, lx, lh);
      grad.addColorStop(0, 'rgba(8, 12, 8, 0.85)');
      grad.addColorStop(0.6, 'rgba(18, 24, 16, 0.45)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(lx, 0, lw, lh);
    }

    // Mold colonies on bottom edge
    const moldGrad = ctx.createLinearGradient(0, 420, 0, h);
    moldGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    moldGrad.addColorStop(1, 'rgba(8, 16, 10, 0.8)');
    ctx.fillStyle = moldGrad;
    ctx.fillRect(0, 420, w, 92);

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.ClampToEdgeWrapping;
    map.wrapT = THREE.ClampToEdgeWrapping;

    const bump = new THREE.CanvasTexture(bumpCanvas);
    bump.wrapS = THREE.ClampToEdgeWrapping;
    bump.wrapT = THREE.ClampToEdgeWrapping;

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

    // Base cold weathered concrete (gray to off-white tones matching reference image)
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#686b6a');
    bgGrad.addColorStop(0.4, '#8c908e');
    bgGrad.addColorStop(0.7, '#747775');
    bgGrad.addColorStop(1, '#565958');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    bctx.fillStyle = '#808080';
    bctx.fillRect(0, 0, w, h);

    // Fine concrete grain and stippling
    for (let i = 0; i < 6000; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random() * 4;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(30, 32, 31, 0.25)' : 'rgba(215, 220, 218, 0.2)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      bctx.fillStyle = Math.random() > 0.5 ? 'rgba(40, 40, 40, 0.3)' : 'rgba(200, 200, 200, 0.2)';
      bctx.beginPath();
      bctx.arc(x, y, r, 0, Math.PI * 2);
      bctx.fill();
    }

    // Heavy black soot and water damage clouds across upper left & middle (matching photo)
    for (let s = 0; s < 45; s++) {
      const sx = Math.random() * (w * 0.75);
      const sy = Math.random() * (h * 0.85);
      const srad = 30 + Math.random() * 90;
      const soot = ctx.createRadialGradient(sx, sy, 5, sx, sy, srad);
      soot.addColorStop(0, 'rgba(18, 19, 20, 0.7)');
      soot.addColorStop(0.5, 'rgba(32, 34, 35, 0.45)');
      soot.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = soot;
      ctx.beginPath();
      ctx.arc(sx, sy, srad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Black mold spatter colonies (distinctive dark speckles and clusters from photo)
    for (let cluster = 0; cluster < 60; cluster++) {
      const cx = (w * 0.35) + Math.random() * (w * 0.6);
      const cy = 40 + Math.random() * 380;
      const count = 5 + Math.floor(Math.random() * 20);

      for (let k = 0; k < count; k++) {
        const kx = cx + (Math.random() - 0.5) * 60;
        const ky = cy + (Math.random() - 0.5) * 50;
        const kr = 2 + Math.random() * 7;
        ctx.fillStyle = 'rgba(12, 13, 14, 0.85)';
        ctx.beginPath();
        ctx.arc(kx, ky, kr, 0, Math.PI * 2);
        ctx.fill();

        bctx.fillStyle = '#101010';
        bctx.beginPath();
        bctx.arc(kx, ky, kr, 0, Math.PI * 2);
        bctx.fill();
      }
    }

    // Vertical dark moisture drip trails running down from top
    for (let d = 0; d < 30; d++) {
      const dx = Math.random() * w;
      const dlen = 80 + Math.random() * 320;
      const dgrad = ctx.createLinearGradient(dx, 0, dx, dlen);
      dgrad.addColorStop(0, 'rgba(15, 16, 17, 0.8)');
      dgrad.addColorStop(0.4, 'rgba(25, 27, 28, 0.45)');
      dgrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = dgrad;
      ctx.fillRect(dx - 2, 0, 4 + Math.random() * 8, dlen);
    }

    // Chipped flaking plaster pits revealing dark interior masonry (like in photo lower-left)
    for (let p = 0; p < 12; p++) {
      const px = 40 + Math.random() * (w * 0.4);
      const py = 120 + Math.random() * 300;
      const pr = 15 + Math.random() * 35;

      ctx.fillStyle = '#222425';
      ctx.beginPath();
      ctx.ellipse(px, py, pr, pr * 1.4, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Sharp white chipped rim
      ctx.strokeStyle = '#c5cac8';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      bctx.fillStyle = '#151515';
      bctx.beginPath();
      bctx.ellipse(px, py, pr, pr * 1.4, 0.1, 0, Math.PI * 2);
      bctx.fill();
    }

    // Horizontal concrete seam/joint line near bottom third (matching photo)
    const seamY = 410;
    ctx.strokeStyle = '#1a1c1d';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, seamY);
    ctx.bezierCurveTo(300, seamY + 2, 700, seamY - 2, w, seamY + 1);
    ctx.stroke();

    bctx.strokeStyle = '#050505';
    bctx.lineWidth = 4;
    bctx.beginPath();
    bctx.moveTo(0, seamY);
    bctx.bezierCurveTo(300, seamY + 2, 700, seamY - 2, w, seamY + 1);
    bctx.stroke();

    // Secondary fine cracks along seam
    ctx.strokeStyle = 'rgba(20, 22, 23, 0.55)';
    ctx.lineWidth = 1.5;
    for (let c = 0; c < 5; c++) {
      const cx = Math.random() * w;
      ctx.beginPath();
      ctx.moveTo(cx, seamY);
      ctx.lineTo(cx + (Math.random() - 0.5) * 40, seamY + 35);
      ctx.stroke();
    }

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(3, 1);

    const bump = new THREE.CanvasTexture(bumpCanvas);
    bump.wrapS = THREE.RepeatWrapping;
    bump.wrapT = THREE.RepeatWrapping;
    bump.repeat.set(3, 1);

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

    // Dark iron base
    ctx.fillStyle = '#1c1b18';
    ctx.fillRect(0, 0, w, h);
    bctx.fillStyle = '#606060';
    bctx.fillRect(0, 0, w, h);

    // Vertical steel panel seams with rivet dots
    ctx.strokeStyle = '#100e0c';
    ctx.lineWidth = 4;
    for (let x = 120; x < w; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();

      bctx.strokeStyle = '#202020';
      bctx.lineWidth = 5;
      bctx.beginPath();
      bctx.moveTo(x, 0);
      bctx.lineTo(x, h);
      bctx.stroke();

      // Rivets
      for (let y = 15; y < h; y += 35) {
        ctx.fillStyle = '#3a342c';
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        bctx.fillStyle = '#d0d0d0';
        bctx.beginPath();
        bctx.arc(x, y, 3.5, 0, Math.PI * 2);
        bctx.fill();
      }
    }

    // Heavy vibrant bubbling orange-red rust crust (matching Image 1's iconic rust)
    for (let r = 0; r < 70; r++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      const rad = 15 + Math.random() * 45;

      const rustGrad = ctx.createRadialGradient(rx, ry, 2, rx, ry, rad);
      rustGrad.addColorStop(0, 'rgba(138, 48, 14, 0.85)');
      rustGrad.addColorStop(0.5, 'rgba(88, 30, 10, 0.65)');
      rustGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rustGrad;
      ctx.beginPath();
      ctx.arc(rx, ry, rad, 0, Math.PI * 2);
      ctx.fill();

      bctx.fillStyle = 'rgba(230, 230, 230, 0.4)';
      bctx.beginPath();
      bctx.arc(rx, ry, rad * 0.7, 0, Math.PI * 2);
      bctx.fill();
    }

    // Electrical soot blowout around the fuse box area (x: 420 to 580)
    const sootGrad = ctx.createRadialGradient(480, 240, 20, 480, 240, 160);
    sootGrad.addColorStop(0, 'rgba(5, 5, 5, 0.9)');
    sootGrad.addColorStop(0.6, 'rgba(15, 12, 10, 0.6)');
    sootGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sootGrad;
    ctx.fillRect(320, 100, 320, 280);

    const map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.ClampToEdgeWrapping;
    map.wrapT = THREE.ClampToEdgeWrapping;

    const bump = new THREE.CanvasTexture(bumpCanvas);
    bump.wrapS = THREE.ClampToEdgeWrapping;
    bump.wrapT = THREE.ClampToEdgeWrapping;

    return { map, bump };
  }
}
