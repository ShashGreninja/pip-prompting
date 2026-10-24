// Runs in the page's own JS world at document_start so it can see console errors.
// Keeps the last 10 and hands them to Pip's content script only when asked.
(() => {
  const buf = [];
  const push = text => {
    buf.push(String(text).slice(0, 2000));
    if (buf.length > 10) buf.shift();
  };
  const fmt = a => {
    if (a instanceof Error) return a.stack || a.message;
    if (a && typeof a === 'object') { try { return JSON.stringify(a); } catch { return String(a); } }
    return String(a);
  };

  const origError = console.error;
  console.error = function (...args) {
    try { push(args.map(fmt).join(' ')); } catch {}
    return origError.apply(this, args);
  };

  addEventListener('error', e => {
    if (!e.message) return; // resource load failures have no message
    push(e.error && e.error.stack ? e.error.stack : `${e.message} at ${e.filename}:${e.lineno}:${e.colno}`);
  }, true);
  addEventListener('unhandledrejection', e => push('Unhandled promise rejection: ' + fmt(e.reason)));

  addEventListener('message', e => {
    if (e.source === window && e.data && e.data.__pip === 'get-errors') {
      window.postMessage({ __pip: 'errors', errors: buf.slice() }, '*');
    }
  });
})();
