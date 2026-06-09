/* @ds-bundle: {"format":3,"namespace":"InvestAnaliticDesignSystem_81c80b","components":[{"name":"AIComposer","sourcePath":"components/ai/AIComposer.jsx"},{"name":"AIMessage","sourcePath":"components/ai/AIMessage.jsx"},{"name":"AllocationBar","sourcePath":"components/data/AllocationBar.jsx"},{"name":"Avatar","sourcePath":"components/data/Avatar.jsx"},{"name":"Badge","sourcePath":"components/data/Badge.jsx"},{"name":"Card","sourcePath":"components/data/Card.jsx"},{"name":"PnLValue","sourcePath":"components/data/PnLValue.jsx"},{"name":"StatCard","sourcePath":"components/data/StatCard.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/_internal/style.js":"32ee92b9a7aa","components/ai/AIComposer.jsx":"f3a8a273719d","components/ai/AIMessage.jsx":"bebfbe49dd35","components/data/AllocationBar.jsx":"8ac9ae250e1a","components/data/Avatar.jsx":"da74f4d03f73","components/data/Badge.jsx":"2170604acc13","components/data/Card.jsx":"52b66f2f1b99","components/data/PnLValue.jsx":"8c8a48c3d837","components/data/StatCard.jsx":"82b7f31eb943","components/forms/Button.jsx":"f97698c64dcf","components/forms/IconButton.jsx":"9b9b7003d215","components/forms/Input.jsx":"49270e656511","components/forms/Select.jsx":"d4a44afb89de","components/forms/Switch.jsx":"443af3dec658","components/navigation/Tabs.jsx":"39a85f5eb985","ui_kits/app/data.js":"8b0e359d34f8","ui_kits/app/screens.jsx":"08ac3a2422ba","ui_kits/app/shell.jsx":"453666704998"},"inlinedExternals":[],"unexposedExports":[{"name":"injectOnce","sourcePath":"components/_internal/style.js"}]} */

(() => {

const __ds_ns = (window.InvestAnaliticDesignSystem_81c80b = window.InvestAnaliticDesignSystem_81c80b || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/_internal/style.js
try { (() => {
// Internal helper — injects a component's CSS once per document.
// Components ship their styling with the JS bundle (the only CSS shipped
// to consumers via styles.css is tokens + base), so each primitive injects
// its own token-built rules on first mount. Idempotent by id.

function injectOnce(id, css) {
  if (typeof document === 'undefined') return;
  if (document.getElementById(id)) return;
  const el = document.createElement('style');
  el.id = id;
  el.textContent = css;
  document.head.appendChild(el);
}
Object.assign(__ds_scope, { injectOnce });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/_internal/style.js", error: String((e && e.message) || e) }); }

// components/ai/AIComposer.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.ia-composer{ font-family:var(--font-sans); width:100%; }
.ia-composer__shell{
  position:relative; background:var(--surface-card);
  border:1px solid var(--border-2); border-radius:var(--radius-xl);
  box-shadow:var(--shadow-sm);
  transition:border-color var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
.ia-composer__shell:focus-within{ border-color:var(--accent); box-shadow:var(--shadow-accent); }
.ia-composer__row{ display:flex; align-items:flex-end; gap:10px; padding:10px 10px 10px 16px; }
.ia-composer__spark{
  flex:none; width:30px; height:30px; border-radius:var(--radius-pill); margin-bottom:5px;
  display:flex; align-items:center; justify-content:center; color:#fff;
  background:linear-gradient(135deg, var(--violet-500), var(--azure-500));
}
.ia-composer__spark svg{ width:17px; height:17px; }
.ia-composer__input{
  flex:1; min-width:0; border:0; outline:none; background:transparent; resize:none;
  font-family:inherit; font-size:var(--text-base); line-height:1.5; color:var(--text-1);
  padding:6px 0; max-height:160px; min-height:24px;
}
.ia-composer__input::placeholder{ color:var(--text-4); }
.ia-composer__send{
  flex:none; width:38px; height:38px; border:0; border-radius:var(--radius-md); cursor:pointer;
  background:var(--accent); color:#fff; display:flex; align-items:center; justify-content:center;
  transition:background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out), opacity var(--dur-fast) var(--ease-out);
}
.ia-composer__send:hover:not(:disabled){ background:var(--accent-hover); }
.ia-composer__send:active{ transform:translateY(1px); }
.ia-composer__send:focus-visible{ outline:none; box-shadow:var(--ring); }
.ia-composer__send:disabled{ opacity:.4; cursor:not-allowed; }
.ia-composer__send svg{ width:18px; height:18px; }
.ia-composer__suggest{ display:flex; gap:8px; flex-wrap:wrap; padding:0 12px 12px; }
.ia-composer__chip{
  appearance:none; border:1px solid var(--border-1); background:var(--surface-sunken); cursor:pointer;
  font-family:inherit; font-size:var(--text-sm); color:var(--text-2);
  padding:6px 12px; border-radius:var(--radius-pill); white-space:nowrap;
  transition:background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
}
.ia-composer__chip:hover{ background:var(--accent-soft); color:var(--accent-hover); border-color:var(--azure-200); }
.ia-composer__hint{ font-size:var(--text-2xs); color:var(--text-4); padding:0 16px 10px; }
`;
const Spark = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none"
}, /*#__PURE__*/React.createElement("path", {
  d: "M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3z",
  fill: "currentColor"
}));
const SendIcon = () => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  fill: "none"
}, /*#__PURE__*/React.createElement("path", {
  d: "M5 12h13M13 6l6 6-6 6",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}));

/**
 * The persistent AI input — the product's spine. A spark-marked text area with
 * a send button, optional suggestion chips and a hint. Uncontrolled by default;
 * call `onSend(text)` on Enter / send click. Shift+Enter inserts a newline.
 */
function AIComposer({
  placeholder = 'Спроси аналитика или добавь сделку: «Купил 5 лотов Сбера по 286»',
  suggestions = [],
  onSend,
  onSuggestion,
  hint = 'Enter — отправить · Shift+Enter — новая строка',
  disabled = false,
  className = '',
  ...rest
}) {
  __ds_scope.injectOnce('ia-composer', CSS);
  const ref = React.useRef(null);
  const [val, setVal] = React.useState('');
  const grow = el => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  };
  const submit = () => {
    const text = val.trim();
    if (!text || disabled) return;
    onSend && onSend(text);
    setVal('');
    if (ref.current) ref.current.style.height = 'auto';
  };
  const onKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['ia-composer', className].filter(Boolean).join(' ')
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: "ia-composer__shell"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ia-composer__row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ia-composer__spark"
  }, /*#__PURE__*/React.createElement(Spark, null)), /*#__PURE__*/React.createElement("textarea", {
    ref: ref,
    className: "ia-composer__input",
    rows: 1,
    placeholder: placeholder,
    value: val,
    disabled: disabled,
    onChange: e => {
      setVal(e.target.value);
      grow(e.target);
    },
    onKeyDown: onKey
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "ia-composer__send",
    onClick: submit,
    disabled: disabled || !val.trim(),
    "aria-label": "\u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C"
  }, /*#__PURE__*/React.createElement(SendIcon, null))), suggestions.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "ia-composer__suggest"
  }, suggestions.map((s, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    type: "button",
    className: "ia-composer__chip",
    onClick: () => onSuggestion ? onSuggestion(s) : onSend && onSend(s)
  }, s))), hint && /*#__PURE__*/React.createElement("div", {
    className: "ia-composer__hint"
  }, hint)));
}
Object.assign(__ds_scope, { AIComposer });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ai/AIComposer.jsx", error: String((e && e.message) || e) }); }

// components/ai/AIMessage.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.ia-msg{ display:flex; gap:12px; font-family:var(--font-sans); max-width:760px; }
.ia-msg--user{ flex-direction:row-reverse; margin-left:auto; }
.ia-msg__avatar{
  flex:none; width:34px; height:34px; border-radius:var(--radius-pill);
  display:flex; align-items:center; justify-content:center;
}
.ia-msg__avatar--ai{ background:linear-gradient(135deg, var(--violet-500), var(--azure-500)); color:#fff; box-shadow:var(--shadow-ai); }
.ia-msg__avatar--ai svg,.ia-msg__avatar--ai i{ width:18px; height:18px; }
.ia-msg__avatar--user{ background:var(--surface-sunken); color:var(--text-2); font-weight:var(--fw-bold); font-size:13px; }
.ia-msg__body{ display:flex; flex-direction:column; gap:8px; min-width:0; }
.ia-msg__bubble{
  font-size:var(--text-base); line-height:var(--text-base-lh); color:var(--text-1);
  padding:12px 15px; border-radius:var(--radius-lg);
}
.ia-msg--ai .ia-msg__bubble{ background:var(--surface-ai); border:1px solid var(--ai-soft); border-top-left-radius:var(--radius-xs); }
.ia-msg--user .ia-msg__bubble{ background:var(--accent); color:var(--text-on-accent); border-top-right-radius:var(--radius-xs); }
.ia-msg__bubble p{ margin:0 0 8px; }
.ia-msg__bubble p:last-child{ margin:0; }
.ia-msg__bubble strong{ font-weight:var(--fw-semibold); }
.ia-msg__name{ display:flex; align-items:center; gap:7px; font-size:var(--text-xs); color:var(--text-3); font-weight:var(--fw-semibold); }
.ia-msg__name svg{ width:13px; height:13px; flex:none; color:var(--ai); }
.ia-msg--user .ia-msg__name{ flex-direction:row-reverse; }
.ia-msg__actions{ display:flex; gap:8px; flex-wrap:wrap; margin-top:2px; }

/* typing indicator */
.ia-msg__typing{ display:inline-flex; gap:4px; align-items:center; padding:14px 16px; }
.ia-msg__typing span{ width:7px; height:7px; border-radius:50%; background:var(--ai); opacity:.4; animation:ia-typing 1.2s var(--ease-in-out) infinite; }
.ia-msg__typing span:nth-child(2){ animation-delay:.18s; }
.ia-msg__typing span:nth-child(3){ animation-delay:.36s; }
@keyframes ia-typing{ 0%,60%,100%{ transform:translateY(0); opacity:.4; } 30%{ transform:translateY(-4px); opacity:1; } }
@media (prefers-reduced-motion: reduce){ .ia-msg__typing span{ animation:none; opacity:.6; } }
`;
const Spark = props => /*#__PURE__*/React.createElement("svg", _extends({}, props, {
  viewBox: "0 0 24 24",
  fill: "none"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 3l1.6 5.2L19 10l-5.4 1.8L12 17l-1.6-5.2L5 10l5.4-1.8L12 3z",
  fill: "currentColor"
}), /*#__PURE__*/React.createElement("path", {
  d: "M19 4.5l.6 1.9L21.5 7l-1.9.6L19 9.5l-.6-1.9L16.5 7l1.9-.6L19 4.5z",
  fill: "currentColor",
  opacity: ".85"
}));

/**
 * A single conversation turn. AI turns get the gradient spark avatar + tinted
 * bubble + optional action chips; user turns get an azure right-aligned bubble.
 * Set `typing` to show the animated indicator instead of content.
 */
function AIMessage({
  role = 'ai',
  // 'ai' | 'user'
  name,
  typing = false,
  actions = null,
  // array of nodes (e.g. <Button>s) or a node
  className = '',
  children,
  ...rest
}) {
  __ds_scope.injectOnce('ia-msg', CSS);
  const isAI = role === 'ai';
  const displayName = name || (isAI ? 'ИИ-аналитик' : 'Вы');
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['ia-msg', `ia-msg--${role}`, className].filter(Boolean).join(' ')
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: ['ia-msg__avatar', isAI ? 'ia-msg__avatar--ai' : 'ia-msg__avatar--user'].filter(Boolean).join(' ')
  }, isAI ? /*#__PURE__*/React.createElement(Spark, null) : name ? name[0].toUpperCase() : 'В'), /*#__PURE__*/React.createElement("div", {
    className: "ia-msg__body"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ia-msg__name"
  }, isAI && /*#__PURE__*/React.createElement(Spark, null), displayName), typing ? /*#__PURE__*/React.createElement("div", {
    className: "ia-msg__bubble ia-msg__typing",
    "aria-label": "\u0418\u0418 \u043F\u0435\u0447\u0430\u0442\u0430\u0435\u0442"
  }, /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null), /*#__PURE__*/React.createElement("span", null)) : /*#__PURE__*/React.createElement("div", {
    className: "ia-msg__bubble"
  }, children), actions && !typing && /*#__PURE__*/React.createElement("div", {
    className: "ia-msg__actions"
  }, Array.isArray(actions) ? actions : actions)));
}
Object.assign(__ds_scope, { AIMessage });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/ai/AIMessage.jsx", error: String((e && e.message) || e) }); }

// components/data/AllocationBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.ia-alloc{ display:flex; flex-direction:column; gap:8px; font-family:var(--font-sans); width:100%; }
.ia-alloc__bar{ display:flex; width:100%; height:10px; border-radius:var(--radius-pill); overflow:hidden; background:var(--surface-sunken); }
.ia-alloc__bar--lg{ height:14px; }
.ia-alloc__seg{ height:100%; transition:width var(--dur-slow) var(--ease-out); }
.ia-alloc__seg:first-child{ border-top-left-radius:var(--radius-pill); border-bottom-left-radius:var(--radius-pill); }
.ia-alloc__seg:last-child{ border-top-right-radius:var(--radius-pill); border-bottom-right-radius:var(--radius-pill); }
.ia-alloc__legend{ display:flex; flex-wrap:wrap; gap:6px 16px; }
.ia-alloc__item{ display:flex; align-items:center; gap:7px; font-size:var(--text-sm); color:var(--text-2); }
.ia-alloc__swatch{ width:9px; height:9px; border-radius:3px; flex:none; }
.ia-alloc__name{ color:var(--text-1); font-weight:var(--fw-medium); }
.ia-alloc__pct{ font-family:var(--font-mono); font-variant-numeric:tabular-nums; color:var(--text-3); margin-left:auto; }
.ia-alloc__item--inline .ia-alloc__pct{ margin-left:4px; }
`;
const PALETTE = ['var(--azure-500)', 'var(--gain-500)', 'var(--violet-500)', 'var(--amber-500)', 'var(--azure-300)', 'var(--ink-400)', 'var(--loss-500)', 'var(--gain-700)'];
const PCT = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

/**
 * Horizontal stacked allocation bar + legend. Feed `segments` of {label,value}
 * (values are summed and normalised to %). For portfolio/sector/account weights.
 */
function AllocationBar({
  segments = [],
  size = 'md',
  showLegend = true,
  className = '',
  ...rest
}) {
  __ds_scope.injectOnce('ia-alloc', CSS);
  const total = segments.reduce((s, x) => s + (x.value || 0), 0) || 1;
  const withPct = segments.map((s, i) => ({
    ...s,
    pct: s.value / total * 100,
    color: s.color || PALETTE[i % PALETTE.length]
  }));
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['ia-alloc', className].filter(Boolean).join(' ')
  }, rest), /*#__PURE__*/React.createElement("div", {
    className: ['ia-alloc__bar', size === 'lg' ? 'ia-alloc__bar--lg' : ''].filter(Boolean).join(' ')
  }, withPct.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "ia-alloc__seg",
    style: {
      width: `${s.pct}%`,
      background: s.color
    },
    title: `${s.label}: ${PCT.format(s.pct)}%`
  }))), showLegend && /*#__PURE__*/React.createElement("div", {
    className: "ia-alloc__legend"
  }, withPct.map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "ia-alloc__item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ia-alloc__swatch",
    style: {
      background: s.color
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "ia-alloc__name"
  }, s.label), /*#__PURE__*/React.createElement("span", {
    className: "ia-alloc__pct"
  }, PCT.format(s.pct), "%")))));
}
Object.assign(__ds_scope, { AllocationBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/AllocationBar.jsx", error: String((e && e.message) || e) }); }

// components/data/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.ia-avatar{
  display:inline-flex; align-items:center; justify-content:center; flex:none;
  font-family:var(--font-sans); font-weight:var(--fw-bold); color:#fff;
  border-radius:var(--radius-md); overflow:hidden; user-select:none; line-height:1;
}
.ia-avatar--circle{ border-radius:var(--radius-pill); }
.ia-avatar--sm{ width:28px; height:28px; font-size:11px; }
.ia-avatar--md{ width:38px; height:38px; font-size:14px; }
.ia-avatar--lg{ width:48px; height:48px; font-size:18px; }
.ia-avatar img{ width:100%; height:100%; object-fit:cover; }
`;

// Deterministic brand-neutral tile colour from a string (avoids P&L hues).
const TILE = ['var(--azure-600)', 'var(--violet-600)', 'var(--ink-600)', 'var(--azure-700)', 'var(--gain-700)', 'var(--amber-600)'];
function pick(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = h * 31 + str.charCodeAt(i) >>> 0;
  return TILE[h % TILE.length];
}
function initials(name = '') {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]).join('').toUpperCase() || '?';
}

