(async () => {
  const $ = id => document.getElementById(id);

  // Pip, awake and idle, in the popup.
  const style = document.createElement('style');
  style.textContent = PipArt.CSS;
  document.head.appendChild(style);
  $('avatar').innerHTML = `<div class="pip-wrap" data-state="idle" data-tod="${PipArt.timeOfDay()}" style="width:52px;height:52px">${PipArt.SVG}</div>`;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let hostname = '';
  try { hostname = new URL(tab.url).hostname; } catch {}
  const pageOk = /^https?:/.test((tab && tab.url) || '');

  let settings = await PipSettings.load();
  $('show').checked = settings.showPip;
  $('host').textContent = hostname || 'this site';
  $('hideHere').checked = settings.hiddenSites.includes(hostname);
  $('hideHere').disabled = !pageOk;
  $('wake').disabled = !pageOk;
  if (!pageOk) $('wake').textContent = 'Pip can’t run on this page';

  const commands = await chrome.commands.getAll();
  const toggle = commands.find(c => c.name === 'toggle-pip');
  if (toggle && toggle.shortcut) $('shortcut').textContent = toggle.shortcut;

  $('show').addEventListener('change', e => PipSettings.save({ showPip: e.target.checked }));
  $('hideHere').addEventListener('change', async e => {
    settings = await PipSettings.load();
    const set = new Set(settings.hiddenSites);
    e.target.checked ? set.add(hostname) : set.delete(hostname);
    PipSettings.save({ hiddenSites: [...set] });
  });
  $('wake').addEventListener('click', async () => {
    try { await chrome.tabs.sendMessage(tab.id, { type: 'toggle' }); } catch {}
    window.close();
  });
  $('settings').addEventListener('click', e => { e.preventDefault(); chrome.runtime.openOptionsPage(); });
})();
