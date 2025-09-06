/* =========================================================
   TreydBuddy demo backend (client-side) • auth.js
   - LocalStorage-based users + session
   - Role redirects and page protection
   - Auto-binds to your existing forms
   ========================================================= */

(() => {
  // ---------- Config: page filenames (keep in sync with your files) ----------
  const PAGES = {
    login: 'Login.html',
    register: 'register.html',
    admin: 'AdminDashboard.html',
    student: 'StudentDashboard.html',
    eventDetails: 'EventDetails.html',
    ticketPurchase: 'ticket-purchase.html',
    ticketingQR: 'ticketing-qr.html',
  };

  // ---------- Storage keys ----------
  const USER_KEY = 'tb_users';     // [{id, fullName, email, password, role}]
  const SESSION_KEY = 'tb_session'; // {email, fullName, role}

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const byId = (id) => document.getElementById(id);
  const normEmail = (e) => (e || '').trim().toLowerCase();
  const now = () => Date.now();

  const getUsers = () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY) || '[]'); }
    catch { return []; }
  };
  const saveUsers = (list) => localStorage.setItem(USER_KEY, JSON.stringify(list));

  const getSession = () => {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch { return null; }
  };
  const setSession = (s) => localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  const clearSession = () => localStorage.removeItem(SESSION_KEY);

  const routeByRole = (role) => {
    if (role === 'admin') window.location.href = PAGES.admin;
    else window.location.href = PAGES.student;
  };

  // ---------- Seed defaults (first run) ----------
  function seedDefaults() {
    const users = getUsers();
    const hasAdmin = users.some(u => u.role === 'admin');
    if (!hasAdmin) {
      users.push({
        id: now(),
        fullName: 'Admin Sample',
        email: 'admin@bpsu.edu.ph',
        password: 'admin123', // demo only
        role: 'admin',
      });
      saveUsers(users);
      // Optional: seed a sample student too
      if (!users.some(u => u.email === 'student@bpsu.edu.ph')) {
        users.push({
          id: now() + 1,
          fullName: 'Juan Dela Cruz',
          email: 'student@bpsu.edu.ph',
          password: 'student123',
          role: 'student',
        });
        saveUsers(users);
      }
    }
  }

  // ---------- Auth API ----------
  function registerUser({ fullName, email, password, role = 'student' }) {
    fullName = (fullName || '').trim();
    email = normEmail(email);
    password = (password || '').trim();

    if (!fullName || !email || !password) {
      return { ok: false, error: 'All fields are required.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }
    const users = getUsers();
    if (users.some(u => u.email === email)) {
      return { ok: false, error: 'Email is already registered.' };
    }
    users.push({ id: now(), fullName, email, password, role });
    saveUsers(users);
    return { ok: true };
  }

  function loginUser({ email, password }) {
    email = normEmail(email);
    password = (password || '').trim();
    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return { ok: false, error: 'Invalid email or password.' };
    setSession({ email: user.email, fullName: user.fullName, role: user.role });
    return { ok: true, role: user.role };
  }

  // ---------- Page protection ----------
  function requireLoggedIn() {
    const s = getSession();
    if (!s) {
      window.location.href = PAGES.login;
      return null;
    }
    return s;
  }
  function requireAdmin() {
    const s = requireLoggedIn();
    if (!s) return null;
    if (s.role !== 'admin') routeByRole(s.role);
    return s;
  }

  // ---------- UI bindings ----------
  function bindLoginPage() {
    // If already logged in, send to the right dashboard.
    const s = getSession();
    if (s) routeByRole(s.role);

    const form = $('form');
    if (!form) return;

    const email = byId('email');
    const password = byId('password');
    const loginBtn = form.querySelector('.btn.btn-primary');

    function handleLogin(e) {
      e && e.preventDefault();
      const res = loginUser({ email: email?.value, password: password?.value });
      if (!res.ok) return alert(res.error);
      routeByRole(res.role);
    }

    // click + Enter submit
    loginBtn && loginBtn.addEventListener('click', handleLogin);
    form.addEventListener('submit', handleLogin);
  }

  function bindRegisterPage() {
    const form = $('form');
    if (!form) return;

    const fullName = byId('fullName');
    const email = byId('email');
    const password = byId('password');
    const confirm = byId('confirmPassword');
    const registerBtn = form.querySelector('.btn.btn-primary');

    function handleRegister(e) {
      e && e.preventDefault();
      if ((password?.value || '') !== (confirm?.value || '')) {
        return alert('Passwords do not match.');
      }
      const res = registerUser({
        fullName: fullName?.value,
        email: email?.value,
        password: password?.value,
        role: 'student',
      });
      if (!res.ok) return alert(res.error);
      alert('Account created! Please log in.');
      window.location.href = PAGES.login;
    }

    registerBtn && registerBtn.addEventListener('click', handleRegister);
    form.addEventListener('submit', handleRegister);
  }

  function bindLogoutLinks() {
    // Any <a> with text "Log out" will log out.
    document.querySelectorAll('a').forEach(a => {
      if ((a.textContent || '').trim().toLowerCase() === 'log out') {
        a.addEventListener('click', (e) => {
          e.preventDefault();
          clearSession();
          window.location.href = PAGES.login;
        });
      }
    });
  }

  // Stamp year if #year exists (nice touch)
  function stampYear() {
    const y = byId('year');
    if (y) y.textContent = new Date().getFullYear();
  }

  // ---------- Router ----------
  function boot() {
    seedDefaults();
    stampYear();
    bindLogoutLinks();

    const path = (location.pathname || '').toLowerCase();

    // Page guards
    if (path.endsWith(PAGES.admin.toLowerCase())) {
      requireAdmin();
    } else if (
      path.endsWith(PAGES.student.toLowerCase()) ||
      path.endsWith(PAGES.eventDetails.toLowerCase()) ||
      path.endsWith(PAGES.ticketPurchase.toLowerCase())
    ) {
      const s = requireLoggedIn();
      if (!s) return;
      // If an admin tries to open student pages, send them to admin dashboard.
      if (s.role === 'admin' && !path.endsWith(PAGES.admin.toLowerCase())) {
        routeByRole('admin');
        return;
      }
    } else if (path.endsWith(PAGES.ticketingQR.toLowerCase())) {
      requireAdmin();
    }

    // Page-specific bindings
    if (path.endsWith(PAGES.login.toLowerCase())) bindLoginPage();
    if (path.endsWith(PAGES.register.toLowerCase())) bindRegisterPage();
  }

  document.addEventListener('DOMContentLoaded', boot);

  // Expose a tiny API to window (optional debug in console)
  window.TBAuth = {
    getUsers, saveUsers, getSession, clearSession, registerUser, loginUser
  };
})();
