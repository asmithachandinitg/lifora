import { Component, OnInit, AfterViewChecked, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  WorkoutEntry, FitnessCategory, Exercise, PersonalRecord,
  DailyChartPoint, WeeklyChartPoint, MonthlyChartPoint
} from './fitness.model';
import { FitnessService } from './fitness.service';
import { AuthService } from '../../core/auth/auth.service';
import { MoodService } from '../mood/mood.service';

declare var d3: any;

@Component({
  selector: 'app-fitness',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fitness.component.html',
  styleUrls: ['./fitness.component.css']
})
export class FitnessComponent implements OnInit, AfterViewChecked {

  activeTab: 'dashboard' | 'history' | 'records' = 'dashboard';
  chartView: 'daily' | 'weekly' | 'monthly' = 'weekly';
  showModal = false;
  showDeleteConfirm = false;
  entryToDelete: string | null = null;
  editMode = false;
  editingId: string | null = null;
  loading = false;
  error = '';
  showMoodPrompt = false;
  postWorkoutMood = '';
  postWorkoutNote = '';
  postWorkoutTitle = '';
  entries: WorkoutEntry[] = [];
  personalRecords: PersonalRecord[] = [];

  formError = '';
  today = new Date().toISOString().split('T')[0];

  private lastChartView = '';
  private lastEntriesLen = -1;
  private lastTab = '';

  private userWeight = 70;
  private userHeight = 170;

  private metMap: Record<FitnessCategory, number> = {
    cardio: 7.0,
    strength: 5.0,
    flexibility: 2.5,
    sports: 6.0
  };

  categoryConfig: Record<FitnessCategory, { label: string; icon: string; color: string }> = {
    cardio: { label: 'Cardio', icon: 'directions_run', color: '#ef4444' },
    strength: { label: 'Strength', icon: 'fitness_center', color: '#8B5CF6' },
    flexibility: { label: 'Flexibility', icon: 'self_improvement', color: '#06b6d4' },
    sports: { label: 'Sports', icon: 'sports_basketball', color: '#f59e0b' }
  };

  categories: FitnessCategory[] = ['cardio', 'strength', 'flexibility', 'sports'];

  dailyData: DailyChartPoint[] = [];
  weeklyData: WeeklyChartPoint[] = [];
  monthlyData: MonthlyChartPoint[] = [];
  selectedMonth: Date = new Date();

  // ── form MUST be after metMap ──────────────────────────────
  form = this.getEmptyForm();
  moodOptions = [
    { value: 'great', emoji: '😄', label: 'Great', color: '#22c55e' },
    { value: 'good', emoji: '🙂', label: 'Good', color: '#84cc16' },
    { value: 'okay', emoji: '😐', label: 'Okay', color: '#f59e0b' },
    { value: 'sad', emoji: '😢', label: 'Sad', color: '#3b82f6' },
    { value: 'angry', emoji: '😡', label: 'Angry', color: '#ef4444' },
  ];

  moodScaleDefaults: Record<string, number> = {
    great: 9, good: 7, okay: 5, sad: 3, angry: 2
  };

  constructor(
    private fitnessService: FitnessService,
    private moodService: MoodService,
    private el: ElementRef,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.loadWorkouts();
    this.loadUserStats();
  }

  ngAfterViewChecked() {
    const changed = this.chartView !== this.lastChartView ||
      this.entries.length !== this.lastEntriesLen ||
      this.activeTab !== this.lastTab;
    if (this.activeTab === 'dashboard' && changed) {
      this.lastChartView = this.chartView;
      this.lastEntriesLen = this.entries.length;
      this.lastTab = this.activeTab;
      this.prepareChartData();
      setTimeout(() => this.drawChart(), 80);
    }
  }

  // ── User Stats ─────────────────────────────────────────────

  loadUserStats() {
    this.authService.loadUser().subscribe({
      next: (user) => {
        this.userWeight = user?.weight || 70;
        this.userHeight = user?.height || 170;
      },
      error: () => {
        this.userWeight = 70;
        this.userHeight = 170;
      }
    });
  }

