// Pip: the sleeping helper in the bottom-right corner and its panel.
// Flow: sleeping -> click -> waking -> panel (pick template) -> prompt -> insert/copy.
// Pip only ever writes prompts into the chat box or clipboard. It never sends them.
(() => {
  if (window.top !== window || document.getElementById('pip-root')) return;

  const host = document.createElement('div');
  host.id = 'pip-root';
  host.style.cssText = 'all:initial;position:fixed;right:16px;bottom:12px;z-index:2147483646;width:72px;height:72px;';
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `<style>${PipArt.CSS}${PipPanelCSS}${PipGames.CSS}</style>
    <div class="panel" role="dialog" aria-label="Pip prompt helper"></div>
    <div class="pip-wrap" data-state="sleeping" role="button" tabindex="0" title="Pip: click to wake"
      aria-label="Pip is asleep. Click to wake.">${PipArt.SVG}</div>`;
  document.documentElement.appendChild(host);
  PipContext.setOwnHost(host);

  const pip = root.querySelector('.pip-wrap');
  const panel = root.querySelector('.panel');
  const AWAKE = ['idle', 'listening', 'thinking', 'hmm', 'ready', 'worried'];
  const GREETINGS = {
    morning: 'Morning! What are we prompting?',
    day: 'Hi! What are we prompting?',
    evening: 'Evening! What are we prompting?',
    night: 'Late one, huh? What are we prompting?'
  };

  let settings = PipSettings.DEFAULTS;
  let shownByShortcut = false;
  let view = {};
  let timers = [];
  let reactTimer = 0;

  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const isOpen = () => panel.classList.contains('open');
  const state = () => pip.dataset.state;

  // ---------- visibility ----------
  function applyVisibility() {
    const hiddenHere = settings.hiddenSites.includes(location.hostname);
    const visible = shownByShortcut || (settings.showPip && !hiddenHere);
    host.style.display = visible && !document.fullscreenElement ? '' : 'none';
  }
  document.addEventListener('fullscreenchange', applyVisibility);
  PipSettings.load().then(s => { settings = s; applyVisibility(); });
  PipSettings.onChange(s => { settings = s; applyVisibility(); });

  // ---------- states ----------
  function setState(s) {
    pip.dataset.state = '';
    void pip.getBoundingClientRect(); // restart CSS animations when re-entering a state
    pip.dataset.state = s;
    pip.dataset.tod = PipArt.timeOfDay();
    pip.setAttribute('aria-label', s === 'sleeping' ? 'Pip is asleep. Click to wake.' : 'Pip, your prompt helper');
    pip.title = s === 'sleeping' ? 'Pip: click to wake' : 'Pip';
  }

  function goToSleepLater() {
    later(() => {
      setState('yawning');
      later(() => {
        setState('sleeping');
        if (shownByShortcut) { shownByShortcut = false; applyVisibility(); }
      }, 1400);
    }, Math.max(3, settings.sleepAfter) * 1000);
  }

  function squish() {
    const s = root.querySelector('.squisher');
    s.classList.remove('squish');
    void s.getBoundingClientRect();
    s.classList.add('squish');
  }

  function openPanel() {
    panel.classList.add('open');
    showHome();
  }

  // Stops whatever the current view runs (e.g. a game loop) before switching away.
  function leaveView() {
    if (view.cleanup) view.cleanup();
    clearTimeout(reactTimer);
  }

  function closePanel() {
    leaveView();
    view = {};
    panel.classList.remove('open');
    PipContext.clearSelectionSnapshot();
    clearTimers();
    setState('idle');
    goToSleepLater();
  }

  function wake() {
    clearTimers();
    setState('waking');
    later(() => { setState('listening'); openPanel(); }, 750);
  }

  function onPipClick() {
    if (state() === 'sleeping' || state() === 'yawning') return wake();
    squish();
    if (isOpen()) return closePanel();
    clearTimers();
    setState('listening');
    openPanel();
  }

  host.addEventListener('pointerdown', () => PipContext.snapshotSelection(), true);
  pip.addEventListener('click', onPipClick);
  pip.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPipClick(); }
  });
  // Keep our typing away from the page's own keyboard shortcuts.
  for (const type of ['keydown', 'keyup', 'keypress']) {
    root.addEventListener(type, e => {
      if (type === 'keydown' && e.key === 'Escape' && isOpen()) closePanel();
      e.stopPropagation();
    });
  }

  chrome.runtime.onMessage.addListener(msg => {
    if (msg.type !== 'toggle') return;
    PipContext.snapshotSelection();
    if (host.style.display === 'none') { shownByShortcut = true; applyVisibility(); }
    if (state() === 'sleeping' || state() === 'yawning') wake();
    else if (isOpen()) closePanel();
    else { clearTimers(); setState('listening'); openPanel(); }
  });

  // Occasional blinks while awake.
  (function blinkLoop() {
    setTimeout(() => {
      if (!document.hidden && AWAKE.includes(state())) {
        pip.classList.add('blink');
        setTimeout(() => pip.classList.remove('blink'), 140);
      }
      blinkLoop();
    }, 2500 + Math.random() * 3500);
  })();

  // Eyes follow the cursor a little while awake. Never while asleep.
  let raf = 0;
  document.addEventListener('mousemove', e => {
    if (raf || !['idle', 'listening'].includes(state())) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      const r = pip.getBoundingClientRect();
      const clamp = v => Math.max(-1, Math.min(1, v));
      pip.style.setProperty('--lx', clamp((e.clientX - (r.left + r.width / 2)) / 300) * 2.5 + 'px');
      pip.style.setProperty('--ly', clamp((e.clientY - (r.top + r.height / 2)) / 300) * 2.5 + 'px');
    });
  }, { passive: true });

  // ---------- panel views ----------
  const header = (title, back, backAct = 'home') => `<header>
      ${back ? `<button class="icon" data-act="${backAct}" aria-label="Back">&larr;</button>` : ''}
      <h2>${esc(title)}</h2>
      <button class="icon" data-act="close" aria-label="Close">&times;</button>
    </header>`;

  function fail(message) {
    clearTimers();
    setState('worried');
    panel.innerHTML = `${header('Hmm, that didn’t work', true)}<p class="note">${esc(message)}</p>`;
  }

  async function showHome() {
    leaveView();
    view = { name: 'home' };
    panel.innerHTML = `${header(GREETINGS[PipArt.timeOfDay()])}
      <input class="search" type="search" placeholder="Search templates" aria-label="Search templates">
      <div data-list><p class="hint">Looking at this page…</p></div>
      <div data-draft></div>
      <footer>
        <button class="link" data-act="settings">Settings</button>
        <button class="link" data-act="games">Play with Pip</button>
        <button class="link" data-act="hide-site">Hide on this site</button>
      </footer>`;

    let templates, signals;
    try {
      [templates, signals] = await Promise.all([PipTemplates.all(), PipContext.signals()]);
    } catch (e) {
      return fail('I couldn’t load my templates. Try reloading the page. (' + e.message + ')');
    }
    if (view.name !== 'home') return;
    const ranked = PipTemplates.suggest(templates, signals);
    const list = panel.querySelector('[data-list]');
    const renderList = mode => {
      const q = mode.startsWith('q:') ? mode.slice(2).toLowerCase() : '';
      const items = q
        ? templates.filter(t => `${t.name} ${t.category} ${t.id}`.toLowerCase().includes(q))
        : mode === 'all' ? templates : ranked.slice(0, 3);
      const title = q ? 'Templates' : mode === 'all' ? 'All templates' : 'Suggested for this page';
      list.innerHTML = `<p class="sec">${title}</p>` +
        (items.map(t => `<button class="item" data-id="${esc(t.id)}">${esc(t.name)}${
          !q && mode !== 'all' && t.reason ? `<small>${esc(t.reason)}</small>` : ''}</button>`).join('') ||
          '<p class="hint">No templates match.</p>') +
        (mode === 'suggested' ? `<button class="link" data-act="all">Browse all ${templates.length}</button>` : '');
    };
    renderList('suggested');
    view.renderList = renderList;
    panel.querySelector('.search').addEventListener('input', e => {
      const v = e.target.value.trim();
      renderList(v ? 'q:' + v : 'suggested');
    });

    const draft = PipContext.getDraft(PipContext.findChatBox()).trim();
    if (draft) {
      panel.querySelector('[data-draft]').innerHTML =
        `<button class="dashed" data-act="draft">Check my draft<small>“${esc(draft.slice(0, 60))}”</small></button>`;
    }
  }

  async function showTemplate(id) {
    const t = (await PipTemplates.all()).find(x => x.id === id);
    if (!t) return;
    clearTimers();
    setState('thinking');
    view = { name: 'template', t };
    panel.innerHTML = `${header(t.name, true)}<p class="hint">Reading the page…</p>`;

    const ctx = await PipContext.gather(t.context);
    if (view.t !== t) return;
    const meta = [...ctx.meta];
    if (t.body.includes('profile.stack')) {
      const stack = settings.profile.stack;
      meta.push({ key: 'profile.stack', ok: !!stack, label: stack ? `Your stack: ${stack}` : 'No stack saved yet' });
    }
    view.ctx = ctx;
    view.include = new Set(meta.filter(m => m.ok).map(m => m.key));
    setState('listening');

    const fields = PipTemplates.asks(t, settings.profile).map(a => `<label class="q"><span>${esc(a.label)}</span>${
      a.options
        ? `<div class="chips" data-ask="${esc(a.key)}">${a.options.map(o =>
            `<button type="button" class="chip" aria-pressed="false" data-opt="${esc(o)}">${esc(o)}</button>`).join('')}</div>`
        : `<input class="field" data-ask="${esc(a.key)}" value="${esc(a.default)}" placeholder="Optional">`
    }</label>`).join('');

    panel.innerHTML = `${header(t.name, true)}
      ${fields}
      ${meta.length ? `<p class="sec">Pip will include</p><div>${meta.map(m =>
        `<button class="cchip" data-ctx="${esc(m.key)}" aria-pressed="${m.ok}" ${m.ok ? '' : 'disabled'}><span class="mk">${m.ok ? '✓' : '–'}</span>${esc(m.label)}</button>`
      ).join('')}</div>` : ''}
      ${meta.some(m => m.key === 'profile.stack' && !m.ok) ? '<p class="hint">Save your stack once in <button class="link" data-act="settings">Settings</button> and Pip adds it to every prompt.</p>' : ''}
      <div class="actions"><button class="primary" data-act="write">Write my prompt</button></div>`;
    const first = panel.querySelector('.field, .chip');
    if (first) first.focus();
  }

  async function captureScreenshot() {
    host.style.visibility = 'hidden';
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      const r = await chrome.runtime.sendMessage({ type: 'screenshot' });
      if (!r || !r.ok) throw new Error((r && r.error) || 'Screenshot failed');
      return r.data;
    } finally {
      host.style.visibility = '';
    }
  }

  async function writePrompt() {
    const { t, ctx, include } = view;
    const answers = {};
    panel.querySelectorAll('[data-ask]').forEach(el => {
      answers[el.dataset.ask] = el.classList.contains('chips')
        ? [...el.querySelectorAll('[aria-pressed="true"]')].map(b => b.dataset.opt).join(', ')
        : el.value.trim();
    });
    const page = { ...ctx.page };
    for (const m of ctx.meta) if (!include.has(m.key)) delete page[m.key.slice(5)];
    const profile = { ...settings.profile };
    if (!include.has('profile.stack')) profile.stack = '';

    setState('thinking');
    let shot = null;
    let shotError = '';
    if (include.has('page.screenshot')) {
      try { shot = await captureScreenshot(); } catch (e) { shotError = e.message; }
    }
    showResult(PipTemplates.render(t, { page, profile, ask: answers }), shot, shotError);
  }

  function showResult(text, shot, shotError) {
    const box = PipContext.findChatBox();
    view = { ...view, name: 'result', shot };
    setState('listening');
    panel.innerHTML = `${header('Your prompt', true)}
      <textarea class="out" aria-label="Your prompt">${esc(text)}</textarea>
      ${shot ? `<div class="shot"><img alt="Screenshot of this page" src="${shot}">
        <div><button class="secondary" data-act="copy-shot">Copy screenshot</button><a download="page.png" href="${shot}">Save</a>
        <p class="hint">Paste it into your chat along with the prompt.</p></div></div>` : ''}
      ${shotError ? `<p class="note">I couldn’t take a screenshot here (${esc(shotError)}). You can attach one yourself.</p>` : ''}
      <div class="actions">
        ${box ? '<button class="primary" data-act="insert">Insert into chat box</button><button class="secondary" data-act="copy">Copy</button>'
              : '<button class="primary" data-act="copy">Copy prompt</button>'}
      </div>
      <div class="handoff"><span>Open in</span>
        <button class="secondary sm" data-act="handoff" data-target="chatgpt">ChatGPT ↗</button>
        <button class="secondary sm" data-act="handoff" data-target="claude">Claude ↗</button>
      </div>
      <p class="status" aria-live="polite"></p>
      <p class="hint">${box ? 'Pip never sends anything. Review the prompt and press Enter yourself.'
                            : 'No chat box on this page. Copy it, or open a new chat and Pip pastes it there. You still press Enter.'}</p>`;
  }

  async function handoff(target) {
    const text = panel.querySelector('.out').value;
    await copyText(text); // backup in case the new tab needs a sign-in first
    const r = await chrome.runtime.sendMessage({ type: 'handoff', target, text }).catch(() => null);
    if (!r || !r.ok) {
      panel.querySelector('.status').textContent = 'Couldn’t open a new tab. The prompt is copied, so paste it there yourself.';
      return;
    }
    celebrate(`Opening ${target === 'claude' ? 'Claude' : 'ChatGPT'}… Pip will paste it there. It's on your clipboard too.`, true);
  }

  // On ChatGPT/Claude: paste a prompt the user sent here from another tab.
  // Waits through sign-in, and only ever uses the site's real chat box.
  async function receiveHandoff() {
    const site = PipContext.chatSite();
    if (!site) return;
    let text = null;
    for (let i = 0; i < 3 && !text; i++) {
      if (i) await new Promise(r => setTimeout(r, 800)); // the opener may still be saving it
      const r = await chrome.runtime.sendMessage({ type: 'claim-handoff' }).catch(() => null);
      text = r && r.ok ? r.data : null;
    }
    if (!text) return;

    const started = Date.now();
    let seenAt = 0, attempts = 0, hinted = false;
    const iv = setInterval(() => {
      const box = PipContext.findChatBox({ strict: true });
      if (!box) {
        seenAt = 0;
        if (!hinted && Date.now() - started > 4000) {
          hinted = true;
          notice(`Sign in to ${site} and I'll paste your prompt as soon as the chat box appears. It's on your clipboard too.`, 'hmm', false);
        }
        if (Date.now() - started > 15 * 60 * 1000) clearInterval(iv);
        return;
      }
      if (!seenAt) { seenAt = Date.now(); return; }
      if (Date.now() - seenAt < 800) return; // let the editor finish setting up
      const probe = text.trim().split('\n')[0].slice(0, 20); // first line survives editors' newline handling
      if (!PipContext.getDraft(box).includes(probe)) PipContext.insert(box, text);
      if (PipContext.getDraft(box).includes(probe) || ++attempts >= 5) {
        clearInterval(iv);
        chrome.runtime.sendMessage({ type: 'handoff-done' }).catch(() => {});
        notice(`Your prompt is in ${site}'s chat box. Review it, then press Enter yourself.`, 'ready', true);
      }
    }, 500);
  }

  function notice(message, mood, autoClose) {
    leaveView();
    clearTimers();
    shownByShortcut = true;
    applyVisibility();
    view = { name: 'notice' };
    setState(mood);
    panel.innerHTML = `${header('Pip')}<p class="note">${esc(message)}</p>`;
    panel.classList.add('open');
    if (autoClose) later(closePanel, 5000);
  }

  function celebrate(message, closeAfter) {
    clearTimers();
    setState('ready');
    const status = panel.querySelector('.status');
    if (status) status.textContent = message;
    later(() => { if (closeAfter) closePanel(); else setState('listening'); }, closeAfter ? 1500 : 2200);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      root.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  }

  async function copyShot() {
    try {
      const blob = await (await fetch(view.shot)).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      celebrate('Screenshot copied. Paste it into your chat.', false);
    } catch {
      panel.querySelector('.status').textContent = 'Couldn’t copy the image here. Use Save instead.';
    }
  }

  async function showDraft() {
    const box = PipContext.findChatBox();
    const draft = PipContext.getDraft(box).trim();
    if (!box || !draft) return showHome();
    const lint = PipTemplates.lintDraft(draft);
    const related = PipTemplates.matchDraft(await PipTemplates.all(), draft);
    view = { name: 'draft', box, draft, lint };
    clearTimers();
    setState(lint.ok ? 'ready' : 'hmm');
    panel.innerHTML = `${header(lint.ok ? 'Your draft looks solid' : 'Your draft could be sharper', true)}
      ${lint.checks.map(c => `<div class="check"><span class="${c.ok ? 'y' : 'n'}">${c.ok ? '✓' : '✗'}</span>${esc(c.label)}</div>`).join('')}
      ${lint.notes.map(n => `<p class="note">${esc(n)}</p>`).join('')}
      ${lint.ok ? '' : `<div class="actions"><button class="primary" data-act="scaffold">Add the missing pieces</button></div>
        <p class="hint">Adds labelled blanks under your draft for you to fill in. Nothing is sent.</p>`}
      ${related.length ? `<p class="sec">Or start from a template</p>${related.map(t =>
        `<button class="item" data-id="${esc(t.id)}">${esc(t.name)}</button>`).join('')}` : ''}
      <p class="status" aria-live="polite"></p>`;
  }

  function showGames() {
    leaveView();
    clearTimers();
    setState('listening');
    view = { name: 'games' };
    panel.innerHTML = `${header('Play with Pip', true)}
      ${PipGames.LIST.map(g => `<button class="item" data-game="${g.id}">${esc(g.name)}<small>${esc(g.blurb)}</small></button>`).join('')}
      <p class="hint">Quick games, a minute or two each. Pip cheers you on.</p>`;
  }

  function startGame(id) {
    leaveView();
    const game = PipGames.LIST.find(g => g.id === id);
    panel.innerHTML = `${header(game.name, true, 'games')}<div class="game"></div>`;
    const api = {
      react(s, ms) {
        clearTimeout(reactTimer);
        setState(s);
        reactTimer = setTimeout(() => { if (view.name === 'game') setState('listening'); }, ms);
      }
    };
    view = { name: 'game', id };
    view.cleanup = PipGames.mount(id, panel.querySelector('.game'), api);
  }

  panel.addEventListener('click', async e => {
    const el = e.target.closest('button');
    if (!el) return;
    if (el.classList.contains('chip')) {
      el.setAttribute('aria-pressed', el.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      return;
    }
    if (el.dataset.ctx) {
      const on = el.getAttribute('aria-pressed') !== 'true';
      el.setAttribute('aria-pressed', String(on));
      el.querySelector('.mk').textContent = on ? '✓' : '✕';
      view.include[on ? 'add' : 'delete'](el.dataset.ctx);
      return;
    }
    if (el.dataset.id) return showTemplate(el.dataset.id);
    if (el.dataset.game) return startGame(el.dataset.game);

    switch (el.dataset.act) {
      case 'handoff': return handoff(el.dataset.target);
      case 'games': return showGames();
      case 'game-again': return startGame(view.id);
      case 'close': return closePanel();
      case 'home': clearTimers(); setState('listening'); return showHome();
      case 'all': return view.renderList && view.renderList('all');
      case 'draft': return showDraft();
      case 'write': return writePrompt();
      case 'settings': return chrome.runtime.sendMessage({ type: 'open-options' });
      case 'hide-site':
        await PipSettings.save({ hiddenSites: [...new Set([...settings.hiddenSites, location.hostname])] });
        shownByShortcut = false;
        panel.classList.remove('open');
        clearTimers();
        setState('sleeping');
        return;
      case 'insert': {
        const box = PipContext.findChatBox();
        if (!box) return;
        PipContext.insert(box, panel.querySelector('.out').value);
        return celebrate('Inserted. Review it, then press Enter yourself.', true);
      }
      case 'copy':
        await copyText(panel.querySelector('.out').value);
        return celebrate('Copied! Paste it into your AI chat.', false);
      case 'copy-shot': return copyShot();
      case 'scaffold':
        PipContext.insert(view.box, PipTemplates.scaffold(view.draft, view.lint, settings.profile), { replace: true });
        return celebrate('Added. Fill in the [blanks] in your chat box.', true);
    }
  });

  setState('sleeping');
  receiveHandoff();
})();
