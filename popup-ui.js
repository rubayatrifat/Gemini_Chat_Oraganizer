// ============================================================
//  Gemini Chat Folders — popup-ui.js
//  Custom modal system to replace alert / confirm / prompt
// ============================================================

// ── INJECT STYLES ───────────────────────────────────────────

const GCF_MODAL_STYLES = `
  #gcf-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(2px);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: gcf-fade-in 0.15s ease;
  }

  @keyframes gcf-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  #gcf-modal {
    background: #1e2022;
    border: 1px solid #3c3f41;
    border-radius: 16px;
    padding: 28px 28px 20px;
    min-width: 320px;
    max-width: 440px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    animation: gcf-slide-up 0.18s cubic-bezier(0.2, 0, 0, 1);
    font-family: 'Google Sans', sans-serif;
    color: #e8eaed;
  }

  @keyframes gcf-slide-up {
    from { transform: translateY(12px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  #gcf-modal .gcf-modal-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 10px;
    color: #e8eaed;
  }

  #gcf-modal .gcf-modal-message {
    font-size: 14px;
    color: #9aa0a6;
    margin: 0 0 20px;
    line-height: 1.5;
  }

  #gcf-modal .gcf-modal-input {
    width: 100%;
    background: #2d2e30;
    border: 1px solid #3c3f41;
    border-radius: 8px;
    color: #e8eaed;
    font-size: 14px;
    padding: 10px 12px;
    margin-bottom: 20px;
    outline: none;
    box-sizing: border-box;
    font-family: 'Google Sans', sans-serif;
    transition: border-color 0.15s;
  }

  #gcf-modal .gcf-modal-input:focus {
    border-color: #8ab4f8;
  }

  #gcf-modal .gcf-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  #gcf-modal .gcf-modal-btn {
    padding: 8px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    font-family: 'Google Sans', sans-serif;
    transition: background 0.15s, opacity 0.15s;
  }

  #gcf-modal .gcf-modal-btn-cancel {
    background: #2d2e30;
    color: #e8eaed;
  }
  #gcf-modal .gcf-modal-btn-cancel:hover { background: #3c3f41; }

  #gcf-modal .gcf-modal-btn-confirm {
    background: #8ab4f8;
    color: #1e2022;
  }
  #gcf-modal .gcf-modal-btn-confirm:hover { opacity: 0.88; }

  #gcf-modal .gcf-modal-btn-danger {
    background: #f28b82;
    color: #1e2022;
  }
  #gcf-modal .gcf-modal-btn-danger:hover { opacity: 0.88; }
`;

// Inject styles once
(function injectModalStyles() {
  if (document.getElementById('gcf-modal-styles')) return;
  const style = document.createElement('style');
  style.id = 'gcf-modal-styles';
  style.textContent = GCF_MODAL_STYLES;
  document.head.appendChild(style);
})();

// ── CORE MODAL BUILDER ──────────────────────────────────────

/**
 * Base modal builder.
 * Returns a Promise that resolves with the user's response.
 *
 * @param {object} opts
 * @param {string}  opts.title
 * @param {string}  opts.message
 * @param {'alert'|'confirm'|'prompt'} opts.type
 * @param {string}  [opts.defaultValue]   — for prompt
 * @param {string}  [opts.confirmLabel]   — confirm button text
 * @param {'confirm'|'danger'} [opts.confirmStyle]
 */
function gcfModal({ title, message, type, defaultValue = '', confirmLabel = 'OK', confirmStyle = 'confirm' }) {
  return new Promise((resolve) => {

    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'gcf-modal-overlay';

    // Modal box
    const modal = document.createElement('div');
    modal.id = 'gcf-modal';

    // Title
    const titleEl = document.createElement('p');
    titleEl.className = 'gcf-modal-title';
    titleEl.textContent = title;
    modal.appendChild(titleEl);

    // Message
    if (message) {
      const msgEl = document.createElement('p');
      msgEl.className = 'gcf-modal-message';
      msgEl.textContent = message;
      modal.appendChild(msgEl);
    }

    // Input (prompt only)
    let input = null;
    if (type === 'prompt') {
      input = document.createElement('input');
      input.className = 'gcf-modal-input';
      input.type = 'text';
      input.value = defaultValue;
      input.placeholder = 'Type here…';
      modal.appendChild(input);
    }

    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'gcf-modal-actions';

    function close(value) {
      overlay.remove();
      resolve(value);
    }

    // Cancel button (not shown for alert)
    if (type !== 'alert') {
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'gcf-modal-btn gcf-modal-btn-cancel';
      cancelBtn.textContent = 'Cancel';
      cancelBtn.addEventListener('click', () => close(null));
      actions.appendChild(cancelBtn);
    }

    // Confirm button
    const confirmBtn = document.createElement('button');
    confirmBtn.className = `gcf-modal-btn gcf-modal-btn-${confirmStyle}`;
    confirmBtn.textContent = confirmLabel;
    confirmBtn.addEventListener('click', () => {
      if (type === 'prompt') {
        close(input.value.trim() || null);
      } else if (type === 'confirm') {
        close(true);
      } else {
        close(true);
      }
    });
    actions.appendChild(confirmBtn);
    modal.appendChild(actions);

    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close(null);
    });

    // Keyboard: Enter = confirm, Escape = cancel
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  { e.preventDefault(); confirmBtn.click(); }
      if (e.key === 'Escape') { e.preventDefault(); close(null); }
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Focus input or confirm button
    setTimeout(() => (input ?? confirmBtn).focus(), 50);
  });
}

// ── PUBLIC API ───────────────────────────────────────────────

/**
 * gcfAlert('Something happened')
 * → shows modal with OK button, resolves when closed
 */
window.gcfAlert = (message, title = 'Notice') =>
  gcfModal({ title, message, type: 'alert', confirmLabel: 'OK' });

/**
 * gcfConfirm('Are you sure?')
 * → resolves true (OK) or null (Cancel)
 */
window.gcfConfirm = (message, title = 'Confirm', danger = false) =>
  gcfModal({
    title,
    message,
    type: 'confirm',
    confirmLabel: danger ? 'Delete' : 'OK',
    confirmStyle: danger ? 'danger' : 'confirm'
  });

/**
 * gcfPrompt('Enter folder name:', 'Work')
 * → resolves with string (OK) or null (Cancel)
 */
window.gcfPrompt = (message, defaultValue = '', title = 'Input') =>
  gcfModal({ title, message, type: 'prompt', defaultValue, confirmLabel: 'Save' });
