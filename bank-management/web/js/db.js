// ── db.js — Data Structures & Store ──────────────────────────────────────────
// Mirrors the C++ HashTable + TransactionList + Account structures in JavaScript

const db = {
  accounts: [
    {
      id: 1001, name: 'Alice Johnson', pin: '1234',
      type: 'Savings', balance: 15000, active: true,
      txns: [
        { t: 'Account opened',  a: 10000, b: 10000, d: '2025-01-10', cr: true },
        { t: 'Salary credit',   a: 5000,  b: 15000, d: '2025-03-01', cr: true }
      ]
    },
    {
      id: 1002, name: 'Bob Smith', pin: '5678',
      type: 'Current', balance: 32000, active: true,
      txns: [
        { t: 'Account opened',    a: 22000, b: 22000, d: '2025-01-15', cr: true },
        { t: 'Business deposit',  a: 10000, b: 32000, d: '2025-04-10', cr: true }
      ]
    },
    {
      id: 1003, name: 'Carol White', pin: '9012',
      type: 'Savings', balance: 8500, active: true,
      txns: [
        { t: 'Account opened', a: 8500, b: 8500, d: '2025-02-20', cr: true }
      ]
    }
  ],

  nextId: 1004,

  // O(1) lookup by ID — mirrors C++ HashTable::find()
  find(id) {
    return this.accounts.find(a => a.id == id && a.active);
  },

  // Returns all active accounts — mirrors HashTable::all()
  all() {
    return this.accounts.filter(a => a.active);
  },

  // Prepend transaction — mirrors C++ TransactionList::push()
  addTxn(acc, type, amount, credit) {
    const bal = credit
      ? +(acc.balance + amount).toFixed(2)
      : +(acc.balance - amount).toFixed(2);
    acc.balance = bal;
    const now = new Date().toISOString().slice(0, 10);
    acc.txns.unshift({ t: type, a: amount, b: bal, d: now, cr: credit });
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = n =>
  '₹' + parseFloat(n).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

const initials = n =>
  n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

const show = id => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
};

function toast(elId, txt, ok) {
  const el = document.getElementById(elId);
  el.innerHTML = `<div class="toast ${ok ? 'toast-ok' : 'toast-err'}">${txt}</div>`;
  setTimeout(() => el.innerHTML = '', 3500);
}
