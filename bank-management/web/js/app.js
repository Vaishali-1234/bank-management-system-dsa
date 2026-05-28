// ── app.js — Main Router & Shell ─────────────────────────────────────────────

const adminTabs = [
  { id: 'dashboard', label: 'Dashboard',    icon: '📊' },
  { id: 'accounts',  label: 'Accounts',     icon: '👥' },
  { id: 'create',    label: 'New account',  icon: '➕' },
  { id: 'txn',       label: 'Transactions', icon: '💸' },
  { id: 'search',    label: 'Search',       icon: '🔍' },
];

const staffTabs = [
  { id: 'accounts',  label: 'Accounts',     icon: '👥' },
  { id: 'txn',       label: 'Transactions', icon: '💸' },
  { id: 'search',    label: 'Search',       icon: '🔍' },
];

function openDash() {
  document.getElementById('role-badge').textContent  = role.toUpperCase();
  document.getElementById('user-name').textContent   = role === 'admin' ? 'Administrator' : 'Staff Member';
  document.getElementById('user-role').textContent   = role;
  document.getElementById('user-avatar').textContent = role === 'admin' ? 'AD' : 'ST';

  const tabs = role === 'admin' ? adminTabs : staffTabs;
  document.getElementById('nav-links').innerHTML = tabs.map(t => `
    <button class="nav-btn" id="nav-${t.id}" onclick="gotoTab('${t.id}')">
      ${t.icon} ${t.label}
    </button>
  `).join('');

  show('s-dash');
  gotoTab(role === 'admin' ? 'dashboard' : 'accounts');
}

function gotoTab(id) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const nb = document.getElementById('nav-' + id);
  if (nb) nb.classList.add('active');

  const c = document.getElementById('main-content');

  // Route to the correct render function (defined in admin.js / staff.js)
  if      (id === 'dashboard') c.innerHTML = renderDashboard();
  else if (id === 'accounts')  c.innerHTML = renderAccounts();
  else if (id === 'create')    c.innerHTML = renderCreate();
  else if (id === 'txn')       c.innerHTML = renderTxn();
  else if (id === 'search')    c.innerHTML = renderSearch();
}