  // ── Workouts ───────────────────────────────────────────────

  loadWorkouts() {
    this.loading = true;
    this.fitnessService.getWorkouts().subscribe({
      next: (data) => {
        this.entries = data;
        this.loading = false;
        this.prepareChartData();
        setTimeout(() => this.drawChart(), 150);
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load workouts.';
        this.loading = false;
      }
    });
  }

  loadPersonalRecords() {
    this.fitnessService.getPersonalRecords().subscribe({
      next: (data) => this.personalRecords = data,
      error: (err) => console.error(err)
    });
  }

  onTabChange(tab: 'dashboard' | 'history' | 'records') {
    this.activeTab = tab;
    if (tab === 'records') this.loadPersonalRecords();
    if (tab === 'dashboard') setTimeout(() => this.drawChart(), 150);
  }

  setChartView(view: 'daily' | 'weekly' | 'monthly') {
    this.chartView = view;
    this.prepareChartData();
    setTimeout(() => this.drawChart(), 80);
  }

  // ── Chart Data ─────────────────────────────────────────────

  prepareChartData() {
    this.prepareDailyData();
    this.prepareWeeklyData();
    this.prepareMonthlyData();
  }

  prepareDailyData() {
    const todayStr = this.today;
    this.dailyData = this.entries
      .filter(e => e.date.slice(0, 10) === todayStr)
      .map(e => ({
        hour: e.workoutTime || '08:00',
        duration: e.duration,
        category: e.category,
        title: e.title
      }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }

  prepareWeeklyData() {
    const sorted = [...this.entries].sort((a, b) => b.date.localeCompare(a.date));
    this.weeklyData = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const workouts = sorted.filter(e => e.date.slice(0, 10) === dateStr);
      const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
      const totalCalories = workouts.reduce(
        (sum, w) => sum + (w.caloriesBurned || 0) + (w.stepsCalories || 0), 0
      );

      const categoryDurations: Partial<Record<FitnessCategory, number>> = {};
      workouts.forEach(w => {
        categoryDurations[w.category] = (categoryDurations[w.category] || 0) + w.duration;
      });

      this.weeklyData.push({
        date: dateStr,
        label: d.toLocaleDateString('en', { weekday: 'short' }),
        duration: totalDuration,
        calories: totalCalories,
        category: workouts.length ? workouts[0].category : 'cardio',
        categoryDurations,
        hasWorkout: workouts.length > 0
      });
    }
  }

  prepareMonthlyData() {
    const year = this.selectedMonth.getFullYear();
    const month = this.selectedMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = this.today;
    this.monthlyData = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const found = this.entries.filter(e => e.date.slice(0, 10) === dateStr);
      const d = new Date(year, month, day);
      this.monthlyData.push({
        date: dateStr,
        day,
        duration: found.reduce((s, e) => s + e.duration, 0),
        calories: found.reduce((s, e) => s + e.caloriesBurned + (e.stepsCalories || 0), 0),
        hasWorkout: found.length > 0,
        isToday: dateStr === todayStr,
        isFuture: dateStr > todayStr,
        weekday: d.getDay()
      });
    }
  }

  // ── D3 Drawing ─────────────────────────────────────────────

  drawChart() {
    if (typeof d3 === 'undefined') return;
    if (this.chartView === 'daily') this.drawDailyChart();
    if (this.chartView === 'weekly') this.drawWeeklyChart();
    if (this.chartView === 'monthly') this.drawMonthlyChart();
  }

