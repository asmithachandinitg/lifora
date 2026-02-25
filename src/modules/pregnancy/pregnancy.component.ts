import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PregnancyEntry, PregnancyProfile, PregnancySymptom } from './pregnancy.model';
import { PregnancyService } from './pregnancy.service';

@Component({
  selector: 'app-pregnancy',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pregnancy.component.html',
  styleUrls: ['./pregnancy.component.css']
})
export class PregnancyComponent implements OnInit {

  activeTab: 'dashboard' | 'weekly' | 'history' = 'dashboard';
  showModal = false;
  showProfileModal = false;
  showDeleteConfirm = false;
  entryToDelete: string | null = null;
  editMode = false;
  editingId: string | null = null;

  entries: PregnancyEntry[] = [];
  profile: PregnancyProfile | null = null;

  form = this.getEmptyForm();
  profileForm = { dueDate: '', lmpDate: '' };
  formError = '';

  allSymptoms: { key: PregnancySymptom; label: string; icon: string }[] = [
    { key: 'nausea',       label: 'Nausea',       icon: 'sick'              },
    { key: 'fatigue',      label: 'Fatigue',       icon: 'battery_1_bar'    },
    { key: 'back_pain',    label: 'Back Pain',     icon: 'accessibility'    },
    { key: 'heartburn',    label: 'Heartburn',     icon: 'local_fire_department' },
    { key: 'swelling',     label: 'Swelling',      icon: 'water_drop'       },
    { key: 'headache',     label: 'Headache',      icon: 'psychology'       },
    { key: 'cramps',       label: 'Cramps',        icon: 'flash_on'         },
    { key: 'spotting',     label: 'Spotting',      icon: 'favorite_border'  },
    { key: 'mood_swings',  label: 'Mood Swings',   icon: 'mood_bad'         },
    { key: 'insomnia',     label: 'Insomnia',      icon: 'nightlight'       },
    { key: 'cravings',     label: 'Cravings',      icon: 'fastfood'         }
  ];

  moodLabels: Record<number, string> = {
    1: 'Very Low', 2: 'Low', 3: 'Neutral', 4: 'Good', 5: 'Great'
  };

  moodIcons: Record<number, string> = {
    1: 'sentiment_very_dissatisfied',
    2: 'sentiment_dissatisfied',
    3: 'sentiment_neutral',
    4: 'sentiment_satisfied',
    5: 'sentiment_very_satisfied'
  };

  moodColors: Record<number, string> = {
    1: '#ef4444', 2: '#f97316', 3: '#f59e0b', 4: '#84cc16', 5: '#22c55e'
  };

  // Baby size info by trimester / milestone weeks
  babySizeByWeek: Record<number, { size: string; emoji: string; description: string }> = {
    4:  { size: 'Poppy seed',    emoji: '🌱', description: 'The embryo is just beginning to form.' },
    6:  { size: 'Sweet pea',     emoji: '🫛', description: 'The heart is beating for the first time.' },
    8:  { size: 'Raspberry',     emoji: '🫐', description: 'Tiny fingers and toes are forming.' },
    10: { size: 'Strawberry',    emoji: '🍓', description: 'All vital organs are in place.' },
    12: { size: 'Lime',          emoji: '🍋', description: 'End of first trimester! Nausea often eases.' },
    16: { size: 'Avocado',       emoji: '🥑', description: 'You may start to feel movement.' },
    20: { size: 'Banana',        emoji: '🍌', description: 'Halfway there! Anatomy scan week.' },
    24: { size: 'Ear of corn',   emoji: '🌽', description: 'Baby\'s lungs are developing rapidly.' },
    28: { size: 'Eggplant',      emoji: '🍆', description: 'Third trimester begins. Baby can blink!' },
    32: { size: 'Squash',        emoji: '🥦', description: 'Baby is practicing breathing movements.' },
    36: { size: 'Papaya',        emoji: '🍈', description: 'Nearly full term. Baby is head-down.' },
    40: { size: 'Watermelon',    emoji: '🍉', description: 'Due date! Full term baby.' }
  };

  constructor(private pregnancyService: PregnancyService) {}

  ngOnInit() {
    this.loadProfile();
    this.loadEntries();
  }

  loadProfile() {
    this.pregnancyService.getProfile().subscribe({
      next: (p) => { this.profile = p; },
      error: () => { this.profile = null; }
    });
  }

  loadEntries() {
    this.pregnancyService.getEntries().subscribe({
      next: (data) => { this.entries = data; },
      error: (err) => console.error(err)
    });
  }

  getEmptyForm() {
    const today = new Date().toISOString().split('T')[0];
    return {
      date: today,
      week: this.currentWeek || 1,
      weight: null as number | null,
      systolic: null as number | null,
      diastolic: null as number | null,
      babyMovements: null as number | null,
      symptoms: [] as PregnancySymptom[],
      mood: 3,
      notes: ''
    };
  }

  toggleSymptom(s: PregnancySymptom) {
    const idx = this.form.symptoms.indexOf(s);
    if (idx > -1) this.form.symptoms.splice(idx, 1);
    else this.form.symptoms.push(s);
  }

  hasSymptom(s: PregnancySymptom): boolean {
    return this.form.symptoms.includes(s);
  }

  openModal() {
    this.form = this.getEmptyForm();
    this.form.week = this.currentWeek || 1;
    this.formError = '';
    this.editMode = false;
    this.editingId = null;
    this.showModal = true;
  }

  closeModal() { this.showModal = false; this.editMode = false; this.editingId = null; }

