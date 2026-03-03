import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from './expenses.service';

interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'expense' | 'income';
  budget: number;
}

interface Record {
  _id?: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  note: string;
  datetime: Date;
}

interface Account {
  _id?: string;
  id: string;
  name: string;
  icon: string;
  balance: number;
}

interface DayGroup {
  dateLabel: string;
  dateKey: string;
  records: Record[];
  dayTotal: number;
}

interface CategoryStat {
  id: string;
  name: string;
  icon: string;
  color: string;
  total: number;
  percentage: number;
}

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent implements OnInit {

  constructor(
    private expenseService: ExpenseService
  ) { }

  activeTab = 'records';

  // Current month state
  viewDate: Date = new Date();
  budgetAlerts: any[] = [];
  allRecords: Record[] = [];

  allCategories: Category[] = [
    { id: 'food', name: 'Food & Dining', icon: '🍔', type: 'expense', budget: 0 },
    { id: 'transport', name: 'Transport', icon: '🚗', type: 'expense', budget: 0 },
    { id: 'shopping', name: 'Shopping', icon: '🛍️', type: 'expense', budget: 0 },
    { id: 'health', name: 'Health', icon: '💊', type: 'expense', budget: 0 },
    { id: 'entertainment', name: 'Entertainment', icon: '🎬', type: 'expense', budget: 0 },
    { id: 'bills', name: 'Bills & Utilities', icon: '💡', type: 'expense', budget: 0 },
    { id: 'education', name: 'Education', icon: '📚', type: 'expense', budget: 0 },
    { id: 'travel', name: 'Travel', icon: '✈️', type: 'expense', budget: 0 },
    { id: 'salary', name: 'Salary', icon: '💰', type: 'income', budget: 0 },
    { id: 'freelance', name: 'Freelance', icon: '💻', type: 'income', budget: 0 },
    { id: 'investment', name: 'Investment', icon: '📈', type: 'income', budget: 0 },
    { id: 'others', name: 'Others', icon: '📦', type: 'expense', budget: 0 },
  ];

  categoryColors: string[] = [
    '#f97316', '#3b82f6', '#ec4899', '#22c55e',
    '#a855f7', '#eab308', '#06b6d4', '#14b8a6',
    '#f43f5e', '#8b5cf6', '#10b981', '#9ca3af'
  ];

  availableIcons = [
    '🍔', '🍕', '☕', '🍜', '🚗', '🚌', '✈️', '🛍️',
    '💊', '🏥', '🎬', '🎮', '🎵', '💡', '📱', '💻',
    '📚', '🏠', '💰', '📈', '🎁', '⚽', '🌿', '💅',
    '🐾', '👶', '🏋️', '🛒', '🎓', '💍', '🧴', '📦'
  ];

  // Modals
  showAddRecord = false;
  showBudgetModal = false;
  showAddCategory = false;
  confirmModal = false;

  // Snackbar
  snackbar: { show: boolean, message: string, type: 'warning' | 'danger' | 'info' } = { show: false, message: '', type: 'warning' };
  private snackTimer: any;

  selectedBudgetCat: Category | null = null;
  budgetLimit = 0;
  selectedRecord: Record | null = null;

  // Add record form
  recordForm = {
    type: 'expense' as 'expense' | 'income',
    category: '',
    account: '',
    note: '',
    date: '',
    time: ''
  };
  recordErrors: any = {};

  // New category form
  newCategory = { name: '', icon: '📦', type: 'expense' as 'expense' | 'income' };
  catErrors: any = {};

  // Accounts
  allAccounts: Account[] = [
    { id: 'cash', name: 'Cash', icon: '💵', balance: 0 },
    { id: 'bank', name: 'Bank Account', icon: '🏦', balance: 0 },
  ];
  showAccountModal = false;
  editAccountMode = false;
  selectedAccountIndex = -1;
  accountForm = { name: '', icon: '💵', balance: 0 };
  accountErrors: any = {};

  accountIcons = [
    '💵', '🏦', '💳', '👛', '💰', '🏧', '📱', '🪙',
    '💴', '💶', '💷', '🏪', '🏬', '💹', '📊', '🤑'
  ];

  // Calculator state
  calcDisplay = '0';
  calcExpression = '';
  private calcFirstNum = '';
  private calcOperatorVal = '';
  private calcNewNum = true;

  get todayStr(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  get currentMonthLabel(): string {
    return this.viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  get isCurrentMonth(): boolean {
    const now = new Date();
    return this.viewDate.getMonth() === now.getMonth() &&
      this.viewDate.getFullYear() === now.getFullYear();
  }

  get monthRecords(): Record[] {
    return this.allRecords.filter(r => {
      const d = new Date(r.datetime);
      return d.getMonth() === this.viewDate.getMonth() &&
        d.getFullYear() === this.viewDate.getFullYear();
    });
  }

  get monthExpense(): number {
    return this.monthRecords
      .filter(r => r.type === 'expense')
      .reduce((sum, r) => sum + r.amount, 0);
  }

  get monthIncome(): number {
    return this.monthRecords
      .filter(r => r.type === 'income')
      .reduce((sum, r) => sum + r.amount, 0);
  }

  get monthTotal(): number {
    return this.monthIncome - this.monthExpense;
  }

  get groupedRecords(): DayGroup[] {
    const groups: { [key: string]: Record[] } = {};

    this.monthRecords
      .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
      .forEach(r => {
        const d = new Date(r.datetime);
        const key = d.toDateString();
        if (!groups[key]) groups[key] = [];
        groups[key].push(r);
      });

    return Object.entries(groups).map(([key, records]) => {
      const d = new Date(key);
      const dayTotal = records.reduce((sum, r) =>
        r.type === 'income' ? sum + r.amount : sum - r.amount, 0);
      return {
        dateLabel: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', weekday: 'long' }),
        dateKey: key,
        records,
        dayTotal
      };
    });
  }

  get filteredCategories(): Category[] {
    return this.allCategories.filter(c => c.type === this.recordForm.type);
  }

  get categoryStats(): CategoryStat[] {
    const expenseRecords = this.monthRecords.filter(r => r.type === 'expense');
    const totals: { [key: string]: number } = {};

    expenseRecords.forEach(r => {
      totals[r.category] = (totals[r.category] || 0) + r.amount;
    });

    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    if (total === 0) return [];

    return Object.entries(totals)
      .map(([id, amount], i) => {
        const cat = this.allCategories.find(c => c.id === id);
        return {
          id,
          name: cat?.name || id,
          icon: cat?.icon || '📦',
          color: this.categoryColors[i % this.categoryColors.length],
          total: amount,
          percentage: Math.round((amount / total) * 100)
        };
      })
      .sort((a, b) => b.total - a.total);
  }

  getBudgetUsedPercent(cat: CategoryStat): number {
    const catFull = this.allCategories.find(c => c.id === cat.id);
    if (!catFull || !catFull.budget || catFull.budget === 0) return 100;
    const pct = Math.round((cat.total / catFull.budget) * 100);
    return pct > 100 ? 100 : pct;
  }

  ngOnInit() {
    this.viewDate = new Date();
    this.loadAll();
     this.loadBudgetAlerts(); 
  }

  loadBudgetAlerts() {
  this.expenseService.getBudgetStatus().subscribe({
    next: (statuses) => {
      // Only show warning and danger level alerts on load
      this.budgetAlerts = statuses.filter((s: any) => s.level !== 'ok');
    },
    error: () => {}
  });
}

dismissAlert(categoryId: string) {
  this.budgetAlerts = this.budgetAlerts.filter(a => a.categoryId !== categoryId);
}

  loadAll() {
    const now = new Date();
    this.recordForm.date = this.todayStr;
    this.recordForm.time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    this.expenseService.getExpenses().subscribe({
      next: (data) => { this.allRecords = data; },
      error: (err) => console.error('Expenses error:', err)
    });

    this.expenseService.getAccounts().subscribe({
      next: (data) => {
        this.allAccounts = data.map((a: any) => ({ ...a, id: a._id }));
      },
      error: (err) => console.error('Accounts error:', err)
    });

    // Load budgets and apply to categories
    this.expenseService.getBudgets().subscribe({
      next: (budgets) => {
        budgets.forEach((b: any) => {
          const cat = this.allCategories.find(c => c.id === b.categoryId);
          if (cat) cat.budget = b.limit;
        });
      },
      error: (err) => console.error('Budgets error:', err)
    });

    this.expenseService.getCategories().subscribe({
      next: (data) => {
        if (data.length > 0) {
          // Merge custom categories from DB with defaults
          data.forEach((cat: any) => {
            if (!this.allCategories.find(c => c.id === cat._id)) {
              this.allCategories.push({ id: cat._id, name: cat.name, icon: cat.icon, type: cat.type, budget: cat.budget });
            }
          });
        }
      },
      error: (err) => console.error('Categories error:', err)
    });
  }

  prevMonth() {
    const d = new Date(this.viewDate);
    d.setMonth(d.getMonth() - 1);
    this.viewDate = d;
  }

  nextMonth() {
    if (this.isCurrentMonth) return;
    const d = new Date(this.viewDate);
    d.setMonth(d.getMonth() + 1);
    this.viewDate = d;
  }

  getCategoryIcon(id: string): string {
    return this.allCategories.find(c => c.id === id)?.icon || '📦';
  }

  getCategoryName(id: string): string {
    return this.allCategories.find(c => c.id === id)?.name || id;
  }

  getCategorySpent(id: string): number {
    return this.monthRecords
      .filter(r => r.type === 'expense' && r.category === id)
      .reduce((sum, r) => sum + r.amount, 0);
  }

  getBudgetPercent(cat: Category): number {
    if (!cat.budget) return 0;
    return Math.min(Math.round((this.getCategorySpent(cat.id) / cat.budget) * 100), 100);
  }

  // Add Record
  openAddRecord() {
    const now = new Date();
    this.recordForm = {
      type: 'expense',
      category: '',
      account: '',
      note: '',
      date: this.todayStr,
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    };
    this.recordErrors = {};
    this.calcClear();
    this.showAddRecord = true;
  }

  closeAddRecord() {
    this.showAddRecord = false;
  }

  saveRecord() {
    this.recordErrors = {};
    const amount = parseFloat(this.calcDisplay);

    if (!amount || amount <= 0) {
      this.recordErrors.amount = 'Please enter a valid amount';
      return;
    }
    if (!this.recordForm.category) {
      this.recordErrors.category = 'Please select a category';
      return;
    }
    if (!this.recordForm.account) {
      this.recordErrors.account = 'Please select an account';
      return;
    }

    const dateStr = `${this.recordForm.date}T${this.recordForm.time || '00:00'}`;
    const payload = {
      type: this.recordForm.type,
      amount,
      category: this.recordForm.category,
      account: this.recordForm.account,
      note: this.recordForm.note,
      datetime: new Date(dateStr)
    };
    
    this.expenseService.createExpense(payload).subscribe({
  next: (res: any) => {
    const created = res.expense;
    this.allRecords.unshift(created);

    // Update local account balance
    const acc = this.allAccounts.find(a => a.id === this.recordForm.account || a._id === this.recordForm.account);
    if (acc) {
      acc.balance = this.recordForm.type === 'expense'
        ? acc.balance - amount
        : acc.balance + amount;
    }
    this.closeAddRecord();

    // Budget alert from backend
    if (res.budgetAlert) {
      const { level, message } = res.budgetAlert;
      const icon = level === 'danger' ? '🚨' : '⚠️';
      this.showSnackMessage(`${icon} ${message}`, level);
    }
  },
  error: (err) => console.error(err)
});
  }

  confirmDeleteRecord(record: Record) {
    this.selectedRecord = record;
    this.confirmModal = true;
  }

  closeConfirm() {
    this.confirmModal = false;
    this.selectedRecord = null;
  }

  confirmAction() {
    if (this.selectedRecord && this.selectedRecord._id) {
      this.expenseService.deleteExpense(this.selectedRecord._id).subscribe(() => {
        this.allRecords = this.allRecords.filter(r => r._id !== this.selectedRecord!._id);
        this.closeConfirm();
      });
    } else if (this.selectedAccountIndex >= 0) {
      const acc = this.allAccounts[this.selectedAccountIndex];
      if (acc._id || acc.id) {
        const id = acc._id || acc.id;
        this.expenseService.deleteAccount(id).subscribe(() => {
          this.allAccounts.splice(this.selectedAccountIndex, 1);
          this.selectedAccountIndex = -1;
          this.closeConfirm();
        });
      } else {
        this.allAccounts.splice(this.selectedAccountIndex, 1);
        this.selectedAccountIndex = -1;
        this.closeConfirm();
      }
    } else {
      this.closeConfirm();
    }
  }

  // Snackbar
  showSnackMessage(message: string, type: 'warning' | 'danger' | 'info' = 'warning') {
    if (this.snackTimer) clearTimeout(this.snackTimer);
    this.snackbar = { show: true, message, type };
    this.snackTimer = setTimeout(() => {
      this.snackbar.show = false;
    }, 4000);
  }

  // Budget
  openBudgetModal(cat: Category) {
    this.selectedBudgetCat = cat;
    this.budgetLimit = cat.budget;
    this.showBudgetModal = true;
  }

  closeBudgetModal() {
    this.showBudgetModal = false;
    this.selectedBudgetCat = null;
  }

  saveBudget() {
    if (!this.selectedBudgetCat) return;
    const cat = this.allCategories.find(c => c.id === this.selectedBudgetCat!.id);
    if (!cat) return;

    const oldBudget = cat.budget;

    // Always save to DB using the Budget model (works for default + custom categories)
    this.expenseService.setBudget(cat.id, this.budgetLimit).subscribe({
      next: () => {
        cat.budget = this.budgetLimit;

        // Check current spend vs new budget
        const spent = this.getCategorySpent(cat.id);
        if (this.budgetLimit > 0 && spent > this.budgetLimit) {
          this.showSnackMessage(`🚨 Already over budget for ${cat.name}! Spent: ${spent.toFixed(0)}, Budget: ${this.budgetLimit}`, 'danger');
        } else {
          this.showSnackMessage(`✅ Budget set for ${cat.name}: ${this.budgetLimit}`, 'info');
        }

        this.closeBudgetModal();
      },
      error: (err) => {
        cat.budget = oldBudget;
        console.error('Budget save error:', err);
        this.showSnackMessage('❌ Failed to save budget. Try again.', 'danger');
      }
    });
  }

  // Categories
  openAddCategory() {
    this.newCategory = { name: '', icon: '📦', type: 'expense' };
    this.catErrors = {};
    this.showAddCategory = true;
  }

  closeAddCategory() {
    this.showAddCategory = false;
  }

  saveCategory() {
    this.catErrors = {};
    if (!this.newCategory.name.trim()) {
      this.catErrors.name = 'Name is required';
      return;
    }
    const payload = { name: this.newCategory.name, icon: this.newCategory.icon, type: this.newCategory.type, budget: 0 };
    this.expenseService.createCategory(payload).subscribe({
      next: (created) => {
        this.allCategories.push({ id: created._id, name: created.name, icon: created.icon, type: created.type, budget: created.budget });
        this.closeAddCategory();
      },
      error: (err) => console.error(err)
    });
  }

  // Pie chart CSS gradient - returns SafeStyle compatible string
  getPieGradient(): { [key: string]: string } {
    if (this.categoryStats.length === 0) return {};
    let cumulative = 0;
    const parts = this.categoryStats.map(cat => {
      const start = cumulative;
      cumulative += cat.percentage;
      return `${cat.color} ${start}% ${cumulative}%`;
    });
    const gradient = `conic-gradient(${parts.join(', ')})`;
    return { 'background': gradient };
  }

  // ===== CALCULATOR =====
  calcNumber(num: string) {
    if (this.calcNewNum) {
      this.calcDisplay = num;
      this.calcNewNum = false;
    } else {
      this.calcDisplay = this.calcDisplay === '0' ? num : this.calcDisplay + num;
    }
  }

  calcDecimal() {
    if (this.calcNewNum) {
      this.calcDisplay = '0.';
      this.calcNewNum = false;
      return;
    }
    if (!this.calcDisplay.includes('.')) {
      this.calcDisplay += '.';
    }
  }

  calcOperator(op: string) {
    this.calcFirstNum = this.calcDisplay;
    this.calcOperatorVal = op;
    this.calcExpression = `${this.calcDisplay} ${op}`;
    this.calcNewNum = true;
  }

  calcEquals() {
    if (!this.calcFirstNum || !this.calcOperatorVal) return;
    const a = parseFloat(this.calcFirstNum);
    const b = parseFloat(this.calcDisplay);
    let result = 0;
    switch (this.calcOperatorVal) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '×': result = a * b; break;
      case '÷': result = b !== 0 ? a / b : 0; break;
    }
    this.calcExpression = `${this.calcFirstNum} ${this.calcOperatorVal} ${b} =`;
    this.calcDisplay = parseFloat(result.toFixed(2)).toString();
    this.calcFirstNum = '';
    this.calcOperatorVal = '';
    this.calcNewNum = true;
  }

  calcClear() {
    this.calcDisplay = '0';
    this.calcExpression = '';
    this.calcFirstNum = '';
    this.calcOperatorVal = '';
    this.calcNewNum = true;
  }

  calcBackspace() {
    if (this.calcDisplay.length > 1) {
      this.calcDisplay = this.calcDisplay.slice(0, -1);
    } else {
      this.calcDisplay = '0';
      this.calcNewNum = true;
    }
  }

  // ===== ACCOUNTS =====
  openAddAccount() {
    this.editAccountMode = false;
    this.accountForm = { name: '', icon: '💵', balance: 0 };
    this.accountErrors = {};
    this.showAccountModal = true;
  }

  openEditAccount(acc: Account, index: number) {
    this.editAccountMode = true;
    this.selectedAccountIndex = index;
    this.accountForm = { name: acc.name, icon: acc.icon, balance: acc.balance };
    this.accountErrors = {};
    this.showAccountModal = true;
  }

  closeAccountModal() {
    this.showAccountModal = false;
    this.editAccountMode = false;
    this.selectedAccountIndex = -1;
  }

  saveAccount() {
    this.accountErrors = {};
    if (!this.accountForm.name.trim()) {
      this.accountErrors.name = 'Name is required';
      return;
    }
    const payload = { name: this.accountForm.name, icon: this.accountForm.icon, balance: this.accountForm.balance };

    if (this.editAccountMode && this.selectedAccountIndex >= 0) {
      const acc = this.allAccounts[this.selectedAccountIndex];
      const id = acc._id || acc.id;
      this.expenseService.updateAccount(id, payload).subscribe({
        next: (updated) => {
          this.allAccounts[this.selectedAccountIndex] = updated;
          this.closeAccountModal();
        },
        error: (err) => console.error(err)
      });
    } else {
      this.expenseService.createAccount(payload).subscribe({
        next: (created) => {
          this.allAccounts.push(created);
          this.closeAccountModal();
        },
        error: (err) => console.error(err)
      });
    }
  }

  confirmDeleteAccount(acc: Account, index: number) {
    this.selectedRecord = null;
    this.selectedAccountIndex = index;
    this.confirmModal = true;
  }

  getAccountName(id: string): string {
    return this.allAccounts.find(a => a.id === id)?.name || '';
  }

  getAccountIcon(id: string): string {
    return this.allAccounts.find(a => a.id === id)?.icon || '';
  }

  calcPercent() {
    this.calcDisplay = (parseFloat(this.calcDisplay) / 100).toString();
  }
}
