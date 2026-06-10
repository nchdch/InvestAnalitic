export const MODAL_CSS = `
.ia-modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,.45); backdrop-filter: blur(2px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
  animation: ia-fade-in var(--dur-fast) var(--ease-out);
}
@keyframes ia-fade-in { from { opacity:0 } to { opacity:1 } }
.ia-modal {
  background: var(--surface-card); border: 1px solid var(--border-1);
  border-radius: var(--radius-lg); box-shadow: var(--shadow-xl);
  width: 100%; max-width: 480px;
  animation: ia-slide-up var(--dur-normal) var(--ease-out);
  max-height: 90vh; display: flex; flex-direction: column;
}
.ia-modal--wide { max-width: 800px; }
@keyframes ia-slide-up { from { transform: translateY(16px); opacity:0 } to { transform: translateY(0); opacity:1 } }
.ia-modal__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px 14px; border-bottom: 1px solid var(--border-1);
  flex-shrink: 0;
}
.ia-modal__title { font-size: var(--text-h4); font-weight: var(--fw-bold); color: var(--text-1); }
.ia-modal__body { padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
.ia-modal__foot { padding: 14px 20px; border-top: 1px solid var(--border-1); display: flex; gap: 10px; justify-content: flex-end; flex-shrink: 0; }
.ia-modal-close { background: transparent; border: 0; cursor: pointer; color: var(--text-3); display: flex; padding: 4px; border-radius: var(--radius-sm); }
.ia-modal-close:hover { color: var(--text-1); background: var(--surface-sunken); }
.ia-modal-error { background: var(--loss-soft); border: 1px solid var(--loss); border-radius: var(--radius-md); padding: 10px 14px; font-size: var(--text-sm); color: var(--loss); }
.ia-modal-divider { border: 0; border-top: 1px solid var(--divider); margin: 4px 0; }
.ia-modal-section-label { font-size: var(--text-xs); font-weight: var(--fw-semibold); letter-spacing: var(--tracking-wide); text-transform: uppercase; color: var(--text-3); }

/* ---- Общие элементы форм модалок ---- */
.ia-toggle-row { display: flex; gap: 8px; }
.ia-toggle-btn {
  flex: 1; padding: 9px 14px; border-radius: var(--radius-md);
  border: 1px solid var(--border-1); background: transparent;
  cursor: pointer; font-family: inherit; font-size: var(--text-sm);
  font-weight: var(--fw-medium); color: var(--text-2);
  transition: all var(--dur-fast) var(--ease-out);
  display: flex; align-items: center; justify-content: center; gap: 7px;
}
.ia-toggle-btn:hover { background: var(--surface-sunken); color: var(--text-1); }
.ia-toggle-btn.is-active { border-color: var(--accent); background: var(--accent-soft); color: var(--accent-hover); font-weight: var(--fw-semibold); }
.ia-toggle-btn.is-sell.is-active { border-color: var(--loss); background: var(--loss-soft); color: var(--loss); }
.ia-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ia-rate-refresh {
  background: transparent; border: 0; cursor: pointer; color: var(--text-3);
  display: flex; align-items: center; padding: 0; line-height: 0;
  transition: color var(--dur-fast) var(--ease-out);
}
.ia-rate-refresh:hover:not(:disabled) { color: var(--accent); }
.ia-rate-refresh:disabled { cursor: default; }
.ia-rate-refresh.is-spinning svg { animation: ia-spin 0.7s linear infinite; }
@keyframes ia-spin { to { transform: rotate(360deg); } }

/* ---- Импорт сделок ---- */
.ia-import-drop {
  border: 2px dashed var(--border-2); border-radius: var(--radius-lg);
  padding: 36px 20px; text-align: center; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  color: var(--text-3); transition: all var(--dur-fast) var(--ease-out);
}
.ia-import-drop:hover { border-color: var(--accent); color: var(--accent-hover); background: var(--accent-soft); }
.ia-import-drop input { display: none; }
.ia-import-drop__hint { font-size: var(--text-xs); color: var(--text-3); max-width: 360px; }
.ia-import-stats { display: flex; gap: 18px; flex-wrap: wrap; font-size: var(--text-sm); color: var(--text-2); }
.ia-import-stats b { color: var(--text-1); font-weight: var(--fw-semibold); }
.ia-import-table-wrap { max-height: 360px; overflow: auto; border: 1px solid var(--border-1); border-radius: var(--radius-md); }
.ia-import-table-wrap table { font-size: var(--text-xs); }
.ia-import-table-wrap th { position: sticky; top: 0; background: var(--surface-card); z-index: 1; }
.ia-import-row--error td { background: var(--negative-soft); }
.ia-import-result { display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 28px 0; text-align: center; }
.ia-import-result svg { color: var(--positive); }
.ia-import-result__title { font-size: var(--text-h4); font-weight: var(--fw-bold); color: var(--text-1); }
.ia-import-result__sub { color: var(--text-2); margin-top: 4px; }

@media (max-width: 480px) {
  .ia-modal-backdrop { padding: 12px; }
  .ia-field-row { grid-template-columns: 1fr; }
}
`
