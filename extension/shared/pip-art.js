// Pip's artwork and state animations. The state lives in data-state on .pip-wrap:
// sleeping, waking, idle, listening, thinking, hmm, ready, worried, yawning.
// data-tod (morning/day/evening/night) tints the spark and adds a nightcap at night.
var PipArt = (() => {
  const SVG = `
<svg class="pip" viewBox="0 0 120 120" aria-hidden="true">
  <ellipse class="shadow" cx="60" cy="113" rx="30" ry="4"/>
  <g class="hopper"><g class="bob"><g class="squisher">
    <g class="arm-l"><ellipse class="skin-dark" cx="20" cy="76" rx="6" ry="8"/></g>
    <g class="arm-r"><ellipse class="skin-dark" cx="100" cy="76" rx="6" ry="8"/></g>
    <path class="skin-dark" d="M44 96 L33 110 L60 98 Z"/>
    <rect class="skin" x="18" y="30" width="84" height="68" rx="30"/>
    <path class="belly" d="M18 74 Q18 98 48 98 L72 98 Q102 98 102 74 Q60 90 18 74 Z"/>
    <ellipse class="shine" cx="38" cy="44" rx="9" ry="4.5" transform="rotate(-28 38 44)"/>
    <path class="stem" d="M60 31 Q57 21 64 14" fill="none" stroke-width="3" stroke-linecap="round"/>
    <path class="spark" d="M65 5 L67 10 L72 12 L67 14 L65 19 L63 14 L58 12 L63 10 Z"/>
    <g class="cheeks"><ellipse cx="36" cy="72" rx="5.5" ry="3.2"/><ellipse cx="84" cy="72" rx="5.5" ry="3.2"/></g>
    <g class="look">
      <g class="v eyes-open">
        <ellipse class="ink" cx="46" cy="60" rx="5.5" ry="7"/><circle class="glint" cx="48" cy="57" r="2"/>
        <ellipse class="ink" cx="74" cy="60" rx="5.5" ry="7"/><circle class="glint" cx="76" cy="57" r="2"/>
      </g>
      <g class="v eyes-closed line"><path d="M40 61 Q46 66 52 61"/><path d="M68 61 Q74 66 80 61"/></g>
      <g class="v eyes-peek"><ellipse class="ink" cx="46" cy="61" rx="4.5" ry="3.5"/><path class="line" d="M68 61 Q74 66 80 61"/></g>
      <g class="v eyes-happy line"><path d="M40 63 Q46 54 52 63"/><path d="M68 63 Q74 54 80 63"/></g>
      <g class="v brows-hmm line thin"><path d="M40 50 L51 50"/><path d="M68 47 Q74 42 80 46"/></g>
      <g class="v brows-worried line thin"><path d="M41 50 L51 46"/><path d="M69 46 L79 50"/></g>
      <path class="v m-smile line" d="M54 74 Q60 79 66 74"/>
      <path class="v m-sleep line" d="M57 76 Q60 78 63 76"/>
      <path class="v m-flat line" d="M56 76 L64 76"/>
      <path class="v m-wobble line thin" d="M53 76 q3.5 -3 7 0 q3.5 3 7 0"/>
      <path class="v m-open ink" d="M53 73 Q60 84 67 73 Z"/>
      <ellipse class="v m-o ink" cx="60" cy="76" rx="3.5" ry="4"/>
      <ellipse class="v m-yawn ink" cx="60" cy="77" rx="5" ry="6.5"/>
    </g>
    <g class="v cap">
      <path class="cap-cloth" d="M66 36 Q84 14 108 22 Q98 28 94 42 Z"/>
      <path d="M64 37 Q80 30 95 42" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>
      <circle cx="109" cy="22" r="4.5" fill="#fff"/>
    </g>
  </g></g></g>
  <g class="v fx-z"><text class="z1" x="92" y="28" font-size="12">z</text><text class="z2" x="100" y="16" font-size="9">z</text></g>
  <g class="v fx-dots"><circle class="d1" cx="88" cy="24" r="2.5"/><circle class="d2" cx="96" cy="16" r="3.5"/><circle class="d3" cx="106" cy="8" r="4.5"/></g>
  <text class="v fx-q" x="98" y="26" font-size="18">?</text>
  <g class="v fx-spark">
    <g transform="translate(12 34)"><path class="star" d="M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6 Z"/></g>
    <g transform="translate(106 30)"><path class="star s2" d="M0 -5 L1.3 -1.3 L5 0 L1.3 1.3 L0 5 L-1.3 1.3 L-5 0 L-1.3 -1.3 Z"/></g>
    <g transform="translate(110 58)"><path class="star s3" d="M0 -4 L1 -1 L4 0 L1 1 L0 4 L-1 1 L-4 0 L-1 -1 Z"/></g>
  </g>
</svg>`;

  const CSS = `
.pip-wrap{--body:#8B7CF6;--body-dark:#6E5EE0;--body-light:#C9C2FC;--eye:#221A45;--cheek:#F9A8D4;--spark:#FBBF24;--cap:#5B8DEF;
  width:72px;height:72px;cursor:pointer;outline:none;transform-origin:100% 100%;
  transition:transform .45s cubic-bezier(.3,1.4,.5,1),opacity .45s;-webkit-tap-highlight-color:transparent}
.pip-wrap:focus-visible{outline:2px solid var(--body);outline-offset:4px;border-radius:16px}
.pip-wrap[data-state="sleeping"]{transform:scale(.78) translateY(6px);opacity:.82}
.pip-wrap[data-state="sleeping"]:hover{transform:scale(.82) translateY(4px);opacity:1}
.pip{width:100%;height:100%;overflow:visible;display:block}
.pip g{transform-box:view-box}
.skin{fill:var(--body)} .skin-dark{fill:var(--body-dark)}
.belly{fill:var(--body-dark);opacity:.35} .shine{fill:#fff;opacity:.28}
.cheeks ellipse{fill:var(--cheek);opacity:.75} .cheeks{transition:opacity .4s}
.ink{fill:var(--eye)} .glint{fill:#fff}
.line,.line path{fill:none;stroke:var(--eye);stroke-width:2.8;stroke-linecap:round}
.thin,.thin path{stroke-width:2.4}
.cap-cloth{fill:var(--cap)}
.shadow{fill:#000;opacity:.12;transform-box:view-box;transform-origin:60px 113px}
.fx-z text,.fx-q{fill:var(--body-dark);font-family:system-ui,sans-serif;font-weight:700}
.fx-dots circle{fill:var(--body-light)} .fx-spark{fill:var(--spark)}
.v{opacity:0;transition:opacity .15s}
.hopper,.bob,.squisher{transform-origin:60px 108px}
.look{transform:translate(var(--lx,0px),var(--ly,0px));transition:transform .25s ease-out}
.eyes-open{transform-origin:60px 60px;transition:transform .07s,opacity .15s}
.pip-wrap.blink .eyes-open{transform:scaleY(.1)}
.arm-r{transform-origin:98px 80px} .arm-l{transform-origin:22px 80px}
.stem{stroke:var(--body-dark)}
.spark{fill:var(--spark);transform-box:fill-box;transform-origin:50% 50%;transition:opacity .4s}
.star{transform-box:fill-box;transform-origin:50% 50%}
[data-tod="evening"] .spark{fill:#FB923C}
[data-tod="night"] .spark{fill:#A5C4FD}

[data-state="sleeping"] .eyes-closed,[data-state="yawning"] .eyes-closed{opacity:1}
[data-state="sleeping"]:hover .eyes-closed{opacity:0}
[data-state="sleeping"]:hover .eyes-peek{opacity:1}
:is([data-state="waking"],[data-state="idle"],[data-state="listening"],[data-state="thinking"],[data-state="hmm"],[data-state="worried"]) .eyes-open{opacity:1}
[data-state="ready"] .eyes-happy{opacity:1}
[data-state="sleeping"] .m-sleep{opacity:1}
[data-state="waking"] .m-o,[data-state="yawning"] .m-yawn{opacity:1}
:is([data-state="idle"],[data-state="listening"]) .m-smile{opacity:1}
[data-state="thinking"] .m-flat{opacity:1}
:is([data-state="hmm"],[data-state="worried"]) .m-wobble{opacity:1}
[data-state="ready"] .m-open{opacity:1}
[data-state="hmm"] .brows-hmm{opacity:1}
[data-state="worried"] .brows-worried{opacity:1}
[data-state="sleeping"] .fx-z{opacity:1}
[data-state="thinking"] .fx-dots{opacity:1}
[data-state="hmm"] .fx-q{opacity:1}
[data-state="ready"] .fx-spark{opacity:1}
[data-tod="night"]:is([data-state="sleeping"],[data-state="yawning"]) .cap{opacity:1}
[data-state="sleeping"] .spark{opacity:.3}
[data-state="sleeping"] .cheeks{opacity:.45}
[data-state="thinking"] .look{transform:translate(3px,-3px)}

[data-state="sleeping"] .bob{animation:pip-breathe 4.8s ease-in-out infinite}
[data-state="sleeping"] .z1{animation:pip-z 6s ease-in-out infinite}
[data-state="sleeping"] .z2{animation:pip-z 6s ease-in-out 3s infinite}
[data-state="waking"] .bob{animation:pip-stretch .7s ease-out}
[data-state="waking"] .arm-r{animation:pip-wave .7s ease-in-out .15s}
[data-state="yawning"] .bob{animation:pip-yawn 1.4s ease-in-out}
[data-state="hmm"] .bob{transform:rotate(-7deg);transition:transform .3s}
[data-state="thinking"] .d1{animation:pip-pulse 1.2s infinite}
[data-state="thinking"] .d2{animation:pip-pulse 1.2s .2s infinite}
[data-state="thinking"] .d3{animation:pip-pulse 1.2s .4s infinite}
[data-state="thinking"] .arm-l{animation:pip-tap .6s ease-in-out infinite alternate}
[data-state="ready"] .hopper{animation:pip-hop .6s ease-out}
[data-state="ready"] .shadow{animation:pip-shrink .6s ease-out}
[data-state="ready"] .star{animation:pip-twinkle 1.1s ease-out both}
[data-state="ready"] .s2{animation-delay:.15s}
[data-state="ready"] .s3{animation-delay:.3s}
[data-state="ready"] .spark{animation:pip-glow .9s ease-out}
[data-state="worried"] .hopper{animation:pip-shake .35s ease-in-out 2}
.squisher.squish{animation:pip-squish .35s ease-out}

@keyframes pip-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.015,1.04)}}
@keyframes pip-z{0%{opacity:0;transform:translate(0,4px)}25%{opacity:.75}100%{opacity:0;transform:translate(7px,-10px)}}
@keyframes pip-stretch{0%{transform:scale(1,1)}30%{transform:scale(1.1,.88)}60%{transform:scale(.94,1.1)}100%{transform:scale(1,1)}}
@keyframes pip-wave{0%,100%{transform:rotate(0)}30%{transform:rotate(-35deg)}65%{transform:rotate(10deg)}}
@keyframes pip-yawn{0%,100%{transform:scale(1,1)}45%{transform:scale(.97,1.08)}}
@keyframes pip-pulse{0%,100%{opacity:.25}50%{opacity:1}}
@keyframes pip-tap{from{transform:rotate(0)}to{transform:rotate(-14deg)}}
@keyframes pip-hop{0%{transform:translateY(0)}35%{transform:translateY(-12px) scale(.97,1.04)}70%{transform:translateY(0) scale(1.06,.94)}100%{transform:none}}
@keyframes pip-shrink{35%{transform:scale(.7)}}
@keyframes pip-twinkle{0%{opacity:0;transform:scale(.2)}45%{opacity:1;transform:scale(1.15)}100%{opacity:0;transform:scale(.7) rotate(40deg)}}
@keyframes pip-glow{0%,100%{transform:scale(1)}40%{transform:scale(1.5)}}
@keyframes pip-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-2.5px)}75%{transform:translateX(2.5px)}}
@keyframes pip-squish{0%{transform:scale(1)}35%{transform:scale(1.1,.88)}70%{transform:scale(.96,1.06)}100%{transform:scale(1)}}
@media (prefers-reduced-motion:reduce){.pip *,.pip-wrap{animation:none!important;transition:none!important}}
`;

  function timeOfDay(date = new Date()) {
    const h = date.getHours();
    return h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'day' : h < 21 ? 'evening' : 'night';
  }

  return { SVG, CSS, timeOfDay };
})();
