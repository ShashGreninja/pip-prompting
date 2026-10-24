// Service worker: loads templates and does the things content scripts can't
// (screenshots, other tabs, cross-origin PR diffs). It never sends prompts anywhere.
importScripts('shared/frontmatter.js');

const PR_DIFF_RE = /^https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+\.diff$/;
const HANDOFF_URLS = { chatgpt: 'https://chatgpt.com/', claude: 'https://claude.ai/new' };
const HANDOFF_TTL = 15 * 60 * 1000;
let templatesPromise = null;

// A prompt waiting to be pasted into a ChatGPT/Claude tab Pip opened. It lives only
// in local extension storage, for that one tab, and is deleted once pasted.
async function pendingHandoff(tabId) {
  const { pipHandoff: h } = await chrome.storage.local.get('pipHandoff');
  if (!h || h.tabId !== tabId) return null;
  if (Date.now() - h.at > HANDOFF_TTL) { await chrome.storage.local.remove('pipHandoff'); return null; }
  return h;
}

async function loadTemplates() {
  const files = await (await fetch(chrome.runtime.getURL('templates/index.json'))).json();
  return Promise.all(files.map(async f => {
    const md = await (await fetch(chrome.runtime.getURL('templates/' + f))).text();
    return PipFrontmatter.parse(md);
  }));
}

async function handle(msg, sender) {
  switch (msg.type) {
    case 'templates':
      templatesPromise = templatesPromise || loadTemplates().catch(e => { templatesPromise = null; throw e; });
      return templatesPromise;
    case 'screenshot':
      return chrome.tabs.captureVisibleTab(sender.tab.windowId, { format: 'png' });
    case 'tabs': {
      const tabs = await chrome.tabs.query({ windowId: sender.tab.windowId });
      return tabs
        .filter(t => t.id !== sender.tab.id && /^https?:/.test(t.url || ''))
        .map(t => ({ title: t.title, url: t.url }));
    }
    case 'diff': {
      if (!PR_DIFF_RE.test(msg.url)) throw new Error('Not a GitHub pull request diff URL');
      const r = await fetch(msg.url, { credentials: 'include' });
      if (!r.ok) throw new Error('GitHub returned ' + r.status);
      return r.text();
    }
    case 'handoff': {
      const url = HANDOFF_URLS[msg.target];
      if (!url) throw new Error('Unknown chat site');
      const tab = await chrome.tabs.create({ url, index: sender.tab.index + 1, openerTabId: sender.tab.id });
      await chrome.storage.local.set({ pipHandoff: { tabId: tab.id, text: String(msg.text).slice(0, 100000), at: Date.now() } });
      return true;
    }
    case 'claim-handoff': {
      const h = await pendingHandoff(sender.tab.id);
      return h ? h.text : null;
    }
    case 'handoff-done':
      if (await pendingHandoff(sender.tab.id)) await chrome.storage.local.remove('pipHandoff');
      return true;
    case 'open-options':
      chrome.runtime.openOptionsPage();
      return true;
    default:
      throw new Error('Unknown message: ' + msg.type);
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handle(msg, sender).then(
    data => sendResponse({ ok: true, data }),
    err => sendResponse({ ok: false, error: String((err && err.message) || err) })
  );
  return true; // keep the channel open for the async response
});

chrome.tabs.onRemoved.addListener(async tabId => {
  if (await pendingHandoff(tabId)) chrome.storage.local.remove('pipHandoff');
});

chrome.commands.onCommand.addListener(async cmd => {
  if (cmd !== 'toggle-pip') return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) chrome.tabs.sendMessage(tab.id, { type: 'toggle' }).catch(() => {});
});
