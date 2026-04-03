import { Component, OnInit, AfterViewChecked, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Habit, HabitWithStats, HabitCategory, HabitFrequency,
  WeeklyStats, MonthlyStats
} from './habits.model';
import { HabitService } from './habits.service';
import { ModuleLinkService } from '../../shared/module-link.service';

declare var d3: any;

@Component({
  selector: 'app-habit',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './habits.component.html',
  styleUrls: ['./habits.component.css']
})
export class HabitsComponent implements OnInit, AfterViewChecked {

  activeTab: 'today' | 'calendar' | 'stats' = 'today';
  showModal = false;
  showDeleteConfirm = false;
  habitToDelete: string | null = null;
  editMode = false;
  editingId: string | null = null;
  loading = false;
  error = '';
  selectedHabitForCalendar: HabitWithStats | null = null;
  selectedMonth: Date = new Date();
  statsView: 'weekly' | 'monthly' = 'weekly';

  habits: HabitWithStats[] = [];
  weeklyStats: WeeklyStats[] = [];
  monthlyStats: MonthlyStats[] = [];

  today = new Date().toISOString().split('T')[0];
  formError = '';

  private lastTab = '';
  private lastHabitsLen = -1;

  form = this.getEmptyForm();

  categoryConfig: Record<HabitCategory, { label: string; icon: string; color: string }> = {
    health:       { label: 'Health',       icon: 'favorite',         color: '#ef4444' },
    fitness:      { label: 'Fitness',      icon: 'fitness_center',   color: '#06b6d4' },
    mindfulness:  { label: 'Mindfulness',  icon: 'self_improvement', color: '#8B5CF6' },
    work:         { label: 'Work',         icon: 'work',             color: '#f59e0b' },
    personal:     { label: 'Personal',     icon: 'person',           color: '#ec4899' },
    social:       { label: 'Social',       icon: 'people',           color: '#14b8a6' },
    finance:      { label: 'Finance',      icon: 'savings',          color: '#10b981' },
    learning:     { label: 'Learning',     icon: 'menu_book',        color: '#6366f1' }
  };

  categories: HabitCategory[] = ['health', 'fitness', 'mindfulness', 'work', 'personal', 'social', 'finance', 'learning'];

  iconOptions = [
    'favorite', 'fitness_center', 'self_improvement', 'savings', 'menu_book',
    'water_drop', 'bedtime', 'directions_run', 'restaurant', 'work',
    'people', 'person', 'code', 'brush', 'music_note',
    'language', 'bolt', 'star', 'local_fire_department', 'psychology'
  ];

  linkedGoalId:    string | null = null;
linkedGoalTitle: string | null = null;

  constructor(
    private habitService: HabitService,
    private moduleLinkService: ModuleLinkService,
    private el: ElementRef
  ) { }

ngOnInit() {
  this.loadHabits();

  const goalLink = this.moduleLinkService.consumeGoalLink();
  if (goalLink) {
    this.linkedGoalId    = goalLink.goalId;
    this.linkedGoalTitle = goalLink.goalTitle;
    // Pre-fill form with goal context and open modal
    this.form = {
      ...this.getEmptyForm(),
      category: goalLink.category as HabitCategory,
    };
    this.formError = '';
    this.editMode  = false;
    this.editingId = null;
    this.showModal = true;
  }
}

clearGoalLink() {
  this.linkedGoalId    = null;
  this.linkedGoalTitle = null;
}

ngAfterViewChecked() {
  const changed = this.activeTab !== this.lastTab || this.habits.length !== this.lastHabitsLen;
  if (changed && this.activeTab === 'stats') {
    this.lastTab = this.activeTab;
    this.lastHabitsLen = this.habits.length;
    this.prepareStatsData();
    setTimeout(() => this.drawStatsChart(), 100);
  }
}

  loadHabits() {
    this.loading = true;
    this.habitService.getHabits().subscribe({
      next: (data) => {
        this.habits = data.map(h => this.enrichHabit(h));
        this.loading = false;
        if (!this.selectedHabitForCalendar && this.habits.length)
          this.selectedHabitForCalendar = this.habits[0];
      },
      error: () => { this.error = 'Failed to load habits.'; this.loading = false; }
    });
  }

  // ── Enrich habit with computed stats ──────────────────────

