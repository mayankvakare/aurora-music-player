/* ╔══════════════════════════════════════════════════════════════════╗
   ║   AURORA MEGA 4-IN-1 VISUALIZER STAGE                           ║
   ║   Box Above Songs (Hero Centerpiece)                            ║
   ║   1. Animated Audio Visualizer (Live frequency reactivity)      ║
   ║   2. Aurora Flow (Flowing purple / cyan / pink ribbons)         ║
   ║   3. 3D Glass Orb (Center glowing sphere with glass optics)     ║
   ║   4. Liquid Chrome (Futuristic metallic fluid & neon streaks)   ║
   ╚══════════════════════════════════════════════════════════════════╝ */

let audioCtx            = null;
let analyser            = null;
let dataArray           = null;
let visRaf              = null;
let visInitTried        = false;
let visForceFake        = true;
let visAudioUnavailable = false;

/* ─────────────────────────────────────
   PUBLIC: initVisualizer()
   Called when audio plays
───────────────────────────────────── */
function initVisualizer() {
  if (visInitTried) {
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    if (!visAudioUnavailable) visForceFake = false;
    startLoop();
    return;
  }
  visInitTried = true;

  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(audio);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;
    const filteredSource = typeof setupAudioFilters === 'function' ? setupAudioFilters(source, audioCtx) : source;
    filteredSource.connect(analyser);
    analyser.connect(audioCtx.destination);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    visAudioUnavailable = false;
    visForceFake = false;
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    startLoop();
  } catch (e) {
    console.warn('Aurora visualizer fallback mode:', e);
    visAudioUnavailable = true;
    visForceFake = true;
    startLoop();
  }
}

/* ─────────────────────────────────────
   PUBLIC: drawVisualizer(fake)
   Called on init and window resize
───────────────────────────────────── */
function drawVisualizer(fake = false) {
  visForceFake = fake;
  startLoop();
}

/* ─────────────────────────────────────
   INTERNAL: startLoop()
───────────────────────────────────── */
function startLoop() {
  if (visRaf) {
    cancelAnimationFrame(visRaf);
    visRaf = null;
  }

  const canvas = visualizerCanvas || document.getElementById('visualizer');
  if (!canvas) return;

  function ensureSize() {
    const dpr = window.devicePixelRatio || 1;
    let W = canvas.offsetWidth  || canvas.parentElement?.offsetWidth  || 320;
    let H = canvas.offsetHeight || canvas.parentElement?.offsetHeight || 320;
    W = Math.max(W, 160);
    H = Math.max(H, 160);

    const targetW = Math.round(W * dpr);
    const targetH = Math.round(H * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width  = targetW;
      canvas.height = targetH;
    }
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, W, H, dpr };
  }

  let { ctx, W, H, dpr } = ensureSize();
  if (!ctx) return;

  const BARS   = 48;
  const barGap = W / BARS;
  const barW   = barGap * 0.58;

  let lastHeights = new Array(BARS).fill(H * 0.05);
  let lastEnergy  = 0;
  let t = 0;

  const PCOUNT = 36;
  let particles = makeParticles(PCOUNT, W, H);

  if (window.ResizeObserver && !canvas._roAttached) {
    canvas._roAttached = true;
    const ro = new ResizeObserver(() => {
      const up = ensureSize();
      W = up.W; H = up.H;
      lastHeights = new Array(BARS).fill(H * 0.05);
      particles   = makeParticles(PCOUNT, W, H);
    });
    ro.observe(canvas);
  }

  /* ─────────────────── MAIN ANIMATION LOOP ─────────────────── */
  function loop() {
    ctx.clearRect(0, 0, W, H);

    let energy = 0;
    const playing = state && state.isPlaying;

    if (playing) {
      if (!visForceFake && !visAudioUnavailable && analyser && dataArray) {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];

        if (sum > 0) {
          state.usingRealVis = true;
          lastHeights = mapRealBars(dataArray, BARS, H * 0.42);
          energy = sum / dataArray.length / 255;
        } else {
          state.usingRealVis = false;
          lastHeights = makeFakeHeights(t, BARS, H);
          energy = 0.38 + 0.35 * Math.abs(Math.sin(t * 1.1));
        }
      } else {
        state.usingRealVis = false;
        lastHeights = makeFakeHeights(t, BARS, H);
        energy = 0.38 + 0.35 * Math.abs(Math.sin(t * 1.1));
      }
      lastEnergy = lastEnergy * 0.85 + energy * 0.15;
      t += 0.028;
    } else {
      /* Paused / Idle state: gentle calm breathing */
      lastEnergy = lastEnergy * 0.96 + 0.04 * 0.04;
      lastHeights = lastHeights.map((h, i) => {
        const target = H * (0.04 + 0.05 * Math.abs(Math.sin(t * 0.4 + i * 0.2)));
        return h * 0.95 + target * 0.05;
      });
      t += 0.008;
    }

    const E = Math.min(Math.max(lastEnergy, 0), 1);

    /* 1. Aurora Flow (Atmospheric background waves) */
    drawAuroraFlow(ctx, W, H, t, E);

    /* 2. Liquid Chrome (Metallic fluid particles & neon reflections) */
    drawLiquidChrome(ctx, W, H, t, E, particles, playing);

    /* 3. 3D Glass Orb (Center glowing sphere with refraction & specular highlights) */
    drawGlassOrb(ctx, W, H, t, E);

    /* 4. Animated Audio Equalizer (Reacts dynamically to sound frequencies) */
    drawEqBars(ctx, W, H, lastHeights, BARS, barW, barGap, t, E);

    visRaf = requestAnimationFrame(loop);
  }

  loop();
}

