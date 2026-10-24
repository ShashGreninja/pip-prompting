(async () => {
  const $ = id => document.getElementById(id);
  const PROFILE_FIELDS = ['stack', 'preferences', 'test_framework'];
  let settings = await PipSettings.load();
  let savedTimer = 0;

  function flashSaved() {
    $('saved').textContent = 'Saved.';
    clearTimeout(savedTimer);
    savedTimer = setTimeout(() => { $('saved').textContent = ''; }, 1500);
  }

  async function save(patch) {
    await PipSettings.save(patch);
    settings = { ...settings, ...patch };
    flashSaved();
  }

  function renderSites() {
    $('sites').innerHTML = '';
    for (const site of settings.hiddenSites) {
      const li = document.createElement('li');
      li.textContent = site;
      const btn = document.createElement('button');
      btn.textContent = 'Show again';
      btn.addEventListener('click', async () => {
        await save({ hiddenSites: settings.hiddenSites.filter(s => s !== site) });
        renderSites();
      });
      li.appendChild(btn);
      $('sites').appendChild(li);
    }
    $('noSites').hidden = settings.hiddenSites.length > 0;
  }

  for (const key of PROFILE_FIELDS) {
    $(key).value = settings.profile[key] || '';
    let t = 0;
    $(key).addEventListener('input', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const profile = { ...settings.profile };
        for (const k of PROFILE_FIELDS) profile[k] = $(k).value.trim();
        save({ profile });
      }, 400);
    });
  }

  $('showPip').checked = settings.showPip;
  $('showPip').addEventListener('change', e => save({ showPip: e.target.checked }));

  const sleepSel = $('sleepAfter');
  if (![...sleepSel.options].some(o => +o.value === settings.sleepAfter)) {
    sleepSel.add(new Option(`${settings.sleepAfter} seconds`, settings.sleepAfter));
  }
  sleepSel.value = String(settings.sleepAfter);
  sleepSel.addEventListener('change', e => save({ sleepAfter: +e.target.value }));

  const toggle = (await chrome.commands.getAll()).find(c => c.name === 'toggle-pip');
  if (toggle && toggle.shortcut) $('shortcut').textContent = toggle.shortcut;

  renderSites();
})();
