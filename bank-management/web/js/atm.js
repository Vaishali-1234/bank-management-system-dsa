// ── atm.js — ATM / Customer Panel ────────────────────────────────────────────

function openAtm() {
  show('s-dash');
  document.getElementById('role-badge').textContent    = 'ATM';
  document.getElementById('user-name').textContent     = atmAcc.name;
  document.getElementById('user-role').textContent     = 'customer';
  document.getElementById('user-avatar').textContent   = initials(atmAcc.name);
  document.getElementById('nav-links').innerHTML = `
    <button class="nav-btn active" onclick="renderAtmContent()">💳 My account</button>
  `;
  renderAtmContent();
}

function renderAtmContent() {
  const acc = atmAcc;
  document.getElementById('main-content').innerHTML = `
  <div class="atm-screen">
    <div class="page-head">
      <div>
        <div class="page-title">Welcome back, ${acc.name.split(' ')[0]}</div>
        <div class="page-sub">Account #${acc.id} · ${acc.type}</div>
      </div>
    </div>

    <div class="metric accent" style="margin-bottom:1.25rem">
      <div class="metric-label">AVAILABLE BALANCE</div>
      <div class="metric-value" style="font-size:28px">${fmt(acc.balance)}</div>
      <div class="metric-sub">${acc.type} account</div>
    </div>

    <div class="grid2" style="margin-bottom:1.25rem">
      <div class="card">
        <div style="font-size:13px;font-weight:600;margin-bottom:10px">Deposit</div>
        <div class="field">
          <label>AMOUNT (₹)</label>
          <input id="atm-dep" type="number" min="1" placeholder="500">
        </div>
        <button class="btn btn-success btn-full" onclick="atmDep()">Deposit →</button>
        <div id="atm-dep-msg"></div>
      </div>
      <div class="card">
        <div style="font-size:13px;font-weight:600;margin-bottom:10px">Withdraw</div>
        <div class="field">
          <label>AMOUNT (₹)</label>
          <input id="atm-wd" type="number" min="1" placeholder="500">
        </div>
        <button class="btn btn-danger btn-full" onclick="atmWd()">Withdraw →</button>
        <div id="atm-wd-msg"></div>
      </div>
    </div>

    <div class="card">
      <div style="font-size:13px;font-weight:600;margin-bottom:14px">Mini statement</div>
      <table>
        <thead>
          <tr>
            <th>DATE</th>
            <th>DESCRIPTION</th>
            <th style="text-align:right">AMOUNT</th>
            <th style="text-align:right">BALANCE</th>
          </tr>
        </thead>
        <tbody>${acc.txns.slice(0, 8).map(t => `
          <tr>
            <td class="id-cell">${t.d}</td>
            <td>${t.t}</td>
            <td style="text-align:right" class="${t.cr ? 'txn-cr' : 'txn-dr'}">${t.cr ? '+' : '-'}${fmt(t.a)}</td>
            <td style="text-align:right;font-family:'DM Mono',monospace;font-size:12px">${fmt(t.b)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

function atmDep() {
  const amt = parseFloat(document.getElementById('atm-dep').value);
  if (isNaN(amt) || amt <= 0) { toast('atm-dep-msg', 'Invalid amount', false); return; }
  db.addTxn(atmAcc, 'ATM Deposit', amt, true);
  renderAtmContent();
}

function atmWd() {
  const amt = parseFloat(document.getElementById('atm-wd').value);
  if (isNaN(amt) || amt <= 0)   { toast('atm-wd-msg', 'Invalid amount', false); return; }
  if (amt > atmAcc.balance)     { toast('atm-wd-msg', 'Insufficient balance', false); return; }
  db.addTxn(atmAcc, 'ATM Withdrawal', amt, false);
  renderAtmContent();
}
