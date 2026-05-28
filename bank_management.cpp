#include <iostream>
#include <iomanip>
#include <string>
#include <vector>
#include <ctime>
#include <algorithm>
#include <limits>
using namespace std;

// ─── Color codes ───────────────────────────────────────────────────────────
#define RESET   "\033[0m"
#define GREEN   "\033[92m"
#define CYAN    "\033[96m"
#define YELLOW  "\033[93m"
#define RED     "\033[91m"
#define WHITE   "\033[97m"
#define BOLD    "\033[1m"

// ─── Data Structures ───────────────────────────────────────────────────────

struct Transaction {
    string type;
    double amount;
    double balanceAfter;
    string date;
    Transaction* next;
    Transaction(string t, double a, double b, string d)
        : type(t), amount(a), balanceAfter(b), date(d), next(nullptr) {}
};

// Linked list of transactions per account
struct TransactionList {
    Transaction* head;
    int count;
    TransactionList() : head(nullptr), count(0) {}

    void push(string type, double amount, double balance) {
        time_t now = time(0);
        char buf[20];
        strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M", localtime(&now));
        Transaction* t = new Transaction(type, amount, balance, string(buf));
        t->next = head;
        head = t;
        count++;
    }

    void print() {
        if (!head) { cout << GREEN << "  No transactions yet.\n" << RESET; return; }
        Transaction* cur = head;
        int shown = 0;
        while (cur && shown < 10) {
            cout << GREEN << "  " << left << setw(22) << cur->date
                 << setw(14) << cur->type
                 << setw(12) << fixed << setprecision(2) << cur->amount
                 << "Balance: " << cur->balanceAfter << RESET << "\n";
            cur = cur->next;
            shown++;
        }
    }

    ~TransactionList() {
        Transaction* cur = head;
        while (cur) { Transaction* tmp = cur; cur = cur->next; delete tmp; }
    }
};

// Account node for linked list of accounts
struct Account {
    int id;
    string name;
    string pin;       // 4-digit PIN for ATM
    string type;      // Savings / Current
    double balance;
    bool active;
    TransactionList* txns;
    Account* next;

    Account(int i, string n, string p, string t, double b)
        : id(i), name(n), pin(p), type(t), balance(b), active(true), next(nullptr) {
        txns = new TransactionList();
        txns->push("Account opened", b, b);
    }
    ~Account() { delete txns; }
};

// Hash table for O(1) account lookup by ID
struct HashTable {
    static const int SIZE = 101;
    Account* table[SIZE];
    HashTable() { fill(table, table + SIZE, nullptr); }

    int hash(int id) { return id % SIZE; }

    void insert(Account* acc) {
        int h = hash(acc->id);
        acc->next = table[h];
        table[h] = acc;
    }

    Account* find(int id) {
        Account* cur = table[hash(id)];
        while (cur) { if (cur->id == id) return cur; cur = cur->next; }
        return nullptr;
    }

    bool remove(int id) {
        int h = hash(id);
        Account* cur = table[h], *prev = nullptr;
        while (cur) {
            if (cur->id == id) {
                if (prev) prev->next = cur->next;
                else table[h] = cur->next;
                cur->active = false;
                return true;
            }
            prev = cur; cur = cur->next;
        }
        return false;
    }

    // Collect all active accounts into a vector (for sorting/display)
    vector<Account*> all() {
        vector<Account*> v;
        for (int i = 0; i < SIZE; i++) {
            Account* cur = table[i];
            while (cur) { if (cur->active) v.push_back(cur); cur = cur->next; }
        }
        return v;
    }
};

// ─── Global state ──────────────────────────────────────────────────────────
HashTable accounts;
int nextId = 1001;
const string ADMIN_PASS = "admin123";
const string STAFF_PASS = "staff123";

// ─── Utility ───────────────────────────────────────────────────────────────
void clearInput() { cin.clear(); cin.ignore(numeric_limits<streamsize>::max(), '\n'); }

void pause() {
    cout << YELLOW << "\n  Press Enter to continue..." << RESET;
    cin.ignore(numeric_limits<streamsize>::max(), '\n');
}

void printLine(char c = '*', int n = 52) {
    cout << GREEN;
    for (int i = 0; i < n; i++) cout << c;
    cout << RESET << "\n";
}