/**
 * Avatar / broker tile. Shows an image if `src` given, else colour-coded
 * initials derived from `name`. Square (broker) or circle (person).
 */
function Avatar({
  name = '',
  src = null,
  shape = 'square',
  size = 'md',
  color,
  className = '',
  ...rest
}) {
  __ds_scope.injectOnce('ia-avatar', CSS);
  const cls = ['ia-avatar', `ia-avatar--${size}`, shape === 'circle' ? 'ia-avatar--circle' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls,
    style: {
      background: src ? 'var(--surface-sunken)' : color || pick(name)
    },
    title: name
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name
  }) : initials(name));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/data/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.ia-badge{
  display:inline-flex; align-items:center; gap:4px; font-family:var(--font-sans);
  font-size:var(--text-xs); font-weight:var(--fw-semibold); line-height:1;
  padding:4px 8px; border-radius:var(--radius-sm); white-space:nowrap;
}
.ia-badge--sm{ font-size:var(--text-2xs); padding:3px 6px; }
.ia-badge svg,.ia-badge i{ width:1em; height:1em; }
.ia-badge__dot{ width:6px; height:6px; border-radius:50%; background:currentColor; }
.ia-badge--neutral{ background:var(--surface-sunken); color:var(--text-2); }
.ia-badge--accent{ background:var(--accent-soft); color:var(--accent-hover); }
.ia-badge--positive{ background:var(--positive-soft); color:var(--positive); }
.ia-badge--negative{ background:var(--negative-soft); color:var(--negative); }
.ia-badge--warning{ background:var(--warning-soft); color:var(--amber-600); }
.ia-badge--ai{ background:var(--ai-soft); color:var(--ai); }
.ia-badge--outline{ background:transparent; box-shadow:inset 0 0 0 1px var(--border-2); color:var(--text-2); }
`;

/**
 * Small status pill. Tones map to semantic roles; `dot` shows a leading status dot.
 */
function Badge({
  tone = 'neutral',
  size = 'md',
  dot = false,
  icon = null,
  className = '',
  children,
  ...rest
}) {
  __ds_scope.injectOnce('ia-badge', CSS);
  const cls = ['ia-badge', `ia-badge--${tone}`, size === 'sm' ? 'ia-badge--sm' : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    className: "ia-badge__dot"
  }), icon, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Badge.jsx", error: String((e && e.message) || e) }); }

// components/data/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.ia-card{
  background:var(--surface-card); border:1px solid var(--border-1);
  border-radius:var(--radius-lg); box-shadow:var(--shadow-sm);
  font-family:var(--font-sans); color:var(--text-2); overflow:hidden;
}
.ia-card--flat{ box-shadow:none; }
.ia-card--raised{ box-shadow:var(--shadow-md); }
.ia-card--interactive{ cursor:pointer; transition:box-shadow var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out), border-color var(--dur-base) var(--ease-out); }
.ia-card--interactive:hover{ box-shadow:var(--shadow-md); border-color:var(--border-2); }
.ia-card__header{ display:flex; align-items:center; gap:12px; padding:16px 20px; border-bottom:1px solid var(--divider); }
.ia-card__title{ font-size:var(--text-h4); font-weight:var(--fw-semibold); color:var(--text-1); margin:0; }
.ia-card__sub{ font-size:var(--text-sm); color:var(--text-3); margin:2px 0 0; }
.ia-card__actions{ margin-left:auto; display:flex; align-items:center; gap:6px; }
.ia-card__body{ padding:20px; }
.ia-card__body--tight{ padding:0; }
`;