  enrichHabit(h: Habit): HabitWithStats {
    const completedToday = h.completions?.some(
      c => c.date === this.today && c.completed
    ) ?? false;

    const completionRate = this.calcCompletionRate(h);

    return {
      ...h,
      completions: h.completions || [],
      completedToday,
      completionRate,
      currentStreak: h.currentStreak || 0,
      longestStreak: h.longestStreak || 0
    };
  }

  calcCompletionRate(h: Habit): number {
    const today = new Date();
    const created = new Date(h.createdAt || today);
    const start = new Date(Math.max(created.getTime(), today.getTime() - 30 * 24 * 60 * 60 * 1000));
    const days = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const startStr = start.toISOString().split('T')[0];
    const completed = (h.completions || []).filter(c => c.completed && c.date >= startStr).length;
    return Math.round((completed / days) * 100);
  }

  // ── Grouping ───────────────────────────────────────────────

  get groupedHabits(): { category: HabitCategory; habits: HabitWithStats[] }[] {
    const groups: Partial<Record<HabitCategory, HabitWithStats[]>> = {};
    this.habits.forEach(h => {
      if (!groups[h.category]) groups[h.category] = [];
      groups[h.category]!.push(h);
    });
    return this.categories
      .filter(c => groups[c]?.length)
      .map(c => ({ category: c, habits: groups[c]! }));
  }

  get todayCompletion(): number {
    if (!this.habits.length) return 0;
    const done = this.habits.filter(h => h.completedToday).length;
    return Math.round((done / this.habits.length) * 100);
  }

  get completedToday(): number { return this.habits.filter(h => h.completedToday).length; }

  get bestStreak(): number {
    return this.habits.length ? Math.max(...this.habits.map(h => h.currentStreak)) : 0;
  }

  // ── Toggle ─────────────────────────────────────────────────

  toggleHabit(habit: HabitWithStats) {
    const newVal = !habit.completedToday;
    this.habitService.toggleLog(habit._id!, this.today, newVal).subscribe({
      next: (updated) => {
        const idx = this.habits.findIndex(h => h._id === habit._id);
        if (idx > -1) this.habits[idx] = this.enrichHabit(updated);
      },
      error: () => {}
    });
  }

  // Toggle completion for any past or current date (used in calendar)
  toggleHabitOnDate(habit: HabitWithStats, dateStr: string) {
    if (dateStr > this.today) return;
    const currentlyCompleted = habit.completions?.some(c => c.date === dateStr && c.completed) ?? false;
    this.habitService.toggleLog(habit._id!, dateStr, !currentlyCompleted).subscribe({
      next: (updated) => {
        const idx = this.habits.findIndex(h => h._id === habit._id);
        if (idx > -1) {
          this.habits[idx] = this.enrichHabit(updated);
          if (this.selectedHabitForCalendar?._id === habit._id) {
            this.selectedHabitForCalendar = this.habits[idx];
          }
        }
      },
      error: () => {}
    });
  }

  // ── Calendar ───────────────────────────────────────────────

  selectHabitForCalendar(habit: HabitWithStats) {
    this.selectedHabitForCalendar = habit;
  }

  getCalendarData(habit: HabitWithStats): MonthlyStats[] {
    const year = this.selectedMonth.getFullYear();
    const month = this.selectedMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: MonthlyStats[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const comp = habit.completions?.find(c => c.date === dateStr);
      const d = new Date(year, month, day);
      result.push({
        date: dateStr,
        day,
        completed: comp?.completed ? 1 : 0,
        total: 1,
        isToday: dateStr === this.today,
        isFuture: dateStr > this.today,
        weekday: d.getDay()
      });
    }
    return result;
  }

  get calendarEmptyOffset(): number[] {
    const data = this.selectedHabitForCalendar
      ? this.getCalendarData(this.selectedHabitForCalendar)
      : [];
    return new Array(data[0]?.weekday || 0);
  }

