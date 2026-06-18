// ============================================================
//  Gemini Chat Folders — content.js
//  Manifest V3 | gemini.google.com
// ============================================================

const fontLink = document.createElement('link');
fontLink.rel = 'stylesheet';
fontLink.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200';
document.head.appendChild(fontLink);

const STORAGE_KEY = 'geminiChatFolders';
const UI_ROOT_ID  = 'gcf-root';
const DRAG        = { chatId: null, fromFolderId: null };

// ── MATERIAL SYMBOLS LIST ────────────────────────────────────
// Subset of common Google Material Symbols for the icon picker

const MATERIAL_ICONS = [
  'folder','folder_open','work','school','star','favorite','bookmark',
  'home','code','terminal','bug_report','build','science','psychology',
  'sports_esports','movie','music_note','photo','brush','design_services',
  'shopping_cart','attach_money','trending_up','bar_chart','analytics',
  'fitness_center','directions_run','sports','health_and_safety',
  'travel_explore','flight','directions_car','restaurant','coffee',
  'pets','nature','park','eco','water_drop','sunny',
  'chat','forum','mail','call','group','person','emoji_emotions',
  'celebration','cake','card_giftcard','volunteer_activism','handshake',
  'lightbulb','tips_and_updates','rocket_launch','satellite_alt',
  'lock','security','privacy_tip','key','shield',
  'settings','tune','dashboard','widgets','layers',
  'cloud','cloud_upload','cloud_download','storage','database',
  'article','description','notes','edit_note','sticky_note_2',
  'task_alt','checklist','assignment','library_books','auto_stories',
];

const PICKER_COLORS = [
  '#8ab4f8','#f28b82','#81c995','#fdd663','#ff8bcb',
  '#c58af9','#78d9ec','#fcad70','#aecbfa','#e6c9a8',
  '#ffffff','#9aa0a6',
];

// ── 1. STABLE DOM HELPERS ────────────────────────────────────

function getChatItems() {
  return [...document.querySelectorAll('a[href^="/app/"][aria-label]')].filter(el =>
    /^\/app\/[a-f0-9]+$/i.test(el.getAttribute('href'))
  );
}
function getChatId(el) {
  const m = (el.getAttribute('href') || '').match(/\/app\/([a-f0-9]+)/i);
  return m ? m[1] : null;
}
function getChatTitle(el) {
  return el.getAttribute('aria-label') || 'Untitled';
}
function getRecentsSection() {
  const btn = document.querySelector('button[aria-label="Toggle Recents"]');
  return btn?.closest('expandable-section') ?? null;
}

// ── 2. HIDE / SHOW ───────────────────────────────────────────

function syncRecentsVisibility(data) {
  const assigned = new Set(data.folders.flatMap(f => f.chatIds));
  getChatItems().forEach(el => {
    const id = getChatId(el);
    if (!id) return;
    const host = el.closest('gem-nav-list-item') ?? el.parentElement;
    host.style.display = assigned.has(id) ? 'none' : '';
  });
}
function showAllChats() {
  getChatItems().forEach(el => {
    const host = el.closest('gem-nav-list-item') ?? el.parentElement;
    host.style.display = '';
  });
}

// ── 3. STORAGE ───────────────────────────────────────────────

async function loadData() {
  return new Promise(resolve =>
    chrome.storage.local.get(STORAGE_KEY, r =>
      resolve(r[STORAGE_KEY] || { folders: [] })
    )
  );
}
async function saveData(data) {
  return new Promise(resolve =>
    chrome.storage.local.set({ [STORAGE_KEY]: data }, resolve)
  );
}
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── 4. ICON PICKER ───────────────────────────────────────────

/**
 * Shows a modal icon + color + name picker.
 * Returns { name, icon, color } or null if cancelled.
 */