/**
 * Surface container: hairline border + soft shadow. Optional header (title,
 * subtitle, actions slot) and padded/tight body.
 */
function Card({
  title,
  subtitle,
  actions = null,
  elevation = 'sm',
  interactive = false,
  tightBody = false,
  className = '',
  children,
  ...rest
}) {
  __ds_scope.injectOnce('ia-card', CSS);
  const cls = ['ia-card', elevation === 'flat' ? 'ia-card--flat' : '', elevation === 'md' ? 'ia-card--raised' : '', interactive ? 'ia-card--interactive' : '', className].filter(Boolean).join(' ');
  const hasHeader = title || subtitle || actions;
  return /*#__PURE__*/React.createElement("div", _extends({
    className: cls
  }, rest), hasHeader && /*#__PURE__*/React.createElement("div", {
    className: "ia-card__header"
  }, /*#__PURE__*/React.createElement("div", null, title && /*#__PURE__*/React.createElement("h3", {
    className: "ia-card__title"
  }, title), subtitle && /*#__PURE__*/React.createElement("p", {
    className: "ia-card__sub"
  }, subtitle)), actions && /*#__PURE__*/React.createElement("div", {
    className: "ia-card__actions"
  }, actions)), /*#__PURE__*/React.createElement("div", {
    className: ['ia-card__body', tightBody ? 'ia-card__body--tight' : ''].filter(Boolean).join(' ')
  }, children));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Card.jsx", error: String((e && e.message) || e) }); }

// components/data/PnLValue.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.ia-pnl{
  display:inline-flex; align-items:center; gap:4px;
  font-family:var(--font-mono); font-variant-numeric:tabular-nums lining-nums;
  font-weight:var(--fw-semibold); line-height:1; white-space:nowrap;
}
.ia-pnl--up{ color:var(--pnl-up); }
.ia-pnl--down{ color:var(--pnl-down); }
.ia-pnl--flat{ color:var(--pnl-flat); }
.ia-pnl__arrow{ width:0.85em; height:0.85em; flex:none; }
.ia-pnl--sm{ font-size:var(--text-sm); }
.ia-pnl--md{ font-size:var(--text-base); }
.ia-pnl--lg{ font-size:var(--text-h4); }
.ia-pnl--xl{ font-size:var(--text-h2); letter-spacing:var(--tracking-snug); }
.ia-pnl__pct{ opacity:.95; }
.ia-pnl--badge{
  font-family:var(--font-mono); border-radius:var(--radius-sm); padding:2px 7px; gap:3px;
}
.ia-pnl--badge.ia-pnl--up{ background:var(--pnl-up-soft); }
.ia-pnl--badge.ia-pnl--down{ background:var(--pnl-down-soft); }
.ia-pnl--badge.ia-pnl--flat{ background:var(--surface-sunken); }
`;
const RUB = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const PCT = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const ArrowUp = () => /*#__PURE__*/React.createElement("svg", {
  className: "ia-pnl__arrow",
  viewBox: "0 0 12 12",
  fill: "none"
}, /*#__PURE__*/React.createElement("path", {
  d: "M6 9.5V2.5M6 2.5L2.5 6M6 2.5L9.5 6",
  stroke: "currentColor",
  strokeWidth: "1.6",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}));
const ArrowDown = () => /*#__PURE__*/React.createElement("svg", {
  className: "ia-pnl__arrow",
  viewBox: "0 0 12 12",
  fill: "none"
}, /*#__PURE__*/React.createElement("path", {
  d: "M6 2.5v7M6 9.5L2.5 6M6 9.5L9.5 6",
  stroke: "currentColor",
  strokeWidth: "1.6",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}));
function fmtMoney(v) {
  const s = RUB.format(Math.abs(v));
  return `${v < 0 ? '−' : ''}${s} ₽`;
}
function fmtPct(v) {
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}${PCT.format(Math.abs(v))}%`;
}

/**
 * Directional P&L figure — sign, color, arrow, tabular figures. The single
 * most-used data primitive. Render money, percent, or both.
 */
function PnLValue({
  value = 0,
  percent = null,
  display = 'both',
  // 'money' | 'percent' | 'both'
  size = 'md',
  arrow = true,
  badge = false,
  showSignWhenZero = false,
  className = '',
  ...rest
}) {
  __ds_scope.injectOnce('ia-pnl', CSS);
  const basis = percent != null ? percent : value;
  const dir = basis > 0 ? 'up' : basis < 0 ? 'down' : 'flat';
  const cls = ['ia-pnl', `ia-pnl--${dir}`, `ia-pnl--${size}`, badge ? 'ia-pnl--badge' : '', className].filter(Boolean).join(' ');
  const showArrow = arrow && (dir !== 'flat' || showSignWhenZero);
  return /*#__PURE__*/React.createElement("span", _extends({
    className: cls
  }, rest), showArrow && dir === 'up' && /*#__PURE__*/React.createElement(ArrowUp, null), showArrow && dir === 'down' && /*#__PURE__*/React.createElement(ArrowDown, null), (display === 'money' || display === 'both') && /*#__PURE__*/React.createElement("span", null, fmtMoney(value)), (display === 'percent' || display === 'both') && percent != null && /*#__PURE__*/React.createElement("span", {
    className: "ia-pnl__pct"
  }, display === 'both' ? `(${fmtPct(percent)})` : fmtPct(percent)));
}
Object.assign(__ds_scope, { PnLValue });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/PnLValue.jsx", error: String((e && e.message) || e) }); }

// components/data/StatCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.ia-stat{
  display:flex; flex-direction:column; gap:6px;
  font-family:var(--font-sans);
}
.ia-stat__label{ display:flex; align-items:center; gap:6px; font-size:var(--text-sm); color:var(--text-3); font-weight:var(--fw-medium); }
.ia-stat__label svg,.ia-stat__label i{ width:15px; height:15px; }
.ia-stat__value{
  font-family:var(--font-mono); font-variant-numeric:tabular-nums lining-nums;
  font-weight:var(--fw-bold); color:var(--text-1); line-height:1.05; letter-spacing:var(--tracking-snug);
}
.ia-stat--sm .ia-stat__value{ font-size:var(--text-h3); }
.ia-stat--md .ia-stat__value{ font-size:var(--text-h2); }
.ia-stat--lg .ia-stat__value{ font-size:var(--text-h1); letter-spacing:var(--tracking-tight); }
.ia-stat--xl .ia-stat__value{ font-size:var(--text-display); letter-spacing:var(--tracking-tight); }
.ia-stat__foot{ display:flex; align-items:center; gap:8px; font-size:var(--text-sm); color:var(--text-3); }
.ia-stat__unit{ font-size:0.6em; font-weight:var(--fw-semibold); color:var(--text-3); margin-left:4px; }
`;

/**
 * Headline metric: small label, large tabular figure, optional P&L delta and
 * caption. Use for the portfolio total and account/section summaries.
 */
function StatCard({
  label,
  value,
  unit = '',
  icon = null,
  delta = null,
  // number → rendered as PnLValue
  deltaPercent = null,
  caption = '',
  size = 'md',
  className = '',
  ...rest
}) {
  __ds_scope.injectOnce('ia-stat', CSS);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['ia-stat', `ia-stat--${size}`, className].filter(Boolean).join(' ')
  }, rest), /*#__PURE__*/React.createElement("span", {
    className: "ia-stat__label"
  }, icon, label), /*#__PURE__*/React.createElement("span", {
    className: "ia-stat__value"
  }, value, unit && /*#__PURE__*/React.createElement("span", {
    className: "ia-stat__unit"
  }, unit)), (delta != null || deltaPercent != null || caption) && /*#__PURE__*/React.createElement("span", {
    className: "ia-stat__foot"
  }, (delta != null || deltaPercent != null) && /*#__PURE__*/React.createElement(__ds_scope.PnLValue, {
    value: delta ?? 0,
    percent: deltaPercent,
    display: delta != null ? 'both' : 'percent',
    size: "sm"
  }), caption && /*#__PURE__*/React.createElement("span", null, caption)));
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.ia-btn{
  --_bg:var(--accent); --_fg:var(--text-on-accent); --_bd:transparent;
  display:inline-flex; align-items:center; justify-content:center; gap:8px;
  font-family:var(--font-sans); font-weight:var(--fw-semibold);
  border:1px solid var(--_bd); background:var(--_bg); color:var(--_fg);
  border-radius:var(--radius-md); cursor:pointer; white-space:nowrap;
  text-decoration:none; user-select:none; line-height:1;
  transition:background var(--dur-fast) var(--ease-out),
             border-color var(--dur-fast) var(--ease-out),
             box-shadow var(--dur-fast) var(--ease-out),
             transform var(--dur-fast) var(--ease-out);
}
.ia-btn:focus-visible{ outline:none; box-shadow:var(--ring); }
.ia-btn:active{ transform:translateY(1px); }
.ia-btn[disabled],.ia-btn[aria-disabled="true"]{ opacity:.5; cursor:not-allowed; transform:none; }

/* sizes */
.ia-btn--sm{ height:var(--control-sm); padding:0 12px; font-size:var(--text-sm); }
.ia-btn--md{ height:var(--control-md); padding:0 16px; font-size:var(--text-base); }
.ia-btn--lg{ height:var(--control-lg); padding:0 22px; font-size:var(--text-lg); }
.ia-btn--block{ width:100%; }

/* variants */
.ia-btn--primary{ --_bg:var(--accent); --_fg:var(--text-on-accent); }
.ia-btn--primary:hover:not([disabled]){ --_bg:var(--accent-hover); }
.ia-btn--secondary{ --_bg:var(--surface-card); --_fg:var(--text-1); --_bd:var(--border-2); }
.ia-btn--secondary:hover:not([disabled]){ background:var(--surface-sunken); }
.ia-btn--ghost{ --_bg:transparent; --_fg:var(--text-2); }
.ia-btn--ghost:hover:not([disabled]){ background:var(--surface-sunken); --_fg:var(--text-1); }
.ia-btn--soft{ --_bg:var(--accent-soft); --_fg:var(--accent-hover); }
.ia-btn--soft:hover:not([disabled]){ --_bg:var(--accent-soft-hover); }
.ia-btn--danger{ --_bg:var(--negative); --_fg:#fff; }
.ia-btn--danger:hover:not([disabled]){ filter:brightness(0.94); }

.ia-btn__spin{ width:1em; height:1em; border:2px solid currentColor; border-right-color:transparent;
  border-radius:50%; animation:ia-btn-spin .6s linear infinite; }
@keyframes ia-btn-spin{ to{ transform:rotate(360deg); } }
@media (prefers-reduced-motion: reduce){ .ia-btn__spin{ animation-duration:1.2s; } }
`;

