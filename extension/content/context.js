// Reads context from the page (never changes it, except inserting a prompt the user asked for).
var PipContext = (() => {
  const LIMIT = 12000;
  const PR_RE = /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/;
  const CHAT_SELECTORS = [
    '#prompt-textarea',                          // ChatGPT
    'div.ProseMirror[contenteditable="true"]',   // Claude and other ProseMirror chats
    'rich-textarea .ql-editor',                  // Gemini
    'textarea[placeholder*="ask" i]',
    'textarea[placeholder*="message" i]'
  ];

  let ownHost = null;
  let lastEditable = null;
  let selSnapshot = '';

  const clip = (s, n = LIMIT) => (s.length > n ? s.slice(0, n) + '\n…[trimmed]' : s);
  const fmtN = n => n.toLocaleString();
  const isVisible = el => !!el && el.isConnected && el.getClientRects().length > 0;
  const isEditable = el => !!el && (
    el instanceof HTMLTextAreaElement ||
    (el instanceof HTMLInputElement && /^(text|search|)$/.test(el.type)) ||
    el.isContentEditable
  );

  document.addEventListener('focusin', e => {
    const path = e.composedPath();
    if (ownHost && path.includes(ownHost)) return;
    const el = path[0];
    if (isEditable(el)) lastEditable = el.isContentEditable ? el.closest('[contenteditable="true"]') || el : el;
  }, true);

  function setOwnHost(host) { ownHost = host; }

  // Clicking Pip can clear the page selection, so grab it on pointerdown first.
  function snapshotSelection() {
    const t = String(getSelection() || '').trim();
    if (t) selSnapshot = t;
  }
  function clearSelectionSnapshot() { selSnapshot = ''; }
  function selectionText() {
    const live = String(getSelection() || '').trim();
    return clip(live || selSnapshot);
  }

  function looksLikeCode(s) {
    return s.split('\n').length >= 2 &&
      /[{};]|=>|\bfunction\b|\bdef\b|\bclass\b|\bimport\b|\breturn\b|<\/?\w+>/.test(s);
  }

  function mainText() {
    const el = document.querySelector('main, article, [role="main"]') || document.body;
    return clip((el.innerText || '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim());
  }

  function designTokens() {
    const toHex = c => {
      const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
      if (!m || (m[4] !== undefined && +m[4] === 0)) return null;
      return '#' + [m[1], m[2], m[3]].map(n => (+n).toString(16).padStart(2, '0')).join('');
    };
    const add = (map, k) => { if (k) map.set(k, (map.get(k) || 0) + 1); };
    const top = (map, n) => [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(e => e[0]);
    const fonts = new Map(), text = new Map(), bg = new Map(), radii = new Map();

    const els = [document.body, ...document.querySelectorAll('h1,h2,h3,p,li,a,button,input,nav,header,section,div')]
      .filter(el => el !== ownHost).slice(0, 600);
    for (const el of els) {
      const cs = getComputedStyle(el);
      add(fonts, cs.fontFamily.split(',')[0].replace(/["']/g, '').trim());
      add(text, toHex(cs.color));
      add(bg, toHex(cs.backgroundColor));
      if (cs.borderTopLeftRadius !== '0px') add(radii, cs.borderTopLeftRadius);
    }
    const size = sel => { const el = document.querySelector(sel); return el ? getComputedStyle(el).fontSize : null; };
    const body = getComputedStyle(document.body);
    return [
      `- Fonts: ${top(fonts, 3).join(', ')}`,
      `- Headings: ${['h1', 'h2', 'h3'].filter(size).map(h => `${h} ${size(h)}`).join(', ') || 'none found'}`,
      `- Body text: ${body.fontSize}, line-height ${body.lineHeight}`,
      `- Text colors: ${top(text, 4).join(', ')}`,
      `- Background colors: ${top(bg, 4).join(', ') || 'transparent'}`,
      `- Corner radii: ${top(radii, 3).join(', ') || 'square corners'}`
    ].join('\n');
  }

  function consoleErrors() {
    return new Promise(resolve => {
      const done = errors => { clearTimeout(timer); removeEventListener('message', onMsg); resolve(errors); };
      const onMsg = e => { if (e.data && e.data.__pip === 'errors') done(e.data.errors || []); };
      const timer = setTimeout(() => done([]), 400);
      addEventListener('message', onMsg);
      window.postMessage({ __pip: 'get-errors' }, '*');
    });
  }

  async function ask(type, extra) {
    try {
      const r = await chrome.runtime.sendMessage({ type, ...extra });
      return r && r.ok ? r.data : null;
    } catch { return null; }
  }

  async function prDiff() {
    const m = location.href.match(PR_RE);
    if (!m) return '';
    const d = await ask('diff', { url: m[0] + '.diff' });
    return d ? clip(d, LIMIT * 2) : '';
  }

  const otherTabs = async () => (await ask('tabs')) || [];

  async function signals() {
    const url = location.href;
    const both = (url + ' ' + document.title).toLowerCase();
    const sel = selectionText();
    const codeSelected = !!sel && looksLikeCode(sel);
    const isDocs = /(^|[./])docs?\.|\/docs?(\/|$)|\/reference|\/api(\/|$)|developer|readthedocs|devdocs|\/guides?\//.test(url);
    const [errors, tabs] = await Promise.all([consoleErrors(), otherTabs()]);
    return {
      errors: errors.length,
      tabCount: tabs.length,
      isPR: PR_RE.test(url),
      isCode: /github\.com\/[^/]+\/[^/]+\/blob\/|gitlab\.com\/.+\/-\/blob\/|bitbucket\.org\/.+\/src\/|gist\.github\.com/.test(url),
      isDocs,
      isApi: /\bapi\b|endpoint|reference|graphql/.test(both),
      isMigration: /migrat|upgrad|changelog|release[- ]?notes|breaking[- ]changes/.test(both),
      isTicket: /atlassian\.net\/browse|linear\.app\/.+\/issue|github\.com\/[^/]+\/[^/]+\/issues\/\d+|trello\.com\/c\/|clickup\.com/.test(url),
      isDesign: /dribbble\.com|behance\.net|figma\.com|mobbin\.com|awwwards\.com|land-book\.com|godly\.website/.test(url),
      isAIChat: /chatgpt\.com|chat\.openai\.com|claude\.ai|gemini\.google\.com|perplexity\.ai|copilot\.microsoft\.com|chat\.deepseek\.com/.test(url),
      isWritingDoc: /docs\.google\.com\/document|notion\.so|hackmd\.io|medium\.com\/.*(new-story|edit)/.test(url),
      isArticle: !!document.querySelector('article'),
      textSelected: !!sel && !codeSelected,
      codeSelected
    };
  }

  // Gathers what a template lists under `context`. Returns the values and a
  // description of each piece so the panel can show (and let the user drop) it.
  async function gather(keys) {
    const page = { url: location.href, title: document.title };
    const meta = [];
    for (const key of keys) {
      switch (key) {
        case 'page.content': {
          const sel = selectionText();
          page.content = sel || mainText();
          meta.push({ key, ok: !!page.content,
            label: sel ? `Selected text (${fmtN(sel.length)} chars)` : `Page text (${fmtN(page.content.length)} chars)` });
          break;
        }
        case 'page.screenshot':
          meta.push({ key, ok: true, label: 'Screenshot of the visible page' });
          break;
        case 'page.design_tokens':
          page.design_tokens = designTokens();
          meta.push({ key, ok: true, label: 'Fonts and colors from this page' });
          break;
        case 'page.console_errors': {
          const errs = await consoleErrors();
          page.console_errors = errs.join('\n\n');
          meta.push({ key, ok: errs.length > 0, label: errs.length ? `Console errors (${errs.length})` : 'No console errors captured' });
          break;
        }
        case 'page.diff': {
          page.diff = await prDiff();
          meta.push({ key, ok: !!page.diff,
            label: page.diff ? `Pull request diff (${fmtN(page.diff.split('\n').length)} lines)` : 'No pull request diff on this page' });
          break;
        }
        case 'page.tabs': {
          const tabs = await otherTabs();
          page.tabs = tabs.map(t => `- ${t.title} (${t.url})`).join('\n');
          meta.push({ key, ok: tabs.length > 0, label: tabs.length ? `Your other tabs (${tabs.length})` : 'No other tabs open' });
          break;
        }
      }
    }
    return { page, meta };
  }

  // strict: only real chat boxes, never "the last thing you typed in" (used for
  // handoffs, where that could be a sign-in field).
  function findChatBox({ strict = false } = {}) {
    for (const sel of CHAT_SELECTORS) {
      const el = document.querySelector(sel);
      if (isVisible(el)) return el;
    }
    return !strict && isVisible(lastEditable) ? lastEditable : null;
  }

  // The AI chat site this page belongs to, if it's one Pip can hand prompts to.
  function chatSite() {
    return { 'chatgpt.com': 'ChatGPT', 'claude.ai': 'Claude' }[location.hostname] || '';
  }

  function getDraft(box) {
    if (!box) return '';
    return box instanceof HTMLTextAreaElement || box instanceof HTMLInputElement ? box.value : box.innerText;
  }

  // Puts text in the chat box. Never submits it.
  function insert(box, text, { replace = false } = {}) {
    box.focus();
    if (box instanceof HTMLTextAreaElement || box instanceof HTMLInputElement) {
      const proto = box instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setValue = Object.getOwnPropertyDescriptor(proto, 'value').set;
      setValue.call(box, replace || !box.value.trim() ? text : box.value + '\n\n' + text);
      box.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    const hasText = box.innerText.trim().length > 0;
    const range = document.createRange();
    range.selectNodeContents(box);
    if (!replace) range.collapse(false);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    const ok = document.execCommand('insertText', false, (!replace && hasText ? '\n\n' : '') + text);
    if (!ok) {
      box.textContent = text;
      box.dispatchEvent(new InputEvent('input', { bubbles: true }));
    }
  }

  return {
    setOwnHost, snapshotSelection, clearSelectionSnapshot, signals, gather,
    findChatBox, chatSite, getDraft, insert
  };
})();