function showFolderPicker({ name = '', icon = 'folder', color = '#8ab4f8' } = {}) {
  return new Promise(resolve => {
    // Reuse gcfModal overlay infrastructure
    const overlay = document.createElement('div');
    overlay.id = 'gcf-modal-overlay';

    const modal = document.createElement('div');
    modal.id = 'gcf-icon-picker';

    let selectedIcon  = icon;
    let selectedColor = color;
    let filteredIcons = [...MATERIAL_ICONS];

    // Title
    const title = document.createElement('p');
    title.className = 'gcf-picker-title';
    title.textContent = name ? 'Edit Folder' : 'New Folder';
    modal.appendChild(title);

    // Folder name input
    const nameLabel = document.createElement('span');
    nameLabel.className = 'gcf-picker-label';
    nameLabel.textContent = 'Folder Name';
    modal.appendChild(nameLabel);

    const nameInput = document.createElement('input');
    nameInput.className = 'gcf-picker-name-input';
    nameInput.type = 'text';
    nameInput.placeholder = 'e.g. Work, Personal, Research…';
    nameInput.value = name;
    modal.appendChild(nameInput);

    // Icon search
    const iconLabel = document.createElement('span');
    iconLabel.className = 'gcf-picker-label';
    iconLabel.textContent = 'Icon';
    modal.appendChild(iconLabel);

    const searchInput = document.createElement('input');
    searchInput.className = 'gcf-picker-search';
    searchInput.type = 'text';
    searchInput.placeholder = 'Search icons…';
    modal.appendChild(searchInput);

    // Icon grid
    const iconGrid = document.createElement('div');
    iconGrid.className = 'gcf-icon-grid';

    function renderIcons() {
      iconGrid.innerHTML = '';
      filteredIcons.forEach(ic => {
        const opt = document.createElement('div');
        opt.className = 'gcf-icon-opt' + (ic === selectedIcon ? ' gcf-selected' : '');
        opt.title = ic;
        opt.innerHTML = `<span class="gcf-material-icon" style="color:${selectedColor}">${ic}</span>`;
        opt.addEventListener('click', () => {
          selectedIcon = ic;
          renderIcons();
        });
        iconGrid.appendChild(opt);
      });
    }
    renderIcons();
    modal.appendChild(iconGrid);

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();
      filteredIcons = q
        ? MATERIAL_ICONS.filter(ic => ic.includes(q))
        : [...MATERIAL_ICONS];
      renderIcons();
    });

    // Color picker
    const colorLabel = document.createElement('span');
    colorLabel.className = 'gcf-picker-label';
    colorLabel.textContent = 'Color';
    modal.appendChild(colorLabel);

    const colorGrid = document.createElement('div');
    colorGrid.className = 'gcf-color-grid';

    function renderColors() {
      colorGrid.innerHTML = '';
      PICKER_COLORS.forEach(c => {
        const sw = document.createElement('div');
        sw.className = 'gcf-color-swatch' + (c === selectedColor ? ' gcf-selected' : '');
        sw.style.background = c;
        sw.title = c;
        sw.addEventListener('click', () => {
          selectedColor = c;
          renderColors();
          renderIcons(); // re-render icons with new color
        });
        colorGrid.appendChild(sw);
      });
    }
    renderColors();
    modal.appendChild(colorGrid);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'gcf-picker-actions';

    function close(result) {
      overlay.remove();
      resolve(result);
    }

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'gcf-picker-btn gcf-picker-btn-cancel';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => close(null));

    const saveBtn = document.createElement('button');
    saveBtn.className = 'gcf-picker-btn gcf-picker-btn-save';
    saveBtn.textContent = 'Save';
    saveBtn.addEventListener('click', () => {
      const folderName = nameInput.value.trim();
      if (!folderName) {
        nameInput.focus();
        nameInput.style.borderColor = '#f28b82';
        return;
      }
      close({ name: folderName, icon: selectedIcon, color: selectedColor });
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(saveBtn);
    modal.appendChild(actions);

    overlay.addEventListener('click', e => { if (e.target === overlay) close(null); });
    overlay.addEventListener('keydown', e => {
      if (e.key === 'Escape') close(null);
      if (e.key === 'Enter' && e.target !== searchInput) saveBtn.click();
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    setTimeout(() => nameInput.focus(), 50);
  });
}

// ── 5. UI RENDERING ─────────────────────────────────────────

async function renderFolderPanel() {
  const data = await loadData();

  document.getElementById(UI_ROOT_ID)?.remove();

  const recentsSection = getRecentsSection();
  if (!recentsSection) return;

  const root = document.createElement('div');
  root.id = UI_ROOT_ID;

  // Section title — no icon, matches "Notebooks" style
  const sectionTitle = document.createElement('span');
  sectionTitle.className = 'gcf-section-title';
  sectionTitle.textContent = 'Folders';
  root.appendChild(sectionTitle);

  // Render each folder
  for (const folder of data.folders) {
    root.appendChild(buildFolderEl(folder, data));
  }

  // "+ New Folder" button at the bottom — matches "+ New notebook"
  const newBtn = document.createElement('button');
  newBtn.className = 'gcf-new-folder-btn';
  newBtn.innerHTML = `
    <span class="gcf-material-icon">add</span>
    <span>New Folder</span>
  `;
  newBtn.addEventListener('click', () => createFolder(data));
  root.appendChild(newBtn);

  // Divider below our panel
  const divider = document.createElement('div');
  divider.className = 'gcf-divider';
  root.appendChild(divider);

  recentsSection.parentElement.insertBefore(root, recentsSection);

  syncRecentsVisibility(data);
  initRecentsDraggable();
}

function buildFolderEl(folder, data) {
  const chatItems     = getChatItems();
  const chatsInFolder = chatItems.filter(el => {
    const id = getChatId(el);
    return id && folder.chatIds.includes(id);
  });

  const item = document.createElement('div');
  item.className = 'gcf-folder-item gcf-collapsed';
  item.dataset.folderId = folder.id;

  // ── Folder row ──
  const row = document.createElement('div');
  row.className = 'gcf-folder-row';

  // Folder icon (Material Symbol, colored)
  const iconEl = document.createElement('span');
  iconEl.className = 'gcf-material-icon gcf-folder-icon';
  iconEl.textContent = folder.icon || 'folder';
  iconEl.style.color  = folder.color || '#8ab4f8';

  // Folder name
  const label = document.createElement('span');
  label.className = 'gcf-folder-label';
  label.textContent = folder.name;

  // Action buttons (edit + delete) — visible on hover
  const actions = document.createElement('div');
  actions.className = 'gcf-folder-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'gcf-icon-btn';
  editBtn.title = 'Edit folder';
  editBtn.innerHTML = `<span class="gcf-material-icon">edit</span>`;
  editBtn.addEventListener('click', e => { e.stopPropagation(); editFolder(folder, data); });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'gcf-icon-btn';
  deleteBtn.title = 'Delete folder';
  deleteBtn.innerHTML = `<span class="gcf-material-icon">delete</span>`;
  deleteBtn.addEventListener('click', e => { e.stopPropagation(); deleteFolder(folder, data); });

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  // Chat count badge — visible when collapsed
  const countBadge = document.createElement('span');
  countBadge.className = 'gcf-folder-count';
  countBadge.textContent = folder.chatIds.length > 0 ? folder.chatIds.length : '';

  // Collapse arrow
  const arrow = document.createElement('span');
  arrow.className = 'gcf-material-icon gcf-folder-arrow';
  arrow.textContent = 'keyboard_arrow_down';

  row.appendChild(iconEl);
  row.appendChild(label);
  row.appendChild(countBadge);
  row.appendChild(arrow);
  row.appendChild(actions);

  // Toggle collapse on row click
  row.addEventListener('click', () => item.classList.toggle('gcf-collapsed'));

  // Drop target on folder row
  row.addEventListener('dragover', e => { e.preventDefault(); row.classList.add('gcf-drop-over'); });
  row.addEventListener('dragleave', () => row.classList.remove('gcf-drop-over'));
  row.addEventListener('drop', async e => {
    e.preventDefault();
    row.classList.remove('gcf-drop-over');
    const chatId = e.dataTransfer.getData('text/plain');
    if (!chatId) return;
    const freshData = await loadData();
    const target = freshData.folders.find(f => f.id === folder.id);
    if (!target) return;
    freshData.folders.forEach(f => { f.chatIds = f.chatIds.filter(id => id !== chatId); });
    if (!target.chatIds.includes(chatId)) target.chatIds.push(chatId);
    await saveData(freshData);
    renderFolderPanel();
  });

  item.appendChild(row);

  // ── Chat list ──
  const chatList = document.createElement('div');
  chatList.className = 'gcf-chat-list';

  if (chatsInFolder.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'gcf-empty-folder';
    empty.textContent = 'Empty — add chats or drag them here';
    chatList.appendChild(empty);
  }

  for (const chatEl of chatsInFolder) {
    const id    = getChatId(chatEl);
    const title = getChatTitle(chatEl);

    const chip = document.createElement('div');
    chip.className = 'gcf-chat-chip';
    chip.draggable = true;
    chip.dataset.chatId = id;
    chip.innerHTML = `
      <span class="gcf-material-icon gcf-drag-handle">drag_indicator</span>
      <span class="gcf-chat-chip-title" title="${escHtml(title)}">${escHtml(title)}</span>
      <button class="gcf-chip-remove" title="Remove from folder">✕</button>
    `;

    chip.querySelector('.gcf-chat-chip-title').addEventListener('click', () => {
      const link = document.querySelector(`a[href="/app/${id}"]`);
      link ? link.click() : (window.location.href = `/app/${id}`);
    });

    chip.querySelector('.gcf-chip-remove').addEventListener('click', async () => {
      const confirmed = await gcfConfirm(
        `Remove "${title}" from "${folder.name}"? It will reappear in Recents.`,
        'Remove Chat',
        false
      );
      if (!confirmed) return;
      removeChatFromFolder(id, folder, data);
    });

    chip.addEventListener('dragstart', e => {
      DRAG.chatId = id;
      DRAG.fromFolderId = folder.id;
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.effectAllowed = 'move';
      chip.classList.add('gcf-dragging');
    });
    chip.addEventListener('dragend', () => {
      chip.classList.remove('gcf-dragging');
      DRAG.chatId = null;
      DRAG.fromFolderId = null;
    });

    chatList.appendChild(chip);
  }

  // Chat list drop zone
  chatList.addEventListener('dragover', e => { e.preventDefault(); chatList.classList.add('gcf-drop-over'); });
  chatList.addEventListener('dragleave', e => {
    if (!chatList.contains(e.relatedTarget)) chatList.classList.remove('gcf-drop-over');
  });
  chatList.addEventListener('drop', async e => {
    e.preventDefault();
    chatList.classList.remove('gcf-drop-over');
    const chatId = e.dataTransfer.getData('text/plain');
    if (!chatId) return;
    const freshData = await loadData();
    const target = freshData.folders.find(f => f.id === folder.id);
    if (!target) return;
    freshData.folders.forEach(f => { f.chatIds = f.chatIds.filter(id => id !== chatId); });
    if (!target.chatIds.includes(chatId)) target.chatIds.push(chatId);
    await saveData(freshData);
    renderFolderPanel();
  });

  // Smooth collapsible wrapper
  const collapseWrapper = document.createElement('div');
  collapseWrapper.className = 'gcf-collapse-wrapper';
  collapseWrapper.appendChild(chatList);
  item.appendChild(collapseWrapper);

  // Add a chat is OUTSIDE collapseWrapper so it won't get clipped
  // But still hidden when folder is collapsed via CSS
  const addChatEl = buildAddChatDropdown(folder, data, chatItems);
  addChatEl.classList.add('gcf-add-chat-outer');
  item.appendChild(addChatEl);
  return item;
}

function buildAddChatDropdown(folder, data, chatItems) {
  const wrapper = document.createElement('div');
  wrapper.className = 'gcf-add-chat-wrap';

  const assignedIds = new Set(data.folders.flatMap(f => f.chatIds));
  const available   = chatItems.filter(el => {
    const id = getChatId(el);
    return id && !assignedIds.has(id);
  });

  // ── Trigger button ──
  const trigger = document.createElement('button');
  trigger.className = 'gcf-dropdown-trigger';
  trigger.innerHTML = `<span class="gcf-material-icon">add</span><span>Add a chat</span>`;

  // ── Options panel ──
  const panel = document.createElement('div');
  panel.className = 'gcf-dropdown-panel';

  if (available.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'gcf-dropdown-empty';
    empty.textContent = 'All chats are in folders';
    panel.appendChild(empty);
  } else {
    for (const chatEl of available) {
      const id = getChatId(chatEl);
      if (!id) continue;
      const optEl = document.createElement('div');
      optEl.className = 'gcf-dropdown-opt';
      optEl.textContent = getChatTitle(chatEl);
      optEl.title = getChatTitle(chatEl);
      optEl.addEventListener('click', () => {
        panel.classList.remove('gcf-dropdown-open');
        trigger.classList.remove('gcf-dropdown-active');
        addChatToFolder(id, folder, data);
      });
      panel.appendChild(optEl);
    }
  }

  // Position panel as fixed overlay — avoids overflow:hidden clipping
  function openPanel() {
    // Close any other open panels first
    document.querySelectorAll('.gcf-dropdown-panel.gcf-dropdown-open').forEach(p => {
      p.classList.remove('gcf-dropdown-open');
    });
    document.querySelectorAll('.gcf-dropdown-active').forEach(t => t.classList.remove('gcf-dropdown-active'));

    panel.classList.add('gcf-dropdown-open');
    trigger.classList.add('gcf-dropdown-active');

    // Close on outside click
    setTimeout(() => {
      const close = (ev) => {
        if (!trigger.contains(ev.target) && !panel.contains(ev.target)) {
          closePanel();
          document.removeEventListener('click', close);
        }
      };
      document.addEventListener('click', close);
    }, 0);
  }

  function closePanel() {
    panel.classList.remove('gcf-dropdown-open');
    trigger.classList.remove('gcf-dropdown-active');
  }

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    panel.classList.contains('gcf-dropdown-open') ? closePanel() : openPanel();
  });

  wrapper.appendChild(trigger);
  wrapper.appendChild(panel);
  return wrapper;
}

