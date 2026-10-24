// Pip pairs: a flip-card matching game with Pip's moods. Score from flips and time.
var PipPairs = (() => {
  const { shuffle, getBest, recordBest } = PipGameKit;

  const INK = '#221A45';
  const FACES = {
    happy: `<path d="M16 24 Q20 18 24 24 M32 24 Q36 18 40 24"/><path d="M23 30 Q28 37 33 30 Z" fill="${INK}"/>`,
    sleepy: `<path d="M16 23 Q20 27 24 23 M32 23 Q36 27 40 23 M26 32 Q28 33.5 30 32"/><text x="43" y="13" font-size="9" font-weight="700" fill="${INK}" stroke="none">z</text>`,
    surprised: `<circle cx="20" cy="22" r="3.2" fill="${INK}" stroke="none"/><circle cx="36" cy="22" r="3.2" fill="${INK}" stroke="none"/><ellipse cx="28" cy="33" rx="3" ry="4" fill="${INK}" stroke="none"/>`,
    curious: `<ellipse cx="20" cy="23" rx="2.8" ry="3.6" fill="${INK}" stroke="none"/><ellipse cx="36" cy="23" rx="2.8" ry="3.6" fill="${INK}" stroke="none"/><path d="M15 16 L24 16 M32 15 Q36 11 41 14 M22 33 q3 -2.5 6 0 q3 2.5 6 0"/>`,
    cheeky: `<ellipse cx="20" cy="23" rx="2.8" ry="3.6" fill="${INK}" stroke="none"/><path d="M32 23 Q36 27 40 23 M23 31 Q28 35 33 31"/>`,
    worried: `<ellipse cx="20" cy="24" rx="2.8" ry="3.6" fill="${INK}" stroke="none"/><ellipse cx="36" cy="24" rx="2.8" ry="3.6" fill="${INK}" stroke="none"/><path d="M16 17 L23 14 M33 14 L40 17 M22 34 q3 -2.5 6 0 q3 2.5 6 0"/>`
  };
  const face = mood => `<svg viewBox="0 0 56 52" aria-hidden="true">
    <path d="M14 42 L9 50 L22 44 Z" fill="#6E5EE0"/>
    <rect x="4" y="8" width="48" height="36" rx="16" fill="#8B7CF6"/>
    <path d="M28 8 Q27 4 30 1" fill="none" stroke="#6E5EE0" stroke-width="1.6" stroke-linecap="round"/>
    <circle cx="30.5" cy="1.8" r="1.8" fill="#FBBF24"/>
    <ellipse cx="13" cy="32" rx="3.5" ry="2" fill="#F9A8D4" opacity=".85"/><ellipse cx="43" cy="32" rx="3.5" ry="2" fill="#F9A8D4" opacity=".85"/>
    <g fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round">${FACES[mood]}</g></svg>`;

  function pipPairs(el, api) {
    const moods = Object.keys(FACES);
    let deck, open, flips, matched, lock, startT, tick, alive = true;

    const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    const secs = () => (startT ? Math.floor((Date.now() - startT) / 1000) : 0);
    const scoreNow = () => Math.max(100, Math.round(1000 - Math.max(0, flips - moods.length) * 45 - secs() * 6));

    function render() {
      deck = shuffle([...moods, ...moods]);
      open = []; flips = 0; matched = 0; lock = false; startT = 0;
      clearInterval(tick);
      el.innerHTML = `<div class="g-hud">
          <span class="pill">Time <b data-time>0:00</b></span>
          <span class="pill">Flips <b data-flips>0</b></span>
          <span class="pill">Best <b data-best>–</b></span>
        </div>
        <div class="g-board"><div class="g-grid">${deck.map((m, i) => `<button class="g-card" data-i="${i}" aria-label="Hidden card">
          <span class="in"><span class="face back">✦</span><span class="face front">${face(m)}<small>${m}</small></span></span>
        </button>`).join('')}</div></div>
        <p class="hint">Flip two cards to find Pip's matching moods. The clock starts on your first flip.</p>`;
      getBest('pairs').then(b => { if (b && alive) el.querySelector('[data-best]').textContent = b; });
      const cards = [...el.querySelectorAll('.g-card')];
      cards.forEach(card => card.addEventListener('click', () => flip(card)));
      cards[0].focus();
    }

    function flip(card) {
      if (lock || card.hasAttribute('data-open') || card.hasAttribute('data-done')) return;
      if (!startT) {
        startT = Date.now();
        tick = setInterval(() => { if (alive) el.querySelector('[data-time]').textContent = fmtTime(secs()); }, 500);
      }
      card.setAttribute('data-open', '');
      card.setAttribute('aria-label', deck[card.dataset.i] + ' Pip');
      open.push(card);
      if (open.length < 2) return;
      flips++;
      el.querySelector('[data-flips]').textContent = flips;
      const [a, b] = open;
      open = [];
      if (deck[a.dataset.i] === deck[b.dataset.i]) {
        matched++;
        setTimeout(() => {
          [a, b].forEach(c => { c.removeAttribute('data-open'); c.setAttribute('data-done', ''); c.classList.add('pop'); });
        }, 250);
        api.react('ready', 600);
        if (matched === moods.length) setTimeout(finish, 800);
      } else {
        lock = true;
        setTimeout(() => { if (alive) [a, b].forEach(c => c.classList.add('shake')); }, 300);
        api.react('hmm', 600);
        setTimeout(() => {
          if (!alive) return;
          [a, b].forEach(c => { c.classList.remove('shake'); c.removeAttribute('data-open'); c.setAttribute('aria-label', 'Hidden card'); });
          lock = false;
        }, 850);
      }
    }

    async function finish() {
      if (!alive) return;
      clearInterval(tick);
      const score = scoreNow();
      const time = fmtTime(secs());
      const { best, isNew } = await recordBest('pairs', score);
      const stars = score >= 800 ? 3 : score >= 550 ? 2 : 1;
      api.react(isNew ? 'ready' : 'idle', 1200);
      const board = el.querySelector('.g-board');
      board.insertAdjacentHTML('beforeend', `<div class="g-over"><div class="g-over-card">
          <div class="g-stars">${'★'.repeat(stars)}<span class="off">${'★'.repeat(3 - stars)}</span></div>
          <h2>${score}</h2>
          <p>${isNew ? '<span class="g-new">NEW BEST!</span>' : `<span class="hint">Best: ${best}</span>`}</p>
          <p class="hint">${flips} flips in ${time}</p>
          <button class="primary" data-act="game-again">Play again</button>
        </div></div>`);
      board.querySelector('.primary').focus();
    }

    render();
    return () => { alive = false; clearInterval(tick); };
  }

  return {
    id: 'pairs',
    name: 'Pip pairs',
    blurb: "Match Pip's moods. Fewer flips and less time score higher.",
    mount: pipPairs
  };
})();