/* ══════════════════════════════════════════════════════════
   LAYER 1: AURORA FLOW (Purple, Cyan & Pink Ribbons)
══════════════════════════════════════════════════════════ */
function drawAuroraFlow(ctx, W, H, t, E) {
  const waves = [
    { r:139, g:92,  b:246, yFrac:0.18, speed:0.35, ampFrac:0.12 }, /* violet */
    { r:236, g:72,  b:153, yFrac:0.35, speed:0.48, ampFrac:0.10 }, /* pink   */
    { r:56,  g:189, b:248, yFrac:0.55, speed:0.42, ampFrac:0.09 }, /* cyan   */
    { r:167, g:139, b:250, yFrac:0.72, speed:0.32, ampFrac:0.08 }, /* lavender */
  ];

  ctx.save();

  waves.forEach((w, wi) => {
    const yBase = H * w.yFrac;
    const amp   = H * (w.ampFrac + E * 0.09);
    const phase = t * w.speed + wi * 1.35;
    const alpha = 0.07 + E * 0.08;

    const grad = ctx.createLinearGradient(0, yBase - amp, 0, yBase + amp * 2.2);
    grad.addColorStop(0,   `rgba(${w.r},${w.g},${w.b},${alpha * 2.2})`);
    grad.addColorStop(0.4, `rgba(${w.r},${w.g},${w.b},${alpha})`);
    grad.addColorStop(1,   `rgba(${w.r},${w.g},${w.b},0)`);

    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) {
      const nx = x / W;
      const y  =
        yBase +
        Math.sin(nx * 4.2 + phase) * amp * 0.55 +
        Math.sin(nx * 7.5 - phase * 0.7) * amp * 0.28 +
        Math.sin(nx * 2.2 + t * 0.3) * amp * 0.17;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  });

  /* Neon horizontal aurora streak rays */
  for (let i = 0; i < 2; i++) {
    const yL = H * (0.16 + i * 0.36 + Math.sin(t * 0.35 + i) * 0.06);
    const {r, g, b} = waves[i * 2];
    const a = 0.04 + E * 0.08;
    const sg = ctx.createLinearGradient(0, 0, W, 0);
    sg.addColorStop(0,   'transparent');
    sg.addColorStop(0.3, `rgba(${r},${g},${b},${a})`);
    sg.addColorStop(0.7, `rgba(${r},${g},${b},${a})`);
    sg.addColorStop(1,   'transparent');
    ctx.beginPath();
    ctx.moveTo(0, yL);
    ctx.lineTo(W, yL);
    ctx.strokeStyle = sg;
    ctx.lineWidth = 1 + E * 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

/* ══════════════════════════════════════════════════════════
   LAYER 2: LIQUID CHROME (Metallic fluid & neon sparks)
══════════════════════════════════════════════════════════ */
function makeParticles(n, W, H) {
  return Array.from({ length: n }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    r: Math.random() * 2.4 + 0.8,
    life: Math.random() * Math.PI * 2,
    hue: [275, 325, 195][Math.floor(Math.random() * 3)],
  }));
}