  prevMonth() {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() - 1, 1);
  }

  nextMonth() {
    const next = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 1);
    if (next <= new Date()) this.selectedMonth = next;
  }

  get selectedMonthLabel(): string {
    return this.selectedMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' });
  }

  get isCurrentMonth(): boolean {
    const now = new Date();
    return this.selectedMonth.getMonth() === now.getMonth() &&
           this.selectedMonth.getFullYear() === now.getFullYear();
  }

  // ── Stats ──────────────────────────────────────────────────

  prepareStatsData() {
    this.weeklyStats = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const completed = this.habits.filter(h =>
        h.completions?.some(c => c.date === dateStr && c.completed)
      ).length;
      this.weeklyStats.push({
        label: d.toLocaleDateString('en', { weekday: 'short' }),
        date: dateStr,
        completed,
        total: this.habits.length
      });
    }

    const year = this.selectedMonth.getFullYear();
    const month = this.selectedMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    this.monthlyStats = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const completed = this.habits.filter(h =>
        h.completions?.some(c => c.date === dateStr && c.completed)
      ).length;
      const d = new Date(year, month, day);
      this.monthlyStats.push({
        date: dateStr, day,
        completed,
        total: this.habits.length,
        isToday: dateStr === this.today,
        isFuture: dateStr > this.today,
        weekday: d.getDay()
      });
    }
  }

  drawStatsChart() {
    if (typeof d3 === 'undefined') return;
    if (this.statsView === 'weekly') this.drawWeeklyStatsChart();
    else this.drawMonthlyStatsChart();
  }

  drawWeeklyStatsChart() {
    const container = this.el.nativeElement.querySelector('#habit-weekly-chart');
    if (!container) return;
    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth || 600;
    const height = 240;
    const m = { top: 30, right: 20, bottom: 40, left: 50 };
    const iW = width - m.left - m.right;
    const iH = height - m.top - m.bottom;

    const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const x = d3.scaleBand().domain(this.weeklyStats.map(d => d.label)).range([0, iW]).padding(0.35);
    const y = d3.scaleLinear().domain([0, Math.max(this.habits.length, 1)]).range([iH, 0]);

    g.append('g').call(d3.axisLeft(y).ticks(4).tickSize(-iW).tickFormat(''))
      .selectAll('line').attr('stroke', '#f3f4f6').attr('stroke-dasharray', '3,3');
    g.selectAll('.domain').remove();

    g.append('g').attr('transform', `translate(0,${iH})`)
      .call(d3.axisBottom(x))
      .call((ax: any) => ax.select('.domain').attr('stroke', '#e5e7eb'))
      .selectAll('text').attr('font-size', '12px').attr('fill', '#9ca3af');

    g.append('g').call(d3.axisLeft(y).ticks(4).tickFormat((d: number) => `${d}`))
      .call((ax: any) => ax.select('.domain').remove())
      .selectAll('text').attr('font-size', '11px').attr('fill', '#9ca3af');

    this.weeklyStats.forEach(d => {
      if (d.completed > 0) {
        g.append('rect')
          .attr('x', x(d.label) ?? 0)
          .attr('y', y(d.completed))
          .attr('width', x.bandwidth())
          .attr('height', iH - y(d.completed))
          .attr('fill', '#8B5CF6')
          .attr('rx', 6).attr('opacity', 0.85);

        g.append('text')
          .attr('x', (x(d.label) ?? 0) + x.bandwidth() / 2)
          .attr('y', y(d.completed) - 8)
          .attr('text-anchor', 'middle')
          .attr('font-size', '12px').attr('font-weight', '700').attr('fill', '#374151')
          .text(d.completed);
      } else {
        g.append('rect')
          .attr('x', x(d.label) ?? 0).attr('y', iH - 4)
          .attr('width', x.bandwidth()).attr('height', 4)
          .attr('fill', '#e5e7eb').attr('rx', 4);
      }
    });
  }

  drawMonthlyStatsChart() {
    const container = this.el.nativeElement.querySelector('#habit-monthly-chart');
    if (!container) return;
    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth || 600;
    const cellSize = Math.min(Math.floor((width - 40) / 7), 54);
    const gap = 5;
    const firstWeekday = this.monthlyStats[0]?.weekday || 0;
    const totalCells = firstWeekday + this.monthlyStats.length;
    const rows = Math.ceil(totalCells / 7);
    const height = 34 + rows * (cellSize + gap) + 10;

    const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);
    const g = svg.append('g').attr('transform', 'translate(20,30)');

    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach((day, i) => {
      g.append('text')
        .attr('x', i * (cellSize + gap) + cellSize / 2).attr('y', -12)
        .attr('text-anchor', 'middle').attr('font-size', '11px').attr('fill', '#9ca3af')
        .text(day);
    });

    this.monthlyStats.forEach((d, idx) => {
      const col = (firstWeekday + idx) % 7;
      const row = Math.floor((firstWeekday + idx) / 7);
      const cx = col * (cellSize + gap);
      const cy = row * (cellSize + gap);

      const pct = d.total > 0 ? d.completed / d.total : 0;
      const fill = d.isFuture ? '#f9fafb'
        : pct === 0 ? '#f3f4f6'
        : pct < 0.5 ? 'rgba(139,92,246,0.4)'
        : pct < 1 ? 'rgba(139,92,246,0.7)'
        : '#8B5CF6';

      g.append('rect')
        .attr('x', cx).attr('y', cy)
        .attr('width', cellSize).attr('height', cellSize)
        .attr('rx', 8).attr('fill', fill)
        .attr('stroke', d.isToday ? '#6d28d9' : 'transparent')
        .attr('stroke-width', 2);

      g.append('text')
        .attr('x', cx + 7).attr('y', cy + 15)
        .attr('font-size', '11px')
        .attr('font-weight', d.isToday ? '700' : '400')
        .attr('fill', pct > 0 && !d.isFuture ? '#fff' : d.isFuture ? '#d1d5db' : '#9ca3af')
        .text(d.day);

      if (!d.isFuture && d.completed > 0) {
        g.append('text')
          .attr('x', cx + cellSize / 2).attr('y', cy + cellSize / 2 + 8)
          .attr('text-anchor', 'middle').attr('font-size', '12px')
          .attr('font-weight', '700').attr('fill', '#fff')
          .text(`${d.completed}/${d.total}`);
      }
    });
  }

  // ── Form ───────────────────────────────────────────────────

  getEmptyForm() {
    return {
      name: '',
      description: '',
      category: 'health' as HabitCategory,
      icon: 'favorite',
      frequency: 'daily' as HabitFrequency,
      color: '#8B5CF6',
      notes: '',
      deadline: ''
    };
  }

  openModal() {
    this.form = this.getEmptyForm();
    this.formError = '';
    this.editMode = false;
    this.editingId = null;
    this.showModal = true;
  }

  openEditModal(habit: HabitWithStats) {
    this.form = {
      name: habit.name,
      description: habit.description || '',
      category: habit.category,
      icon: habit.icon,
      frequency: habit.frequency,
      color: habit.color,
      notes: habit.notes || '',
      deadline: habit.deadline || ''
    };
    this.editingId = habit._id!;
    this.editMode = true;
    this.formError = '';
    this.showModal = true;
  }

