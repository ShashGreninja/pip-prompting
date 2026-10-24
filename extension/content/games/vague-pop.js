// Vague pop: pop the vague words floating up in bubbles, leave the clear ones.
var PipVaguePop = (() => {
  const { TAU, pick, clamp, makeStars, drawSky, drawPip, burst, stepParticles, stepFloats, canvasGame, blinking } = PipGameKit;

  function vaguePop(ctx, W, H, api) {
    const VAGUE = ['stuff', 'thing', 'better', 'nicer', 'etc', 'somehow', 'kinda', 'whatever', 'good', 'properly',
      'fix it', 'make it pop', 'asap', 'just works', 'clean it up', 'do the thing'];
    const CLEAR = ['Goal', 'Context', 'Format', 'Example', 'Constraints', 'Stack', 'Audience', 'Edge cases',
      'Steps', 'Tone', 'Inputs', 'Output', 'Tests', 'Scope', 'Deadline'];
    const stars = makeStars(W, H);
    let bubbles, parts, floats, rings, combo, time, spawnIn, mood, moodT, flash;

    const g = {
      score: 0, lives: 3, over: false,
      mult: () => 1 + Math.min(4, Math.floor(combo / 4)),
      reset() {
        bubbles = []; parts = []; floats = []; rings = [];
        combo = 0; time = 0; spawnIn = 10; mood = 'idle'; moodT = 0; flash = 0;
        g.score = 0; g.lives = 3; g.over = false;
      },
      down(px, py) {
        for (let i = bubbles.length - 1; i >= 0; i--) {
          const b = bubbles[i];
          if (Math.hypot(px - b.x, py - b.y) > b.r + 5) continue;
          if (b.vague) {
            combo++;
            const pts = 10 * g.mult();
            g.score += pts;
            burst(parts, b.x, b.y, ['#C4B5FD', '#ECE8FF', '#FBBF24'], 16);
            rings.push({ x: b.x, y: b.y, r: b.r, life: 1 });
            floats.push({ x: b.x, y: b.y, text: '+' + pts, color: '#fff', life: 1 });
            bubbles.splice(i, 1);
            mood = 'happy'; moodT = 320;
            if (combo % 4 === 0) { floats.push({ x: W / 2, y: H / 2, text: `Combo x${g.mult()}!`, color: '#FBBF24', life: 1.2 }); api.react('ready', 600); }
          } else if (!b.wrong) {
            b.wrong = true; b.v += 1.6;
            loseLife(b.x, b.y, 'keep that one!');
          }
          return;
        }
      },
      update(k) {
        time += k * 16.67;
        if ((spawnIn -= k) <= 0) { spawn(); spawnIn = Math.max(24, 64 - time / 1000); }
        bubbles = bubbles.filter(b => {
          b.y -= b.v * k;
          b.x = b.baseX + Math.sin(time / 650 + b.ph) * b.amp;
          if (b.y >= -b.r) return true;
          if (b.vague) loseLife(b.x, 22, 'it escaped!');
          else if (!b.wrong) { g.score += 2; floats.push({ x: clamp(b.x, 30, W - 30), y: 26, text: '+2', color: '#86EFAC', life: 0.8 }); }
          return false;
        });
        rings = rings.filter(r => (r.life -= 0.05 * k) > 0);
        if (moodT > 0 && (moodT -= k * 16.67) <= 0) mood = 'idle';
        flash = Math.max(0, flash - 0.05 * k);
      },
      draw(t, k, phase) {
        drawSky(ctx, W, H, stars, t);
        const ready = phase === 'ready';
        drawPip(ctx, ready ? W / 2 : 36, H - 8 + (ready ? Math.sin(t / 400) * 2 : 0), ready ? 0.58 : 0.42,
          ready ? 'idle' : mood, { blink: blinking(t), look: ready ? 0 : 2 });
        if (phase !== 'ready') {
          for (const b of bubbles) drawBubble(b, t);
          for (const r of rings) {
            ctx.strokeStyle = `rgba(236,232,255,${r.life})`;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(r.x, r.y, r.r + (1 - r.life) * 18, 0, TAU); ctx.stroke();
          }
          parts = stepParticles(ctx, parts, k);
          floats = stepFloats(ctx, floats, k);
        }
        if (flash > 0) { ctx.fillStyle = `rgba(244,63,94,${flash * 0.22})`; ctx.fillRect(0, 0, W, H); }
      }
    };

    function loseLife(x, y, text) {
      g.lives--; combo = 0; flash = 1; mood = 'hurt'; moodT = 650;
      floats.push({ x: clamp(x, 50, W - 50), y, text, color: '#FDA4AF', life: 1 });
      api.react('worried', 700);
      if (g.lives <= 0) g.over = true;
    }

    function spawn() {
      const vague = Math.random() < 0.55;
      const text = pick(vague ? VAGUE : CLEAR);
      ctx.font = '700 12px system-ui, sans-serif';
      const r = Math.max(21, ctx.measureText(text).width / 2 + 8);
      const x = r + 4 + Math.random() * (W - 2 * r - 8);
      bubbles.push({ text, vague, r, x, baseX: x, y: H + r, ph: Math.random() * TAU, amp: 5 + Math.random() * 9,
        v: 0.6 + Math.min(time / 1000, 100) * 0.018 + Math.random() * 0.35, wrong: false });
    }

    function drawBubble(b, t) {
      const wob = 1 + Math.sin(t / 220 + b.ph) * 0.025;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.scale(wob, 2 - wob);
      ctx.fillStyle = b.wrong ? 'rgba(251,113,133,.22)' : 'rgba(196,181,253,.14)';
      ctx.strokeStyle = b.wrong ? '#FB7185' : 'rgba(236,232,255,.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.38)';
      ctx.beginPath(); ctx.ellipse(-b.r * 0.4, -b.r * 0.45, b.r * 0.22, b.r * 0.12, -0.6, 0, TAU); ctx.fill();
      ctx.fillStyle = '#F5F3FF';
      ctx.font = '700 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, 0, 1);
      ctx.restore();
    }

    g.reset();
    return g;
  }

  return {
    id: 'pop',
    name: 'Vague pop',
    blurb: 'Pop the vague words before they float away. Leave the clear ones.',
    mount: (el, api) => canvasGame(el, api, {
      id: 'pop', name: 'Vague pop', W: 312, H: 300, create: vaguePop,
      label: 'Vague pop. Click vague words to pop them.',
      hint: 'Click the vague words to pop them before they escape. Clicking a clear word costs a life.'
    })
  };
})();
