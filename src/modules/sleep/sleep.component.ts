import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SleepEntry, SleepQuality } from './sleep.model';
import { SleepService } from './sleep.service';

@Component({
  selector: 'app-sleep',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sleep.component.html',
  styleUrls: ['./sleep.component.css']
})
export class SleepComponent implements OnInit {

  activeTab: 'dashboard' | 'history' = 'dashboard';
  showModal = false;
  showDeleteConfirm = false;
  entryToDelete: string | null = null;
  loading = false;
  error = '';

  entries: SleepEntry[] = [];

  form = this.getEmptyForm();
  formError = '';

  qualityLabels: Record<number, string> = {
    1: 'Terrible', 2: 'Poor', 3: 'Fair', 4: 'Good', 5: 'Excellent'
  };

  qualityColors: Record<number, string> = {
    1: '#ef4444', 2: '#f97316', 3: '#f59e0b', 4: '#84cc16', 5: '#22c55e'
  };

  qualityIcons: Record<number, string> = {
    1: 'sentiment_very_dissatisfied',
    2: 'sentiment_dissatisfied',
    3: 'sentiment_neutral',
    4: 'sentiment_satisfied',
    5: 'sentiment_very_satisfied'
  };

  constructor(private sleepService: SleepService) {}

  ngOnInit() {
    this.loadEntries();
  }

  loadEntries() {
    this.loading = true;
    this.sleepService.getSleepEntries().subscribe({
      next: (data) => {
        this.entries = data;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to load sleep data.';
        this.loading = false;
      }
    });
  }

  getEmptyForm() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    return {
      sleepDate: today,
      sleepTime: '23:00',
      wakeDate: today,
      wakeTime: '07:00',
      quality: 3 as SleepQuality,
      deepMinutes: 90,
      lightMinutes: 210,
      remMinutes: 120,
      notes: ''
    };
  }

  openModal() {
    this.form = this.getEmptyForm();
    this.formError = '';
    this.showModal = true;
  }

  closeModal() { this.showModal = false; }

  calcDuration(sleepDT: string, wakeDT: string): number {
    return Math.round((new Date(wakeDT).getTime() - new Date(sleepDT).getTime()) / 60000);
  }

  saveEntry() {
    const sleepDT = `${this.form.sleepDate}T${this.form.sleepTime}`;
    const wakeDT  = `${this.form.wakeDate}T${this.form.wakeTime}`;
    const duration = this.calcDuration(sleepDT, wakeDT);

    if (duration <= 0) {
      this.formError = 'Wake time must be after sleep time.';
      return;
    }

    const totalStages = this.form.deepMinutes + this.form.lightMinutes + this.form.remMinutes;
    if (totalStages > duration) {
      this.formError = `Stage total (${totalStages}min) cannot exceed duration (${duration}min).`;
      return;
    }

    const payload: Partial<SleepEntry> = {
      sleepTime: sleepDT,
      wakeTime:  wakeDT,
      duration,
      quality:   this.form.quality,
      stages: {
        deep:  this.form.deepMinutes,
        light: this.form.lightMinutes,
        rem:   this.form.remMinutes
      },
      notes: this.form.notes
    };

    this.sleepService.createSleepEntry(payload).subscribe({
      next: (created) => {
        this.entries.unshift(created);
        this.showModal = false;
      },
      error: (err) => {
        console.error(err);
        this.formError = 'Failed to save. Please try again.';
      }
    });
  }

  confirmDelete(id: string) {
    this.entryToDelete = id;
    this.showDeleteConfirm = true;
  }

  deleteEntry() {
    if (!this.entryToDelete) return;
    this.sleepService.deleteSleepEntry(this.entryToDelete).subscribe({
      next: () => {
        this.entries = this.entries.filter(e => e._id !== this.entryToDelete);
        this.showDeleteConfirm = false;
        this.entryToDelete = null;
      },
      error: (err) => console.error(err)
    });
  }

  // ── Computed stats ──────────────────────────────────────────

  get avgDuration(): number {
    if (!this.entries.length) return 0;
    return Math.round(this.entries.reduce((s, e) => s + e.duration, 0) / this.entries.length);
  }

  get avgQuality(): number {
    if (!this.entries.length) return 0;
    return +(this.entries.reduce((s, e) => s + e.quality, 0) / this.entries.length).toFixed(1);
  }

  get bestSleep(): SleepEntry | null {
    if (!this.entries.length) return null;
    return this.entries.reduce((best, e) => e.duration > best.duration ? e : best);
  }

  get last7(): SleepEntry[] {
    return [...this.entries]
      .sort((a, b) => new Date(b.sleepTime).getTime() - new Date(a.sleepTime).getTime())
      .slice(0, 7)
      .reverse();
  }

  get sortedEntries(): SleepEntry[] {
    return [...this.entries].sort((a, b) =>
      new Date(b.sleepTime).getTime() - new Date(a.sleepTime).getTime()
    );
  }

  // ── Helpers ─────────────────────────────────────────────────

  formatDuration(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  formatTime(dt: string): string {
    return new Date(dt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  }

  getBarHeight(entry: SleepEntry): number {
    const max = Math.max(...this.last7.map(e => e.duration), 480);
    return Math.round((entry.duration / max) * 100);
  }

  getQualityColor(q: number): string {
    return this.qualityColors[q] || '#9ca3af';
  }

  getQualityLabel(q: number): string {
    return this.qualityLabels[q] || '';
  }

  getQualityIcon(q: number): string {
    return this.qualityIcons[Math.round(q)] || 'sentiment_neutral';
  }

  getStagePercent(minutes: number, total: number): number {
    if (!total) return 0;
    return Math.round((minutes / total) * 100);
  }

  getSleepGoalStatus(): { label: string; color: string; icon: string } {
    const avg = this.avgDuration;
    if (avg >= 480) return { label: 'On track',          color: '#22c55e', icon: 'check_circle' };
    if (avg >= 360) return { label: 'Almost there',      color: '#f59e0b', icon: 'warning'      };
    return              { label: 'Needs improvement', color: '#ef4444', icon: 'error'        };
  }

  trackByEntry(_: number, e: SleepEntry) { return e._id; }
}
