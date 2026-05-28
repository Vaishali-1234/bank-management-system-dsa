// ── auth.js — Login & Logout Logic ───────────────────────────────────────────

const ADMIN_PASS = 'admin123';
const STAFF_PASS = 'staff123';

let role   = null;
let atmAcc = null;

function updateHint() {
  const v = document.getElementById('login-role').value;
  document.getElementById('login-hint').textContent =
    v === 'atm'
      ? 'Enter your 4-digit PIN  ·  Alice: 1234  ·  Bob: 5678  ·  Carol: 9012'
      : 'Admin: admin123  ·  Staff: staff123';
}

function doLogin() {
  const r = document.getElementById('login-role').value;
  const p = document.getElementById('login-pass').value;

  if (r === 'admin' && p === ADMIN_PASS) {
    role = 'admin';
    openDash();
  } else if (r === 'staff' && p === STAFF_PASS) {
    role = 'staff';
    openDash();
  } else if (r === 'atm') {
    const acc = db.accounts.find(a => a.pin === p && a.active);
    if (!acc) {
      toast('login-msg', 'PIN not found or account inactive', false);
      return;
    }
    role   = 'atm';
    atmAcc = acc;
    openAtm();
  } else {
    toast('login-msg', 'Incorrect credentials', false);
  }
}

function logout() {
  role   = null;
  atmAcc = null;
  document.getElementById('login-pass').value = '';
  show('s-login');
}