// Make visible Recents items draggable
function initRecentsDraggable() {
  getChatItems().forEach(chatEl => {
    const id     = getChatId(chatEl);
    const hostEl = chatEl.closest('gem-nav-list-item') ?? chatEl.parentElement;
    if (!id || hostEl.style.display === 'none') return;

    hostEl.draggable = true;
    hostEl.classList.add('gcf-recents-draggable');

    hostEl.addEventListener('dragstart', e => {
      DRAG.chatId = id;
      DRAG.fromFolderId = null;
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.effectAllowed = 'move';
      hostEl.classList.add('gcf-dragging');
    });
    hostEl.addEventListener('dragend', () => {
      hostEl.classList.remove('gcf-dragging');
      DRAG.chatId = null;
    });
  });
}

// ── 6. FOLDER ACTIONS ───────────────────────────────────────

async function createFolder(data) {
  const result = await showFolderPicker();
  if (!result) return;
  const colors = ['#8ab4f8','#f28b82','#81c995','#fdd663','#ff8bcb','#c58af9'];
  data.folders.push({
    id: uid(),
    name: result.name,
    icon: result.icon,
    color: result.color || colors[data.folders.length % colors.length],
    chatIds: []
  });
  await saveData(data);
  renderFolderPanel();
}

async function editFolder(folder, data) {
  const result = await showFolderPicker({
    name:  folder.name,
    icon:  folder.icon  || 'folder',
    color: folder.color || '#8ab4f8',
  });
  if (!result) return;
  folder.name  = result.name;
  folder.icon  = result.icon;
  folder.color = result.color;
  await saveData(data);
  renderFolderPanel();
}

