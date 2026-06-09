// Internal helper — injects a component's CSS once per document.
// Components ship their styling with the JS bundle (the only CSS shipped
// to consumers via styles.css is tokens + base), so each primitive injects
// its own token-built rules on first mount. Idempotent by id.

export function injectOnce(id, css) {
  if (typeof document === 'undefined') return
  if (document.getElementById(id)) return
  const el = document.createElement('style')
  el.id = id
  el.textContent = css
  document.head.appendChild(el)
}
