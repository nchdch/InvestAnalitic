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
`
