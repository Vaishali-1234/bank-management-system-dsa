// ── staff.js — Transactions Panel (Deposit · Withdraw · Transfer) ─────────────

function renderTxn() {
  return `
  <div class="page-head">
    <div>
      <div class="page-title">Transactions</div>
      <div class="page-sub">Deposit · Withdraw · Transfer</div>
    </div>
  </div>
  <div class="card" style="max-width:440px">
    <div class="field">
      <label>ACCOUNT ID</label>
      <input id="tf-id" type="number" placeholder="1001" oninput="lookupAccField('tf')">
      <div class="acc-lookup" id="tf-lookup"></div>
    </div>
    <div class="field">
      <label>OPERATION</label>
      <select id="tf-op" onchange="toggleTransferField()">
        <option value="deposit">Deposit</option>
        <option value="withdraw">Withdraw</option>
        <option value="transfer">Transfer to another account</option>
      </select>
    </div>
    <div class="field" id="tf-to-wrap" style="display:none">
      <label>DESTINATION ACCOUNT ID</label>
      <input id="tf-toid" type="number" placeholder="1002" oninput="lookupAccField('tf-to')">
      <div class="acc-lookup" id="tf-to-lookup"></div>
    </div>
    <div class="field">
      <label>AMOUNT (₹)</label>
      <input id="tf-amt" type="number" min="1" placeholder="500">
    </div>
    <button class="btn btn-primary btn-full" onclick="doTxn()">Submit transaction →</button>
    <div id="tf-msg"></div>
  </div>`;
}

function toggleTransferField() {
  document.getElementById('tf-to-wrap').style.display =
    document.getElementById('tf-op').value === 'transfer' ? 'block' : 'none';
}

function lookupAccField(prefix) {
  const inputId = prefix === 'tf' ? 'tf-id' : 'tf-toid';
  const id  = parseInt(document.getElementById(inputId).value);
  const el  = document.getElementById(prefix + '-lookup');
  const acc = db.find(id);
  el.textContent = acc ? `✓ ${acc.name} · ${fmt(acc.balance)}` : '';
}

function doTxn() {
  const id  = parseInt(document.getElementById('tf-id').value);
  const op  = document.getElementById('tf-op').value;
  const amt = parseFloat(document.getElementById('tf-amt').value);
  const acc = db.find(id);

  if (!acc) { toast('tf-msg', 'Account not found', false); return; }
  if (isNaN(amt) || amt <= 0) { toast('tf-msg', 'Invalid amount', false); return; }

  if (op === 'deposit') {
    db.addTxn(acc, 'Deposit', amt, true);
    toast('tf-msg', `Deposited ${fmt(amt)}. New balance: ${fmt(acc.balance)}`, true);

  } else if (op === 'withdraw') {
    if (amt > acc.balance) { toast('tf-msg', 'Insufficient balance', false); return; }
    db.addTxn(acc, 'Withdrawal', amt, false);
    toast('tf-msg', `Withdrawn ${fmt(amt)}. New balance: ${fmt(acc.balance)}`, true);

  } else {
    // Transfer
    const toId = parseInt(document.getElementById('tf-toid').value);
    const to   = db.find(toId);
    if (!to)          { toast('tf-msg', 'Destination account not found', false); return; }
    if (id === toId)  { toast('tf-msg', 'Cannot transfer to same account', false); return; }
    if (amt > acc.balance) { toast('tf-msg', 'Insufficient balance', false); return; }
    db.addTxn(acc, 'Transfer out → #' + toId, amt, false);
    db.addTxn(to,  'Transfer in ← #' + id,   amt, true);
    toast('tf-msg', `Transferred ${fmt(amt)} from ${acc.name} to ${to.name}`, true);
  }
}
