# Bank Management System — DSA Project

An interactive Bank Management System with two implementations:
- **C++ console app** — pure DSA logic (linked lists, hash table, custom data structures)
- **Web UI (HTML/JS)** — browser-based SPA with the same logic ported to JavaScript

---

## Folder Structure

```
bank-management/
├── cpp/
│   └── bank_management.cpp      ← C++ console version
│
└── web/
    ├── index.html               ← Entry point (open this in browser)
    ├── css/
    │   └── style.css            ← All styles
    ├── js/
    │   ├── db.js                ← Data structures (HashTable, TransactionList)
    │   ├── auth.js              ← Login / logout logic
    │   ├── admin.js             ← Admin panel (dashboard, accounts, create, search)
    │   ├── staff.js             ← Staff panel (transactions: deposit/withdraw/transfer)
    │   ├── atm.js               ← ATM / customer panel
    │   └── app.js               ← Main router & shell
    └── pages/
        ├── dashboard.html       ← (reference, redirects to index.html)
        ├── accounts.html        ← (reference, redirects to index.html)
        ├── transactions.html    ← (reference, redirects to index.html)
        └── atm.html             ← (reference, redirects to index.html)
```

---

## How to Run

### C++ Version
```bash
g++ -o bank cpp/bank_management.cpp
./bank
```

### Web Version
Just open `web/index.html` in any browser — no server needed.

---

## Data Structures Used (DSA)

| Structure | Where | Purpose |
|---|---|---|
| **Linked List** | `TransactionList` (C++) / `txns[]` (JS) | Per-account transaction history |
| **Hash Table** | `HashTable` (C++) / `db.find()` (JS) | O(1) account lookup by ID |
| **Array / Vector** | `accounts[]` (JS) | Account storage & iteration |
| **Sorting** | `listAllAccounts()` (C++) / `.sort()` (JS) | Alphabetical / ID ordering |

---

## Login Credentials

| Role | Credential |
|---|---|
| Admin | `admin123` |
| Staff | `staff123` |
| ATM (Alice #1001) | PIN `1234` |
| ATM (Bob #1002) | PIN `5678` |
| ATM (Carol #1003) | PIN `9012` |

---

## Features

**Admin Panel**
- Create / delete accounts
- View all accounts with balances
- Deposit, withdraw, transfer funds
- Search by name or ID
- Dashboard with metrics & recent transactions

**Staff Panel**
- View accounts, deposit, withdraw, transfer (no delete)

**ATM Panel**
- Customer login with 4-digit PIN
- Check balance, deposit, withdraw
- Mini statement (last 8 transactions)