function drawLiquidChrome(ctx, W, H, t, E, particles, playing) {
  ctx.save();

  particles.forEach(p => {
    const speed = 1 + E * (playing ? 2.5 : 0.6);
    p.x += p.vx * speed;
    p.y += p.vy * speed;
    p.life += 0.035 + E * 0.04;
    if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
    if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

    const pR = p.r * (1 + E * 1.6 * Math.abs(Math.sin(p.life)));
    const al = 0.35 + 0.55 * Math.abs(Math.sin(p.life * 0.8));
    const h  = p.hue + Math.sin(t * 0.8 + p.life) * 28;

    /* Chrome metallic gradient with hot center */
    const rg = ctx.createRadialGradient(
      p.x - pR * 0.3, p.y - pR * 0.3, 0,
      p.x, p.y, pR * 2.8
    );
    rg.addColorStop(0,   `hsla(${h},100%,96%,${al})`);
    rg.addColorStop(0.35,`hsla(${h},90%, 72%,${al * 0.75})`);
    rg.addColorStop(0.7, `hsla(${h},85%, 48%,${al * 0.35})`);
    rg.addColorStop(1,   `hsla(${h},100%,30%,0)`);

    ctx.beginPath();
    ctx.arc(p.x, p.y, pR * 2.8, 0, Math.PI * 2);
    ctx.fillStyle = rg;
    ctx.fill();
  });

  /* Futuristic metallic neon streaks on bass surges */
  if (playing && E > 0.42) {
    const count = Math.floor(E * 4);
    for (let s = 0; s < count; s++) {
      const x1  = Math.random() * W;
      const y1  = Math.random() * H;
      const len = 20 + Math.random() * 60;
      const ang = Math.random() * Math.PI * 2;
      const hue = [270, 320, 190][Math.floor(Math.random() * 3)];
      const sg  = ctx.createLinearGradient(
        x1, y1,
        x1 + Math.cos(ang) * len, y1 + Math.sin(ang) * len
      );
      sg.addColorStop(0, `hsla(${hue},100%,85%,${E * 0.35})`);
      sg.addColorStop(1, `hsla(${hue},100%,85%,0)`);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + Math.cos(ang) * len, y1 + Math.sin(ang) * len);
      ctx.strokeStyle = sg;
      ctx.lineWidth = 1 + Math.random() * 1.2;
      ctx.stroke();
    }
  }

  ctx.restore();
}

