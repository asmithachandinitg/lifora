import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PeriodEntry, DailySymptomLog, FlowLevel, PeriodSymptom, SymptomCategory, SymptomMeta } from './period.model';
import { PeriodService } from './period.service';

interface CalendarDay {
  date: string;           // YYYY-MM-DD
  dayNum: number;
  inMonth: boolean;
  isPeriod: boolean;
  isFertile: boolean;
  isOvulation: boolean;
  isPredicted: boolean;   // predicted next period
  isToday: boolean;
  periodEntry?: PeriodEntry;
  dailyLog?: DailySymptomLog;
}

@Component({
  selector: 'app-period',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './period.component.html',
  styleUrls: ['./period.component.css']
})
export class PeriodComponent implements OnInit {

  activeTab: 'dashboard' | 'history' | 'calendar' = 'dashboard';

  // Modal state
  showPeriodModal  = false;
  showDailyModal   = false;
  showDeleteConfirm = false;
  showDayPanel     = false;

  entryToDelete: string | null = null;
  deleteType: 'period' | 'daily' = 'period';
  editMode   = false;
  editingId: string | null = null;

  // Data
  periodEntries: PeriodEntry[]    = [];
  dailyLogs:     DailySymptomLog[] = [];

  // Forms
  periodForm = this.getEmptyPeriodForm();
  dailyForm  = this.getEmptyDailyForm();
  formError  = '';

  // Calendar
  calendarDate  = new Date();
  calendarDays: CalendarDay[] = [];
  selectedDay: CalendarDay | null = null;

  // Symptom category expand state in modal
  expandedCats: Set<string> = new Set(['Pain']);

  // ── Static lookup data ────────────────────────────────────

  flowLevels: FlowLevel[] = ['spotting', 'light', 'medium', 'heavy'];

  flowColors: Record<FlowLevel, string> = {
    spotting: '#fca5a5', light: '#f87171', medium: '#ef4444', heavy: '#b91c1c'
  };
  flowIcons: Record<FlowLevel, string> = {
    spotting: 'water_drop', light: 'opacity', medium: 'bloodtype', heavy: 'favorite'
  };

  symptomCategories: SymptomCategory[] = [
    { label: 'Pain', icon: 'flash_on', symptoms: [
      { key: 'cramps',        label: 'Cramps',        icon: 'flash_on'       },
      { key: 'pelvic_pain',   label: 'Pelvic Pain',   icon: 'accessibility'  },
      { key: 'back_pain',     label: 'Back Pain',     icon: 'accessibility'  },
      { key: 'low_back_pain', label: 'Low Back',      icon: 'accessibility'  },
      { key: 'shoulder_aches',label: 'Shoulder',      icon: 'accessibility'  },
      { key: 'neck_aches',    label: 'Neck Aches',    icon: 'accessibility'  },
      { key: 'migraines',     label: 'Migraines',     icon: 'psychology'     },
      { key: 'headache',      label: 'Headache',      icon: 'psychology'     },
      { key: 'muscle_pain',   label: 'Muscle Pain',   icon: 'fitness_center' }
    ]},
    { label: 'Digestive', icon: 'restaurant', symptoms: [
      { key: 'bloating',     label: 'Bloating',     icon: 'circle'     },
      { key: 'nausea',       label: 'Nausea',       icon: 'sick'       },
      { key: 'diarrhea',     label: 'Diarrhea',     icon: 'water_drop' },
      { key: 'constipation', label: 'Constipation', icon: 'block'      },
      { key: 'hunger',       label: 'Hunger',       icon: 'restaurant' },
      { key: 'cravings',     label: 'Cravings',     icon: 'fastfood'   }
    ]},
    { label: 'Physical', icon: 'self_improvement', symptoms: [
      { key: 'fatigue',            label: 'Fatigue',            icon: 'battery_1_bar'        },
      { key: 'swelling',           label: 'Swelling',           icon: 'water_drop'           },
      { key: 'weight_gain',        label: 'Weight Gain',        icon: 'monitor_weight'       },
      { key: 'breast_tenderness',  label: 'Breast Tenderness',  icon: 'favorite_border'      },
      { key: 'breast_sensitivity', label: 'Breast Sensitivity', icon: 'favorite_border'      },
      { key: 'hot_flashes',        label: 'Hot Flashes',        icon: 'local_fire_department'},
      { key: 'night_sweats',       label: 'Night Sweats',       icon: 'nights_stay'          },
      { key: 'chills',             label: 'Chills',             icon: 'ac_unit'              },
      { key: 'fever',              label: 'Fever',              icon: 'thermostat'           },
      { key: 'itchiness',          label: 'Itchiness',          icon: 'back_hand'            },
      { key: 'rashes',             label: 'Rashes',             icon: 'healing'              },
      { key: 'dizziness',          label: 'Dizziness',          icon: 'rotate_right'         },
      { key: 'ovulation_pain',     label: 'Ovulation Pain',     icon: 'egg_alt'              },
      { key: 'acne',               label: 'Acne',               icon: 'face'                 }
    ]},
    { label: 'Mental / Emotional', icon: 'psychology', symptoms: [
      { key: 'mood_swings', label: 'Mood Swings', icon: 'mood_bad'                    },
      { key: 'irritation',  label: 'Irritation',  icon: 'sentiment_very_dissatisfied' },
      { key: 'anxiety',     label: 'Anxiety',     icon: 'psychology'                  },
      { key: 'stress',      label: 'Stress',      icon: 'psychology_alt'              },
      { key: 'tension',     label: 'Tension',     icon: 'sports_martial_arts'         },
      { key: 'confusion',   label: 'Confusion',   icon: 'help_outline'                },
      { key: 'insomnia',    label: 'Insomnia',    icon: 'nightlight'                  },
      { key: 'moodiness',   label: 'Moodiness',   icon: 'mood_bad'                    },
      { key: 'pms',         label: 'PMS',         icon: 'warning'                     }
    ]},
    { label: 'Other', icon: 'more_horiz', symptoms: [
      { key: 'illness', label: 'Illness', icon: 'sick' }
    ]}
  ];

