// Checks the extension without a browser. Run with `npm test`.
//  1. Every file the manifest and extension pages reference exists.
//  2. Every script parses.
//  3. Every template parses, uses only known slots, and renders cleanly
//     with full context and with no context at all.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const EXT = path.join(ROOT, 'extension');
const read = rel => fs.readFileSync(path.join(EXT, rel), 'utf8');
const exists = rel => fs.existsSync(path.join(EXT, rel));

let failures = 0;
const fail = msg => { failures++; console.error(`  ✗ ${msg}`); };
const section = title => console.log(`\n${title}`);

// ---------- 1. references ----------
section('Manifest and page references');
const manifest = JSON.parse(read('manifest.json'));
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
if (manifest.version !== pkg.version) fail(`manifest version ${manifest.version} != package.json version ${pkg.version}`);

const referenced = [
  manifest.background.service_worker,
  manifest.action.default_popup,
  manifest.options_page,
  ...Object.values(manifest.icons),
  ...Object.values(manifest.action.default_icon),
  ...manifest.content_scripts.flatMap(c => c.js)
];
for (const page of [manifest.action.default_popup, manifest.options_page]) {
  const html = read(page);
  for (const [, ref] of html.matchAll(/(?:src|href)="([^"#:]+)"/g)) {
    referenced.push(path.posix.join(path.posix.dirname(page), ref));
  }
}
const bg = read(manifest.background.service_worker);
for (const [, ref] of bg.matchAll(/importScripts\('([^']+)'\)/g)) referenced.push(ref);
for (const rel of new Set(referenced)) if (!exists(rel)) fail(`missing file: ${rel}`);
console.log(`  checked ${new Set(referenced).size} references`);

// ---------- 2. syntax ----------
section('Script syntax');
const jsFiles = [];
(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) jsFiles.push(full);
  }
})(EXT);
for (const file of jsFiles) {
  try { new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file }); }
  catch (e) { fail(`${path.relative(ROOT, file)}: ${e.message}`); }
}
console.log(`  parsed ${jsFiles.length} scripts`);

// ---------- 3. templates ----------
section('Templates');
const sandbox = vm.createContext({ console, chrome: {} });
vm.runInContext(read('shared/frontmatter.js'), sandbox);
vm.runInContext(read('content/templates.js'), sandbox);
const { PipFrontmatter, PipTemplates } = sandbox;

const CONTEXT_KEYS = ['page.url', 'page.title', 'page.content', 'page.screenshot', 'page.design_tokens',
  'page.console_errors', 'page.diff', 'page.tabs'];
const PROFILE_KEYS = ['profile.stack', 'profile.preferences', 'profile.test_framework'];
const SAMPLE = {
  page: {
    url: 'https://example.dev/docs', title: 'Example docs', content: 'Some page text.',
    design_tokens: '- Fonts: Inter', console_errors: 'TypeError: x.map is not a function', diff: '+ added line', tabs: '- Tab (https://a.dev)'
  },
  profile: { stack: 'Next.js', preferences: 'small diffs', test_framework: 'Vitest' }
};

const index = JSON.parse(read('templates/index.json'));
const onDisk = fs.readdirSync(path.join(EXT, 'templates')).filter(f => f.endsWith('.md') && f !== 'README.md');
for (const f of onDisk) if (!index.includes(f)) fail(`templates/${f} is not listed in templates/index.json`);

const seen = { id: new Set(), trigger: new Set() };
for (const file of index) {
  if (!exists('templates/' + file)) { fail(`templates/index.json lists missing ${file}`); continue; }
  let t;
  try { t = PipFrontmatter.parse(read('templates/' + file)); }
  catch (e) { fail(`${file}: ${e.message}`); continue; }

  for (const field of ['id', 'name', 'trigger', 'category']) if (!t[field]) fail(`${file}: missing ${field}`);
  for (const field of ['id', 'trigger']) {
    if (seen[field].has(t[field])) fail(`${file}: duplicate ${field} "${t[field]}"`);
    seen[field].add(t[field]);
  }
  for (const key of t.context) if (!CONTEXT_KEYS.includes(key)) fail(`${file}: unknown context "${key}"`);

  const askKeys = t.ask.map(a => 'ask.' + a.key);
  for (const a of t.ask) if (!a.key || !a.label) fail(`${file}: every ask needs a key and a label`);
  const known = [...CONTEXT_KEYS, ...PROFILE_KEYS, ...askKeys];
  for (const [, slot] of t.body.matchAll(/\{\{(?:#if )?([\w.]+)\}\}/g)) {
    if (!known.includes(slot)) fail(`${file}: unknown slot {{${slot}}}`);
  }

  const answers = Object.fromEntries(t.ask.map(a => [a.key, a.options ? a.options[0] : 'an answer']));
  // "minimal" is the least Pip ever has: the page URL and title, nothing else.
  const renders = {
    full: PipTemplates.render(t, { ...SAMPLE, ask: answers }),
    minimal: PipTemplates.render(t, { page: { url: SAMPLE.page.url, title: SAMPLE.page.title }, profile: {}, ask: {} })
  };
  const count = (s, re) => (s.match(re) || []).length;
  for (const [name, text] of Object.entries(renders)) {
    if (/\{\{|\}\}/.test(text)) fail(`${file}: ${name} render leaves template syntax behind`);
    for (const word of [/\bundefined\b/g, /\bnull\b/g]) {
      if (count(text, word) > count(t.body, word)) fail(`${file}: ${name} render leaks "${word.source.slice(2, -2)}"`);
    }
    if (text.length < 80) fail(`${file}: ${name} render is suspiciously short`);
  }
  if (t.ask.length && !/\[[^\]]+\]/.test(renders.minimal)) fail(`${file}: unanswered questions should show [placeholders]`);
}
console.log(`  checked ${index.length} templates`);

console.log(failures ? `\n${failures} problem(s) found.` : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