closeModal() {
  this.showModal  = false;
  this.editMode   = false;
  this.editingId  = null;
  this.clearGoalLink(); 
}
  saveHabit() {
    if (!this.form.name.trim()) { this.formError = 'Habit name is required.'; return; }

    const payload: Partial<Habit> = {
      name: this.form.name.trim(),
      description: this.form.description,
      category: this.form.category,
      icon: this.form.icon,
      frequency: this.form.frequency,
      color: this.form.color,
      notes: this.form.notes,
      deadline: this.form.deadline || null,
        linkedGoalId:    this.linkedGoalId    || undefined,
  linkedGoalTitle: this.linkedGoalTitle || undefined,
    };

    if (this.editMode && this.editingId) {
      this.habitService.updateHabit(this.editingId, payload).subscribe({
        next: (updated) => {
          const idx = this.habits.findIndex(h => h._id === this.editingId);
          if (idx > -1) this.habits[idx] = this.enrichHabit(updated);
          this.closeModal();
        },
        error: () => { this.formError = 'Failed to update.'; }
      });
    } else {
      this.habitService.createHabit(payload).subscribe({
        next: () => { this.loadHabits(); this.closeModal(); this.clearGoalLink(); },
        error: () => { this.formError = 'Failed to save.'; }
      });
    }
  }

  confirmDelete(id: string) { this.habitToDelete = id; this.showDeleteConfirm = true; }

  deleteHabit() {
    if (!this.habitToDelete) return;
    this.habitService.deleteHabit(this.habitToDelete).subscribe({
      next: () => {
        this.habits = this.habits.filter(h => h._id !== this.habitToDelete);
        this.showDeleteConfirm = false;
        this.habitToDelete = null;
      },
      error: () => {}
    });
  }

  // ── Helpers ────────────────────────────────────────────────

  getCatColor(cat: HabitCategory): string { return this.categoryConfig[cat].color; }
  getCatIcon(cat: HabitCategory): string  { return this.categoryConfig[cat].icon; }
  getCatLabel(cat: HabitCategory): string { return this.categoryConfig[cat].label; }
  trackById(_: number, h: Habit) { return h._id; }

  onStatsTabClick() {
  this.activeTab = 'stats';
  this.prepareStatsData();
  setTimeout(() => this.drawStatsChart(), 200);
}
}