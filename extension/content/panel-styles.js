// Styles for Pip's panel, injected into its shadow root by pip.js.
var PipPanelCSS = `
:host{all:initial}
*{box-sizing:border-box}
.panel{--bg:#fff;--ink:#1f1d2b;--muted:#6b6880;--line:#e6e3ef;--chip:#f3f1fa;--accent:#7464E6;--accent-ink:#fff;--ok:#15803d;--bad:#b42318;
  position:absolute;right:0;bottom:84px;width:340px;max-width:calc(100vw - 32px);max-height:min(580px,calc(100vh - 120px));overflow:auto;
  background:var(--bg);color:var(--ink);border:1px solid var(--line);border-radius:14px;padding:14px;
  font:13px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;box-shadow:0 12px 32px rgba(20,10,60,.16);
  opacity:0;transform:translateY(8px) scale(.98);transform-origin:90% 100%;pointer-events:none;transition:opacity .18s,transform .18s}
@media (prefers-color-scheme:dark){.panel{--bg:#1d1b26;--ink:#ecebf3;--muted:#a19eb5;--line:#322f40;--chip:#2a2836;--accent:#9d90fa;--accent-ink:#17142a;--ok:#4ade80;--bad:#f87171}}
.panel.open{opacity:1;transform:none;pointer-events:auto}
header{display:flex;align-items:center;gap:6px;margin-bottom:8px}
h2{flex:1;font-size:15px;font-weight:600;margin:0}
button{font:inherit;color:inherit;cursor:pointer}
.icon{border:0;background:none;color:var(--muted);font-size:18px;line-height:1;padding:2px 6px;border-radius:6px}
.icon:hover{background:var(--chip)}
.sec{margin:12px 0 6px;font-size:11px;font-weight:600;letter-spacing:.02em;color:var(--muted);text-transform:uppercase}
.hint{color:var(--muted);font-size:12px;margin:6px 0}
.search{width:100%;font:inherit;color:inherit;background:var(--chip);border:1px solid transparent;border-radius:9px;padding:7px 10px;outline:none}
.search:focus,.field:focus{border-color:var(--accent)}
.item{display:block;width:100%;text-align:left;border:1px solid var(--line);background:none;border-radius:9px;padding:8px 10px;margin-bottom:6px}
.item:hover,.item:focus-visible{border-color:var(--accent);outline:none}
.item small{display:block;color:var(--muted);font-size:11.5px;margin-top:1px}
.dashed{display:block;width:100%;text-align:left;border:1px dashed var(--accent);background:none;border-radius:9px;padding:8px 10px;margin-top:10px}
.dashed small{display:block;color:var(--muted);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.link{border:0;background:none;color:var(--accent);padding:0;font-size:12px}
footer{display:flex;justify-content:space-between;margin-top:12px;padding-top:10px;border-top:1px solid var(--line)}
label.q{display:block;margin:10px 0 0}
label.q > span{display:block;font-weight:500;margin-bottom:4px}
.field{width:100%;font:inherit;color:inherit;background:var(--chip);border:1px solid transparent;border-radius:8px;padding:6px 9px;outline:none}
.chips{display:flex;flex-wrap:wrap;gap:5px}
.chip,.cchip{border:1px solid var(--line);background:none;border-radius:999px;padding:3px 10px;font-size:12px}
.chip[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.cchip{display:inline-flex;gap:5px;align-items:center;margin:0 5px 5px 0}
.cchip[aria-pressed="false"]{color:var(--muted);text-decoration:line-through}
.cchip:disabled{text-decoration:none;cursor:default;opacity:.7}
.primary{border:0;background:var(--accent);color:var(--accent-ink);border-radius:9px;padding:8px 14px;font-weight:600}
.secondary{border:1px solid var(--line);background:none;border-radius:9px;padding:8px 14px}
.actions{display:flex;gap:8px;margin-top:12px}
.out{width:100%;min-height:200px;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;color:inherit;background:var(--chip);border:1px solid transparent;border-radius:9px;padding:9px;resize:vertical;outline:none}
.out:focus{border-color:var(--accent)}
.shot{display:flex;gap:10px;align-items:center;margin-top:10px;padding:8px;border:1px solid var(--line);border-radius:9px}
.shot img{width:84px;height:54px;object-fit:cover;object-position:top;border-radius:5px;border:1px solid var(--line)}
.shot a{color:var(--accent);font-size:12px;margin-left:8px}
.check{display:flex;gap:6px;margin:4px 0}
.check .y{color:var(--ok)} .check .n{color:var(--bad)}
.status{margin:8px 0 0;font-size:12px;color:var(--accent);font-weight:500}
.status:empty{display:none}
.note{font-size:12px;margin:6px 0;padding:7px 9px;background:var(--chip);border-radius:8px}
.panel > :last-child{margin-bottom:0}
.actions + .hint{margin-top:8px}
.handoff{display:flex;align-items:center;gap:6px;margin-top:8px}
.handoff span{font-size:12px;color:var(--muted);margin-right:2px}
.sm{padding:5px 10px;font-size:12px;border-radius:8px}
.panel{color-scheme:light}
@media (prefers-color-scheme:dark){.panel{color-scheme:dark}}
`;
