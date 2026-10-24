// Spark catch: move Pip to catch prompt pieces and dodge vague words.
var PipSparkCatch = (() => {
  const { TAU, pick, clamp, star, makeStars, drawSky, drawPip, burst, stepParticles, stepFloats, canvasGame, blinking } = PipGameKit;

  function sparkCatch(ctx, W, H, api) {
    const GOOD = ['Goal', 'Context', 'Format', 'Constraints', 'Stack', 'Audience', 'Steps', 'Edge cases'];
    const BAD = ['stuff', 'better', 'thing', 'etc', 'somehow', 'nice', 'just fix it', 'whatever'];
    const stars = makeStars(W, H);
    const keys = {};
    let x, tx, vx, items, parts, floats, combo, time, spawnIn, mood, moodT, shakeT, flash;

    const g = {
      score: 0, lives: 3, over: false,
      mult: () => 1 + Math.min(4, Math.floor(combo / 4)),
      reset() {
        x = tx = W / 2; vx = 0; items = []; parts = []; floats = [];
        combo = 0; time = 0; spawnIn = 20; mood = 'idle'; moodT = 0; shakeT = 0; flash = 0;
        g.score = 0; g.lives = 3; g.over = false;
      },
      key(k, down) {
        if (k !== 'ArrowLeft' && k !== 'ArrowRight') return false;
        keys[k] = down;
        return true;
      },
      move(px) { tx = px; },
      update(k) {
        time += k * 16.67;
        if (keys.ArrowLeft) tx -= 6 * k;
        if (keys.ArrowRight) tx += 6 * k;
        tx = clamp(tx, 28, W - 28);
        const nx = x + (tx - x) * Math.min(1, 0.28 * k);
        vx = nx - x; x = nx;

        if ((spawnIn -= k) <= 0) { spawn(); spawnIn = Math.max(16, 48 - time / 1600); }
        const catchTop = H - 62;
        items = items.filter(it => {
          it.y += it.v * k;
          const cx = it.x + it.w / 2;
          if (it.y + 22 >= catchTop && it.y < catchTop + 26 && it.x < x + 30 && it.x + it.w > x - 30) {
            if (it.kind === 'bad') {
              g.lives--; combo = 0; mood = 'hurt'; moodT = 650; shakeT = 280; flash = 1;
              burst(parts, cx, it.y + 10, ['#9CA3AF', '#6B7280', '#C4B5FD'], 10);
              floats.push({ x: cx, y: it.y, text: 'vague!', color: '#FDA4AF', life: 1 });
              api.react('worried', 700);
              if (g.lives <= 0) g.over = true;
            } else {
              combo++;
              const pts = (it.kind === 'gold' ? 5 : 1) * g.mult();
              g.score += pts; mood = 'happy'; moodT = 380;
              burst(parts, cx, it.y + 10, it.kind === 'gold' ? ['#FBBF24', '#FDE68A', '#fff'] : ['#C4B5FD', '#FBBF24', '#fff'], it.kind === 'gold' ? 22 : 12);
              floats.push({ x: cx, y: it.y, text: '+' + pts, color: it.kind === 'gold' ? '#FDE68A' : '#fff', life: 1 });
              if (combo % 4 === 0) { floats.push({ x: W / 2, y: H / 2 - 20, text: `Combo x${g.mult()}!`, color: '#FBBF24', life: 1.2 }); api.react('ready', 600); }
            }
            return false;
          }
          if (it.y > H) { if (it.kind !== 'bad') combo = 0; return false; }
          return true;
        });
        if (moodT > 0 && (moodT -= k * 16.67) <= 0) mood = 'idle';
        if (shakeT > 0) shakeT -= k * 16.67;
        flash = Math.max(0, flash - 0.05 * k);
      },
      draw(t, k, phase) {
        ctx.save();
        if (shakeT > 0) ctx.translate((Math.random() - 0.5) * 6, 0);
        drawSky(ctx, W, H, stars, t);
        ctx.fillStyle = '#241C4C';
        ctx.beginPath(); ctx.ellipse(W / 2, H + 34, W * 0.8, 62, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#1C1640';
        ctx.beginPath(); ctx.ellipse(W * 0.15, H + 18, W * 0.4, 36, 0, 0, TAU); ctx.fill();
        if (phase !== 'ready') for (const it of items) drawItem(it, t);
        const bob = phase === 'ready' ? Math.sin(t / 400) * 2 : 0;
        drawPip(ctx, phase === 'ready' ? W / 2 : x, H - 14 + bob, 0.58, phase === 'ready' ? 'idle' : mood,
          { tilt: clamp(vx * 0.05, -0.28, 0.28), blink: blinking(t), look: clamp(vx * 1.5, -3, 3) });
        if (phase !== 'ready') { parts = stepParticles(ctx, parts, k); floats = stepFloats(ctx, floats, k); }
        ctx.restore();
        if (flash > 0) { ctx.fillStyle = `rgba(244,63,94,${flash * 0.22})`; ctx.fillRect(0, 0, W, H); }
      }
    };

    function spawn() {
      const r = Math.random();
      const kind = r < 0.07 ? 'gold' : r < 0.6 ? 'good' : 'bad';
      const text = kind === 'gold' ? 'Example' : pick(kind === 'bad' ? BAD : GOOD);
      ctx.font = '700 12px system-ui, sans-serif';
      const w = ctx.measureText(text).width + (kind === 'bad' ? 20 : 32);
      items.push({ kind, text, w, x: 8 + Math.random() * (W - w - 16), y: -24,
        v: 1.15 + Math.min(time / 1000, 100) * 0.028 + Math.random() * 0.55, ph: Math.random() * TAU });
    }

    function drawItem(it, t) {
      const w = it.w;
      ctx.save();
      ctx.translate(it.x + w / 2, it.y + 11);
      ctx.font = '700 12px system-ui, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      if (it.kind === 'bad') {
        ctx.rotate(Math.sin(t / 260 + it.ph) * 0.12);
        ctx.fillStyle = '#3A3354';
        ctx.strokeStyle = 'rgba(255,255,255,.14)';
        ctx.beginPath(); ctx.roundRect(-w / 2, -11, w, 22, 11); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#A8A2C0';
        ctx.fillText(it.text, 0, 1);
      } else {
        const gold = it.kind === 'gold';
        const pulse = 1 + Math.sin(t / 180 + it.ph) * 0.06;
        ctx.fillStyle = gold ? 'rgba(251,191,36,.28)' : 'rgba(167,139,250,.28)';
        ctx.beginPath(); ctx.roundRect(-w / 2 - 4 * pulse, -15 * pulse, w + 8 * pulse, 30 * pulse, 15); ctx.fill();
        ctx.fillStyle = gold ? '#F59E0B' : '#8B7CF6';
        ctx.beginPath(); ctx.roundRect(-w / 2, -11, w, 22, 11); ctx.fill();
        ctx.fillStyle = gold ? '#fff' : '#FDE68A';
        star(ctx, -w / 2 + 12, 0, 6);
        ctx.fillStyle = '#fff';
        ctx.fillText(it.text, 6, 1);
      }
      ctx.restore();
    }

    g.reset();
    return g;
  }

  return {
    id: 'catch',
    name: 'Spark catch',
    blurb: 'Catch prompt pieces, dodge vague words. Chain catches for combos.',
    mount: (el, api) => canvasGame(el, api, {
      id: 'catch', name: 'Spark catch', W: 312, H: 280, create: sparkCatch,
      label: 'Spark catch. Move Pip with the arrow keys or the mouse.',
      hint: 'Move with the mouse or arrow keys. Catch the glowing prompt pieces, dodge the grey vague words. Gold sparks are worth 5.'
    })
  };
})();