void printHeader(const string& title) {
    cout << "\n";
    printLine();
    cout << GREEN << "*" << CYAN << BOLD
         << setw(27 + title.size()/2) << right << title
         << setw(27 - title.size()/2) << left << ""
         << GREEN << "*" << RESET << "\n";
    printLine();
}

void banner() {
    cout << GREEN;
    cout << "\n";
    cout << "  ██████╗  █████╗ ███╗   ██╗██╗  ██╗\n";
    cout << "  ██╔══██╗██╔══██╗████╗  ██║██║ ██╔╝\n";
    cout << "  ██████╔╝███████║██╔██╗ ██║█████╔╝ \n";
    cout << "  ██╔══██╗██╔══██║██║╚██╗██║██╔═██╗ \n";
    cout << "  ██████╔╝██║  ██║██║ ╚████║██║  ██╗\n";
    cout << "  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝\n";
    cout << CYAN << "     Management System  [DSA Project]\n" << RESET;
    cout << "\n";
}

// ─── Account Operations ────────────────────────────────────────────────────
void createAccount() {
    printHeader(" CREATE NEW ACCOUNT ");
    string name, type, pin;
    double initBalance;

    cout << GREEN << "  Enter full name    : " << WHITE;
    clearInput(); getline(cin, name);
    if (name.empty()) { cout << RED << "  Name cannot be empty.\n" << RESET; return; }

    cout << GREEN << "  Account type (1=Savings / 2=Current): " << WHITE;
    int t; cin >> t;
    type = (t == 2) ? "Current" : "Savings";

    cout << GREEN << "  Set 4-digit ATM PIN: " << WHITE;
    cin >> pin;
    if (pin.size() != 4) { cout << RED << "  PIN must be 4 digits.\n" << RESET; return; }

    cout << GREEN << "  Initial deposit (min 500): " << WHITE;
    cin >> initBalance;
    if (initBalance < 500) { cout << RED << "  Minimum deposit is 500.\n" << RESET; return; }

    Account* acc = new Account(nextId++, name, pin, type, initBalance);
    accounts.insert(acc);

    printLine('-');
    cout << CYAN << "  ✔  Account created successfully!\n";
    cout << GREEN << "  Account ID : " << YELLOW << acc->id << "\n";
    cout << GREEN << "  Name       : " << WHITE  << acc->name << "\n";
    cout << GREEN << "  Type       : " << WHITE  << acc->type << "\n";
    cout << GREEN << "  Balance    : " << WHITE  << fixed << setprecision(2) << acc->balance << "\n" << RESET;
    printLine('-');
    pause();
}

void viewAccount(bool adminMode = true) {
    printHeader(" VIEW ACCOUNT ");
    cout << GREEN << "  Enter Account ID: " << WHITE;
    int id; cin >> id;
    Account* acc = accounts.find(id);
    if (!acc) { cout << RED << "  Account not found.\n" << RESET; pause(); return; }

    printLine('-');
    cout << GREEN << "  Account ID : " << YELLOW << acc->id << "\n";
    cout << GREEN << "  Name       : " << WHITE  << acc->name << "\n";
    cout << GREEN << "  Type       : " << WHITE  << acc->type << "\n";
    cout << GREEN << "  Status     : " << (acc->active ? CYAN"Active" : RED"Inactive") << "\n";
    cout << GREEN << "  Balance    : " << YELLOW  << fixed << setprecision(2) << acc->balance << "\n";
    cout << GREEN << "\n  Last 10 Transactions:\n";
    cout << GREEN << "  " << string(60,'-') << "\n";
    acc->txns->print();
    printLine('-');
    pause();
}

void deposit() {
    printHeader(" DEPOSIT ");
    cout << GREEN << "  Enter Account ID: " << WHITE;
    int id; cin >> id;
    Account* acc = accounts.find(id);
    if (!acc) { cout << RED << "  Account not found.\n" << RESET; pause(); return; }

    cout << GREEN << "  Enter amount to deposit: " << WHITE;
    double amount; cin >> amount;
    if (amount <= 0) { cout << RED << "  Invalid amount.\n" << RESET; pause(); return; }

    acc->balance += amount;
    acc->txns->push("Deposit", amount, acc->balance);
    cout << CYAN << "  ✔  Deposited " << YELLOW << fixed << setprecision(2) << amount
         << CYAN << "  |  New balance: " << YELLOW << acc->balance << RESET << "\n";
    pause();
}