/**
 * Primary action control. Variants: primary | secondary | ghost | soft | danger.
 */
function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  loading = false,
  disabled = false,
  leftIcon = null,
  rightIcon = null,
  as = 'button',
  className = '',
  children,
  ...rest
}) {
  __ds_scope.injectOnce('ia-btn', CSS);
  const Tag = as;
  const cls = ['ia-btn', `ia-btn--${variant}`, `ia-btn--${size}`, block ? 'ia-btn--block' : '', className].filter(Boolean).join(' ');
  const isDisabled = disabled || loading;
  const tagProps = Tag === 'button' ? {
    type: rest.type || 'button',
    disabled: isDisabled
  } : {
    'aria-disabled': isDisabled || undefined
  };
  return /*#__PURE__*/React.createElement(Tag, _extends({
    className: cls
  }, tagProps, rest), loading && /*#__PURE__*/React.createElement("span", {
    className: "ia-btn__spin",
    "aria-hidden": "true"
  }), !loading && leftIcon, children, !loading && rightIcon);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.ia-iconbtn{
  display:inline-flex; align-items:center; justify-content:center;
  background:transparent; border:1px solid transparent; color:var(--text-2);
  border-radius:var(--radius-md); cursor:pointer; padding:0;
  transition:background var(--dur-fast) var(--ease-out),
             color var(--dur-fast) var(--ease-out),
             border-color var(--dur-fast) var(--ease-out),
             transform var(--dur-fast) var(--ease-out);
}
.ia-iconbtn:hover:not([disabled]){ background:var(--surface-sunken); color:var(--text-1); }
.ia-iconbtn:focus-visible{ outline:none; box-shadow:var(--ring); }
.ia-iconbtn:active{ transform:translateY(1px); }
.ia-iconbtn[disabled]{ opacity:.45; cursor:not-allowed; }
.ia-iconbtn svg,.ia-iconbtn i{ width:1.25em; height:1.25em; display:block; }

.ia-iconbtn--sm{ width:var(--control-sm); height:var(--control-sm); font-size:15px; }
.ia-iconbtn--md{ width:var(--control-md); height:var(--control-md); font-size:18px; }
.ia-iconbtn--lg{ width:var(--control-lg); height:var(--control-lg); font-size:20px; }

.ia-iconbtn--outlined{ border-color:var(--border-2); background:var(--surface-card); }
.ia-iconbtn--solid{ background:var(--accent); color:var(--text-on-accent); }
.ia-iconbtn--solid:hover:not([disabled]){ background:var(--accent-hover); color:var(--text-on-accent); }
`;

/**
 * Square icon-only button (toolbar, table row actions, close).
 */
function IconButton({
  size = 'md',
  variant = 'ghost',
  label,
  className = '',
  children,
  ...rest
}) {
  __ds_scope.injectOnce('ia-iconbtn', CSS);
  const cls = ['ia-iconbtn', `ia-iconbtn--${size}`, variant !== 'ghost' ? `ia-iconbtn--${variant}` : '', className].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    className: cls,
    "aria-label": label,
    title: label
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.ia-field{ display:flex; flex-direction:column; gap:6px; font-family:var(--font-sans); }
.ia-field__label{ font-size:var(--text-sm); font-weight:var(--fw-medium); color:var(--text-2); }
.ia-field__req{ color:var(--negative); margin-left:2px; }
.ia-input-wrap{
  display:flex; align-items:center; gap:8px; background:var(--surface-card);
  border:1px solid var(--border-2); border-radius:var(--radius-md);
  padding:0 12px; height:var(--control-md);
  transition:border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
}
.ia-input-wrap--sm{ height:var(--control-sm); }
.ia-input-wrap--lg{ height:var(--control-lg); }
.ia-input-wrap:focus-within{ border-color:var(--accent); box-shadow:var(--ring); }
.ia-input-wrap--invalid{ border-color:var(--negative); }
.ia-input-wrap--invalid:focus-within{ box-shadow:0 0 0 var(--ring-width) var(--negative-soft); }
.ia-input-wrap--disabled{ background:var(--surface-sunken); opacity:.7; cursor:not-allowed; }
.ia-input{
  flex:1; min-width:0; border:0; outline:none; background:transparent;
  font-family:inherit; font-size:var(--text-base); color:var(--text-1); height:100%;
}
.ia-input::placeholder{ color:var(--text-4); }
.ia-input--num{ font-family:var(--font-mono); font-variant-numeric:tabular-nums; text-align:right; }
.ia-input-wrap__affix{ color:var(--text-3); font-size:var(--text-sm); display:inline-flex; align-items:center; }
.ia-input-wrap__affix svg,.ia-input-wrap__affix i{ width:1.1em; height:1.1em; display:block; }
.ia-field__hint{ font-size:var(--text-xs); color:var(--text-3); }
.ia-field__hint--err{ color:var(--negative); }
`;

/**
 * Text / number input with label, prefix/suffix affixes, hint and error.
 */
function Input({
  label,
  required = false,
  size = 'md',
  prefix = null,
  suffix = null,
  hint = '',
  error = '',
  numeric = false,
  disabled = false,
  id,
  className = '',
  ...rest
}) {
  __ds_scope.injectOnce('ia-input', CSS);
  const fid = id || (label ? `ia-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  const invalid = Boolean(error);
  const wrapCls = ['ia-input-wrap', `ia-input-wrap--${size}`, invalid ? 'ia-input-wrap--invalid' : '', disabled ? 'ia-input-wrap--disabled' : ''].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("div", {
    className: ['ia-field', className].filter(Boolean).join(' ')
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "ia-field__label",
    htmlFor: fid
  }, label, required && /*#__PURE__*/React.createElement("span", {
    className: "ia-field__req"
  }, "*")), /*#__PURE__*/React.createElement("div", {
    className: wrapCls
  }, prefix && /*#__PURE__*/React.createElement("span", {
    className: "ia-input-wrap__affix"
  }, prefix), /*#__PURE__*/React.createElement("input", _extends({
    id: fid,
    className: ['ia-input', numeric ? 'ia-input--num' : ''].filter(Boolean).join(' '),
    disabled: disabled,
    "aria-invalid": invalid || undefined,
    inputMode: numeric ? 'decimal' : undefined
  }, rest)), suffix && /*#__PURE__*/React.createElement("span", {
    className: "ia-input-wrap__affix"
  }, suffix)), (hint || error) && /*#__PURE__*/React.createElement("span", {
    className: ['ia-field__hint', invalid ? 'ia-field__hint--err' : ''].filter(Boolean).join(' ')
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.ia-select{ display:flex; flex-direction:column; gap:6px; font-family:var(--font-sans); }
.ia-select__label{ font-size:var(--text-sm); font-weight:var(--fw-medium); color:var(--text-2); }
.ia-select__wrap{ position:relative; display:flex; align-items:center; }
.ia-select__el{
  appearance:none; -webkit-appearance:none; width:100%; cursor:pointer;
  font-family:inherit; font-size:var(--text-base); color:var(--text-1);
  background:var(--surface-card); border:1px solid var(--border-2);
  border-radius:var(--radius-md); height:var(--control-md); padding:0 36px 0 12px;
  transition:border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
}
.ia-select__el--sm{ height:var(--control-sm); font-size:var(--text-sm); }
.ia-select__el--lg{ height:var(--control-lg); }
.ia-select__el:focus-visible{ outline:none; border-color:var(--accent); box-shadow:var(--ring); }
.ia-select__el:disabled{ background:var(--surface-sunken); opacity:.7; cursor:not-allowed; }
.ia-select__chev{
  position:absolute; right:12px; pointer-events:none; color:var(--text-3);
  width:16px; height:16px; display:flex; align-items:center; justify-content:center;
}
.ia-select__chev svg{ width:16px; height:16px; }
`;
const Chevron = () => /*#__PURE__*/React.createElement("span", {
  className: "ia-select__chev",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 16 16",
  fill: "none"
}, /*#__PURE__*/React.createElement("path", {
  d: "M4 6l4 4 4-4",
  stroke: "currentColor",
  strokeWidth: "1.6",
  strokeLinecap: "round",
  strokeLinejoin: "round"
})));

/**
 * Native select wrapped with the system's field chrome and a custom chevron.
 * Pass `options` (array of {value,label}) or children <option>s.
 */
function Select({
  label,
  size = 'md',
  options = null,
  placeholder,
  id,
  className = '',
  children,
  ...rest
}) {
  __ds_scope.injectOnce('ia-select', CSS);
  const fid = id || (label ? `ia-sel-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined);
  return /*#__PURE__*/React.createElement("div", {
    className: ['ia-select', className].filter(Boolean).join(' ')
  }, label && /*#__PURE__*/React.createElement("label", {
    className: "ia-select__label",
    htmlFor: fid
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "ia-select__wrap"
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: fid,
    className: `ia-select__el ia-select__el--${size}`
  }, rest), placeholder && /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, placeholder), options ? options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label)) : children), /*#__PURE__*/React.createElement(Chevron, null)));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.ia-switch{ display:inline-flex; align-items:center; gap:10px; cursor:pointer; font-family:var(--font-sans); }
.ia-switch--disabled{ opacity:.5; cursor:not-allowed; }
.ia-switch__track{
  position:relative; width:38px; height:22px; flex:none; border-radius:var(--radius-pill);
  background:var(--ink-300); transition:background var(--dur-base) var(--ease-out);
}
.ia-switch__track--lg{ width:46px; height:26px; }
.ia-switch__thumb{
  position:absolute; top:2px; left:2px; width:18px; height:18px; border-radius:50%;
  background:var(--white); box-shadow:var(--shadow-sm);
  transition:transform var(--dur-base) var(--ease-spring);
}
.ia-switch__track--lg .ia-switch__thumb{ width:22px; height:22px; }
.ia-switch input{ position:absolute; opacity:0; width:0; height:0; }
.ia-switch input:checked + .ia-switch__track{ background:var(--accent); }
.ia-switch input:checked + .ia-switch__track .ia-switch__thumb{ transform:translateX(16px); }
.ia-switch__track--lg .ia-switch__thumb{ }
.ia-switch input:checked + .ia-switch__track--lg .ia-switch__thumb{ transform:translateX(20px); }
.ia-switch input:focus-visible + .ia-switch__track{ box-shadow:var(--ring); }
.ia-switch__label{ font-size:var(--text-base); color:var(--text-1); }
`;

/**
 * Boolean toggle. Controlled via `checked`/`onChange`. Optional inline label.
 */
function Switch({
  checked,
  defaultChecked,
  onChange,
  label,
  size = 'md',
  disabled = false,
  id,
  className = '',
  ...rest
}) {
  __ds_scope.injectOnce('ia-switch', CSS);
  const trackCls = ['ia-switch__track', size === 'lg' ? 'ia-switch__track--lg' : ''].filter(Boolean).join(' ');
  return /*#__PURE__*/React.createElement("label", {
    className: ['ia-switch', disabled ? 'ia-switch--disabled' : '', className].filter(Boolean).join(' ')
  }, /*#__PURE__*/React.createElement("input", _extends({
    type: "checkbox",
    role: "switch",
    checked: checked,
    defaultChecked: defaultChecked,
    onChange: onChange,
    disabled: disabled,
    id: id
  }, rest)), /*#__PURE__*/React.createElement("span", {
    className: trackCls
  }, /*#__PURE__*/React.createElement("span", {
    className: "ia-switch__thumb"
  })), label && /*#__PURE__*/React.createElement("span", {
    className: "ia-switch__label"
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const CSS = `
.ia-tabs{ display:flex; align-items:center; gap:2px; font-family:var(--font-sans); }
.ia-tabs--line{ border-bottom:1px solid var(--border-1); gap:4px; }
.ia-tabs--pill{ background:var(--surface-sunken); padding:3px; border-radius:var(--radius-md); gap:2px; width:max-content; }
.ia-tab{
  appearance:none; border:0; background:transparent; cursor:pointer;
  font-family:inherit; font-size:var(--text-sm); font-weight:var(--fw-medium);
  color:var(--text-3); padding:8px 14px; border-radius:var(--radius-sm);
  display:inline-flex; align-items:center; gap:7px; white-space:nowrap;
  transition:color var(--dur-fast) var(--ease-out), background var(--dur-fast) var(--ease-out);
}
.ia-tab:hover{ color:var(--text-1); }
.ia-tab:focus-visible{ outline:none; box-shadow:var(--ring); }
.ia-tab svg,.ia-tab i{ width:16px; height:16px; }
.ia-tab__count{ font-family:var(--font-mono); font-size:var(--text-2xs); color:var(--text-4); background:var(--surface-sunken); border-radius:var(--radius-pill); padding:1px 6px; }

/* line variant */
.ia-tabs--line .ia-tab{ border-radius:0; padding:10px 4px; margin-bottom:-1px; border-bottom:2px solid transparent; }
.ia-tabs--line .ia-tab--active{ color:var(--accent); border-bottom-color:var(--accent); }

/* pill variant */
.ia-tabs--pill .ia-tab--active{ color:var(--text-1); background:var(--surface-card); box-shadow:var(--shadow-xs); }
.ia-tabs--pill .ia-tab__count{ background:var(--surface-sunken); }
`;

/**
 * Tab bar. Controlled: pass `value` + `onChange`. `items` = [{value,label,count,icon}].
 */
function Tabs({
  items = [],
  value,
  onChange,
  variant = 'line',
  className = '',
  ...rest
}) {
  __ds_scope.injectOnce('ia-tabs', CSS);
  return /*#__PURE__*/React.createElement("div", _extends({
    className: ['ia-tabs', `ia-tabs--${variant}`, className].filter(Boolean).join(' '),
    role: "tablist"
  }, rest), items.map(it => {
    const active = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      type: "button",
      role: "tab",
      "aria-selected": active,
      className: ['ia-tab', active ? 'ia-tab--active' : ''].filter(Boolean).join(' '),
      onClick: () => onChange && onChange(it.value)
    }, it.icon, it.label, it.count != null && /*#__PURE__*/React.createElement("span", {
      className: "ia-tab__count"
    }, it.count));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/data.js
try { (() => {
/* InvestAnalitic — UI kit demo data (in the house number style) */
window.IA_DATA = {
  portfolio: {
    total: '2 480 350,00 ₽',
    dayDelta: 12480,
    dayPct: 0.51,
    allDelta: 684600,
    allPct: 38.18,
    invested: '1 795 750,00 ₽'
  },
  alloc: [{
    label: 'Акции',
    value: 1680000
  }, {
    label: 'Облигации',
    value: 620000
  }, {
    label: 'Деньги',
    value: 180350
  }],
  accounts: [{
    id: 'sber',
    name: 'Сбер Инвестиции',
    kind: 'ИИС',
    value: '1 412 800,00 ₽',
    dayDelta: 8120,
    dayPct: 0.58,
    allDelta: 384200,
    allPct: 37.3
  }, {
    id: 'tbank',
    name: 'Т-Банк Инвестиции',
    kind: 'Брокерский',
    value: '1 067 550,00 ₽',
    dayDelta: 4360,
    dayPct: 0.41,
    allDelta: 300400,
    allPct: 39.2
  }],
  equities: [{
    ticker: 'SBER',
    name: 'Сбербанк',
    isin: 'RU0009029540',
    qty: 500,
    avg: 218.40,
    price: 286.40,
    value: 143200,
    dayPct: 1.24,
    pnl: 34000,
    pnlPct: 31.1,
    weight: 9.2
  }, {
    ticker: 'LKOH',
    name: 'Лукойл',
    isin: 'RU0009024277',
    qty: 100,
    avg: 6240.00,
    price: 7184.50,
    value: 718450,
    dayPct: 0.42,
    pnl: 94450,
    pnlPct: 15.1,
    weight: 28.9
  }, {
    ticker: 'GAZP',
    name: 'Газпром',
    isin: 'RU0007661625',
    qty: 750,
    avg: 162.10,
    price: 128.06,
    value: 96045,
    dayPct: -0.88,
    pnl: -25530,
    pnlPct: -21.0,
    weight: 3.9
  }, {
    ticker: 'GMKN',
    name: 'Норникель',
    isin: 'RU0007288411',
    qty: 80,
    avg: 132.50,
    price: 158.20,
    value: 12656,
    dayPct: 0.64,
    pnl: 2056,
    pnlPct: 19.4,
    weight: 0.5
  }, {
    ticker: 'YDEX',
    name: 'Яндекс',
    isin: 'RU000A107T19',
    qty: 60,
    avg: 3820.00,
    price: 4488.00,
    value: 269280,
    dayPct: 2.10,
    pnl: 40080,
    pnlPct: 17.5,
    weight: 10.9
  }],
  bonds: [{
    ticker: 'ОФЗ 26244',
    name: 'ОФЗ-ПД',
    isin: 'RU000A1078S5',
    qty: 200,
    price: 932.40,
    value: 186480,
    coupon: 56.10,
    ytm: 13.8,
    maturity: '15.03.2034',
    weight: 7.5
  }, {
    ticker: 'ОФЗ 26238',
    name: 'ОФЗ-ПД',
    isin: 'RU000A1038V6',
    qty: 150,
    price: 612.80,
    value: 91920,
    coupon: 35.40,
    ytm: 13.2,
    maturity: '15.05.2041',
    weight: 3.7
  }, {
    ticker: 'РЖД 1Р-28R',
    name: 'РЖД',
    isin: 'RU000A106ZL5',
    qty: 300,
    price: 988.20,
    value: 296460,
    coupon: 41.10,
    ytm: 12.4,
    maturity: '20.11.2028',
    weight: 11.9
  }],
  payments: [{
    type: 'dividend',
    ticker: 'SBER',
    name: 'Сбербанк',
    date: '12.07',
    amount: '6 250,00 ₽',
    perShare: '12,50 ₽',
    status: 'upcoming',
    days: 4
  }, {
    type: 'coupon',
    ticker: 'ОФЗ 26244',
    name: 'ОФЗ-ПД',
    date: '15.07',
    amount: '11 220,00 ₽',
    perShare: '56,10 ₽',
    status: 'upcoming',
    days: 7
  }, {
    type: 'dividend',
    ticker: 'LKOH',
    name: 'Лукойл',
    date: '24.07',
    amount: '49 800,00 ₽',
    perShare: '498,00 ₽',
    status: 'upcoming',
    days: 16
  }, {
    type: 'coupon',
    ticker: 'РЖД 1Р-28R',
    name: 'РЖД',
    date: '20.06',
    amount: '12 330,00 ₽',
    perShare: '41,10 ₽',
    status: 'paid',
    days: -3
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/data.js", error: String((e && e.message) || e) }); }

// ui_kits/app/screens.jsx
try { (() => {
/* InvestAnalitic UI kit — screens */
const K = window.IAKit;
const {
  Icon,
  money,
  RUB,
  NUM0,
  Button,
  IconButton,
  Input,
  Select,
  Switch,
  Card,
  StatCard,
  PnLValue,
  Badge,
  AllocationBar,
  Avatar,
  Tabs,
  AIMessage,
  AIComposer,
  React
} = K;
const {
  useState
} = React;
const D = window.IA_DATA;

/* ===== Positions table ===== */
function EquityTable() {
  return /*#__PURE__*/React.createElement("table", {
    className: "ia-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\u0422\u0438\u043A\u0435\u0440"), /*#__PURE__*/React.createElement("th", {
    className: "r"
  }, "\u041A\u043E\u043B-\u0432\u043E"), /*#__PURE__*/React.createElement("th", {
    className: "r"
  }, "\u0421\u0440\u0435\u0434\u043D\u044F\u044F"), /*#__PURE__*/React.createElement("th", {
    className: "r"
  }, "\u0426\u0435\u043D\u0430"), /*#__PURE__*/React.createElement("th", {
    className: "r"
  }, "\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C"), /*#__PURE__*/React.createElement("th", {
    className: "r"
  }, "\u0417\u0430 \u0434\u0435\u043D\u044C"), /*#__PURE__*/React.createElement("th", {
    className: "r"
  }, "\u0414\u043E\u0445\u043E\u0434"), /*#__PURE__*/React.createElement("th", {
    className: "r"
  }, "\u0412\u0435\u0441"))), /*#__PURE__*/React.createElement("tbody", null, D.equities.map(p => /*#__PURE__*/React.createElement("tr", {
    key: p.ticker
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    className: "ia-cell-tk"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: p.ticker,
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ia-cell-tk__t ia-mono"
  }, p.ticker), /*#__PURE__*/React.createElement("div", {
    className: "ia-cell-tk__n"
  }, p.name)))), /*#__PURE__*/React.createElement("td", {
    className: "r ia-num"
  }, NUM0.format(p.qty)), /*#__PURE__*/React.createElement("td", {
    className: "r ia-num"
  }, RUB.format(p.avg)), /*#__PURE__*/React.createElement("td", {
    className: "r ia-num"
  }, RUB.format(p.price)), /*#__PURE__*/React.createElement("td", {
    className: "r ia-num",
    style: {
      color: 'var(--text-1)',
      fontWeight: 600
    }
  }, money(p.value)), /*#__PURE__*/React.createElement("td", {
    className: "r"
  }, /*#__PURE__*/React.createElement(PnLValue, {
    percent: p.dayPct,
    display: "percent",
    size: "sm"
  })), /*#__PURE__*/React.createElement("td", {
    className: "r"
  }, /*#__PURE__*/React.createElement(PnLValue, {
    value: p.pnl,
    percent: p.pnlPct,
    display: "both",
    size: "sm"
  })), /*#__PURE__*/React.createElement("td", {
    className: "r ia-num",
    style: {
      color: 'var(--text-3)'
    }
  }, RUB.format(p.weight).replace(',00', ''), "%")))));
}
function BondTable() {
  return /*#__PURE__*/React.createElement("table", {
    className: "ia-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\u0412\u044B\u043F\u0443\u0441\u043A"), /*#__PURE__*/React.createElement("th", {
    className: "r"
  }, "\u041A\u043E\u043B-\u0432\u043E"), /*#__PURE__*/React.createElement("th", {
    className: "r"
  }, "\u0426\u0435\u043D\u0430"), /*#__PURE__*/React.createElement("th", {
    className: "r"
  }, "\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C"), /*#__PURE__*/React.createElement("th", {
    className: "r"
  }, "\u041A\u0443\u043F\u043E\u043D"), /*#__PURE__*/React.createElement("th", {
    className: "r"
  }, "YTM"), /*#__PURE__*/React.createElement("th", null, "\u041F\u043E\u0433\u0430\u0448\u0435\u043D\u0438\u0435"))), /*#__PURE__*/React.createElement("tbody", null, D.bonds.map(p => /*#__PURE__*/React.createElement("tr", {
    key: p.ticker
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    className: "ia-cell-tk"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: p.ticker,
    size: "sm",
    color: "var(--ink-600)"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ia-cell-tk__t ia-mono"
  }, p.ticker), /*#__PURE__*/React.createElement("div", {
    className: "ia-cell-tk__n"
  }, p.name)))), /*#__PURE__*/React.createElement("td", {
    className: "r ia-num"
  }, NUM0.format(p.qty)), /*#__PURE__*/React.createElement("td", {
    className: "r ia-num"
  }, RUB.format(p.price)), /*#__PURE__*/React.createElement("td", {
    className: "r ia-num",
    style: {
      color: 'var(--text-1)',
      fontWeight: 600
    }
  }, money(p.value)), /*#__PURE__*/React.createElement("td", {
    className: "r ia-num"
  }, RUB.format(p.coupon), " \u20BD"), /*#__PURE__*/React.createElement("td", {
    className: "r"
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "positive",
    size: "sm"
  }, RUB.format(p.ytm).replace(',00', ''), "%")), /*#__PURE__*/React.createElement("td", {
    className: "ia-num",
    style: {
      color: 'var(--text-3)'
    }
  }, p.maturity)))));
}

/* ===== Dashboard ===== */
function Dashboard() {
  const [tab, setTab] = useState('eq');
  const p = D.portfolio;
  return /*#__PURE__*/React.createElement("div", {
    className: "ia-screen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ia-grid-top"
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    className: "ia-eyebrow",
    style: {
      marginBottom: 10
    }
  }, "\u0421\u0432\u043E\u0434\u043A\u0430 \u043F\u043E\u0440\u0442\u0444\u0435\u043B\u044F"), /*#__PURE__*/React.createElement(StatCard, {
    size: "xl",
    label: "\u0421\u0442\u043E\u0438\u043C\u043E\u0441\u0442\u044C",
    value: p.total,
    delta: p.dayDelta,
    deltaPercent: p.dayPct,
    caption: "\u0437\u0430 \u0441\u0435\u0433\u043E\u0434\u043D\u044F"
  }), /*#__PURE__*/React.createElement("div", {
    className: "ia-summ-row"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ia-summ-k"
  }, "\u0412\u043B\u043E\u0436\u0435\u043D\u043E"), /*#__PURE__*/React.createElement("div", {
    className: "ia-summ-v ia-num"
  }, p.invested)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ia-summ-k"
  }, "\u0414\u043E\u0445\u043E\u0434 \u0437\u0430 \u0432\u0441\u0451 \u0432\u0440\u0435\u043C\u044F"), /*#__PURE__*/React.createElement(PnLValue, {
    value: p.allDelta,
    percent: p.allPct,
    size: "md"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ia-eyebrow",
    style: {
      marginBottom: 10
    }
  }, "\u0421\u043E\u0441\u0442\u0430\u0432"), /*#__PURE__*/React.createElement(AllocationBar, {
    size: "lg",
    segments: D.alloc
  }))), /*#__PURE__*/React.createElement(Card, {
    className: "ia-ai-aside"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ia-ai-aside__head"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "sparkles",
    size: 16
  }), /*#__PURE__*/React.createElement("span", null, "\u0410\u043D\u0430\u043B\u0438\u0442\u0438\u043A \u0437\u0430\u043C\u0435\u0442\u0438\u043B")), /*#__PURE__*/React.createElement("div", {
    className: "ia-signal ia-signal--warn"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ia-signal__emoji"
  }, "\u26A0\uFE0F"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "LKOH \u2014 28,9% \u043F\u043E\u0440\u0442\u0444\u0435\u043B\u044F"), /*#__PURE__*/React.createElement("p", null, "\u0412\u044B\u0448\u0435 \u0446\u0435\u043B\u0438 12%. \u0412\u044B\u0441\u043E\u043A\u0430\u044F \u043A\u043E\u043D\u0446\u0435\u043D\u0442\u0440\u0430\u0446\u0438\u044F \u0432 \u043E\u0434\u043D\u043E\u043C \u044D\u043C\u0438\u0442\u0435\u043D\u0442\u0435 \u0443\u0432\u0435\u043B\u0438\u0447\u0438\u0432\u0430\u0435\u0442 \u0440\u0438\u0441\u043A."), /*#__PURE__*/React.createElement(Button, {
    variant: "soft",
    size: "sm"
  }, "\u0420\u0435\u0431\u0430\u043B\u0430\u043D\u0441\u0438\u0440\u043E\u0432\u0430\u0442\u044C"))), /*#__PURE__*/React.createElement("div", {
    className: "ia-signal"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ia-signal__emoji"
  }, "\uD83D\uDCC5"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "SBER: \u0434\u0438\u0432\u0438\u0434\u0435\u043D\u0434 \u0447\u0435\u0440\u0435\u0437 4 \u0434\u043D\u044F"), /*#__PURE__*/React.createElement("p", null, "~12,50 \u20BD \u043D\u0430 \u0430\u043A\u0446\u0438\u044E \xB7 \u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F ~6 250 \u20BD \u0434\u043E \u043D\u0430\u043B\u043E\u0433\u043E\u0432."))), /*#__PURE__*/React.createElement("div", {
    className: "ia-signal"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ia-signal__emoji"
  }, "\uD83E\uDDFE"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "GAZP \u0432 \u043C\u0438\u043D\u0443\u0441\u0435 \u221225 530 \u20BD"), /*#__PURE__*/React.createElement("p", null, "\u041C\u043E\u0436\u043D\u043E \u0437\u0430\u0444\u0438\u043A\u0441\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0443\u0431\u044B\u0442\u043E\u043A \u0434\u043E \u043A\u043E\u043D\u0446\u0430 \u0433\u043E\u0434\u0430 \u0438 \u0443\u043C\u0435\u043D\u044C\u0448\u0438\u0442\u044C \u043D\u0430\u043B\u043E\u0433."))))), /*#__PURE__*/React.createElement(Card, {
    tightBody: true
  }, /*#__PURE__*/React.createElement("div", {
    className: "ia-table-head"
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      value: 'eq',
      label: 'Акции',
      count: D.equities.length
    }, {
      value: 'bond',
      label: 'Облигации',
      count: D.bonds.length
    }, {
      value: 'cash',
      label: 'Деньги'
    }]
  }), /*#__PURE__*/React.createElement("div", {
    className: "ia-table-head__r"
  }, /*#__PURE__*/React.createElement(Select, {
    size: "sm",
    defaultValue: "all"
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "\u0412\u0441\u0435 \u0441\u0447\u0435\u0442\u0430"), /*#__PURE__*/React.createElement("option", null, "\u0421\u0431\u0435\u0440 \u0418\u043D\u0432\u0435\u0441\u0442\u0438\u0446\u0438\u0438"), /*#__PURE__*/React.createElement("option", null, "\u0422-\u0411\u0430\u043D\u043A \u0418\u043D\u0432\u0435\u0441\u0442\u0438\u0446\u0438\u0438")), /*#__PURE__*/React.createElement(IconButton, {
    variant: "outlined",
    label: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "download",
    size: 16
  })))), tab === 'eq' && /*#__PURE__*/React.createElement(EquityTable, null), tab === 'bond' && /*#__PURE__*/React.createElement(BondTable, null), tab === 'cash' && /*#__PURE__*/React.createElement("div", {
    className: "ia-cash"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ia-cash__row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ia-mono"
  }, "RUB"), /*#__PURE__*/React.createElement("span", {
    className: "ia-num"
  }, "180 350,00 \u20BD")))));
}

