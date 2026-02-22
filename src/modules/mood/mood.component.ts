import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MoodService } from './mood.service';

interface MoodEntry {
  _id?: string;
  mood: string;
  scale: number;
  note: string;
  datetime: Date;
}

interface CalendarCell {
  day: number | null;
  isToday: boolean;
  emoji: string;
  color: string;
  moods: MoodEntry[];
}

@Component({
  selector: 'app-mood',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mood.component.html',
  styleUrls: ['./mood.component.css']
})
export class MoodComponent implements OnInit {

  
  activeTab = 'today';
  allMoods: MoodEntry[] = [];
  showModal = false;
  confirmModal = false;
  selectedMood: MoodEntry | null = null;
  formErrors: any = {};

  viewDate = new Date();

  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  moods = [
    { value: 'great', label: 'Great', emoji: '😄', color: '#22c55e' },
    { value: 'good', label: 'Good', emoji: '🙂', color: '#84cc16' },
    { value: 'okay', label: 'Okay', emoji: '😐', color: '#f59e0b' },
    { value: 'sad', label: 'Sad', emoji: '😢', color: '#3b82f6' },
    { value: 'angry', label: 'Angry', emoji: '😡', color: '#ef4444' },
  ];

  moodForm = {
    mood: '',
    scale: 5,
    note: '',
    date: '',
    time: ''
  };

  get todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  get todayMoods(): MoodEntry[] {
    const today = new Date().toDateString();
    return this.allMoods
      .filter(m => new Date(m.datetime).toDateString() === today)
      .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime());
  }

  get currentTheme(): string {
    if (this.todayMoods.length === 0) return 'default';
    return this.todayMoods[0].mood;
  }

  get currentMonthLabel(): string {
    return this.viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  get isCurrentMonth(): boolean {
    const now = new Date();
    return this.viewDate.getMonth() === now.getMonth() &&
           this.viewDate.getFullYear() === now.getFullYear();
  }

  get calendarCells(): CalendarCell[] {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const cells: CalendarCell[] = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null, isToday: false, emoji: '', color: '', moods: [] });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = new Date(year, month, d).toDateString();
      const dayMoods = this.allMoods.filter(m => new Date(m.datetime).toDateString() === dateStr);
      const dominant = this.getDominantMoodForDay(dayMoods);
      const moodDef = this.moods.find(m => m.value === dominant);

      cells.push({
        day: d,
        isToday: new Date(year, month, d).toDateString() === today.toDateString(),
        emoji: moodDef?.emoji || '',
        color: moodDef ? moodDef.color + '33' : '',
        moods: dayMoods
      });
    }

    return cells;
  }

  get averageScale(): number {
    if (this.allMoods.length === 0) return 0;
    return this.allMoods.reduce((sum, m) => sum + m.scale, 0) / this.allMoods.length;
  }

  get dominantMood(): string {
    if (this.allMoods.length === 0) return 'okay';
    const counts: { [key: string]: number } = {};
    this.allMoods.forEach(m => { counts[m.mood] = (counts[m.mood] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  get moodFrequency() {
    const total = this.allMoods.length;
    return this.moods.map(m => {
      const count = this.allMoods.filter(e => e.mood === m.value).length;
      return {
        ...m,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      };
    }).filter(m => m.count > 0).sort((a, b) => b.count - a.count);
  }

  get weekTrend() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toDateString();
      const dayMoods = this.allMoods.filter(m => new Date(m.datetime).toDateString() === dateStr);
      const dominant = this.getDominantMoodForDay(dayMoods);
      const moodDef = this.moods.find(m => m.value === dominant);
      const avgScale = dayMoods.length > 0
        ? dayMoods.reduce((s, m) => s + m.scale, 0) / dayMoods.length
        : 0;

      days.push({
        dayLabel: d.toLocaleDateString('en', { weekday: 'short' }),
        emoji: moodDef?.emoji || '·',
        color: moodDef?.color || '#e5e7eb',
        scale: avgScale,
        label: moodDef?.label || 'No data'
      });
    }
    return days;
  }

  constructor(private moodService: MoodService) {}

  ngOnInit() {
    this.loadMoods();
    const now = new Date();
    this.moodForm.date = this.todayStr;
    this.moodForm.time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  loadMoods() {
    this.moodService.getMoods().subscribe({
      next: (data) => { this.allMoods = data; },
      error: (err) => console.error(err)
    });
  }

  openModal() {
    const now = new Date();
    this.moodForm = {
      mood: '',
      scale: 5,
      note: '',
      date: this.todayStr,
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    };
    this.formErrors = {};
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  selectMood(value: string) {
    this.moodForm.mood = value;
    // Auto set scale based on mood
    const defaults: { [key: string]: number } = { great: 9, good: 7, okay: 5, sad: 3, angry: 2 };
    this.moodForm.scale = defaults[value] || 5;
  }

  getSelectedColor(): string {
    return this.moods.find(m => m.value === this.moodForm.mood)?.color || '#A78BFA';
  }

  saveMood() {
    this.formErrors = {};
    if (!this.moodForm.mood) {
      this.formErrors.mood = 'Please select a mood';
      return;
    }

    const datetime = new Date(`${this.moodForm.date}T${this.moodForm.time}`);
    const payload = {
      mood: this.moodForm.mood,
      scale: this.moodForm.scale,
      note: this.moodForm.note,
      datetime
    };

    this.moodService.createMood(payload).subscribe({
      next: (created) => {
        this.allMoods.unshift(created);
        this.closeModal();
      },
      error: (err) => console.error(err)
    });
  }

  confirmDelete(mood: MoodEntry) {
    this.selectedMood = mood;
    this.confirmModal = true;
  }

  closeConfirm() {
    this.confirmModal = false;
    this.selectedMood = null;
  }

  confirmAction() {
    if (!this.selectedMood?._id) return;
    this.moodService.deleteMood(this.selectedMood._id).subscribe(() => {
      this.allMoods = this.allMoods.filter(m => m._id !== this.selectedMood!._id);
      this.closeConfirm();
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

  getMoodEmoji(value: string): string {
    return this.moods.find(m => m.value === value)?.emoji || '😐';
  }

  getMoodLabel(value: string): string {
    return this.moods.find(m => m.value === value)?.label || value;
  }

  getDominantEmoji(): string {
    return this.getMoodEmoji(this.dominantMood);
  }

  getDominantMoodForDay(dayMoods: MoodEntry[]): string {
    if (dayMoods.length === 0) return '';
    const counts: { [key: string]: number } = {};
    dayMoods.forEach(m => { counts[m.mood] = (counts[m.mood] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }
}