  moodLabels: Record<number, string> = { 1:'Very Low', 2:'Low', 3:'Neutral', 4:'Good', 5:'Great' };
  moodIcons:  Record<number, string> = {
    1:'sentiment_very_dissatisfied', 2:'sentiment_dissatisfied',
    3:'sentiment_neutral', 4:'sentiment_satisfied', 5:'sentiment_very_satisfied'
  };
  moodColors: Record<number, string> = {
    1:'#ef4444', 2:'#f97316', 3:'#f59e0b', 4:'#84cc16', 5:'#22c55e'
  };
  painLabels: Record<number, string> = {
    1:'Minimal', 2:'Mild', 3:'Moderate', 4:'Severe', 5:'Unbearable'
  };
  painColors: Record<number, string> = {
    1:'#22c55e', 2:'#84cc16', 3:'#f59e0b', 4:'#f97316', 5:'#ef4444'
  };

  weekDays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  monthNames = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

  constructor(private svc: PeriodService) {}

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.svc.getPeriodEntries().subscribe({ next: d => { this.periodEntries = d; this.buildCalendar(); } });
    this.svc.getDailyLogs().subscribe({ next: d => { this.dailyLogs = d; this.buildCalendar(); } });
  }

  // ── Forms ─────────────────────────────────────────────────

  getEmptyPeriodForm() {
    const today = new Date().toISOString().split('T')[0];
    return { startDate: today, endDate: '', flow: 'medium' as FlowLevel,
             painLevel: 2, mood: 3, symptoms: [] as PeriodSymptom[], notes: '' };
  }

  getEmptyDailyForm(date?: string) {
    return { date: date || new Date().toISOString().split('T')[0],
             mood: 3, painLevel: 1, symptoms: [] as PeriodSymptom[], notes: '' };
  }

  toggleSymptomInPeriod(key: PeriodSymptom) { this.toggle(this.periodForm.symptoms, key); }
  toggleSymptomInDaily(key: PeriodSymptom)  { this.toggle(this.dailyForm.symptoms,  key); }
  hasPeriodSymptom(key: PeriodSymptom): boolean { return this.periodForm.symptoms.includes(key); }
  hasDailySymptom(key: PeriodSymptom):  boolean { return this.dailyForm.symptoms.includes(key);  }

  private toggle(arr: PeriodSymptom[], key: PeriodSymptom) {
    const i = arr.indexOf(key);
    if (i > -1) arr.splice(i, 1); else arr.push(key);
  }

  toggleCat(label: string) {
    if (this.expandedCats.has(label)) this.expandedCats.delete(label);
    else this.expandedCats.add(label);
  }
  isCatExpanded(label: string): boolean { return this.expandedCats.has(label); }

  // ── Period modal ──────────────────────────────────────────

  openPeriodModal(prefillDate?: string) {
    this.periodForm = this.getEmptyPeriodForm();
    if (prefillDate) this.periodForm.startDate = prefillDate;
    this.formError = ''; this.editMode = false; this.editingId = null;
    this.expandedCats = new Set(['Pain']);
    this.showPeriodModal = true;
  }

  closePeriodModal() { this.showPeriodModal = false; this.editMode = false; this.editingId = null; }

  savePeriodEntry() {
    if (!this.periodForm.startDate) { this.formError = 'Start date is required.'; return; }
    const payload: Partial<PeriodEntry> = {
      startDate: this.periodForm.startDate,
      endDate:   this.periodForm.endDate   || undefined,
      flow:      this.periodForm.flow,
      painLevel: this.periodForm.painLevel,
      mood:      this.periodForm.mood,
      symptoms:  this.periodForm.symptoms,
      notes:     this.periodForm.notes.trim() || undefined
    };
    if (this.editMode && this.editingId) {
      this.svc.updatePeriodEntry(this.editingId, payload).subscribe({
        next: u => { const i = this.periodEntries.findIndex(e => e._id === this.editingId);
          if (i > -1) this.periodEntries[i] = u; this.closePeriodModal(); this.buildCalendar(); },
        error: () => { this.formError = 'Failed to update.'; }
      });
    } else {
      this.svc.createPeriodEntry(payload).subscribe({
        next: c => { this.periodEntries.unshift(c); this.closePeriodModal(); this.buildCalendar(); },
        error: () => { this.formError = 'Failed to save.'; }
      });
    }
  }

  openEditPeriodModal(entry: PeriodEntry) {
    this.periodForm = { startDate: entry.startDate, endDate: entry.endDate || '',
      flow: entry.flow, painLevel: entry.painLevel, mood: entry.mood,
      symptoms: [...entry.symptoms], notes: entry.notes || '' };
    this.editingId = entry._id!; this.editMode = true;
    this.formError = ''; this.expandedCats = new Set(['Pain']);
    this.showPeriodModal = true;
  }

  // ── Daily modal ───────────────────────────────────────────

  openDailyModal(date?: string) {
    this.dailyForm = this.getEmptyDailyForm(date);
    // Pre-fill if log exists for this date
    const existing = this.dailyLogs.find(l => l.date === (date || this.dailyForm.date));
    if (existing) {
      this.dailyForm = { date: existing.date, mood: existing.mood,
        painLevel: existing.painLevel, symptoms: [...existing.symptoms], notes: existing.notes || '' };
      this.editingId = existing._id!; this.editMode = true;
    } else {
      this.editMode = false; this.editingId = null;
    }
    this.formError = ''; this.expandedCats = new Set(['Pain']);
    this.showDailyModal = true;
  }

  closeDailyModal() { this.showDailyModal = false; this.editMode = false; this.editingId = null; }

  saveDailyLog() {
    const payload: Partial<DailySymptomLog> = {
      date:      this.dailyForm.date,
      mood:      this.dailyForm.mood,
      painLevel: this.dailyForm.painLevel,
      symptoms:  this.dailyForm.symptoms,
      notes:     this.dailyForm.notes.trim() || undefined
    };
    if (this.editMode && this.editingId) {
      this.svc.updateDailyLog(this.editingId, payload).subscribe({
        next: u => { const i = this.dailyLogs.findIndex(l => l._id === this.editingId);
          if (i > -1) this.dailyLogs[i] = u; this.closeDailyModal(); this.buildCalendar(); },
        error: () => { this.formError = 'Failed to update.'; }
      });
    } else {
      this.svc.createDailyLog(payload).subscribe({
        next: c => { this.dailyLogs.unshift(c); this.closeDailyModal(); this.buildCalendar(); },
        error: () => { this.formError = 'Failed to save.'; }
      });
    }
  }

  // ── Delete ────────────────────────────────────────────────

  confirmDelete(id: string, type: 'period' | 'daily') {
    this.entryToDelete = id; this.deleteType = type; this.showDeleteConfirm = true;
  }

  doDelete() {
    if (!this.entryToDelete) return;
    if (this.deleteType === 'period') {
      this.svc.deletePeriodEntry(this.entryToDelete).subscribe({
        next: () => { this.periodEntries = this.periodEntries.filter(e => e._id !== this.entryToDelete);
          this.showDeleteConfirm = false; this.entryToDelete = null; this.buildCalendar(); }
      });
    } else {
      this.svc.deleteDailyLog(this.entryToDelete).subscribe({
        next: () => { this.dailyLogs = this.dailyLogs.filter(l => l._id !== this.entryToDelete);
          this.showDeleteConfirm = false; this.entryToDelete = null; this.buildCalendar(); }
      });
    }
  }

  // ── Calendar ──────────────────────────────────────────────

  buildCalendar() {
    const year  = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date().toISOString().split('T')[0];

    // Build set of period dates
    const periodDates   = new Set<string>();
    const fertileDates  = new Set<string>();
    const ovulDates     = new Set<string>();
    const predictedDates = new Set<string>();

    for (const entry of this.periodEntries) {
      if (entry.endDate) {
        const s = new Date(entry.startDate);
        const e = new Date(entry.endDate);
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
          periodDates.add(d.toISOString().split('T')[0]);
        }
      } else {
        periodDates.add(entry.startDate);
      }
    }

    // Predictions from latest entry
    const latestEntry = this.sortedPeriodEntries[0];
    if (latestEntry && this.avgCycleLength > 0) {
      const nextStart = new Date(latestEntry.startDate);
      nextStart.setDate(nextStart.getDate() + this.avgCycleLength);
      const avgLen = this.avgPeriodLength || 5;
      for (let i = 0; i < avgLen; i++) {
        const d = new Date(nextStart);
        d.setDate(d.getDate() + i);
        predictedDates.add(d.toISOString().split('T')[0]);
      }
      // Ovulation = nextStart - 14
      const ovulDate = new Date(nextStart);
      ovulDate.setDate(ovulDate.getDate() - 14);
      ovulDates.add(ovulDate.toISOString().split('T')[0]);
      // Fertile window = ovul - 5 to ovul + 1
      for (let i = -5; i <= 1; i++) {
        const fd = new Date(ovulDate);
        fd.setDate(fd.getDate() + i);
        fertileDates.add(fd.toISOString().split('T')[0]);
      }
    }

    const days: CalendarDay[] = [];

    // Padding before month start
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i);
      const ds = d.toISOString().split('T')[0];
      days.push(this.buildDay(ds, d.getDate(), false, periodDates, fertileDates, ovulDates, predictedDates, today));
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d  = new Date(year, month, i);
      const ds = d.toISOString().split('T')[0];
      days.push(this.buildDay(ds, i, true, periodDates, fertileDates, ovulDates, predictedDates, today));
    }

    // Padding after
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d  = new Date(year, month + 1, i);
      const ds = d.toISOString().split('T')[0];
      days.push(this.buildDay(ds, i, false, periodDates, fertileDates, ovulDates, predictedDates, today));
    }

    this.calendarDays = days;
  }

  private buildDay(
    ds: string, dayNum: number, inMonth: boolean,
    periodDates: Set<string>, fertileDates: Set<string>,
    ovulDates: Set<string>, predictedDates: Set<string>,
    today: string
  ): CalendarDay {
    return {
      date: ds, dayNum, inMonth,
      isPeriod:    periodDates.has(ds),
      isFertile:   fertileDates.has(ds) && !periodDates.has(ds),
      isOvulation: ovulDates.has(ds),
      isPredicted: predictedDates.has(ds) && !periodDates.has(ds),
      isToday:     ds === today,
      periodEntry: this.periodEntries.find(e =>
        ds >= e.startDate && ds <= (e.endDate || e.startDate)),
      dailyLog: this.dailyLogs.find(l => l.date === ds)
    };
  }

  prevMonth() {
    this.calendarDate = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() - 1, 1);
    this.buildCalendar();
  }

  nextMonth() {
    this.calendarDate = new Date(this.calendarDate.getFullYear(), this.calendarDate.getMonth() + 1, 1);
    this.buildCalendar();
  }

  selectDay(day: CalendarDay) {
    this.selectedDay = day;
    this.showDayPanel = true;
  }

  closeDayPanel() { this.showDayPanel = false; this.selectedDay = null; }

  // ── Stats ─────────────────────────────────────────────────

  get sortedPeriodEntries(): PeriodEntry[] {
    return [...this.periodEntries].sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }

  get avgCycleLength(): number {
    const withCycle = this.periodEntries.filter(e => e.cycleLength && e.cycleLength > 0);
    if (!withCycle.length) return 28; // default
    return Math.round(withCycle.reduce((s, e) => s + e.cycleLength!, 0) / withCycle.length);
  }

  get avgPeriodLength(): number {
    const withLen = this.periodEntries.filter(e => e.periodLength && e.periodLength > 0);
    if (!withLen.length) return 5;
    return Math.round(withLen.reduce((s, e) => s + e.periodLength!, 0) / withLen.length);
  }

  get nextPeriodDate(): Date | null {
    const latest = this.sortedPeriodEntries[0];
    if (!latest) return null;
    const d = new Date(latest.startDate);
    d.setDate(d.getDate() + this.avgCycleLength);
    return d;
  }

  get nextOvulationDate(): Date | null {
    if (!this.nextPeriodDate) return null;
    const d = new Date(this.nextPeriodDate);
    d.setDate(d.getDate() - 14);
    return d;
  }

  get nextFertileStart(): Date | null {
    if (!this.nextOvulationDate) return null;
    const d = new Date(this.nextOvulationDate);
    d.setDate(d.getDate() - 5);
    return d;
  }

  get nextFertileEnd(): Date | null {
    if (!this.nextOvulationDate) return null;
    const d = new Date(this.nextOvulationDate);
    d.setDate(d.getDate() + 1);
    return d;
  }

  get daysUntilNextPeriod(): number {
    if (!this.nextPeriodDate) return 0;
    return Math.max(0, Math.ceil(
      (this.nextPeriodDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  }

  get daysUntilOvulation(): number {
    if (!this.nextOvulationDate) return 0;
    return Math.max(0, Math.ceil(
      (this.nextOvulationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));
  }

  get currentCycleDay(): number {
    const latest = this.sortedPeriodEntries[0];
    if (!latest) return 0;
    return Math.max(1, Math.ceil(
      (new Date().getTime() - new Date(latest.startDate).getTime()) / (1000 * 60 * 60 * 24)));
  }

  get topSymptoms(): { label: string; count: number }[] {
    const counts: Record<string, number> = {};
    [...this.periodEntries, ...this.dailyLogs].forEach(e =>
      e.symptoms.forEach(s => { counts[s] = (counts[s] || 0) + 1; }));
    return Object.entries(counts)
      .map(([key, count]) => ({ label: this.getSymptomLabel(key as PeriodSymptom), count }))
      .sort((a, b) => b.count - a.count).slice(0, 6);
  }

  get calMonthLabel(): string {
    return `${this.monthNames[this.calendarDate.getMonth()]} ${this.calendarDate.getFullYear()}`;
  }

  // ── Helpers ───────────────────────────────────────────────

  getSymptomLabel(key: PeriodSymptom): string {
    for (const cat of this.symptomCategories)
      for (const s of cat.symptoms)
        if (s.key === key) return s.label;
    return key;
  }

  getSymptomIcon(key: PeriodSymptom): string {
    for (const cat of this.symptomCategories)
      for (const s of cat.symptoms)
        if (s.key === key) return s.icon;
    return 'circle';
  }

  getFlowColor(f: FlowLevel): string  { return this.flowColors[f] || '#9ca3af'; }
  getFlowIcon(f: FlowLevel): string   { return this.flowIcons[f]  || 'water_drop'; }
  getMoodIcon(m: number): string      { return this.moodIcons[Math.round(m)]  || 'sentiment_neutral'; }
  getMoodColor(m: number): string     { return this.moodColors[Math.round(m)] || '#9ca3af'; }
  getMoodLabel(m: number): string     { return this.moodLabels[Math.round(m)] || ''; }
  getPainColor(p: number): string     { return this.painColors[Math.round(p)] || '#9ca3af'; }
  getPainLabel(p: number): string     { return this.painLabels[Math.round(p)] || ''; }

  formatDate(d: Date | null): string {
    if (!d) return '—';
    return d.toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getDayClass(day: CalendarDay): string {
    if (day.isOvulation) return 'day-ovulation';
    if (day.isPeriod)    return 'day-period';
    if (day.isFertile)   return 'day-fertile';
    if (day.isPredicted) return 'day-predicted';
    return '';
  }

  countSelected(catSymptoms: SymptomMeta[], selected: PeriodSymptom[]): number {
    return catSymptoms.filter(s => selected.includes(s.key)).length;
  }

  trackByDate(_: number, d: CalendarDay) { return d.date; }
  trackById(_: number, e: any)           { return e._id; }
}
