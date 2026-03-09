import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AppNotification {
  id: string;
  module: string;
  icon: string;
  iconColor: string;
  title: string;
  body: string;
  route: string;
  time: Date;
  read: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private api = environment.apiUrl;
  private _notifications = new BehaviorSubject<AppNotification[]>([]);
  notifications$ = this._notifications.asObservable();

  private dismissedIds = new Set<string>();
  private readIds      = new Set<string>();
  private refreshInterval: any;

  constructor(private http: HttpClient) {}

  get unreadCount(): number {
    return this._notifications.value.filter(n => !n.read).length;
  }

  get all(): AppNotification[] {
    return this._notifications.value;
  }

  // Call on login / app init
  async start() {
    await this.loadState();
    await this.refresh();
    this.refreshInterval = setInterval(() => this.refresh(), 30 * 60 * 1000);
  }

  stop() {
    clearInterval(this.refreshInterval);
  }

  // Load dismissed/read state from backend
  private async loadState() {
    try {
      const state: any = await this.http.get(`${this.api}/notifications`).toPromise();
      this.dismissedIds = new Set(state.dismissed || []);
      this.readIds      = new Set(state.read || []);
    } catch {
      this.dismissedIds = new Set();
      this.readIds      = new Set();
    }
  }

  markRead(id: string) {
    this.readIds.add(id);
    this.updateList();
    this.http.put(`${this.api}/notifications/read/${id}`, {}).subscribe();
  }

  markAllRead() {
    const ids = this._notifications.value.map(n => n.id);
    ids.forEach(id => this.readIds.add(id));
    this.updateList();
    this.http.put(`${this.api}/notifications/read-all`, { ids }).subscribe();
  }

  dismiss(id: string) {
    this.dismissedIds.add(id);
    this.updateList();
    this.http.put(`${this.api}/notifications/dismiss/${id}`, {}).subscribe();
  }

  dismissAll() {
    this._notifications.value.forEach(n => this.dismissedIds.add(n.id));
    this._notifications.next([]);
    this.http.delete(`${this.api}/notifications/dismiss-all`).subscribe();
  }

  private updateList() {
    const updated = this._notifications.value
      .filter(n => !this.dismissedIds.has(n.id))
      .map(n => ({ ...n, read: this.readIds.has(n.id) }));
    this._notifications.next(updated);
  }

  async refresh() {
    const notes: AppNotification[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = this.toDateStr(new Date());

    const results = await Promise.allSettled([
      this.checkHabits(todayStr),
      this.checkTasks(today),
      this.checkGoals(today),
      this.checkMedicine(todayStr),
      this.checkReading(today),
      this.checkFinance(),
      this.checkTravel(today),
      this.checkPeriod(today, todayStr),
      this.checkPregnancy(todayStr),
    ]);

    results.forEach(r => {
      if (r.status === 'fulfilled') notes.push(...r.value);
    });

    // Filter out dismissed, apply read state
    const filtered = notes
      .filter(n => !this.dismissedIds.has(n.id))
      .map(n => ({ ...n, read: this.readIds.has(n.id) }))
      .sort((a, b) => Number(a.read) - Number(b.read)); // unread first

    this._notifications.next(filtered);
  }

  // ── HABITS ──────────────────────────────────────────────────
  private async checkHabits(todayStr: string): Promise<AppNotification[]> {
    const habits: any[] = await this.get('/habits');
    const incomplete = habits.filter(h => {
      if (h.frequency !== 'daily') return false;
      return !h.completions?.some((c: any) => c.date === todayStr && c.completed);
    });
    if (!incomplete.length) return [];
    return [this.note(
      'habit-incomplete-today', 'Habits', 'repeat', '#8B5CF6',
      `${incomplete.length} habit${incomplete.length > 1 ? 's' : ''} pending today`,
      incomplete.length === 1
        ? `"${incomplete[0].name}" is not done yet`
        : `Including: ${incomplete.slice(0, 2).map((h: any) => h.name).join(', ')}${incomplete.length > 2 ? '...' : ''}`,
      '/habits'
    )];
  }

  // ── TASKS ────────────────────────────────────────────────────
  private async checkTasks(today: Date): Promise<AppNotification[]> {
    const tasks: any[] = await this.get('/tasks');
    const pending = tasks.filter(t => t.status === 'pending' && t.dueDate);
    const notes: AppNotification[] = [];

    const dueToday = pending.filter(t => {
      const d = new Date(t.dueDate); d.setHours(0,0,0,0);
      return d.getTime() === today.getTime();
    });
    const overdue = pending.filter(t => {
      const d = new Date(t.dueDate); d.setHours(0,0,0,0);
      return d.getTime() < today.getTime();
    });

    if (dueToday.length) notes.push(this.note(
      'tasks-due-today', 'Tasks', 'check_circle', '#f97316',
      `${dueToday.length} task${dueToday.length > 1 ? 's' : ''} due today`,
      dueToday.length === 1 ? `"${dueToday[0].title}" is due today`
        : `${dueToday.map((t: any) => t.title).slice(0,2).join(', ')}${dueToday.length > 2 ? '...' : ''}`,
      '/tasks'
    ));

    if (overdue.length) notes.push(this.note(
      'tasks-overdue', 'Tasks', 'warning', '#ef4444',
      `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`,
      overdue.length === 1 ? `"${overdue[0].title}" is past due` : `${overdue.length} tasks are past their due date`,
      '/tasks'
    ));

    return notes;
  }

  // ── GOALS ────────────────────────────────────────────────────
  private async checkGoals(today: Date): Promise<AppNotification[]> {
    const goals: any[] = await this.get('/goals');
    const notes: AppNotification[] = [];

    goals.filter(g => g.status !== 'completed' && g.deadline).forEach(g => {
      const deadline = new Date(g.deadline); deadline.setHours(0,0,0,0);
      const daysLeft = Math.round((deadline.getTime() - today.getTime()) / 86400000);
      if (daysLeft < 0 || daysLeft > 30) return;

      let body = '';
      if (daysLeft === 0)      body = `Deadline is today! Currently at ${g.progress}% progress`;
      else if (daysLeft <= 3)  body = `Only ${daysLeft} day${daysLeft > 1 ? 's' : ''} left — at ${g.progress}% progress`;
      else if (daysLeft <= 7)  body = `${daysLeft} days left — push to ${g.progress < 80 ? 'make more progress' : 'finish strong'}`;
      else                     body = `${daysLeft} days remaining — currently at ${g.progress}%`;

      notes.push(this.note(`goal-${g._id}-${daysLeft}d`, 'Goals', 'flag', '#10b981', `Goal: ${g.title}`, body, '/goals'));
    });

    return notes;
  }

  // ── MEDICINE ─────────────────────────────────────────────────
  private async checkMedicine(todayStr: string): Promise<AppNotification[]> {
    const [medicines, logs]: [any[], any[]] = await Promise.all([
      this.get('/medicine'),
      this.get('/medicine/logs')
    ]);
    const notes: AppNotification[] = [];
    const active = medicines.filter(m => m.status === 'active');

    const notTaken = active.filter(m => !logs.some((l: any) =>
      l.medicineId === m._id && this.toDateStr(new Date(l.takenAt)) === todayStr
    ));
    if (notTaken.length) notes.push(this.note(
      `medicine-reminder-${todayStr}`, 'Medicine', 'medication', '#6366f1',
      'Medicine reminder',
      notTaken.length === 1 ? `Take "${notTaken[0].name}" today` : `${notTaken.length} medicines to take today`,
      '/medicine'
    ));

    active.filter(m => m.stock <= m.lowStockThreshold && m.stock > 0).forEach(m => {
      notes.push(this.note(
        `medicine-lowstock-${m._id}`, 'Medicine', 'inventory_2', '#f59e0b',
        `Low stock: ${m.name}`, `Only ${m.stock} doses remaining — time to refill`, '/medicine'
      ));
    });

    return notes;
  }

  // ── READING ──────────────────────────────────────────────────
  private async checkReading(today: Date): Promise<AppNotification[]> {
    const books: any[] = await this.get('/reading');
    const notes: AppNotification[] = [];

    books.filter(b => b.status === 'reading' && b.endDate).forEach(b => {
      const deadline = new Date(b.endDate); deadline.setHours(0,0,0,0);
      const daysLeft = Math.round((deadline.getTime() - today.getTime()) / 86400000);
      if (daysLeft === 0) notes.push(this.note(
        `reading-deadline-${b._id}`, 'Reading', 'auto_stories', '#3b82f6',
        'Reading deadline today', `"${b.title}" — ${b.pagesRead}/${b.pagesTotal} pages read`, '/reading'
      ));
      else if (daysLeft === 3) notes.push(this.note(
        `reading-3days-${b._id}`, 'Reading', 'auto_stories', '#3b82f6',
        '3 days left to finish', `"${b.title}" — ${b.pagesTotal - b.pagesRead} pages remaining`, '/reading'
      ));
    });

    return notes;
  }

  // ── FINANCE ──────────────────────────────────────────────────
  private async checkFinance(): Promise<AppNotification[]> {
    const status: any[] = await this.get('/expenses/budgets/status');
    return status
      .filter((s: any) => s.spent > s.limit && s.limit > 0)
      .map(s => this.note(
        `finance-overbudget-${s.categoryId}`, 'Finance', 'account_balance_wallet', '#ef4444',
        `Over budget: ${s.categoryName || s.categoryId}`,
        `Spent ₹${Number(s.spent).toFixed(0)} of ₹${Number(s.limit).toFixed(0)} — ₹${(s.spent - s.limit).toFixed(0)} over`,
        '/expenses'
      ));
  }

  // ── TRAVEL ───────────────────────────────────────────────────
  private async checkTravel(today: Date): Promise<AppNotification[]> {
    const trips: any[] = await this.get('/travel');
    const notes: AppNotification[] = [];

    trips.forEach(trip => {
      if (!trip.startDate || trip.status === 'completed') return;
      const start = new Date(trip.startDate); start.setHours(0,0,0,0);
      const daysUntil = Math.round((start.getTime() - today.getTime()) / 86400000);

      if      (daysUntil === 3) notes.push(this.note(`travel-3days-${trip._id}`, 'Travel', 'flight_takeoff', '#06b6d4', `Trip in 3 days: ${trip.name}`, `Heading to ${trip.destination} on ${this.formatDate(trip.startDate)}`, '/travel'));
      else if (daysUntil === 2) notes.push(this.note(`travel-2days-${trip._id}`, 'Travel', 'flight_takeoff', '#06b6d4', `Trip in 2 days: ${trip.name}`, `Don't forget to finish packing for ${trip.destination}`, '/travel'));
      else if (daysUntil === 1) notes.push(this.note(`travel-1day-${trip._id}`,  'Travel', 'flight_takeoff', '#06b6d4', `Trip tomorrow: ${trip.name}`, `Final checks! Heading to ${trip.destination}`, '/travel'));
      else if (daysUntil === 0) notes.push(this.note(`travel-today-${trip._id}`, 'Travel', 'flight_takeoff', '#06b6d4', `Today's the day! ✈️ ${trip.name}`, `Day 1 of your trip to ${trip.destination}. Have a great journey!`, '/travel'));

      if (trip.status === 'ongoing') {
        const dayNum = Math.round((today.getTime() - start.getTime()) / 86400000) + 1;
        if (dayNum > 0) notes.push(this.note(
          `travel-ongoing-${trip._id}-day${dayNum}`, 'Travel', 'luggage', '#06b6d4',
          `Day ${dayNum}: ${trip.name}`, `You're in ${trip.destination}. Enjoy day ${dayNum}! 🌍`, '/travel'
        ));
      }
    });

    return notes;
  }

  // ── PERIOD ───────────────────────────────────────────────────
  private async checkPeriod(today: Date, todayStr: string): Promise<AppNotification[]> {
    const entries: any[] = await this.get('/period');
    if (!entries?.length) return [];
    const notes: AppNotification[] = [];

    const sorted = [...entries].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    const latest = sorted[0];
    const cycleLength = latest.cycleLength || 28;
    const nextStart = new Date(latest.startDate);
    nextStart.setHours(0,0,0,0);
    nextStart.setDate(nextStart.getDate() + cycleLength);
    const daysUntil = Math.round((nextStart.getTime() - today.getTime()) / 86400000);

    if      (daysUntil === 3) notes.push(this.note(`period-3days-${todayStr}`, 'Period', 'water_drop', '#f43f5e', 'Period expected in 3 days', 'Your next cycle is approaching — be prepared', '/period'));
    else if (daysUntil === 2) notes.push(this.note(`period-2days-${todayStr}`, 'Period', 'water_drop', '#f43f5e', 'Period expected in 2 days', 'Stock up on essentials and take care of yourself', '/period'));
    else if (daysUntil === 1) notes.push(this.note(`period-1day-${todayStr}`,  'Period', 'water_drop', '#f43f5e', 'Period expected tomorrow', 'Your cycle starts tomorrow — get ready', '/period'));

    const activePeriod = sorted.find(e => !e.endDate);
    if (activePeriod) {
      try {
        const symptoms: any[] = await this.get('/daily-symptoms');
        if (!symptoms.some((s: any) => s.date === todayStr)) {
          notes.push(this.note(`period-symptoms-${todayStr}`, 'Period', 'edit_note', '#f43f5e', "Log today's symptoms", "You have an active period — track how you're feeling today", '/period'));
        }
      } catch {}
    }

    return notes;
  }

  // ── PREGNANCY ────────────────────────────────────────────────
  private async checkPregnancy(todayStr: string): Promise<AppNotification[]> {
    try {
      const profile: any = await this.get('/pregnancy/profile');
      if (!profile?.dueDate) return [];
      const entries: any[] = await this.get('/pregnancy');
      if (entries.some((e: any) => e.date === todayStr)) return [];
      return [this.note(
        `pregnancy-log-${todayStr}`, 'Pregnancy', 'child_care', '#ec4899',
        "Log today's pregnancy update",
        'Track your weight, baby movements, and symptoms for today',
        '/pregnancy'
      )];
    } catch { return []; }
  }

  // ── Helpers ──────────────────────────────────────────────────
  private note(id: string, module: string, icon: string, iconColor: string, title: string, body: string, route: string): AppNotification {
    return { id, module, icon, iconColor, title, body, route, time: new Date(), read: false };
  }

  private get(path: string): Promise<any> {
    return this.http.get(`${this.api}${path}`).toPromise();
  }

  private toDateStr(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  private formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  }
}