/* ===== Assistant ===== */
function Assistant() {
  const [msgs, setMsgs] = useState([{
    role: 'ai',
    body: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", null, "\u041F\u0440\u0438\u0432\u0435\u0442! \u042F \u0442\u0432\u043E\u0439 \u0438\u043D\u0432\u0435\u0441\u0442\u0438\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u0418\u0418-\u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A. \u0417\u043D\u0430\u044E \u0442\u0432\u043E\u0439 \u043F\u043E\u0440\u0442\u0444\u0435\u043B\u044C \u0434\u043E\u0441\u043A\u043E\u043D\u0430\u043B\u044C\u043D\u043E \u2014 \u0441\u043F\u0440\u0430\u0448\u0438\u0432\u0430\u0439 \u0438\u043B\u0438 \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0439 \u0441\u0434\u0435\u043B\u043A\u0438 \u0432 \u043B\u044E\u0431\u043E\u0439 \u0444\u043E\u0440\u043C\u0435."))
  }, {
    role: 'user',
    body: 'Как мой портфель за месяц?'
  }, {
    role: 'ai',
    body: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", null, "\u0417\u0430 \u043C\u0435\u0441\u044F\u0446 \u043F\u043E\u0440\u0442\u0444\u0435\u043B\u044C ", /*#__PURE__*/React.createElement("strong", null, "+4,8%"), " (+114 200 \u20BD). \u041E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 \u0432\u043A\u043B\u0430\u0434 \u2014 YDEX (+17,5%) \u0438 SBER (+31,1% \u0437\u0430 \u0432\u0441\u0451 \u0432\u0440\u0435\u043C\u044F)."), /*#__PURE__*/React.createElement("p", null, "\u0427\u0442\u043E \u043D\u0430\u0441\u0442\u043E\u0440\u0430\u0436\u0438\u0432\u0430\u0435\u0442: GAZP \u0432 \u043C\u0438\u043D\u0443\u0441\u0435 \u043D\u0430 \u221221%, \u0442\u044F\u043D\u0435\u0442 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u0432\u043D\u0438\u0437. \u0418 LKOH \u0440\u0430\u0437\u0440\u043E\u0441\u0441\u044F \u0434\u043E 28,9% \u2014 \u0441\u0442\u043E\u0438\u0442 \u043F\u0440\u0438\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C\u0441\u044F \u043A \u0431\u0430\u043B\u0430\u043D\u0441\u0443.")),
    actions: [/*#__PURE__*/React.createElement(K.Button, {
      key: "1",
      variant: "soft",
      size: "sm"
    }, "\u0420\u0430\u0437\u043E\u0431\u0440\u0430\u0442\u044C GAZP"), /*#__PURE__*/React.createElement(K.Button, {
      key: "2",
      variant: "ghost",
      size: "sm"
    }, "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0433\u0440\u0430\u0444\u0438\u043A")]
  }]);
  const [typing, setTyping] = useState(false);
  const send = text => {
    setMsgs(m => [...m, {
      role: 'user',
      body: text
    }]);
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs(m => [...m, {
        role: 'ai',
        body: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", null, "\u0421\u0447\u0438\u0442\u0430\u044E \u043F\u043E \u0442\u0432\u043E\u0438\u043C \u0434\u0430\u043D\u043D\u044B\u043C\u2026 \u0417\u0430\u043F\u0438\u0441\u0430\u043B \u0437\u0430\u043F\u0440\u043E\u0441: \xAB", text, "\xBB. \u0412 \u0434\u0435\u043C\u043E-\u0440\u0435\u0436\u0438\u043C\u0435 \u043E\u0442\u0432\u0435\u0442 \u0437\u0430\u0433\u043B\u0443\u0448\u043A\u0430, \u043D\u043E \u0432 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0435 \u0437\u0434\u0435\u0441\u044C \u0431\u0443\u0434\u0435\u0442 \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u044B\u0439 \u0440\u0430\u0437\u0431\u043E\u0440 \u0441 \u0446\u0438\u0444\u0440\u0430\u043C\u0438 \u0438\u0437 \u043F\u043E\u0440\u0442\u0444\u0435\u043B\u044F \u0438 \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u0430\u043C\u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439."))
      }]);
    }, 1400);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "ia-screen ia-chat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ia-chat__feed"
  }, msgs.map((m, i) => /*#__PURE__*/React.createElement(AIMessage, {
    key: i,
    role: m.role,
    actions: m.actions
  }, m.body)), typing && /*#__PURE__*/React.createElement(AIMessage, {
    role: "ai",
    typing: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "ia-chat__composer"
  }, /*#__PURE__*/React.createElement(AIComposer, {
    onSend: send,
    suggestions: ['Когда ближайшие дивиденды?', 'Стоит ли ребалансировать?', 'Какой у меня налог при продаже LKOH?']
  })));
}