void withdraw() {
    printHeader(" WITHDRAWAL ");
    cout << GREEN << "  Enter Account ID: " << WHITE;
    int id; cin >> id;
    Account* acc = accounts.find(id);
    if (!acc) { cout << RED << "  Account not found.\n" << RESET; pause(); return; }

    cout << GREEN << "  Enter amount to withdraw: " << WHITE;
    double amount; cin >> amount;
    if (amount <= 0) { cout << RED << "  Invalid amount.\n" << RESET; pause(); return; }
    if (amount > acc->balance) { cout << RED << "  Insufficient balance.\n" << RESET; pause(); return; }

    acc->balance -= amount;
    acc->txns->push("Withdrawal", amount, acc->balance);
    cout << CYAN << "  ✔  Withdrawn " << YELLOW << fixed << setprecision(2) << amount
         << CYAN << "  |  New balance: " << YELLOW << acc->balance << RESET << "\n";
    pause();
}

void transfer() {
    printHeader(" FUND TRANSFER ");
    cout << GREEN << "  From Account ID: " << WHITE;
    int fromId; cin >> fromId;
    cout << GREEN << "  To   Account ID: " << WHITE;
    int toId; cin >> toId;

    Account* from = accounts.find(fromId);
    Account* to   = accounts.find(toId);

    if (!from) { cout << RED << "  Source account not found.\n" << RESET; pause(); return; }
    if (!to)   { cout << RED << "  Destination account not found.\n" << RESET; pause(); return; }
    if (fromId == toId) { cout << RED << "  Cannot transfer to same account.\n" << RESET; pause(); return; }

    cout << GREEN << "  Amount to transfer: " << WHITE;
    double amount; cin >> amount;
    if (amount <= 0 || amount > from->balance) {
        cout << RED << "  Invalid amount or insufficient balance.\n" << RESET; pause(); return;
    }

    from->balance -= amount;
    to->balance   += amount;
    from->txns->push("Transfer out to #" + to_string(toId), amount, from->balance);
    to->txns->push("Transfer in from #" + to_string(fromId), amount, to->balance);

    cout << CYAN << "  ✔  Transfer successful!\n";
    cout << GREEN << "  " << from->name << " new balance: " << YELLOW << fixed << setprecision(2) << from->balance << "\n";
    cout << GREEN << "  " << to->name   << " new balance: " << YELLOW << to->balance << RESET << "\n";
    pause();
}

void deleteAccount() {
    printHeader(" DELETE ACCOUNT ");
    cout << GREEN << "  Enter Account ID to delete: " << WHITE;
    int id; cin >> id;
    Account* acc = accounts.find(id);
    if (!acc) { cout << RED << "  Account not found.\n" << RESET; pause(); return; }

    cout << YELLOW << "  Confirm delete account of " << acc->name << "? (y/n): " << WHITE;
    char c; cin >> c;
    if (c == 'y' || c == 'Y') {
        accounts.remove(id);
        cout << CYAN << "  ✔  Account #" << id << " deleted.\n" << RESET;
    } else {
        cout << YELLOW << "  Cancelled.\n" << RESET;
    }
    pause();
}

void listAllAccounts() {
    printHeader(" ALL ACCOUNTS ");
    auto all = accounts.all();
    if (all.empty()) { cout << RED << "  No accounts found.\n" << RESET; pause(); return; }

    // Sort by ID using simple insertion sort (DSA demo)
    for (int i = 1; i < (int)all.size(); i++) {
        Account* key = all[i];
        int j = i - 1;
        while (j >= 0 && all[j]->id > key->id) { all[j+1] = all[j]; j--; }
        all[j+1] = key;
    }

    cout << GREEN << "  " << left << setw(8) << "ID"
         << setw(22) << "Name"
         << setw(12) << "Type"
         << setw(14) << "Balance"
         << "Status\n";
    cout << "  " << string(60, '-') << "\n";
    for (auto acc : all) {
        cout << "  " << setw(8) << acc->id
             << setw(22) << acc->name
             << setw(12) << acc->type
             << setw(14) << fixed << setprecision(2) << acc->balance
             << (acc->active ? CYAN"Active" : RED"Inactive") << RESET << "\n";
    }
    cout << GREEN << "\n  Total accounts: " << YELLOW << all.size() << RESET << "\n";
    pause();
}

