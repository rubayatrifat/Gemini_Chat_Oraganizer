// ============================================================
//  Gemini Chat Folders — context-menu.js
//  Injects "Add to Folder" option into Gemini's 3-dots menu
// ============================================================

const CTX_ITEM_ID = 'gcf-ctx-item';
const CTX_SUB_ID  = 'gcf-ctx-submenu';

// ── STYLES ──────────────────────────────────────────────────

const CTX_STYLES = `
  .gcf-ctx-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 16px;
    height: 48px;
    font-size: 14px;
    font-family: 'Google Sans', sans-serif;
    color: #e8eaed;
    cursor: pointer;
    user-select: none;
    position: relative;
    transition: background 0.1s;
    box-sizing: border-box;
    width: 100%;
    border: none;
    background: none;
    text-align: left;
  }
  .gcf-ctx-item:hover { background: rgba(255,255,255,0.08); }

  .gcf-ctx-item-icon { font-size: 18px; flex-shrink: 0; }
  .gcf-ctx-item-label { flex: 1; }
  .gcf-ctx-item-arrow { font-size: 12px; color: #9aa0a6; }

  /* Submenu */
  #${CTX_SUB_ID} {
    position: fixed;
    background: #2d2e30;
    border: 1px solid #3c3f41;
    border-radius: 12px;
    padding: 6px 0;
    min-width: 200px;
    max-width: 260px;
    box-shadow: 0 6px 24px rgba(0,0,0,0.5);
    z-index: 999999;
    font-family: 'Google Sans', sans-serif;
    animation: gcf-fade-in 0.12s ease;
  }

  .gcf-sub-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 14px;
    height: 40px;
    font-size: 13px;
    color: #e8eaed;
    cursor: pointer;
    transition: background 0.1s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .gcf-sub-item:hover { background: rgba(255,255,255,0.08); }

  .gcf-sub-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .gcf-sub-empty {
    padding: 8px 14px;
    font-size: 12px;
    color: #5f6368;
    font-style: italic;
  }

  .gcf-sub-divider {
    height: 1px;
    background: #3c3f41;
    margin: 4px 0;
  }

  .gcf-sub-remove {
    color: #f28b82;
  }
`;

(function injectCtxStyles() {
  if (document.getElementById('gcf-ctx-styles')) return;
  const style = document.createElement('style');
  style.id = 'gcf-ctx-styles';
  style.textContent = CTX_STYLES;
  document.head.appendChild(style);
})();

// ── SUBMENU ─────────────────────────────────────────────────

function removeSubmenu() {
  document.getElementById(CTX_SUB_ID)?.remove();
}

async function showSubmenu(anchorEl, chatId, chatTitle) {
  removeSubmenu();

  const data = await loadData();
  const currentFolder = data.folders.find(f => f.chatIds.includes(chatId));

  const sub = document.createElement('div');
  sub.id = CTX_SUB_ID;

  if (data.folders.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'gcf-sub-empty';
    empty.textContent = 'No folders yet — create one first';
    sub.appendChild(empty);
  } else {
    // List all folders
    for (const folder of data.folders) {
      const isCurrentFolder = currentFolder?.id === folder.id;

      const item = document.createElement('div');
      item.className = 'gcf-sub-item';
      item.innerHTML = `
        <span class="gcf-sub-dot" style="background:${folder.color}"></span>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis">${escHtml(folder.name)}</span>
        ${isCurrentFolder ? '<span style="color:#8ab4f8;font-size:12px">✓</span>' : ''}
      `;
      item.addEventListener('click', async () => {
        removeSubmenu();
        closeGeminiMenu();

        if (isCurrentFolder) return; // already in this folder, do nothing

        await addChatToFolder(chatId, folder, data);
      });
      sub.appendChild(item);
    }

    // If chat is in a folder — show "Remove from folder" option
    if (currentFolder) {
      const divider = document.createElement('div');
      divider.className = 'gcf-sub-divider';
      sub.appendChild(divider);

      const removeItem = document.createElement('div');
      removeItem.className = 'gcf-sub-item gcf-sub-remove';
      removeItem.innerHTML = `
        <span>✕</span>
        <span>Remove from folder</span>
      `;
      removeItem.addEventListener('click', async () => {
        removeSubmenu();
        closeGeminiMenu();
        await removeChatFromFolder(chatId, currentFolder, data);
      });
      sub.appendChild(removeItem);
    }
  }

  document.body.appendChild(sub);

  // Position submenu next to the anchor item
  const rect = anchorEl.getBoundingClientRect();
  const subW  = 220;
  const subH  = sub.offsetHeight || 200;

  let left = rect.right + 6;
  let top  = rect.top;

  // Flip left if not enough space on the right
  if (left + subW > window.innerWidth) {
    left = rect.left - subW - 6;
  }
  // Flip up if not enough space below
  if (top + subH > window.innerHeight) {
    top = window.innerHeight - subH - 8;
  }

  sub.style.left = `${left}px`;
  sub.style.top  = `${top}px`;

  // Close submenu on outside click
  setTimeout(() => {
    document.addEventListener('click', removeSubmenu, { once: true });
  }, 0);
}