/* ===== Rebalance ===== */
function Rebalance() {
  const rows = [{
    tk: 'LKOH',
    cur: 28.9,
    tgt: 12,
    action: 'Продать',
    amount: '−418 600 ₽'
  }, {
    tk: 'YDEX',
    cur: 10.9,
    tgt: 12,
    action: 'Купить',
    amount: '+27 200 ₽'
  }, {
    tk: 'SBER',
    cur: 9.2,
    tgt: 15,
    action: 'Купить',
    amount: '+143 900 ₽'
  }, {
    tk: 'GAZP',
    cur: 3.9,
    tgt: 8,
    action: 'Купить',
    amount: '+101 700 ₽'
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "ia-screen ia-grid-reb"
  }, /*#__PURE__*/React.createElement(Card, {
    title: "\u0426\u0435\u043B\u0435\u0432\u044B\u0435 \u0432\u0435\u0441\u0430",
    subtitle: "\u041F\u0435\u0440\u0435\u0442\u0430\u0449\u0438 \u0438\u043B\u0438 \u0437\u0430\u0434\u0430\u0439 % \u2014 \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A \u0440\u0430\u0441\u0441\u0447\u0438\u0442\u0430\u0435\u0442 \u0441\u0434\u0435\u043B\u043A\u0438"
  }, rows.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.tk,
    className: "ia-reb-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ia-mono ia-reb-row__tk"
  }, r.tk), /*#__PURE__*/React.createElement("div", {
    className: "ia-reb-bar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ia-reb-bar__cur",
    style: {
      width: r.cur + '%'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "ia-reb-bar__tgt",
    style: {
      left: r.tgt + '%'
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "ia-num ia-reb-row__cur"
  }, RUB.format(r.cur).replace(',00', ''), "%"), /*#__PURE__*/React.createElement(Icon, {
    n: "arrow-right",
    size: 14
  }), /*#__PURE__*/React.createElement("span", {
    className: "ia-num ia-reb-row__tgt"
  }, r.tgt, "%"))), /*#__PURE__*/React.createElement("div", {
    className: "ia-reb-legend"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "dot cur"
  }), "\u0422\u0435\u043A\u0443\u0449\u0438\u0439"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    className: "dot tgt"
  }), "\u0426\u0435\u043B\u044C"))), /*#__PURE__*/React.createElement(Card, {
    title: "\u041F\u043B\u0430\u043D \u0441\u0434\u0435\u043B\u043E\u043A",
    actions: /*#__PURE__*/React.createElement(Button, {
      size: "sm"
    }, "\u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C")
  }, /*#__PURE__*/React.createElement("table", {
    className: "ia-table ia-table--plain"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\u0422\u0438\u043A\u0435\u0440"), /*#__PURE__*/React.createElement("th", null, "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u0435"), /*#__PURE__*/React.createElement("th", {
    className: "r"
  }, "\u0421\u0443\u043C\u043C\u0430"))), /*#__PURE__*/React.createElement("tbody", null, rows.map(r => /*#__PURE__*/React.createElement("tr", {
    key: r.tk
  }, /*#__PURE__*/React.createElement("td", {
    className: "ia-mono"
  }, r.tk), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Badge, {
    tone: r.action === 'Купить' ? 'positive' : 'negative',
    size: "sm"
  }, r.action)), /*#__PURE__*/React.createElement("td", {
    className: "r ia-num",
    style: {
      color: r.action === 'Купить' ? 'var(--pnl-up)' : 'var(--pnl-down)'
    }
  }, r.amount))))), /*#__PURE__*/React.createElement("div", {
    className: "ia-note"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "info",
    size: 14
  }), /*#__PURE__*/React.createElement("span", null, "\u041D\u0435 \u0438\u043D\u0434\u0438\u0432\u0438\u0434\u0443\u0430\u043B\u044C\u043D\u0430\u044F \u0438\u043D\u0432\u0435\u0441\u0442\u0438\u0446\u0438\u043E\u043D\u043D\u0430\u044F \u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0430\u0446\u0438\u044F. \u041A\u043E\u043C\u0438\u0441\u0441\u0438\u0438 \u0438 \u043D\u0430\u043B\u043E\u0433\u0438 \u043E\u0440\u0438\u0435\u043D\u0442\u0438\u0440\u043E\u0432\u043E\u0447\u043D\u044B\u0435."))));
}