void searchAccount() {
    printHeader(" SEARCH ACCOUNT ");
    cout << GREEN << "  Search by name (partial match): " << WHITE;
    clearInput();
    string query; getline(cin, query);
    transform(query.begin(), query.end(), query.begin(), ::tolower);

    auto all = accounts.all();
    bool found = false;
    for (auto acc : all) {
        string lname = acc->name;
        transform(lname.begin(), lname.end(), lname.begin(), ::tolower);
        if (lname.find(query) != string::npos) {
            cout << GREEN << "  ID: " << YELLOW << acc->id
                 << GREEN << "  Name: " << WHITE << acc->name
                 << GREEN << "  Balance: " << YELLOW << fixed << setprecision(2) << acc->balance
                 << RESET << "\n";
            found = true;
        }
    }
    if (!found) cout << RED << "  No matching accounts found.\n" << RESET;
    pause();
}

// ─── ATM Panel ─────────────────────────────────────────────────────────────
void atmPanel() {
    printHeader("    ATM SERVICE    ");
    cout << GREEN << "  Enter Account ID: " << WHITE;
    int id; cin >> id;
    Account* acc = accounts.find(id);
    if (!acc) { cout << RED << "  Account not found.\n" << RESET; pause(); return; }

    cout << GREEN << "  Enter PIN: " << WHITE;
    string pin; cin >> pin;
    if (pin != acc->pin) { cout << RED << "  Incorrect PIN.\n" << RESET; pause(); return; }

    int choice;
    do {
        cout << "\n";
        printLine();
        cout << GREEN << "*" << CYAN << BOLD
             << "   Welcome, " << left << setw(38) << acc->name
             << GREEN << "*\n" << RESET;
        printLine();
        cout << GREEN
             << "*   1. Check Balance                  *\n"
             << "*   2. Deposit                        *\n"
             << "*   3. Withdraw                       *\n"
             << "*   4. Mini Statement (last 5 txns)   *\n"
             << "*   5. Exit ATM                       *\n";
        printLine();
        cout << GREEN << "  Enter choice: " << WHITE;
        cin >> choice;

        if (choice == 1) {
            cout << CYAN << "\n  Balance: " << YELLOW << fixed << setprecision(2) << acc->balance << RESET << "\n";
            pause();
        } else if (choice == 2) {
            cout << GREEN << "  Amount to deposit: " << WHITE;
            double amt; cin >> amt;
            if (amt > 0) {
                acc->balance += amt;
                acc->txns->push("ATM Deposit", amt, acc->balance);
                cout << CYAN << "  ✔  New balance: " << YELLOW << acc->balance << RESET << "\n";
            } else cout << RED << "  Invalid amount.\n" << RESET;
            pause();
        } else if (choice == 3) {
            cout << GREEN << "  Amount to withdraw: " << WHITE;
            double amt; cin >> amt;
            if (amt > 0 && amt <= acc->balance) {
                acc->balance -= amt;
                acc->txns->push("ATM Withdrawal", amt, acc->balance);
                cout << CYAN << "  ✔  Dispensing cash. New balance: " << YELLOW << acc->balance << RESET << "\n";
            } else cout << RED << "  Invalid or insufficient amount.\n" << RESET;
            pause();
        } else if (choice == 4) {
            cout << GREEN << "\n  Last 5 transactions:\n";
            printLine('-', 40);
            Transaction* cur = acc->txns->head;
            int shown = 0;
            while (cur && shown < 5) {
                cout << GREEN << "  " << left << setw(20) << cur->date
                     << setw(16) << cur->type
                     << YELLOW << fixed << setprecision(2) << cur->amount << RESET << "\n";
                cur = cur->next; shown++;
            }
            pause();
        }
    } while (choice != 5);
}

