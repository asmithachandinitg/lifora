import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class ExportService {

  private base = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  private headers() {
    const token = localStorage.getItem('token');
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }

  // ── CSV Helper ─────────────────────────────────────────────

  private downloadCSV(filename: string, rows: string[][]): void {
    const csv = rows.map(r =>
      r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.triggerDownload(blob, filename);
  }

  private downloadJSON(filename: string, data: any): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    this.triggerDownload(blob, filename);
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── 1. Finance CSV ─────────────────────────────────────────
  // Pass in the records already filtered for the month,
  // plus the categories array for name lookup.

  exportFinanceCSV(
    records: any[],
    categories: any[],
    monthLabel: string
  ): void {
    const catName = (id: string) =>
      categories.find(c => c.id === id || c._id === id)?.name || id;

    const rows: string[][] = [
      ['Date', 'Type', 'Category', 'Amount', 'Note', 'Account']
    ];

    records
      .slice()
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
      .forEach(r => {
        rows.push([
          new Date(r.datetime).toLocaleDateString('en-GB'),
          r.type,
          catName(r.category),
          r.amount.toString(),
          r.note || '',
          r.account || ''
        ]);
      });

    // Summary rows at bottom
    const expenses = records.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
    const income   = records.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);
    rows.push([]);
    rows.push(['Summary', '', '', '', '', '']);
    rows.push(['Total Income',  '', '', income.toFixed(2),   '', '']);
    rows.push(['Total Expense', '', '', expenses.toFixed(2), '', '']);
    rows.push(['Net',           '', '', (income - expenses).toFixed(2), '', '']);

    const safe = monthLabel.replace(/\s/g, '_');
    this.downloadCSV(`lifora_finance_${safe}.csv`, rows);
  }

  // ── 2. Fitness CSV ─────────────────────────────────────────

  exportFitnessCSV(entries: any[]): void {
    const rows: string[][] = [
      ['Date', 'Title', 'Category', 'Duration (min)', 'Calories Burned', 'Steps', 'Notes']
    ];

    entries
      .slice()
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(e => {
        rows.push([
          new Date(e.date).toLocaleDateString('en-GB'),
          e.title || '',
          e.category || '',
          e.duration?.toString() || '0',
          e.caloriesBurned?.toString() || '0',
          e.steps?.toString() || '0',
          e.notes || ''
        ]);
      });

    // Summary
    const totalCal = entries.reduce((s, e) => s + (e.caloriesBurned || 0), 0);
    const totalMin = entries.reduce((s, e) => s + (e.duration || 0), 0);
    rows.push([]);
    rows.push(['Summary', '', '', '', '', '', '']);
    rows.push(['Total Workouts',  entries.length.toString(), '', '', '', '', '']);
    rows.push(['Total Minutes',   totalMin.toString(),       '', '', '', '', '']);
    rows.push(['Total Calories',  totalCal.toString(),       '', '', '', '', '']);

    const today = new Date().toISOString().split('T')[0];
    this.downloadCSV(`lifora_fitness_${today}.csv`, rows);
  }

  // ── 3. Full Data Backup (JSON) ─────────────────────────────

  exportFullBackup(): void {
    forkJoin({
      expenses:  this.http.get(`${this.base}/expenses`,  this.headers()).pipe(catchError(() => of([]))),
      fitness:   this.http.get(`${this.base}/fitness`,   this.headers()).pipe(catchError(() => of([]))),
      habits:    this.http.get(`${this.base}/habits`,    this.headers()).pipe(catchError(() => of([]))),
      mood:      this.http.get(`${this.base}/mood`,      this.headers()).pipe(catchError(() => of([]))),
      goals:     this.http.get(`${this.base}/goals`,     this.headers()).pipe(catchError(() => of([]))),
      diary:     this.http.get(`${this.base}/diary`,     this.headers()).pipe(catchError(() => of([]))),
      tasks:     this.http.get(`${this.base}/tasks`,     this.headers()).pipe(catchError(() => of([]))),
      food:      this.http.get(`${this.base}/food`,      this.headers()).pipe(catchError(() => of([]))),
      sleep:     this.http.get(`${this.base}/sleep`,     this.headers()).pipe(catchError(() => of([]))),
    }).subscribe(data => {
      const backup = {
        exportedAt: new Date().toISOString(),
        version:    '1.0',
        app:        'Lifora',
        data
      };
      const today = new Date().toISOString().split('T')[0];
      this.downloadJSON(`lifora_backup_${today}.json`, backup);
    });
  }

  // ── 4. Monthly PDF Summary ─────────────────────────────────

  exportMonthlyPDF(
    monthLabel:  string,
    records:     any[],
    categories:  any[],
    workouts:    any[],
    habits:      any[],
    moods:       any[]
  ): void {
    const month = new Date();
    const y = month.getFullYear();
    const m = month.getMonth();

    // Finance
    const monthRecords  = records.filter(r => {
      const d = new Date(r.datetime);
      return d.getMonth() === m && d.getFullYear() === y;
    });
    const totalExpense  = monthRecords.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0);
    const totalIncome   = monthRecords.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0);

    // Fitness
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 30);
    const monthWorkouts = workouts.filter(w => new Date(w.date) >= weekAgo);
    const totalCal      = monthWorkouts.reduce((s, w) => s + (w.caloriesBurned || 0), 0);
    const totalMin      = monthWorkouts.reduce((s, w) => s + (w.duration || 0), 0);

    // Habits
    const todayStr = new Date().toISOString().split('T')[0];
    const completedToday = habits.filter(h =>
      h.completions?.some((c: any) => c.date === todayStr && c.completed)
    ).length;

    // Mood counts
    const moodCounts: Record<string, number> = {};
    moods.forEach(entry => {
      if (entry.mood) moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

    // Category breakdown
    const catName = (id: string) =>
      categories.find(c => c.id === id || c._id === id)?.name || id;
    const catTotals: Record<string, number> = {};
    monthRecords.filter(r => r.type === 'expense').forEach(r => {
      catTotals[catName(r.category)] = (catTotals[catName(r.category)] || 0) + r.amount;
    });
    const catRows = Object.entries(catTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, amt]) => `
        <tr>
          <td>${name}</td>
          <td style="text-align:right;font-weight:600;">₹${amt.toFixed(2)}</td>
          <td style="text-align:right;color:#6b7280;">${totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0}%</td>
        </tr>`).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Lifora — ${monthLabel} Summary</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; color: #1f2937; padding: 40px; background: #fff; }
    .header { text-align: center; margin-bottom: 36px; padding-bottom: 20px; border-bottom: 2px solid #f3f4f6; }
    .header h1 { font-size: 28px; color: #8B5CF6; font-weight: 800; }
    .header p  { color: var(--text-muted); margin-top: 6px; font-size: 14px; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 16px; font-weight: 700; color: #374151; margin-bottom: 14px;
                  padding-bottom: 8px; border-bottom: 1px solid #f3f4f6; display: flex; align-items: center; gap: 8px; }
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
    .stat-box { background: #f9fafb; border-radius: 12px; padding: 16px; text-align: center; }
    .stat-box .val { font-size: 24px; font-weight: 800; color: var(--text); }
    .stat-box .lbl { font-size: 12px; color: var(--text-sub); margin-top: 4px; }
    .stat-box.green .val { color: #10b981; }
    .stat-box.red   .val { color: #ef4444; }
    .stat-box.purple .val { color: #8B5CF6; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #f9fafb; padding: 10px 12px; text-align: left; font-weight: 600; color: var(--text-muted); }
    td { padding: 10px 12px; border-bottom: 1px solid #f9fafb; }
    tr:last-child td { border-bottom: none; }
    .footer { text-align: center; margin-top: 40px; color: var(--text-sub); font-size: 12px; border-top: 1px solid #f3f4f6; padding-top: 16px; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>

  <div class="header">
    <h1>📊 Lifora Monthly Report</h1>
    <p>${monthLabel} &nbsp;·&nbsp; Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </div>

  <!-- Finance Section -->
  <div class="section">
    <h2>💰 Finance Overview</h2>
    <div class="stats-row">
      <div class="stat-box green">
        <div class="val">₹${totalIncome.toFixed(0)}</div>
        <div class="lbl">Total Income</div>
      </div>
      <div class="stat-box red">
        <div class="val">₹${totalExpense.toFixed(0)}</div>
        <div class="lbl">Total Expense</div>
      </div>
      <div class="stat-box ${totalIncome - totalExpense >= 0 ? 'green' : 'red'}">
        <div class="val">₹${(totalIncome - totalExpense).toFixed(0)}</div>
        <div class="lbl">Net Savings</div>
      </div>
    </div>
    ${catRows ? `
    <table>
      <thead><tr><th>Category</th><th style="text-align:right">Amount</th><th style="text-align:right">% of Spend</th></tr></thead>
      <tbody>${catRows}</tbody>
    </table>` : '<p style="color:#9ca3af;font-size:13px;">No expense records this month.</p>'}
  </div>

  <!-- Fitness Section -->
  <div class="section">
    <h2>💪 Fitness Overview</h2>
    <div class="stats-row">
      <div class="stat-box purple">
        <div class="val">${monthWorkouts.length}</div>
        <div class="lbl">Workouts (30 days)</div>
      </div>
      <div class="stat-box">
        <div class="val">${Math.round(totalMin / 60)}h ${totalMin % 60}m</div>
        <div class="lbl">Total Time</div>
      </div>
      <div class="stat-box red">
        <div class="val">${totalCal.toLocaleString()}</div>
        <div class="lbl">Calories Burned</div>
      </div>
    </div>
  </div>

  <!-- Habits Section -->
  <div class="section">
    <h2>🔁 Habits</h2>
    <div class="stats-row">
      <div class="stat-box purple">
        <div class="val">${habits.length}</div>
        <div class="lbl">Active Habits</div>
      </div>
      <div class="stat-box green">
        <div class="val">${completedToday}/${habits.length}</div>
        <div class="lbl">Completed Today</div>
      </div>
      <div class="stat-box">
        <div class="val">${Math.max(...habits.map((h: any) => h.currentStreak || 0), 0)}d</div>
        <div class="lbl">Best Streak</div>
      </div>
    </div>
  </div>

  <!-- Mood Section -->
  <div class="section">
    <h2>😊 Mood Log</h2>
    <div class="stats-row">
      <div class="stat-box">
        <div class="val">${moods.length}</div>
        <div class="lbl">Total Logs</div>
      </div>
      <div class="stat-box">
        <div class="val">${topMood ? topMood[0] : '—'}</div>
        <div class="lbl">Most Common</div>
      </div>
      <div class="stat-box">
        <div class="val">${Object.keys(moodCounts).length}</div>
        <div class="lbl">Moods Expressed</div>
      </div>
    </div>
  </div>

  <div class="footer">Generated by Lifora &nbsp;·&nbsp; Your personal life management app</div>

  <script>window.onload = () => window.print();</script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  }
}
