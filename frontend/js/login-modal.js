// frontend/js/login-modal.js

document.addEventListener('DOMContentLoaded', () => {
  // ===== THEME HELPERS =====
  const THEME_KEY = 'nd_theme';

  function applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  function setTheme(theme) {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  const storedTheme = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(storedTheme);

  // ===== GLOBAL OVERLAY (ONLY FOR LOGIN + SETTINGS) =====
  // Use a dedicated overlay so we don't clash with contact/product overlays
  let overlay = document.getElementById('global-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'global-overlay';
    overlay.className = 'modal-overlay';
    overlay.style.display = 'none';
    document.body.appendChild(overlay);
  }

  // ===== LOGIN MODAL (single smart form: login + register) =====
  let loginModal = document.getElementById('login-modal');

  if (!loginModal) {
    loginModal = document.createElement('div');
    loginModal.className = 'modal';
    loginModal.id = 'login-modal';
    loginModal.style.display = 'none';

    loginModal.innerHTML = `
      <div class="modal-content">
        <button class="close-modal-btn" data-close-modal>&times;</button>

        <h2>Login / Register</h2>
        <p style="font-size:0.85rem; color:#666; margin-top:-4px; margin-bottom:8px;">
          Enter a username and password. Existing users will be logged in; new users will be registered automatically.
        </p>

        <form id="auth-form">
          <label>Username
            <input id="auth-username" type="text" required>
          </label>

          <label>Password
            <input id="auth-password" type="password" required>
          </label>

          <button type="submit">Continue</button>
        </form>
        <p id="auth-message" class="modal-message"></p>
      </div>
    `;

    document.body.appendChild(loginModal);
  }

  // ===== SETTINGS MODAL =====
  let settingsModal = document.getElementById('settings-modal');

  if (!settingsModal) {
    settingsModal = document.createElement('div');
    settingsModal.id = 'settings-modal';
    settingsModal.className = 'modal';
    settingsModal.style.display = 'none';

    settingsModal.innerHTML = `
      <div class="modal-content">
        <button class="close-modal-btn" data-close-modal>&times;</button>
        <h2>Settings</h2>

        <div class="settings-row">
          <span>Dark mode</span>
          <label class="switch">
            <input type="checkbox" id="theme-toggle">
            <span class="slider"></span>
          </label>
        </div>
      </div>
    `;

    document.body.appendChild(settingsModal);
  }

  const themeToggle = settingsModal.querySelector('#theme-toggle');
  if (storedTheme === 'dark') {
    themeToggle.checked = true;
  }

  themeToggle.addEventListener('change', () => {
    const theme = themeToggle.checked ? 'dark' : 'light';
    setTheme(theme);
  });

  // ===== NAV BUTTON (Sign In / username) + DROPDOWN =====
  const loginBtn = document.getElementById('login-open-btn');
  let userMenuWrapper = null;
  let userMenu = null;
  let currentUser = null;

  if (loginBtn) {
    userMenuWrapper = document.createElement('div');
    userMenuWrapper.className = 'user-menu-wrapper';

    loginBtn.parentNode.insertBefore(userMenuWrapper, loginBtn);
    userMenuWrapper.appendChild(loginBtn);

    userMenu = document.createElement('div');
    userMenu.className = 'user-menu';
    userMenu.innerHTML = `
      <button type="button" data-user-menu="settings">Settings</button>
      <button type="button" data-user-menu="logout">Log out</button>
    `;
    userMenuWrapper.appendChild(userMenu);
  }

  // ===== HELPERS: ONLY FOR LOGIN + SETTINGS =====
  function hideAllAppModals() {
    if (loginModal) loginModal.style.display = 'none';
    if (settingsModal) settingsModal.style.display = 'none';
  }

  function closeAllAppModals() {
    hideAllAppModals();
    overlay.style.display = 'none';
  }

  // ===== GLOBAL "CLOSE EVERYTHING" HELPER =====
  function closeAllModals() {
    // 1) Login + Settings
    hideAllAppModals();
    overlay.style.display = 'none';

    // 2) Contact modal (from contact-modal.js)
    const contactOverlay = document.getElementById('contactModalOverlay');
    if (contactOverlay && contactOverlay.classList.contains('show')) {
      contactOverlay.classList.remove('show');
    }

    // Reset scroll in case contact had locked it
    document.body.style.overflow = '';

    // 3) Product modal
    const productOverlay = document.getElementById('product-modal');
    if (productOverlay && !productOverlay.classList.contains('hidden')) {
      productOverlay.classList.add('hidden');
    }
  }

  // Expose globally so contact/product scripts can use it
  window.ndCloseAllModals = closeAllModals;

  // ===== LOGIN / SETTINGS OPENERS =====
  function openLogin() {
    if (window.ndCloseAllModals) window.ndCloseAllModals();

    if (loginModal) loginModal.style.display = 'block';
    overlay.style.display = 'block';
  }

  function openSettings() {
    if (window.ndCloseAllModals) window.ndCloseAllModals();

    if (settingsModal) settingsModal.style.display = 'block';
    overlay.style.display = 'block';

    const theme = localStorage.getItem(THEME_KEY) || 'light';
    themeToggle.checked = theme === 'dark';
  }

  // ===== USER DROPDOWN =====
  function openUserMenu() {
    if (!userMenu) return;
    userMenu.classList.add('open');
  }

  function closeUserMenu() {
    if (!userMenu) return;
    userMenu.classList.remove('open');
  }

  function toggleUserMenu(e) {
    e.stopPropagation();
    if (!userMenu) return;
    if (userMenu.classList.contains('open')) {
      closeUserMenu();
    } else {
      openUserMenu();
    }
  }

  document.addEventListener('click', (e) => {
    if (!userMenu || !userMenu.classList.contains('open')) return;
    if (userMenuWrapper && !userMenuWrapper.contains(e.target)) {
      closeUserMenu();
    }
  });

  if (userMenu) {
    userMenu.addEventListener('click', (e) => {
      const action = e.target.getAttribute('data-user-menu');
      if (!action) return;
      if (action === 'logout') {
        logout();
      } else if (action === 'settings') {
        closeUserMenu();
        openSettings();
      }
    });
  }

  // ===== NAV BUTTON MODES =====
  function setBtnAsLogin() {
    if (!loginBtn) return;
    loginBtn.textContent = 'Sign In';
    loginBtn.classList.remove('logged-in');
    loginBtn.disabled = false;
    loginBtn.style.cursor = 'pointer';
    loginBtn.removeEventListener('click', toggleUserMenu);
    loginBtn.removeEventListener('click', openLogin);
    loginBtn.addEventListener('click', openLogin);
  }

  function setBtnAsUser(username) {
    if (!loginBtn) return;
    currentUser = username;
    loginBtn.textContent = username;
    loginBtn.classList.add('logged-in');
    loginBtn.disabled = false;
    loginBtn.style.cursor = 'pointer';
    loginBtn.removeEventListener('click', openLogin);
    loginBtn.removeEventListener('click', toggleUserMenu);
    loginBtn.addEventListener('click', toggleUserMenu);
  }

  // ===== LOGIN STATE HELPERS =====
  function handleLoggedIn(username, msg) {
    localStorage.setItem('nd_logged_in_user', username);
    setBtnAsUser(username);

    const authMsg = document.getElementById('auth-message');
    if (authMsg && msg) authMsg.textContent = msg;

    // Wait ~2s so the user can see the message, then close
    setTimeout(() => {
      closeAllAppModals();
    }, 2000);
  }

  function logout() {
    currentUser = null;
    localStorage.removeItem('nd_logged_in_user');
    closeUserMenu();
    closeAllAppModals();
    setBtnAsLogin();
  }

  // Initial state from storage
  if (loginBtn) {
    const savedUser = localStorage.getItem('nd_logged_in_user');
    if (savedUser) setBtnAsUser(savedUser);
    else setBtnAsLogin();
  }

  // ===== OVERLAY + ESC CLOSE ONLY LOGIN/SETTINGS =====
  overlay.addEventListener('click', () => {
    closeAllAppModals();
    closeUserMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllAppModals();
      closeUserMenu();
    }
  });

  // Close buttons INSIDE login/settings modals (not contact)
  document.addEventListener('click', (e) => {
    if (e.target.matches('[data-close-modal]')) {
      closeAllAppModals();
    }
  });

  // ===== NAV / LOGO EVENT LISTENERS =====
  // Close everything when clicking ANY navbar link
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.ndCloseAllModals) window.ndCloseAllModals();
      closeUserMenu();
    });
  });

  // Also close everything when clicking the logo
  const logoEl = document.querySelector('.logo, .logo img');
  if (logoEl) {
    logoEl.addEventListener('click', () => {
      if (window.ndCloseAllModals) window.ndCloseAllModals();
      closeUserMenu();
    });
  }

  // ===== API HELPER =====
  async function postJSON(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const json = await res.json().catch(() => ({}));
    return { status: res.status, ...json };
  }

  // ===== SINGLE /auth FORM =====
  const authForm = loginModal.querySelector('#auth-form');
  const authMsg = loginModal.querySelector('#auth-message');

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value.trim();

    authMsg.textContent = 'Checking account...';

    try {
      const result = await postJSON('/auth', { username, password });

      if (result.ok) {
        if (result.mode === 'login') {
          authMsg.textContent = `Welcome back, ${result.username}!`;
        } else {
          authMsg.textContent = `Account created. Welcome, ${result.username}!`;
        }
        handleLoggedIn(result.username, authMsg.textContent);
      } else {
        authMsg.textContent = result.message || 'Authentication failed.';
      }
    } catch (err) {
      console.error(err);
      authMsg.textContent = 'Error contacting server.';
    }
  });
});
