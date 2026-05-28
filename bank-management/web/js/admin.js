// ── admin.js — Admin Panel Rendering & Actions ───────────────────────────────

// ── Dashboard ────────────────────────────────────────────────────────────────
function renderDashboard() {
  const accs  = db.all();
  const total = accs.reduce((s, a) => s + a.balance, 0);
  const sav   = accs.filter(a => a.type === 'Savings').length;
  const cur   = accs.filter(a => a.type === 'Current').length;
  const allTxns = accs
    .flatMap(a => a.txns.map(t => ({ ...t, owner: a.name, ownerId: a.id })))
    .sort((a, b) => b.d.localeCompare(a.d))
    .slice(0, 8);

  return `
  <div class="page-head">
    <div>
      <div class="page-title">Dashboard</div>
      <div class="page-sub">Overview · ${new Date().toDateString()}</div>
    </div>
  </div>
  <div class="metrics">
    <div class="metric accent">
      <div class="metric-label">TOTAL DEPOSITS</div>
      <div class="metric-value" style="font-size:18px">${fmt(total)}</div>
      <div class="metric-sub">across ${accs.length} accounts</div>
    </div>
    <div class="metric">
      <div class="metric-label">ACCOUNTS</div>
      <div class="metric-value">${accs.length}</div>
      <div class="metric-sub">active</div>
    </div>
    <div class="metric">
      <div class="metric-label">SAVINGS</div>
      <div class="metric-value">${sav}</div>
    </div>
    <div class="metric">
      <div class="metric-label">CURRENT</div>
      <div class="metric-value">${cur}</div>
    </div>
  </div>
  <div class="card">
    <div style="font-size:14px;font-weight:600;margin-bottom:14px">Recent transactions</div>
    <div class="tbl-wrap"><table>
      <thead><tr>
        <th>DATE</th><th>ACCOUNT</th><th>DESCRIPTION</th>
        <th style="text-align:right">AMOUNT</th>
        <th style="text-align:right">BALANCE</th>
      </tr></thead>
      <tbody>${allTxns.map(t => `
        <tr>
          <td class="id-cell">${t.d}</td>
          <td>
            <div class="flex items-center gap-2">
              <div class="avatar" style="width:24px;height:24px;font-size:9px">${initials(t.owner)}</div>
              <span>${t.owner}</span>
            </div>
          </td>
          <td>${t.t}</td>
          <td style="text-align:right" class="${t.cr ? 'txn-cr' : 'txn-dr'}">${t.cr ? '+' : '-'}${fmt(t.a)}</td>
          <td style="text-align:right;font-family:'DM Mono',monospace;font-size:12px">${fmt(t.b)}</td>
        </tr>`).join('')}
      </tbody>
    </table></div>
  </div>`;
}

// ── Accounts list (shared with staff, admin gets delete button) ───────────────
function renderAccounts() {
  const accs    = db.all().sort((a, b) => a.id - b.id);
  const isAdmin = role === 'admin';
  return `
  <div class="page-head">
    <div>
      <div class="page-title">Accounts</div>
      <div class="page-sub">${accs.length} active accounts</div>
    </div>
  </div>
  <div class="card">
    <div class="tbl-wrap"><table>
      <thead><tr>
        <th></th><th>ID</th><th>NAME</th><th>TYPE</th>
        <th>BALANCE</th><th>TRANSACTIONS</th><th>STATUS</th>
        ${isAdmin ? '<th></th>' : ''}
      </tr></thead>
      <tbody id="acc-tbody">${accs.map(a => `
        <tr>
          <td><div class="avatar" style="width:28px;height:28px;font-size:11px">${initials(a.name)}</div></td>
          <td class="id-cell">#${a.id}</td>
          <td style="color:var(--text);font-weight:500">${a.name}</td>
          <td><span class="badge badge-${a.type.toLowerCase()}">${a.type}</span></td>
          <td style="font-family:'DM Mono',monospace">${fmt(a.balance)}</td>
          <td class="id-cell">${a.txns.length} txns</td>
          <td><span class="badge badge-active">Active</span></td>
          ${isAdmin ? `<td><button class="btn btn-danger btn-sm" onclick="deleteAcc(${a.id})">Delete</button></td>` : ''}
        </tr>`).join('')}
      </tbody>
    </table></div>
  </div>`;
}

