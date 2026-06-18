# 📂 Gemini Chat Organizer (Chrome Extension)

A lightweight, stable, and professional Chrome Extension built to organize your Google Gemini chats into custom, collapsible folders. Since Gemini doesn't natively support chat categorization, this extension injects a clean, dynamic UI into the sidebar to keep your workspace clutter-free.

---

## ✨ Features

- **Custom Folders:** Create, rename, and delete custom folders directly in the Gemini sidebar.
- **Robust DOM Tracking:** Uses stable accessibility attributes (`aria-label="Toggle Recents"`) and regex-based URL patterns (`href="/app/[hex]"`) instead of dynamic class names, ensuring the extension doesn't break after Gemini updates.
- **Persistent Storage:** Seamlessly saves your folder structures and chat groupings locally using `chrome.storage.local`.
- **Native Integration:** Styled with custom **Inline SVGs** inspired by Google's *Material Symbols* to maintain an official, premium look.
- **Fully Responsive Theme Compatibility:** Automatically matches Gemini's Light and Dark mode transitions.

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3 (Modern Flexbox/Grid, Native variables for theme handling)
- **Scripting:** Pure JavaScript (ES6+, MutationObserver for async DOM loading)
- **Platform:** Chrome Extensions API (Manifest V3)

---

## 🚀 How to Install (Locally)

Since this extension is currently in development, you can load it as an "Unpacked" extension in Google Chrome:

1. **Clone or Download** this repository to your local machine.
2. Open Google Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** by toggling the switch in the top-right corner.
4. Click on the **Load unpacked** button in the top-left corner.
5. Select the project folder (the folder containing `manifest.json`).
6. Open [Google Gemini](https://gemini.google.com/) and enjoy a perfectly organized sidebar!

> 💡 **Tip:** If you make changes to `content.js` or `styles.css`, simply refresh the Gemini tab to see your updates. If you modify `manifest.json`, click the **Refresh (🔄)** icon on the extension card in `chrome://extensions/`.

---

## 🎨 Architecture & UI Design

- **Selectors:** Relies heavily on ARIA roles and stable attributes to remain bullet-proof against Google's dynamic class obfuscation.
- **Icons:** Powered by professional, vector-based Inline SVGs that support dynamic CSS fills.

Feel free to fork, open issues, or submit pull requests to make this extension even better!
