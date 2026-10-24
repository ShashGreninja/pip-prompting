// Parses a template file: YAML frontmatter + prompt body.
// Supports only the YAML subset the templates use: scalars, inline [a, b] lists,
// and one level of "- key: value" list items with indented fields.
var PipFrontmatter = (() => {
  const unquote = s => (/^".*"$|^'.*'$/.test(s) ? s.slice(1, -1) : s);

  function parseValue(raw) {
    const v = raw.trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      return v.slice(1, -1).split(',').map(s => unquote(s.trim())).filter(Boolean);
    }
    return unquote(v);
  }

  function parseYaml(src) {
    const out = {};
    let listKey = null;
    let item = null;
    for (const line of src.split(/\r?\n/)) {
      if (!line.trim()) continue;
      const top = line.match(/^(\w+):\s*(.*)$/);
      if (top) {
        item = null;
        listKey = top[2] === '' ? top[1] : null;
        out[top[1]] = top[2] === '' ? [] : parseValue(top[2]);
        continue;
      }
      const listItem = line.match(/^\s*-\s+(\w+):\s*(.*)$/);
      if (listItem && listKey) {
        item = { [listItem[1]]: parseValue(listItem[2]) };
        out[listKey].push(item);
        continue;
      }
      const field = line.match(/^\s+(\w+):\s*(.*)$/);
      if (field && item) item[field[1]] = parseValue(field[2]);
    }
    return out;
  }

  function parse(md) {
    const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    if (!m) throw new Error('Template is missing frontmatter');
    const meta = parseYaml(m[1]);
    meta.context = meta.context || [];
    meta.ask = meta.ask || [];
    meta.body = m[2].replace(/\r\n/g, '\n').trim();
    return meta;
  }

  return { parse };
})();