/* ===== Calendar ===== */
function Calendar() {
  return /*#__PURE__*/React.createElement("div", {
    className: "ia-screen"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ia-cal-stats"
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatCard, {
    label: "\u041E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F \u0437\u0430 30 \u0434\u043D\u0435\u0439",
    value: "67 270,00 \u20BD",
    icon: /*#__PURE__*/React.createElement(Icon, {
      n: "calendar",
      size: 15
    })
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatCard, {
    label: "\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u043E \u0432 \u044D\u0442\u043E\u043C \u0433\u043E\u0434\u0443",
    value: "184 320,00 \u20BD",
    icon: /*#__PURE__*/React.createElement(Icon, {
      n: "banknote",
      size: 15
    })
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatCard, {
    label: "\u0424\u043E\u0440\u0432\u0430\u0440\u0434\u043D\u0430\u044F \u0434\u043E\u0445\u043E\u0434\u043D\u043E\u0441\u0442\u044C",
    value: "8,4",
    unit: "%",
    icon: /*#__PURE__*/React.createElement(Icon, {
      n: "trending-up",
      size: 15
    })
  }))), /*#__PURE__*/React.createElement(Card, {
    title: "\u0411\u043B\u0438\u0436\u0430\u0439\u0448\u0438\u0435 \u0432\u044B\u043F\u043B\u0430\u0442\u044B",
    tightBody: true
  }, /*#__PURE__*/React.createElement("table", {
    className: "ia-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\u0414\u0430\u0442\u0430"), /*#__PURE__*/React.createElement("th", null, "\u0418\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442"), /*#__PURE__*/React.createElement("th", null, "\u0422\u0438\u043F"), /*#__PURE__*/React.createElement("th", {
    className: "r"
  }, "\u041D\u0430 \u0431\u0443\u043C\u0430\u0433\u0443"), /*#__PURE__*/React.createElement("th", {
    className: "r"
  }, "\u0421\u0443\u043C\u043C\u0430"), /*#__PURE__*/React.createElement("th", null, "\u0421\u0442\u0430\u0442\u0443\u0441"))), /*#__PURE__*/React.createElement("tbody", null, D.payments.map((p, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, /*#__PURE__*/React.createElement("td", {
    className: "ia-num",
    style: {
      color: 'var(--text-2)',
      fontWeight: 600
    }
  }, p.date), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    className: "ia-cell-tk"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: p.ticker,
    size: "sm",
    color: p.type === 'coupon' ? 'var(--ink-600)' : undefined
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "ia-cell-tk__t ia-mono"
  }, p.ticker), /*#__PURE__*/React.createElement("div", {
    className: "ia-cell-tk__n"
  }, p.name)))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Badge, {
    tone: p.type === 'dividend' ? 'accent' : 'neutral',
    size: "sm"
  }, p.type === 'dividend' ? '💰 Дивиденд' : '🧾 Купон')), /*#__PURE__*/React.createElement("td", {
    className: "r ia-num"
  }, p.perShare), /*#__PURE__*/React.createElement("td", {
    className: "r ia-num",
    style: {
      color: 'var(--text-1)',
      fontWeight: 600
    }
  }, p.amount), /*#__PURE__*/React.createElement("td", null, p.status === 'paid' ? /*#__PURE__*/React.createElement(Badge, {
    tone: "positive",
    dot: true,
    size: "sm"
  }, "\u0412\u044B\u043F\u043B\u0430\u0447\u0435\u043D\u043E") : /*#__PURE__*/React.createElement(Badge, {
    tone: "warning",
    size: "sm"
  }, "\u0427\u0435\u0440\u0435\u0437 ", p.days, " \u0434\u043D."))))))));
}
window.IAScreens = {
  Dashboard,
  Assistant,
  Rebalance,
  Calendar
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/shell.jsx
try { (() => {
/* InvestAnalitic UI kit — app shell, tables and screens.
   Built on the design-system bundle (window.InvestAnaliticDesignSystem_81c80b)
   + tokens from styles.css. Lucide for icons. */

const DS = window.InvestAnaliticDesignSystem_81c80b;
const {
  Button,
  IconButton,
  Input,
  Select,
  Switch,
  Card,
  StatCard,
  PnLValue,
  Badge,
  AllocationBar,
  Avatar,
  Tabs,
  AIMessage,
  AIComposer
} = DS;
const {
  useState,
  useEffect,
  useRef
} = React;
const RUB = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const money = v => RUB.format(v) + ' ₽';
const NUM0 = new Intl.NumberFormat('ru-RU');
function Icon({
  n,
  size
}) {
  const ref = useRef(null);
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons({
      nameAttr: 'data-lucide',
      icons: window.lucide.icons,
      attrs: {}
    });
  });
  return /*#__PURE__*/React.createElement("i", {
    "data-lucide": n,
    style: size ? {
      width: size,
      height: size
    } : undefined,
    ref: ref
  });
}

/* ---------------- Sidebar ---------------- */
function Sidebar({
  nav,
  setNav
}) {
  const items = [{
    id: 'dashboard',
    label: 'Портфель',
    icon: 'layout-dashboard'
  }, {
    id: 'assistant',
    label: 'ИИ-аналитик',
    icon: 'sparkles'
  }, {
    id: 'rebalance',
    label: 'Ребалансировка',
    icon: 'scale'
  }, {
    id: 'calendar',
    label: 'Выплаты',
    icon: 'calendar'
  }];
  return /*#__PURE__*/React.createElement("aside", {
    className: "ia-sidebar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ia-sidebar__brand"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../../assets/logo-mark.svg",
    alt: "",
    width: "32",
    height: "32"
  }), /*#__PURE__*/React.createElement("span", {
    className: "ia-sidebar__word"
  }, "Invest", /*#__PURE__*/React.createElement("b", null, "Analitic"))), /*#__PURE__*/React.createElement("nav", {
    className: "ia-sidebar__nav"
  }, items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.id,
    className: 'ia-navitem' + (nav === it.id ? ' is-active' : ''),
    onClick: () => setNav(it.id)
  }, /*#__PURE__*/React.createElement(Icon, {
    n: it.icon,
    size: 18
  }), /*#__PURE__*/React.createElement("span", null, it.label), it.id === 'assistant' && /*#__PURE__*/React.createElement("span", {
    className: "ia-navitem__pip"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "ia-sidebar__accounts"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ia-eyebrow",
    style: {
      padding: '0 4px 8px'
    }
  }, "\u0421\u0447\u0435\u0442\u0430"), window.IA_DATA.accounts.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    className: "ia-acctmini"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: a.name,
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", {
    className: "ia-acctmini__txt"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ia-acctmini__name"
  }, a.name), /*#__PURE__*/React.createElement("div", {
    className: "ia-acctmini__val ia-num"
  }, a.value)))), /*#__PURE__*/React.createElement("button", {
    className: "ia-navitem ia-navitem--ghost"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "plus",
    size: 16
  }), /*#__PURE__*/React.createElement("span", null, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0441\u0447\u0451\u0442"))), /*#__PURE__*/React.createElement("div", {
    className: "ia-sidebar__user"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: "\u0410\u043B\u0435\u043A\u0441\u0435\u0439 \u041C",
    shape: "circle",
    size: "sm",
    color: "var(--ink-600)"
  }), /*#__PURE__*/React.createElement("span", null, "\u0410\u043B\u0435\u043A\u0441\u0435\u0439 \u041C."), /*#__PURE__*/React.createElement(IconButton, {
    label: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    size: "sm"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "settings",
    size: 16
  }))));
}