// ── CLOSE GEMINI'S OWN MENU ─────────────────────────────────

function closeGeminiMenu() {
  // Press Escape to close Gemini's mat-menu overlay
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
}

// ── INJECT "ADD TO FOLDER" INTO GEMINI'S 3-DOTS MENU ────────

// ✅ Save the clicked button reference at click time — never check aria-expanded
let lastMenuTriggerBtn = null;

function tryInjectContextMenuItem(menuPanel) {
  if (menuPanel.querySelector(`#${CTX_ITEM_ID}`)) return;

  // Use the saved reference — 100% reliable, no timing issue
  if (!lastMenuTriggerBtn) return;

  const ariaLabel = lastMenuTriggerBtn.getAttribute('aria-label') || '';
  const chatTitle = ariaLabel.replace(/^More options for\s*/i, '').trim();

  // Find matching chat <a> by aria-label
  const chatLink = [...document.querySelectorAll('a[href^="/app/"][aria-label]')]
    .find(el => el.getAttribute('aria-label') === chatTitle);

  const chatId = chatLink ? getChatId(chatLink) : null;
  if (!chatId) return;

  // Build menu item using Material Symbol to match Gemini's style
  const item = document.createElement('button');
  item.id = CTX_ITEM_ID;
  item.className = 'gcf-ctx-item';
  item.innerHTML = `
    <span class="gcf-ctx-item-icon material-symbols-outlined" style="font-family:'Material Symbols Outlined';font-size:20px;font-variation-settings:'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24;">folder</span>
    <span class="gcf-ctx-item-label">Add to Folder</span>
    <span class="gcf-ctx-item-arrow material-symbols-outlined" style="font-family:'Material Symbols Outlined';font-size:16px;font-variation-settings:'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24;color:#9aa0a6">chevron_right</span>
  `;

  item.addEventListener('click', (e) => {
    e.stopPropagation();
    showSubmenu(item, chatId, chatTitle);
  });

  item.addEventListener('mouseenter', () => {
    showSubmenu(item, chatId, chatTitle);
  });

  menuPanel.appendChild(item);
}

// ── OBSERVE FOR GEMINI'S MENU PANEL ─────────────────────────

function initContextMenuObserver() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest(
      'button.mat-mdc-menu-trigger[aria-label^="More options for"]'
    );
    if (!btn) return;

    // ✅ Save reference immediately at click time — before Angular does anything
    lastMenuTriggerBtn = btn;

    const overlay = document.querySelector('.cdk-overlay-container');
    if (!overlay) return;

    const menuWatcher = new MutationObserver((_, obs) => {
      const menu = overlay.querySelector('[role="menu"]');
      if (menu) {
        tryInjectContextMenuItem(menu);
        obs.disconnect();
      }
    });

    menuWatcher.observe(overlay, { childList: true, subtree: true });
    setTimeout(() => menuWatcher.disconnect(), 2000);
  });

  // Clean up submenu on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#gcf-ctx-submenu') &&
        !e.target.closest(`#${CTX_ITEM_ID}`)) {
      removeSubmenu();
    }
  });
}

// Init
initContextMenuObserver();