async function deleteFolder(folder, data) {
  const confirmed = await gcfConfirm(
    `"${folder.name}" will be deleted. Your chats will reappear in Recents.`,
    'Delete Folder',
    true
  );
  if (!confirmed) return;
  data.folders = data.folders.filter(f => f.id !== folder.id);
  await saveData(data);
  showAllChats();
  renderFolderPanel();
}

async function addChatToFolder(chatId, folder, data) {
  data.folders.forEach(f => { f.chatIds = f.chatIds.filter(id => id !== chatId); });
  folder.chatIds.push(chatId);
  await saveData(data);
  renderFolderPanel();
}

async function removeChatFromFolder(chatId, folder, data) {
  const confirmed = await gcfConfirm(
    'This chat will be removed from the folder and reappear in Recents.',
    'Remove from Folder',
    true
  );
  if (!confirmed) return;
  folder.chatIds = folder.chatIds.filter(id => id !== chatId);
  await saveData(data);
  showAllChats();
  renderFolderPanel();
}

// ── 7. UTILITY ──────────────────────────────────────────────

function escHtml(str) {
  return str.replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])
  );
}

// ── 8. BOOTSTRAP ────────────────────────────────────────────

function init() {
  let renderDebounce, syncDebounce;

  const observer = new MutationObserver(mutations => {
    const ready   = getRecentsSection();
    const missing = !document.getElementById(UI_ROOT_ID);

    if (ready && missing) {
      clearTimeout(renderDebounce);
      renderDebounce = setTimeout(() => renderFolderPanel(), 600);
      return;
    }

    const hasNewChats = mutations.some(m =>
      [...m.addedNodes].some(n =>
        n.nodeType === 1 &&
        (n.matches?.('a[href^="/app/"]') || n.querySelector?.('a[href^="/app/"]'))
      )
    );

    if (hasNewChats) {
      clearTimeout(syncDebounce);
      syncDebounce = setTimeout(async () => {
        const data = await loadData();
        syncRecentsVisibility(data);
        initRecentsDraggable();
      }, 300);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
  renderFolderPanel();
}

init();