/* ---------------- Top bar ---------------- */
function Topbar({
  title,
  sub
}) {
  return /*#__PURE__*/React.createElement("header", {
    className: "ia-topbar"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "ia-topbar__title"
  }, title), sub && /*#__PURE__*/React.createElement("p", {
    className: "ia-topbar__sub"
  }, sub)), /*#__PURE__*/React.createElement("div", {
    className: "ia-topbar__actions"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ia-search"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "search",
    size: 16
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "\u041F\u043E\u0438\u0441\u043A \u0442\u0438\u043A\u0435\u0440\u0430, \u044D\u043C\u0438\u0442\u0435\u043D\u0442\u0430\u2026"
  })), /*#__PURE__*/React.createElement(IconButton, {
    variant: "outlined",
    label: "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "bell",
    size: 18
  })), /*#__PURE__*/React.createElement(Button, {
    leftIcon: /*#__PURE__*/React.createElement(Icon, {
      n: "plus",
      size: 18
    })
  }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0441\u0434\u0435\u043B\u043A\u0443")));
}
window.IAKit = {
  DS,
  Icon,
  Sidebar,
  Topbar,
  money,
  RUB,
  NUM0,
  Button,
  IconButton,
  Input,
  Select,
  Switch,
  Card,
  StatCard,
  PnLValue,
  Badge,
  AllocationBar,
  Avatar,
  Tabs,
  AIMessage,
  AIComposer,
  React
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/shell.jsx", error: String((e && e.message) || e) }); }

__ds_ns.AIComposer = __ds_scope.AIComposer;

__ds_ns.AIMessage = __ds_scope.AIMessage;

__ds_ns.AllocationBar = __ds_scope.AllocationBar;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.PnLValue = __ds_scope.PnLValue;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