  drawDailyChart() {
    const container = this.el.nativeElement.querySelector('#daily-chart');
    if (!container) return;
    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth || 600;
    const height = 240;
    const m = { top: 20, right: 20, bottom: 55, left: 50 };
    const iW = width - m.left - m.right;
    const iH = height - m.top - m.bottom;

    const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    if (!this.dailyData.length) {
      g.append('text').attr('x', iW / 2).attr('y', iH / 2)
        .attr('text-anchor', 'middle').attr('fill', '#9ca3af').attr('font-size', '14px')
        .text('No workouts logged today');
      return;
    }

    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

    const hourMap: Record<string, Partial<Record<FitnessCategory, number>>> = {};
    hours.forEach(h => hourMap[h] = {});
    this.dailyData.forEach((d: DailyChartPoint) => {
      const h = d.hour.slice(0, 2) + ':00';
      hourMap[h][d.category] = (hourMap[h][d.category] || 0) + d.duration;
    });

    const stackData = hours.map(h => ({ hour: h, ...hourMap[h] }));
    const stack = d3.stack().keys(this.categories)(stackData);

    const x = d3.scaleBand().domain(hours).range([0, iW]).padding(0.2);
    const maxTotal = Math.max(...stackData.map((d: any) =>
      this.categories.reduce((s, c) => s + (d[c] || 0), 0)
    ), 60);
    const y = d3.scaleLinear().domain([0, maxTotal]).range([iH, 0]);

    const colorMap: Record<FitnessCategory, string> = {
      cardio: '#ef4444',
      strength: '#8B5CF6',
      flexibility: '#06b6d4',
      sports: '#f59e0b'
    };

    g.append('g').call(d3.axisLeft(y).ticks(4).tickSize(-iW).tickFormat(''))
      .selectAll('line').attr('stroke', '#f3f4f6').attr('stroke-dasharray', '3,3');
    g.selectAll('.domain').remove();

    g.append('g').attr('transform', `translate(0,${iH})`)
      .call(d3.axisBottom(x).tickValues(hours.filter((_: any, i: number) => i % 3 === 0)))
      .call((ax: any) => ax.select('.domain').attr('stroke', '#e5e7eb'))
      .selectAll('text').attr('font-size', '11px').attr('fill', '#9ca3af')
      .attr('transform', 'rotate(-30)').attr('text-anchor', 'end').attr('dy', '0.5em');

    g.append('g').call(d3.axisLeft(y).ticks(4).tickFormat((d: number) => `${d}m`))
      .call((ax: any) => ax.select('.domain').remove())
      .selectAll('text').attr('font-size', '11px').attr('fill', '#9ca3af');

    stack.forEach((layer: any) => {
      const cat = layer.key as FitnessCategory;
      g.selectAll(`.bar-${cat}`)
        .data(layer.filter((d: any) => d[1] > d[0]))
        .enter().append('rect')
        .attr('x', (d: any) => x(d.data.hour) ?? 0)
        .attr('y', (d: any) => y(d[1]))
        .attr('width', x.bandwidth())
        .attr('height', (d: any) => Math.max(0, y(d[0]) - y(d[1])))
        .attr('fill', colorMap[cat])
        .attr('rx', 4)
        .attr('opacity', 0.85);
    });

    stackData.forEach((d: any) => {
      const total = this.categories.reduce((s, c) => s + (d[c] || 0), 0);
      if (total > 0) {
        g.append('text')
          .attr('x', (x(d.hour) ?? 0) + x.bandwidth() / 2)
          .attr('y', y(total) - 5)
          .attr('text-anchor', 'middle').attr('font-size', '10px').attr('fill', '#6b7280')
          .text(`${total}m`);
      }
    });
  }

  drawWeeklyChart() {
    const container = this.el.nativeElement.querySelector('#weekly-chart');
    if (!container) return;
    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth || 600;
    const height = 260;
    const m = { top: 30, right: 20, bottom: 40, left: 50 };
    const iW = width - m.left - m.right;
    const iH = height - m.top - m.bottom;

    const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);
    const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

    const x = d3.scaleBand()
      .domain(this.weeklyData.map((d: WeeklyChartPoint) => d.label))
      .range([0, iW]).padding(0.35);

    const maxDur = Math.max(...this.weeklyData.map((d: WeeklyChartPoint) => d.duration), 60);
    const y = d3.scaleLinear().domain([0, maxDur]).range([iH, 0]);