/* ══════════════════════════════════════════════════════════
   LAYER 3: 3D GLASS ORB (Centerpiece Sphere)
══════════════════════════════════════════════════════════ */
function drawGlassOrb(ctx, W, H, t, E) {
  const cx = W / 2;
  const cy = H / 2;
  /* Perfectly proportioned for the square box above song */
  const R = Math.min(W, H) * 0.26 * (1 + E * 0.12 + Math.sin(t * 1.3) * 0.025);

  ctx.save();

  /* 1. Ambient multi-colored glow halos */
  [[139,92,246],[236,72,153],[56,189,248]].forEach(([r,g,b], i) => {
    const gr = R * (2.4 + i * 0.8 + E * 1.1);
    const ox = Math.sin(t * 0.65 + i * 2.0) * R * 0.12;
    const oy = Math.cos(t * 0.55 + i * 1.5) * R * 0.09;
    const g2 = ctx.createRadialGradient(cx + ox, cy - oy, 0, cx, cy, gr);
    g2.addColorStop(0,   `rgba(${r},${g},${b},${0.11 + E * 0.13})`);
    g2.addColorStop(0.5, `rgba(${r},${g},${b},${0.04 + E * 0.06})`);
    g2.addColorStop(1,   `rgba(${r},${g},${b},0)`);
    ctx.beginPath();
    ctx.arc(cx, cy, gr, 0, Math.PI * 2);
    ctx.fillStyle = g2;
    ctx.fill();
  });

  /* 2. Bass energy soundwave pulse ring */
  if (E > 0.08) {
    const pulseR = R * (1.25 + E * 0.4 + Math.sin(t * 2.8) * 0.06);
    ctx.beginPath();
    ctx.arc(cx, cy, pulseR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(167,139,250,${0.20 + E * 0.35})`;
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }

  /* 3. Main 3D Glass Body (Deep gradient + refraction) */
  const body = ctx.createRadialGradient(cx - R * 0.32, cy - R * 0.35, R * 0.05, cx, cy, R);
  body.addColorStop(0,    `rgba(255,255,255,${0.16 + E * 0.08})`);
  body.addColorStop(0.25, `rgba(180,140,255,${0.12 + E * 0.05})`);
  body.addColorStop(0.6,  'rgba(100,60,220,0.08)');
  body.addColorStop(0.85, 'rgba(50,20,120,0.12)');
  body.addColorStop(1,    'rgba(10,5,40,0.22)');
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = body;
  ctx.fill();

  /* Optional: Inner cover art if real custom image is available */
  if (albumArt && albumArt.complete && albumArt.naturalWidth > 1 && !albumArt.src.includes('data:image/svg+xml')) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R * 0.88, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(albumArt, cx - R * 0.88, cy - R * 0.88, R * 1.76, R * 1.76);
    ctx.restore();
  }

  /* 4. Glass Rim Highlight */
  const rim = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R);
  rim.addColorStop(0,   `rgba(255,255,255,${0.45 + E * 0.16})`);
  rim.addColorStop(0.4, 'rgba(200,160,255,0.16)');
  rim.addColorStop(1,   'rgba(100,50,200,0.10)');
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = rim;
  ctx.lineWidth = 1.6 + E;
  ctx.stroke();

  /* 5. Primary Specular Highlight (Top-left catch light) */
  const s1 = ctx.createRadialGradient(
    cx - R * 0.34, cy - R * 0.38, 0,
    cx - R * 0.28, cy - R * 0.30, R * 0.38
  );
  s1.addColorStop(0,   `rgba(255,255,255,${0.65 + E * 0.20})`);
  s1.addColorStop(0.5, 'rgba(255,255,255,0.22)');
  s1.addColorStop(1,   'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = s1;
  ctx.fill();

  /* 6. Secondary Specular Highlight (Opposite edge) */
  const s2 = ctx.createRadialGradient(
    cx + R * 0.28, cy - R * 0.42, 0,
    cx + R * 0.28, cy - R * 0.42, R * 0.15
  );
  s2.addColorStop(0, `rgba(255,255,255,${0.45 + E * 0.20})`);
  s2.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = s2;
  ctx.fill();

  /* 7. Bottom Caustic Light Refraction */
  const sBot = ctx.createRadialGradient(
    cx, cy + R * 0.55, 0,
    cx, cy + R * 0.55, R * 0.38
  );
  sBot.addColorStop(0,   `rgba(167,139,250,${0.25 + E * 0.18})`);
  sBot.addColorStop(0.5, `rgba(236,72,153,${0.10 + E * 0.08})`);
  sBot.addColorStop(1,   'rgba(56,189,248,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.fillStyle = sBot;
  ctx.fill();

  /* 8. Inner Spherical Depth Rings */
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.clip();
  [0.32, 0.58, 0.80].forEach(f => {
    ctx.beginPath();
    ctx.arc(cx, cy, R * f, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.025 + E * 0.016})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  });
  ctx.restore();

  /* 9. Spinning Chromatic Rainbow Halo */
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 0.42);
  const haloR = R * 1.18;
  for (let a = 0; a < Math.PI * 2; a += 0.055) {
    const hue = ((a / (Math.PI * 2)) * 360 + t * 45) % 360;
    const px  = Math.cos(a) * haloR;
    const py  = Math.sin(a) * haloR;
    const hg  = ctx.createRadialGradient(px * 0.95, py * 0.95, 0, px, py, R * 0.11);
    hg.addColorStop(0, `hsla(${hue},100%,75%,${0.16 + E * 0.20})`);
    hg.addColorStop(1, `hsla(${hue},100%,75%,0)`);
    ctx.beginPath();
    ctx.arc(px, py, R * 0.11, 0, Math.PI * 2);
    ctx.fillStyle = hg;
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}

/* ══════════════════════════════════════════════════════════
   LAYER 4: EQUALIZER BARS & SOUND WAVES (Dynamic Reactivity)
══════════════════════════════════════════════════════════ */
function drawEqBars(ctx, W, H, heights, BARS, barW, barGap, t, E) {
  ctx.save();
  const baseY = H;

  heights.forEach((h, i) => {
    const x     = i * barGap + (barGap - barW) / 2;
    const bh    = Math.max(h, H * 0.03);
    const y     = baseY - bh;
    const r     = Math.min(barW / 2, bh / 2, 4);
    const hue   = (i / BARS * 115 + t * 24) % 360;
    const hue2  = (hue + 55) % 360;

    /* Bar vertical gradient */
    const grad = ctx.createLinearGradient(0, baseY, 0, y);
    grad.addColorStop(0,   `hsla(${hue}, 90%,60%,${0.24 + E * 0.12})`);
    grad.addColorStop(0.4, `hsla(${hue}, 95%,68%,${0.62 + E * 0.18})`);
    grad.addColorStop(0.8, `hsla(${hue2},95%,75%,${0.82 + E * 0.14})`);
    grad.addColorStop(1,   `hsla(${hue2},100%,88%,0.96)`);

    /* Rounded top bar path */
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    if (bh > r * 2) {
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.lineTo(x + barW - r, y);
      ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
    } else {
      ctx.arc(x + barW / 2, y + bh / 2, bh / 2, -Math.PI, 0);
    }
    ctx.lineTo(x + barW, baseY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    /* Glowing tip cap */
    if (bh > H * 0.05) {
      const cap = ctx.createRadialGradient(x + barW / 2, y, 0, x + barW / 2, y, barW * 1.9);
      cap.addColorStop(0,   `hsla(${hue2},100%,90%,${0.55 + E * 0.30})`);
      cap.addColorStop(0.5, `hsla(${hue2},100%,80%,0.16)`);
      cap.addColorStop(1,   `hsla(${hue2},100%,70%,0)`);
      ctx.beginPath();
      ctx.arc(x + barW / 2, y, barW * 1.9, 0, Math.PI * 2);
      ctx.fillStyle = cap;
      ctx.fill();
    }

    /* Edge specular shine */
    const shine = ctx.createLinearGradient(x, 0, x + barW * 0.4, 0);
    shine.addColorStop(0, `rgba(255,255,255,${0.20 + E * 0.12})`);
    shine.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.moveTo(x, baseY);
    ctx.lineTo(x, Math.max(y + r, y));
    ctx.lineTo(x + barW * 0.4, Math.max(y + r, y));
    ctx.lineTo(x + barW * 0.4, baseY);
    ctx.closePath();
    ctx.fillStyle = shine;
    ctx.fill();
  });

  /* Mirror reflection below bars */
  ctx.save();
  ctx.globalAlpha = 0.12 + E * 0.06;
  heights.forEach((h, i) => {
    const x    = i * barGap + (barGap - barW) / 2;
    const refH = Math.min(h * 0.28, H * 0.10);
    const hue  = (i / BARS * 115 + t * 24) % 360;
    const rg   = ctx.createLinearGradient(0, baseY, 0, baseY + refH);
    rg.addColorStop(0, `hsla(${hue},90%,68%,0.55)`);
    rg.addColorStop(1, `hsla(${hue},90%,68%,0)`);
    ctx.fillStyle = rg;
    ctx.fillRect(x, baseY, barW, refH);
  });
  ctx.restore();
  ctx.restore();
}

/* ─── Helpers ─── */
function makeFakeHeights(t, bars, H) {
  return Array.from({ length: bars }, (_, i) => {
    const v = 0.08 + 0.60 * Math.abs(Math.sin(t * 0.95 + i * 0.28 + Math.sin(t * 0.35 + i * 0.1) * 0.5));
    return v * (0.45 + 0.55 * Math.random()) * H * 0.50;
  });
}

function mapRealBars(data, count, maxH) {
  const out  = new Array(count).fill(0);
  const step = Math.max(1, Math.floor(data.length / count));
  for (let i = 0; i < count; i++) {
    let sum = 0;
    for (let j = 0; j < step; j++) sum += data[i * step + j] || 0;
    out[i] = (sum / step / 255) * maxH;
  }
  return out;
}
