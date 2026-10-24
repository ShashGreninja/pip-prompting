// Settings shared by the content script, popup and options page (chrome.storage.sync).
var PipSettings = (() => {
  const DEFAULTS = {
    showPip: true,
    hiddenSites: [],
    sleepAfter: 20, // seconds of inactivity before Pip dozes off
    profile: { stack: '', preferences: '', test_framework: '' }
  };

  async function load() {
    const s = await chrome.storage.sync.get(DEFAULTS);
    s.profile = { ...DEFAULTS.profile, ...s.profile };
    s.hiddenSites = Array.isArray(s.hiddenSites) ? s.hiddenSites : [];
    return s;
  }

  const save = patch => chrome.storage.sync.set(patch);

  function onChange(cb) {
    chrome.storage.onChanged.addListener((_, area) => { if (area === 'sync') load().then(cb); });
  }

  return { DEFAULTS, load, save, onChange };
})();