    const colorMap: Record<FitnessCategory, string> = {
      cardio: '#ef4444',
      strength: '#8B5CF6',
      flexibility: '#06b6d4',
      sports: '#f59e0b'
    };

    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickSize(-iW).tickFormat(''))
      .selectAll('line').attr('stroke', '#f3f4f6').attr('stroke-dasharray', '3,3');
    g.selectAll('.domain').remove();

    g.append('g').attr('transform', `translate(0,${iH})`)
      .call(d3.axisBottom(x))
      .call((ax: any) => ax.select('.domain').attr('stroke', '#e5e7eb'))
      .selectAll('text').attr('font-size', '12px').attr('fill', '#9ca3af');

    g.append('g')
      .call(d3.axisLeft(y).ticks(4).tickFormat((d: number) => `${d}m`))
      .call((ax: any) => ax.select('.domain').remove())
      .selectAll('text').attr('font-size', '11px').attr('fill', '#9ca3af');

    this.weeklyData.forEach((d: WeeklyChartPoint) => {
      if (!d.hasWorkout) {
        g.append('rect')
          .attr('x', x(d.label) ?? 0)
          .attr('y', iH - 4)
          .attr('width', x.bandwidth())
          .attr('height', 4)
          .attr('fill', '#e5e7eb')
          .attr('rx', 4);
        return;
      }

      let yOffset = 0;
      this.categories.forEach((cat: FitnessCategory) => {
        const dur = d.categoryDurations?.[cat] || 0;
        if (dur <= 0) return;

        const barHeight = iH - y(dur);
        const barY = y(d.duration) + yOffset;

        g.append('rect')
          .attr('x', x(d.label) ?? 0)
          .attr('y', barY)
          .attr('width', x.bandwidth())
          .attr('height', barHeight)
          .attr('fill', colorMap[cat])
          .attr('rx', 4)
          .attr('opacity', 0.88);

        yOffset += barHeight;
      });

      g.append('text')
        .attr('x', (x(d.label) ?? 0) + x.bandwidth() / 2)
        .attr('y', y(d.duration) - 8)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', '700')
        .attr('fill', '#374151')
        .text(`${d.duration}m`);
    });
  }

  drawMonthlyChart() {
    const container = this.el.nativeElement.querySelector('#monthly-chart');
    if (!container) return;
    d3.select(container).selectAll('*').remove();

    const width = container.clientWidth || 600;
    const cellSize = Math.min(Math.floor((width - 40) / 7), 54);
    const gap = 5;
    const firstWeekday = this.monthlyData[0]?.weekday || 0;
    const totalCells = firstWeekday + this.monthlyData.length;
    const rows = Math.ceil(totalCells / 7);
    const height = 34 + rows * (cellSize + gap) + 10;

    const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);
    const g = svg.append('g').attr('transform', 'translate(20,30)');

    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((day, i) => {
      g.append('text')
        .attr('x', i * (cellSize + gap) + cellSize / 2).attr('y', -12)
        .attr('text-anchor', 'middle').attr('font-size', '11px').attr('fill', '#9ca3af')
        .text(day);
    });

    this.monthlyData.forEach((d: MonthlyChartPoint, idx: number) => {
      const col = (firstWeekday + idx) % 7;
      const row = Math.floor((firstWeekday + idx) / 7);
      const cx = col * (cellSize + gap);
      const cy = row * (cellSize + gap);

      const fill = d.isFuture ? '#f9fafb' : d.hasWorkout ? '#8B5CF6' : '#f3f4f6';

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
        .attr('fill', d.hasWorkout ? '#fff' : d.isFuture ? '#d1d5db' : '#9ca3af')
        .text(d.day);

      if (d.hasWorkout) {
        g.append('text')
          .attr('x', cx + cellSize / 2)
          .attr('y', cy + cellSize / 2 + 8)
          .attr('text-anchor', 'middle')
          .attr('font-size', '13px')
          .attr('font-weight', '700')
          .attr('fill', '#fff')
          .text(`${d.duration}m`);
      }
    });
  }

  prevMonth() {
    this.selectedMonth = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() - 1, 1);
    this.prepareMonthlyData();
    setTimeout(() => this.drawMonthlyChart(), 80);
  }

  nextMonth() {
    const next = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 1);
    const now = new Date();
    if (
      next.getFullYear() < now.getFullYear() ||
      (next.getFullYear() === now.getFullYear() && next.getMonth() <= now.getMonth())
    ) {
      this.selectedMonth = next;
      this.prepareMonthlyData();
      setTimeout(() => this.drawMonthlyChart(), 80);
    }
  }

  get selectedMonthLabel(): string {
    return this.selectedMonth.toLocaleDateString('en', { month: 'long', year: 'numeric' });
  }

  get isCurrentMonth(): boolean {
    const now = new Date();
    return this.selectedMonth.getMonth() === now.getMonth() &&
      this.selectedMonth.getFullYear() === now.getFullYear();
  }

  // ── Calories ───────────────────────────────────────────────

  calculateCalories(category: FitnessCategory, durationMinutes: number): number {
    const met = this.metMap[category];
    const calories = met * this.userWeight * (durationMinutes / 60);
    return Math.round(calories);
  }

  onFormChange() {
    if (this.form.category && this.form.duration > 0) {
      this.form.caloriesBurned = this.calculateCalories(
        this.form.category,
        this.form.duration
      );
    }
  }

  // ── Form ───────────────────────────────────────────────────

  getEmptyForm() {
    return {
      title: '',
      category: 'cardio' as FitnessCategory,
      duration: 30,
      caloriesBurned: this.calculateCalories('cardio', 30),
      workoutTime: new Date().toTimeString().slice(0, 5),
      exercises: [{ name: '', sets: [{ reps: 0, weight: undefined as number | undefined }] }] as Exercise[],
      notes: '',
      date: this.today
    };
  }

  openModal() {
    this.form = this.getEmptyForm();
    this.formError = '';
    this.editMode = false;
    this.editingId = null;
    this.showModal = true;
  }

  openEditModal(entry: WorkoutEntry) {
    this.form = {
      title: entry.title,
      category: entry.category,
      duration: entry.duration,
      caloriesBurned: entry.caloriesBurned,
      workoutTime: entry.workoutTime || '08:00',
      exercises: entry.exercises.map(e => ({
        name: e.name,
        sets: e.sets.map(s => ({ reps: s.reps, weight: s.weight }))
      })),
      notes: entry.notes,
      date: entry.date.slice(0, 10)
    };
    this.editingId = entry._id!;
    this.editMode = true;
    this.formError = '';
    this.showModal = true;
  }

  closeModal() { this.showModal = false; this.editMode = false; this.editingId = null; }

  addExercise() { this.form.exercises.push({ name: '', sets: [{ reps: 0, weight: undefined }] }); }
  removeExercise(i: number) { this.form.exercises.splice(i, 1); }
  addSet(ex: Exercise) { ex.sets.push({ reps: 0, weight: undefined }); }
  removeSet(ex: Exercise, si: number) { ex.sets.splice(si, 1); }

  saveEntry() {
    if (!this.form.title.trim()) { this.formError = 'Workout title is required.'; return; }
    if (this.form.duration <= 0) { this.formError = 'Duration must be greater than 0.'; return; }
    if (this.form.date > this.today) { this.formError = 'Future date entries are not allowed.'; return; }

    const payload: Partial<WorkoutEntry> = {
      title: this.form.title.trim(),
      category: this.form.category,
      duration: this.form.duration,
      caloriesBurned: this.form.caloriesBurned,
      workoutTime: this.form.workoutTime,
      exercises: this.form.exercises.filter(e => e.name.trim()),
      notes: this.form.notes,
      date: this.form.date
    };

    if (this.editMode && this.editingId) {
      this.fitnessService.updateWorkout(this.editingId, payload).subscribe({
        next: (updated) => {
          const idx = this.entries.findIndex(e => e._id === this.editingId);
          if (idx > -1) this.entries[idx] = updated;
          this.closeModal();
          this.prepareChartData();
          setTimeout(() => this.drawChart(), 100);
        },
        error: (err) => { console.error(err); this.formError = 'Failed to update.'; }
      });
    } else {
      this.fitnessService.createWorkout(payload).subscribe({
        next: (created) => {
          this.entries.unshift(created);
          this.closeModal();
          this.prepareChartData();
          setTimeout(() => this.drawChart(), 100);
          this.postWorkoutTitle = created.title;
          this.postWorkoutMood = '';
          this.postWorkoutNote = '';
          this.showMoodPrompt = true;
        },
        error: (err) => { console.error(err); this.formError = 'Failed to save.'; }
      });
    }
  }

  confirmDelete(id: string) { this.entryToDelete = id; this.showDeleteConfirm = true; }

  deleteEntry() {
    if (!this.entryToDelete) return;
    this.fitnessService.deleteWorkout(this.entryToDelete).subscribe({
      next: () => {
        this.entries = this.entries.filter(e => e._id !== this.entryToDelete);
        this.showDeleteConfirm = false;
        this.entryToDelete = null;
        this.prepareChartData();
        setTimeout(() => this.drawChart(), 100);
      },
      error: (err) => console.error(err)
    });
  }

  // ── Stats ──────────────────────────────────────────────────

  get totalWorkouts(): number { return this.entries.length; }
  get totalCalories(): number { return this.entries.reduce((s, e) => s + e.caloriesBurned + (e.stepsCalories || 0), 0); }
  get totalMinutes(): number { return this.entries.reduce((s, e) => s + e.duration, 0); }
  get avgDuration(): number { return this.entries.length ? Math.round(this.totalMinutes / this.entries.length) : 0; }

  get thisWeekWorkouts(): number {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return this.entries.filter(e => new Date(e.date) >= weekAgo).length;
  }

  get sortedEntries(): WorkoutEntry[] {
    return [...this.entries].sort((a, b) => b.date.localeCompare(a.date));
  }

  get categoryBreakdown() {
    return this.categories.map(cat => {
      const count = this.entries.filter(e => e.category === cat).length;
      const pct = this.entries.length ? Math.round((count / this.entries.length) * 100) : 0;
      return { cat, count, pct, ...this.categoryConfig[cat] };
    }).filter(c => c.count > 0).sort((a, b) => b.count - a.count);
  }

  getCatColor(cat: FitnessCategory): string { return this.categoryConfig[cat].color; }
  getCatIcon(cat: FitnessCategory): string { return this.categoryConfig[cat].icon; }
  getCatLabel(cat: FitnessCategory): string { return this.categoryConfig[cat].label; }

  formatSets(exercise: Exercise): string {
    if (!exercise.sets.length) return '';
    const s = exercise.sets[0];
    return s.weight ? `${exercise.sets.length}×${s.reps} @ ${s.weight}kg` : `${exercise.sets.length}×${s.reps}`;
  }

  trackById(_: number, e: WorkoutEntry) { return e._id; }

  selectPostWorkoutMood(value: string) {
    this.postWorkoutMood = value;
  }

  getPostWorkoutMoodColor(): string {
    return this.moodOptions.find(m => m.value === this.postWorkoutMood)?.color || '#8B5CF6';
  }

  savePostWorkoutMood() {
    if (!this.postWorkoutMood) { this.showMoodPrompt = false; return; }

    const scale = this.moodScaleDefaults[this.postWorkoutMood] || 5;
    const note = this.postWorkoutNote || `After workout: ${this.postWorkoutTitle}`;

    this.moodService.createMood({
      mood: this.postWorkoutMood,
      scale,
      note,
      datetime: new Date()
    }).subscribe({
      next: () => { this.showMoodPrompt = false; },
      error: () => { this.showMoodPrompt = false; }
    });
  }

  skipMoodPrompt() {
    this.showMoodPrompt = false;
  }
}