// ─── Login helpers ─────────────────────────────────────────────────────────
bool adminLogin() {
    printHeader("    ADMIN LOGIN    ");
    cout << GREEN << "  Password: " << WHITE;
    string p; cin >> p;
    if (p == ADMIN_PASS) { cout << CYAN << "  ✔  Admin access granted.\n" << RESET; return true; }
    cout << RED << "  Incorrect password.\n" << RESET; pause(); return false;
}

bool staffLogin() {
    printHeader("    STAFF LOGIN    ");
    cout << GREEN << "  Password: " << WHITE;
    string p; cin >> p;
    if (p == STAFF_PASS) { cout << CYAN << "  ✔  Staff access granted.\n" << RESET; return true; }
    cout << RED << "  Incorrect password.\n" << RESET; pause(); return false;
}

// ─── Menus ─────────────────────────────────────────────────────────────────
void adminMenu() {
    if (!adminLogin()) return;
    int choice;
    do {
        cout << "\n";
        printLine();
        cout << GREEN
             << "*        ADMIN PANEL                  *\n"
             << "*   1. Create Account                 *\n"
             << "*   2. View Account                   *\n"
             << "*   3. Delete Account                 *\n"
             << "*   4. List All Accounts              *\n"
             << "*   5. Search Account by Name         *\n"
             << "*   6. Deposit                        *\n"
             << "*   7. Withdraw                       *\n"
             << "*   8. Fund Transfer                  *\n"
             << "*   9. Back to Main Menu              *\n";
        printLine();
        cout << GREEN << "  Enter choice: " << WHITE;
        cin >> choice;
        switch (choice) {
            case 1: createAccount();   break;
            case 2: viewAccount();     break;
            case 3: deleteAccount();   break;
            case 4: listAllAccounts(); break;
            case 5: searchAccount();   break;
            case 6: deposit();         break;
            case 7: withdraw();        break;
            case 8: transfer();        break;
        }
    } while (choice != 9);
}

void staffMenu() {
    if (!staffLogin()) return;
    int choice;
    do {
        cout << "\n";
        printLine();
        cout << GREEN
             << "*        STAFF PANEL                  *\n"
             << "*   1. View Account                   *\n"
             << "*   2. List All Accounts              *\n"
             << "*   3. Search Account by Name         *\n"
             << "*   4. Deposit                        *\n"
             << "*   5. Withdraw                       *\n"
             << "*   6. Fund Transfer                  *\n"
             << "*   7. Back to Main Menu              *\n";
        printLine();
        cout << GREEN << "  Enter choice: " << WHITE;
        cin >> choice;
        switch (choice) {
            case 1: viewAccount();     break;
            case 2: listAllAccounts(); break;
            case 3: searchAccount();   break;
            case 4: deposit();         break;
            case 5: withdraw();        break;
            case 6: transfer();        break;
        }
    } while (choice != 7);
}

// ─── Main ──────────────────────────────────────────────────────────────────
int main() {
    // Seed with sample accounts
    Account* a1 = new Account(nextId++, "Alice Johnson", "1234", "Savings", 15000);
    Account* a2 = new Account(nextId++, "Bob Smith",     "5678", "Current", 32000);
    Account* a3 = new Account(nextId++, "Carol White",   "9012", "Savings", 8500);
    accounts.insert(a1); accounts.insert(a2); accounts.insert(a3);
    a1->txns->push("Initial salary", 5000, 15000);
    a2->txns->push("Business credit", 10000, 32000);

    int choice;
    do {
        banner();
        printLine();
        cout << GREEN
             << "*         LOGIN  PANEL                *\n"
             << "*   1. Admin Login                    *\n"
             << "*   2. Staff Login                    *\n"
             << "*   3. ATM Service                    *\n"
             << "*   4. Exit                           *\n";
        printLine();
        cout << GREEN << "  Enter Your Choice : " << WHITE;
        cin >> choice;
        switch (choice) {
            case 1: adminMenu(); break;
            case 2: staffMenu(); break;
            case 3: atmPanel();  break;
            case 4: cout << CYAN << "\n  Thank you for using Bank Management System. Goodbye!\n\n" << RESET; break;
            default: cout << RED << "  Invalid choice.\n" << RESET;
        }
    } while (choice != 4);

    return 0;
}