  openProfileModal() {
    this.profileForm = {
      dueDate: this.profile?.dueDate || '',
      lmpDate: this.profile?.lmpDate || ''
    };
    this.showProfileModal = true;
  }

  saveProfile() {
    if (!this.profileForm.dueDate) { this.formError = 'Due date is required.'; return; }
    this.pregnancyService.saveProfile(this.profileForm).subscribe({
      next: (p) => { this.profile = p; this.showProfileModal = false; this.formError = ''; },
      error: (err) => { console.error(err); this.formError = 'Failed to save profile.'; }
    });
  }

  saveEntry() {
    if (!this.form.week || this.form.week < 1 || this.form.week > 42) {
      this.formError = 'Week must be between 1 and 42.';
      return;
    }

    const payload: Partial<PregnancyEntry> = {
      date: this.form.date,
      week: this.form.week,
      weight: this.form.weight || undefined,
      bloodPressure: (this.form.systolic && this.form.diastolic)
        ? { systolic: this.form.systolic, diastolic: this.form.diastolic }
        : undefined,
      babyMovements: this.form.babyMovements || undefined,
      symptoms: this.form.symptoms,
      mood: this.form.mood,
      notes: this.form.notes
    };

    if (this.editMode && this.editingId) {
      this.pregnancyService.updateEntry(this.editingId, payload).subscribe({
        next: (updated) => {
          const idx = this.entries.findIndex(e => e._id === this.editingId);
          if (idx > -1) this.entries[idx] = updated;
          this.closeModal();
        },
        error: (err) => { console.error(err); this.formError = 'Failed to update.'; }
      });
    } else {
      this.pregnancyService.createEntry(payload).subscribe({
        next: (created) => { this.entries.unshift(created); this.closeModal(); },
        error: (err) => { console.error(err); this.formError = 'Failed to save.'; }
      });
    }
  }

  openEditModal(entry: PregnancyEntry) {
    this.form = {
      date: entry.date,
      week: entry.week,
      weight: entry.weight || null,
      systolic: entry.bloodPressure?.systolic || null,
      diastolic: entry.bloodPressure?.diastolic || null,
      babyMovements: entry.babyMovements || null,
      symptoms: [...entry.symptoms],
      mood: entry.mood,
      notes: entry.notes || ''
    };
    this.editingId = entry._id!;
    this.editMode = true;
    this.formError = '';
    this.showModal = true;
  }

  confirmDelete(id: string) { this.entryToDelete = id; this.showDeleteConfirm = true; }

  deleteEntry() {
    if (!this.entryToDelete) return;
    this.pregnancyService.deleteEntry(this.entryToDelete).subscribe({
      next: () => {
        this.entries = this.entries.filter(e => e._id !== this.entryToDelete);
        this.showDeleteConfirm = false;
        this.entryToDelete = null;
      },
      error: (err) => console.error(err)
    });
  }

  // ── Computed ───────────────────────────────────────────────

  get currentWeek(): number {
    if (!this.profile?.dueDate) return 0;
    const dueDate = new Date(this.profile.dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const week = 40 - Math.floor(daysUntilDue / 7);
    return Math.max(1, Math.min(42, week));
  }

  get daysUntilDue(): number {
    if (!this.profile?.dueDate) return 0;
    const diff = new Date(this.profile.dueDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  get trimester(): number {
    const w = this.currentWeek;
    if (w <= 13) return 1;
    if (w <= 26) return 2;
    return 3;
  }

  get trimesterLabel(): string {
    return `${this.trimester}${this.trimester === 1 ? 'st' : this.trimester === 2 ? 'nd' : 'rd'} Trimester`;
  }

  get pregnancyProgress(): number {
    return Math.min(Math.round((this.currentWeek / 40) * 100), 100);
  }

  get sortedEntries(): PregnancyEntry[] {
    return [...this.entries].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  get latestEntry(): PregnancyEntry | null {
    return this.sortedEntries[0] || null;
  }

  get currentBabySize(): { size: string; emoji: string; description: string } | null {
    const weeks = Object.keys(this.babySizeByWeek).map(Number).sort((a, b) => a - b);
    let match: number | null = null;
    for (const w of weeks) {
      if (this.currentWeek >= w) match = w;
    }
    return match !== null ? this.babySizeByWeek[match] : null;
  }

  getWeeklyMilestone(week: number): string {
    const milestones: Record<number, string> = {
      4:  'Embryo implants',
      8:  'Heart is beating',
      12: 'End of 1st trimester',
      16: 'Gender can be determined',
      20: 'Anatomy scan',
      24: 'Viability milestone',
      28: '3rd trimester begins',
      32: 'Brain developing rapidly',
      36: 'Near full term',
      37: 'Full term',
      40: 'Due date'
    };
    return milestones[week] || '';
  }

  getMoodIcon(m: number): string { return this.moodIcons[Math.round(m)] || 'sentiment_neutral'; }
  getMoodColor(m: number): string { return this.moodColors[Math.round(m)] || '#9ca3af'; }
  getMoodLabel(m: number): string { return this.moodLabels[Math.round(m)] || ''; }

  getSymptomIcon(key: PregnancySymptom): string {
    return this.allSymptoms.find(s => s.key === key)?.icon || 'circle';
  }

  getSymptomLabel(key: PregnancySymptom): string {
    return this.allSymptoms.find(s => s.key === key)?.label || key;
  }

  trackByEntry(_: number, e: PregnancyEntry) { return e._id; }
}
