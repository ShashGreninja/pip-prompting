// Template engine: loading, suggesting, rendering, and checking a rough draft.
// Everything here only produces text. Nothing is sent to any AI.
var PipTemplates = (() => {
  let cache = null;

  async function all() {
    if (!cache) {
      const r = await chrome.runtime.sendMessage({ type: 'templates' });
      if (!r || !r.ok) throw new Error((r && r.error) || 'Could not load templates');
      cache = r.data;
    }
    return cache;
  }

  const get = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  const str = v => (v == null ? '' : Array.isArray(v) ? v.join(', ') : String(v).trim());
  const fillSlots = (text, data) => text.replace(/\{\{([\w.]+)\}\}/g, (_, slot) => str(get(data, slot)));

  // Ask fields with their defaults resolved against the user's profile.
  const asks = (t, profile) => t.ask.map(a => ({ ...a, default: a.default ? fillSlots(a.default, { profile }) : '' }));

  // Empty page/profile slots drop their line (or {{#if}} block). Empty ask slots
  // become a visible [placeholder] so the user can fill them in before sending.
  function render(t, data) {
    const labels = Object.fromEntries(t.ask.map(a => [a.key, a.label]));
    const value = slot => str(get(data, slot));
    const placeholder = slot => (slot.startsWith('ask.') ? `[${labels[slot.slice(4)] || slot.slice(4)}]` : '');

    let out = t.body.replace(/\{\{#if ([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, slot, inner) => (value(slot) ? inner : ''));
    out = out.split('\n').filter(line => {
      const slots = [...line.matchAll(/\{\{([\w.]+)\}\}/g)].map(m => m[1]);
      return slots.every(s => value(s) || s.startsWith('ask.'));
    }).join('\n');
    out = out.replace(/\{\{([\w.]+)\}\}/g, (_, slot) => value(slot) || placeholder(slot));
    return out
      .replace(/"""\n"""/g, '')
      .replace(/```\w*\n```/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  // [templateId, signals => [score, reason] | falsy]
  const RULES = [
    ['fix-console-error', s => s.errors && [10, `${s.errors} console error${s.errors > 1 ? 's' : ''} on this page`]],
    ['review-pr', s => s.isPR && [10, 'This is a pull request']],
    ['upgrade-library', s => s.isMigration && [9, 'Looks like a migration guide']],
    ['integrate-api', s => s.isDocs && [s.isApi ? 8 : 5, s.isApi ? 'Looks like API docs' : 'Looks like docs']],
    ['spec-to-plan', s => s.isTicket && [8, 'Looks like a ticket or spec']],
    ['design-to-code', s => s.isDesign && [8, 'Design inspiration on this page']],
    ['explain-code', s => (s.codeSelected && [7, 'You selected some code']) || (s.isCode && [6, 'Viewing source code'])],
    ['check-ai-writing', s => (s.textSelected && [6, 'You selected some writing']) || (s.isWritingDoc && [6, 'Looks like a document'])],
    ['write-tests', s => (s.codeSelected || s.isCode) && [4, 'Code on this page']],
    ['mine-ideas', s => (s.isArticle || s.isDocs) && [4, 'Lots to learn from here']],
    ['refactor', s => (s.codeSelected || s.isCode) && [3, 'Code on this page']],
    ['inspire-from-site', s => !s.isDocs && !s.isCode && !s.isPR && !s.isTicket && !s.isAIChat && [3, 'Like how this site looks?']],
    ['compare-options', s => s.tabCount >= 3 && [3, `${s.tabCount} other tabs open`]],
    ['system-prompt', s => s.isAIChat && [2, '']],
    ['report-bug', () => [1, '']]
  ];

  function suggest(templates, signals) {
    const scored = {};
    for (const [id, rule] of RULES) {
      const r = rule(signals);
      if (r) scored[id] = r;
    }
    return templates
      .map(t => ({ ...t, score: scored[t.id] ? scored[t.id][0] : 0, reason: scored[t.id] ? scored[t.id][1] : '' }))
      .sort((a, b) => b.score - a.score);
  }

  const DRAFT_KEYWORDS = [
    [/error|exception|stack ?trace|undefined is not/i, 'fix-console-error'],
    [/\bbug\b|broken|doesn'?t work|not working/i, 'report-bug'],
    [/\btests?\b/i, 'write-tests'],
    [/refactor|clean ?up/i, 'refactor'],
    [/explain|understand|what does/i, 'explain-code'],
    [/review|pull request|\bpr\b/i, 'review-pr'],
    [/\bapi\b|endpoint|integrat/i, 'integrate-api'],
    [/upgrad|migrat/i, 'upgrade-library'],
    [/design|component|\bui\b|figma|screenshot/i, 'design-to-code'],
    [/\bplan\b|ticket|\bspec\b|\bprd\b/i, 'spec-to-plan'],
    [/compare|\bvs\.?\b|which (library|tool|framework)/i, 'compare-options'],
    [/system prompt/i, 'system-prompt'],
    [/inspir|like (this|that) (site|website)|clone/i, 'inspire-from-site'],
    [/\bideas?\b|references?/i, 'mine-ideas'],
    [/ai[- ]?(sounding|written|generated)|humani[sz]e/i, 'check-ai-writing']
  ];

  function matchDraft(templates, draft) {
    const ids = [...new Set(DRAFT_KEYWORDS.filter(([re]) => re.test(draft)).map(([, id]) => id))];
    return ids.map(id => templates.find(t => t.id === id)).filter(Boolean).slice(0, 3);
  }

  // A quick, local check of a rough prompt. No AI involved.
  function lintDraft(draft) {
    const t = draft.trim();
    const words = t.split(/\s+/).filter(Boolean).length;
    const checks = [
      { key: 'goal', label: 'A clear goal',
        ok: /\b(so that|goal|i want|i need|trying to|in order to)\b/i.test(t) ||
            (words >= 20 && /\b(build|create|fix|write|explain|review|add|implement|refactor|debug)\b/i.test(t)) },
      { key: 'context', label: 'Context: code, stack, error or source',
        ok: /```|"""|\n.*\n.*\n|\b(here is|here's|below|attached|my (code|stack|app|project|repo)|using|built with)\b/i.test(t) },
      { key: 'constraints', label: 'Constraints: what to keep or avoid',
        ok: /\b(don'?t|do not|must|only|avoid|without|keep|at most|no more than|never)\b/i.test(t) },
      { key: 'format', label: 'The output you want back',
        ok: /\b(format|table|list|bullets?|steps?|json|markdown|code only|return|output|respond|give me|show me|summary)\b/i.test(t) }
    ];
    const notes = [];
    if (words < 12) notes.push("It's very short, so the AI has to guess most of what you mean.");
    const vague = t.match(/\b(better|nicer|good|properly|work|stuff|thing|things|somehow|etc)\b/gi);
    if (vague && words < 40) {
      const list = [...new Set(vague.map(v => v.toLowerCase()))].map(v => `"${v}"`).join(', ');
      notes.push(`Vague words: ${list}. Say exactly what should change.`);
    }
    return { checks, notes, ok: checks.every(c => c.ok) && notes.length === 0 };
  }

  function scaffold(draft, lint, profile) {
    const missing = Object.fromEntries(lint.checks.map(c => [c.key, !c.ok]));
    const lines = [draft.trim(), ''];
    if (missing.goal) lines.push('Goal: [what should be true when this is done]');
    if (missing.context) {
      lines.push(`Context: ${profile.stack ? `My stack is ${profile.stack}. ` : ''}[paste the relevant code, error or page, and what it's for]`);
    }
    if (missing.constraints) lines.push('Constraints: [what must not change, what to avoid]');
    if (missing.format) lines.push('Output: [what you want back, e.g. a step-by-step plan, code only, or a table]');
    lines.push('', 'If anything is unclear, ask me before starting.');
    return lines.join('\n');
  }

  return { all, asks, render, suggest, matchDraft, lintDraft, scaffold };
})();