function deleteAcc(id) {
  if (!confirm('Delete account #' + id + '? This cannot be undone.')) return;
  const acc = db.find(id);
  if (!acc) return;
  acc.active = false;
  gotoTab('accounts');
}

// ── Create Account ────────────────────────────────────────────────────────────
function renderCreate() {
  return `
  <div class="page-head">
    <div>
      <div class="page-title">New account</div>
      <div class="page-sub">Create a customer account</div>
    </div>
  </div>
  <div class="card" style="max-width:420px">
    <div class="field"><label>FULL NAME</label><input id="cf-name" placeholder="e.g. John Doe"></div>
    <div class="grid2">
      <div class="field">
        <label>ACCOUNT TYPE</label>
        <select id="cf-type">
          <option value="Savings">Savings</option>
          <option value="Current">Current</option>
        </select>
      </div>
      <div class="field">
        <label>ATM PIN (4 digits)</label>
        <input id="cf-pin" maxlength="4" type="password" placeholder="••••">
      </div>
    </div>
    <div class="field">
      <label>INITIAL DEPOSIT (min ₹500)</label>
      <input id="cf-amt" type="number" min="500" placeholder="1000">
    </div>
    <button class="btn btn-primary btn-full" onclick="createAccount()">Create account →</button>
    <div id="cf-msg"></div>
  </div>`;
}

function createAccount() {
  const name = document.getElementById('cf-name').value.trim();
  const type = document.getElementById('cf-type').value;
  const pin  = document.getElementById('cf-pin').value.trim();
  const amt  = parseFloat(document.getElementById('cf-amt').value);

  if (!name) { toast('cf-msg', 'Name is required', false); return; }
  if (pin.length !== 4 || !/^\d+$/.test(pin)) { toast('cf-msg', 'PIN must be exactly 4 digits', false); return; }
  if (isNaN(amt) || amt < 500) { toast('cf-msg', 'Minimum initial deposit is ₹500', false); return; }

  const acc = {
    id: db.nextId++, name, pin, type,
    balance: amt, active: true,
    txns: [{ t: 'Account opened', a: amt, b: amt, d: new Date().toISOString().slice(0, 10), cr: true }]
  };
  db.accounts.push(acc);
  toast('cf-msg', `Account #${acc.id} created for ${name}!`, true);
  document.getElementById('cf-name').value = '';
  document.getElementById('cf-pin').value  = '';
  document.getElementById('cf-amt').value  = '';
}

// ── Search ────────────────────────────────────────────────────────────────────
function renderSearch() {
  return `
  <div class="page-head">
    <div>
      <div class="page-title">Search</div>
      <div class="page-sub">Find accounts by name or ID</div>
    </div>
  </div>
  <div class="card">
    <input id="sq" placeholder="Search by name or account ID..."
      style="width:100%;padding:10px 14px;background:var(--surface2);border:1px solid var(--border);
             border-radius:var(--radius-sm);color:var(--text);font-family:'Syne',sans-serif;
             font-size:13px;margin-bottom:1rem;outline:none"
      oninput="doSearch()">
    <div id="sr">${renderSearchResults('')}</div>
  </div>`;
}

function doSearch() {
  document.getElementById('sr').innerHTML =
    renderSearchResults(document.getElementById('sq').value);
}

function renderSearchResults(q) {
  const accs = db.all().filter(a => {
    if (!q) return true;
    return a.name.toLowerCase().includes(q.toLowerCase()) || String(a.id).includes(q);
  });
  if (!accs.length) return `<div class="text-sm" style="padding:1rem 0">No accounts found.</div>`;
  return `
  <table>
    <thead><tr><th></th><th>ID</th><th>NAME</th><th>TYPE</th><th>BALANCE</th><th>TXNS</th></tr></thead>
    <tbody>${accs.map(a => `
      <tr>
        <td><div class="avatar" style="width:26px;height:26px;font-size:10px">${initials(a.name)}</div></td>
        <td class="id-cell">#${a.id}</td>
        <td style="color:var(--text);font-weight:500">${a.name}</td>
        <td><span class="badge badge-${a.type.toLowerCase()}">${a.type}</span></td>
        <td style="font-family:'DM Mono',monospace">${fmt(a.balance)}</td>
        <td class="id-cell">${a.txns.length}</td>
      </tr>`).join('')}
    </tbody>
  </table>`;
}
