// Shared pieces for Pip's games: styles, high scores, canvas drawing (Pip,
// sky, particles, HUD, overlays) and canvasGame(), the start/play/game-over shell
// the canvas games run in. Each game lives in its own file and registers in index.js.
var PipGameKit = (() => {
  const CSS = `
.g-canvas{display:block;width:100%;height:auto;border-radius:12px;outline:none;touch-action:none;cursor:pointer;background:#1b1534}
.g-canvas:focus-visible{box-shadow:0 0 0 2px var(--accent)}
.g-hud{display:flex;gap:6px;margin:2px 0 8px}
.pill{font-size:12px;background:var(--chip);border-radius:999px;padding:3px 10px;color:var(--muted)}
.pill b{color:var(--ink);font-variant-numeric:tabular-nums}
.g-board{position:relative}
.g-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;perspective:700px}
.g-card{position:relative;aspect-ratio:4/5;border:0;padding:0;background:none;border-radius:11px}
.g-card:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.g-card .in{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .4s cubic-bezier(.3,1.35,.5,1)}
.g-card[data-open] .in,.g-card[data-done] .in{transform:rotateY(180deg)}
.g-card .face{position:absolute;inset:0;border-radius:11px;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center}
.g-card .back{color:#FDE68A;font-size:20px;
  background:radial-gradient(rgba(255,255,255,.16) 1px,transparent 1.6px) 0 0/9px 9px,linear-gradient(150deg,#9B8CFA,#5B4BD0);
  box-shadow:inset 0 0 0 2px rgba(255,255,255,.14),0 2px 6px rgba(40,20,120,.25)}
.g-card:hover:not([data-open]):not([data-done]) .back{filter:brightness(1.08)}
.g-card .front{transform:rotateY(180deg);background:#F7F5FF;box-shadow:inset 0 0 0 2px #D9D3FD}
.g-card .front svg{width:78%;height:auto}
.g-card .front small{font-size:10px;font-weight:600;color:#5B4BD0;text-transform:capitalize;margin-top:1px}
.g-card[data-done] .front{background:#FFFBEB;box-shadow:inset 0 0 0 2px #FBBF24,0 0 0 3px rgba(251,191,36,.25)}
.g-card.shake{animation:g-shake .32s}
.g-card.pop{animation:g-pop .35s}
.g-over{position:absolute;inset:-4px;display:grid;place-items:center;background:color-mix(in srgb,var(--bg) 78%,transparent);border-radius:12px;animation:g-in .25s ease-out}
.g-over-card{text-align:center;background:var(--bg);border:1px solid var(--line);border-radius:14px;padding:14px 22px;box-shadow:0 10px 28px rgba(20,10,60,.22)}
.g-over-card h2{font-size:30px;margin:0;font-variant-numeric:tabular-nums}
.g-over-card p{margin:4px 0}
.g-stars{font-size:22px;letter-spacing:3px;color:#FBBF24}
.g-stars .off{color:var(--line)}
.g-new{display:inline-block;background:#FBBF24;color:#3b2a05;font-weight:700;font-size:11px;border-radius:999px;padding:2px 9px}
.g-over-card .primary{margin-top:8px}
@keyframes g-in{from{opacity:0;transform:scale(.96)}}
@keyframes g-shake{25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
@keyframes g-pop{50%{transform:scale(1.08)}}
`;

  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const shuffle = arr => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
  const TAU = Math.PI * 2;

  async function getBest(id) {
    try { return (await chrome.storage.local.get({ pipBest: {} })).pipBest[id] || 0; } catch { return 0; }
  }

  async function recordBest(id, score) {
    try {
      const { pipBest = {} } = await chrome.storage.local.get({ pipBest: {} });
      const prev = pipBest[id] || 0;
      if (score > prev) {
        pipBest[id] = score;
        await chrome.storage.local.set({ pipBest });
        return { best: score, isNew: true };
      }
      return { best: prev, isNew: false };
    } catch {
      return { best: score, isNew: false };
    }
  }

  // ---------- canvas drawing helpers ----------
  const P = {
    tail: new Path2D('M44 96 L33 110 L60 98 Z'),
    belly: new Path2D('M18 74 Q18 98 48 98 L72 98 Q102 98 102 74 Q60 90 18 74 Z'),
    stem: new Path2D('M60 31 Q57 21 64 14'),
    spark: new Path2D('M65 5 L67 10 L72 12 L67 14 L65 19 L63 14 L58 12 L63 10 Z'),
    smile: new Path2D('M54 74 Q60 79 66 74'),
    grin: new Path2D('M53 73 Q60 84 67 73 Z'),
    happyEyes: new Path2D('M40 63 Q46 54 52 63 M68 63 Q74 54 80 63'),
    brows: new Path2D('M41 50 L51 46 M69 46 L79 50'),
    wobble: new Path2D('M53 76 q3.5 -3 7 0 q3.5 3 7 0'),
    flat: new Path2D('M56 76 L64 76'),
    blink: new Path2D('M40 61 L52 61 M68 61 L80 61')
  };

  // Pip on a canvas, using the same shapes as the SVG. (cx, bottom) is its feet.
  function drawPip(ctx, cx, bottom, s, mood = 'idle', { tilt = 0, blink = false, look = 0 } = {}) {
    ctx.save();
    ctx.translate(cx, bottom);
    ctx.fillStyle = 'rgba(0,0,0,.28)';
    ctx.beginPath(); ctx.ellipse(0, 0, 28 * s, 4 * s, 0, 0, TAU); ctx.fill();
    ctx.rotate(tilt);
    ctx.scale(s, s);
    ctx.translate(-60, -112);
    ctx.fillStyle = '#6E5EE0';
    ctx.beginPath(); ctx.ellipse(20, 76, 6, 8, mood === 'happy' ? -0.5 : 0, 0, TAU); ctx.ellipse(100, 76, 6, 8, mood === 'happy' ? 0.5 : 0, 0, TAU); ctx.fill();
    ctx.fill(P.tail);
    ctx.fillStyle = '#8B7CF6';
    ctx.beginPath(); ctx.roundRect(18, 30, 84, 68, 30); ctx.fill();
    ctx.globalAlpha = 0.35; ctx.fillStyle = '#6E5EE0'; ctx.fill(P.belly); ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(255,255,255,.28)';
    ctx.beginPath(); ctx.ellipse(38, 44, 9, 4.5, -0.49, 0, TAU); ctx.fill();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#6E5EE0'; ctx.lineWidth = 3; ctx.stroke(P.stem);
    ctx.fillStyle = '#FBBF24'; ctx.fill(P.spark);
    ctx.globalAlpha = 0.75; ctx.fillStyle = '#F9A8D4';
    ctx.beginPath(); ctx.ellipse(36, 72, 5.5, 3.2, 0, 0, TAU); ctx.ellipse(84, 72, 5.5, 3.2, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.translate(look, 0);
    ctx.strokeStyle = ctx.fillStyle = '#221A45';
    ctx.lineWidth = 2.8;
    if (mood === 'happy') {
      ctx.stroke(P.happyEyes);
      ctx.fill(P.grin);
    } else {
      if (blink) ctx.stroke(P.blink);
      else {
        ctx.beginPath(); ctx.ellipse(46, 60, 5.5, 7, 0, 0, TAU); ctx.ellipse(74, 60, 5.5, 7, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(48, 57, 2, 0, TAU); ctx.arc(76, 57, 2, 0, TAU); ctx.fill();
      }
      ctx.lineWidth = 2.4;
      if (mood === 'hurt') { ctx.stroke(P.brows); ctx.stroke(P.wobble); }
      else if (mood === 'focus') ctx.stroke(P.flat);
      else ctx.stroke(P.smile);
    }
    ctx.restore();
  }

  function star(ctx, x, y, r) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 - Math.PI / 2;
      const d = i % 2 ? r * 0.38 : r;
      ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
    }
    ctx.closePath();
    ctx.fill();
  }

  function heart(ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.3);
    ctx.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.75, x, y + s);
    ctx.bezierCurveTo(x, y + s * 0.75, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
    ctx.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3);
    ctx.fill();
  }

  const makeStars = (W, H, n = 30) => Array.from({ length: n }, () => ({
    x: Math.random() * W, y: Math.random() * H * 0.75, r: Math.random() * 1.1 + 0.4,
    ph: Math.random() * TAU, sp: 0.6 + Math.random() * 1.6
  }));

  function drawSky(ctx, W, H, stars, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2E2468');
    g.addColorStop(1, '#15112B');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ECE8FF';
    for (const s of stars) {
      ctx.globalAlpha = 0.2 + 0.6 * Math.abs(Math.sin((t / 1000) * s.sp + s.ph));
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function burst(parts, x, y, colors, n = 12) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU, v = 1 + Math.random() * 2.6;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.2, life: 1, size: 2 + Math.random() * 2.8, color: pick(colors), star: Math.random() < 0.4 });
    }
  }

  function stepParticles(ctx, parts, k) {
    return parts.filter(p => {
      p.x += p.vx * k; p.y += p.vy * k; p.vy += 0.09 * k; p.life -= 0.028 * k;
      if (p.life <= 0) return false;
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      if (p.star) star(ctx, p.x, p.y, p.size * 1.6);
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
      return true;
    });
  }

  function stepFloats(ctx, floats, k) {
    ctx.textAlign = 'center';
    ctx.font = '800 14px system-ui, sans-serif';
    return floats.filter(f => {
      f.y -= 0.7 * k; f.life -= 0.022 * k;
      if (f.life <= 0) return false;
      ctx.globalAlpha = Math.min(1, f.life * 1.5);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
      return true;
    });
  }

  function drawHUD(ctx, W, { score, best, lives, mult }) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#fff';
    ctx.font = '800 20px system-ui, sans-serif';
    ctx.fillText(String(score), 12, 28);
    const sw = ctx.measureText(String(score)).width;
    ctx.fillStyle = '#A9A2D9';
    ctx.font = '600 10px system-ui, sans-serif';
    ctx.fillText(`BEST ${Math.max(best, score)}`, 12, 42);
    if (mult > 1) {
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath(); ctx.roundRect(18 + sw, 13, 30, 18, 9); ctx.fill();
      ctx.fillStyle = '#3B2A05';
      ctx.font = '800 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`x${mult}`, 33 + sw, 26);
    }
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i < lives ? '#FB7185' : 'rgba(255,255,255,.16)';
      heart(ctx, W - 18 - i * 20, 14, 14);
    }
  }

  function drawOverlay(ctx, W, H, { title, big, sub, cta, ribbon }) {
    ctx.fillStyle = 'rgba(14,11,32,.55)';
    ctx.fillRect(0, 0, W, H);
    const cw = W - 64, ch = big ? 132 : 104, cx = 32, cy = H / 2 - ch / 2 - 24;
    ctx.fillStyle = '#251E4D';
    ctx.strokeStyle = 'rgba(255,255,255,.12)';
    ctx.beginPath(); ctx.roundRect(cx, cy, cw, ch, 16); ctx.fill(); ctx.stroke();
    ctx.textAlign = 'center';
    let y = cy + 28;
    ctx.fillStyle = '#C9C2FC'; ctx.font = '700 14px system-ui, sans-serif';
    ctx.fillText(title, W / 2, y);
    if (big) {
      y += 38;
      ctx.fillStyle = '#fff'; ctx.font = '800 34px system-ui, sans-serif';
      ctx.fillText(big, W / 2, y);
    }
    y += 24;
    if (ribbon) {
      ctx.font = '800 11px system-ui, sans-serif';
      const rw = ctx.measureText(ribbon).width + 20;
      ctx.fillStyle = '#FBBF24';
      ctx.beginPath(); ctx.roundRect(W / 2 - rw / 2, y - 13, rw, 19, 10); ctx.fill();
      ctx.fillStyle = '#3B2A05';
      ctx.fillText(ribbon, W / 2, y + 1);
    } else {
      ctx.fillStyle = '#A9A2D9'; ctx.font = '500 12px system-ui, sans-serif';
      ctx.fillText(sub, W / 2, y);
    }
    y += 26;
    ctx.font = '700 12px system-ui, sans-serif';
    const bw = ctx.measureText(cta).width + 28;
    ctx.fillStyle = '#8B7CF6';
    ctx.beginPath(); ctx.roundRect(W / 2 - bw / 2, y - 16, bw, 26, 13); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText(cta, W / 2, y + 1);
  }

  // Shared shell for the canvas games: start screen, loop, high score, game over.
  function canvasGame(el, api, { id, name, W, H, hint, label, create }) {
    el.innerHTML = `<canvas class="g-canvas" tabindex="0" aria-label="${label}"></canvas><p class="hint">${hint}</p>`;
    const cv = el.querySelector('canvas');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);

    const game = create(ctx, W, H, api);
    let phase = 'ready', best = 0, result = null, raf = 0, alive = true, last = performance.now();
    getBest(id).then(b => { best = b; });

    function start() {
      game.reset();
      phase = 'playing';
      api.react('listening', 0);
    }

    async function finish() {
      phase = 'over';
      result = await recordBest(id, game.score);
      best = result.best;
      api.react(result.isNew ? 'ready' : 'worried', 1200);
    }

    function loop(t) {
      if (!alive) return;
      const k = clamp((t - last) / 16.67, 0, 3);
      last = t;
      if (phase === 'playing') {
        game.update(k, t);
        if (game.over) finish();
      }
      game.draw(t, k, phase);
      if (phase === 'playing') drawHUD(ctx, W, { score: game.score, best, lives: game.lives, mult: game.mult() });
      else if (phase === 'ready') drawOverlay(ctx, W, H, { title: name, sub: best ? `Best: ${best}` : 'Set your first high score', cta: 'Click or press Space' });
      else drawOverlay(ctx, W, H, {
        title: 'Game over', big: String(game.score),
        ribbon: result && result.isNew ? 'NEW BEST!' : '', sub: `Best: ${best}`, cta: 'Play again'
      });
      raf = requestAnimationFrame(loop);
    }

    const toCanvas = e => {
      const r = cv.getBoundingClientRect();
      return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
    };
    cv.addEventListener('pointerdown', e => {
      if (phase !== 'playing') { if (phase === 'ready' || result) start(); return; }
      if (game.down) game.down(...toCanvas(e));
    });
    cv.addEventListener('pointermove', e => { if (phase === 'playing' && game.move) game.move(...toCanvas(e)); });
    const onKey = e => {
      if ((e.key === ' ' || e.key === 'Enter') && e.type === 'keydown' && phase !== 'playing' && (phase === 'ready' || result)) { e.preventDefault(); start(); return; }
      if (phase === 'playing' && game.key && game.key(e.key, e.type === 'keydown')) e.preventDefault();
    };
    cv.addEventListener('keydown', onKey);
    cv.addEventListener('keyup', onKey);
    cv.focus();
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }

  const blinking = t => t % 3400 < 130;

  return {
    CSS, TAU, pick, clamp, shuffle, getBest, recordBest,
    drawPip, star, heart, makeStars, drawSky, burst, stepParticles, stepFloats,
    canvasGame, blinking
  };
})();
