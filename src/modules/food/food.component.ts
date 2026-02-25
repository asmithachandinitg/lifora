import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FoodEntry, FoodItem, MealType } from './food.model';
import { FoodService } from './food.service';

@Component({
  selector: 'app-food',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './food.component.html',
  styleUrls: ['./food.component.css']
})
export class FoodComponent implements OnInit {

  activeTab: 'dashboard' | 'history' = 'dashboard';
  showModal = false;
  showDeleteConfirm = false;
  entryToDelete: string | null = null;
  editMode = false;
  editingId: string | null = null;
  showNutrition = false;       // toggle optional nutrition fields in modal
  expandedDays: Set<string> = new Set();

  entries: FoodEntry[] = [];
  form = this.getEmptyForm();
  formError = '';

  mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  mealIcons: Record<MealType, string> = {
    breakfast: 'free_breakfast',
    lunch:     'lunch_dining',
    dinner:    'dinner_dining',
    snack:     'cookie'
  };

  mealColors: Record<MealType, string> = {
    breakfast: '#f59e0b',
    lunch:     '#22c55e',
    dinner:    '#6366f1',
    snack:     '#ec4899'
  };

  constructor(private foodService: FoodService) {}

  ngOnInit() { this.loadEntries(); }

  loadEntries() {
    this.foodService.getFoodEntries().subscribe({
      next: (data) => { this.entries = data; },
      error: (err) => console.error(err)
    });
  }

  getEmptyForm() {
    const now  = new Date();
    const today = now.toISOString().split('T')[0];
    const pad   = (n: number) => String(n).padStart(2, '0');
    const time  = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    return {
      date:     today,
      mealType: 'breakfast' as MealType,
      time,
      notes:    '',
      items:    [this.getEmptyItem()]
    };
  }

  getEmptyItem(): FoodItem {
    return { name: '', quantity: '', calories: undefined, protein: undefined, carbs: undefined, fat: undefined };
  }

  addItem()          { this.form.items.push(this.getEmptyItem()); }
  removeItem(i: number) {
    if (this.form.items.length > 1) this.form.items.splice(i, 1);
  }

  openModal() {
    this.form = this.getEmptyForm();
    this.formError = '';
    this.showNutrition = false;
    this.editMode = false;
    this.editingId = null;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editMode = false;
    this.editingId = null;
  }

  saveEntry() {
    if (!this.form.items.some(i => i.name.trim())) {
      this.formError = 'Add at least one food item.';
      return;
    }

    // Strip empty nutrition fields
    const items = this.form.items
      .filter(i => i.name.trim())
      .map(i => ({
        name:     i.name.trim(),
        quantity: i.quantity?.trim() || undefined,
        calories: i.calories || undefined,
        protein:  i.protein  || undefined,
        carbs:    i.carbs    || undefined,
        fat:      i.fat      || undefined
      }));

    const payload: Partial<FoodEntry> = {
      date:     this.form.date,
      mealType: this.form.mealType,
      time:     this.form.time,
      items,
      notes:    this.form.notes.trim() || undefined
    };

    if (this.editMode && this.editingId) {
      this.foodService.updateFoodEntry(this.editingId, payload).subscribe({
        next: (updated) => {
          const idx = this.entries.findIndex(e => e._id === this.editingId);
          if (idx > -1) this.entries[idx] = updated;
          this.closeModal();
        },
        error: () => { this.formError = 'Failed to update.'; }
      });
    } else {
      this.foodService.createFoodEntry(payload).subscribe({
        next: (created) => { this.entries.unshift(created); this.closeModal(); },
        error: () => { this.formError = 'Failed to save.'; }
      });
    }
  }

  openEditModal(entry: FoodEntry) {
    this.form = {
      date:     entry.date,
      mealType: entry.mealType,
      time:     entry.time,
      notes:    entry.notes || '',
      items:    entry.items.map(i => ({ ...i }))
    };
    // Show nutrition toggle if any item has nutrition data
    this.showNutrition = entry.items.some(i => i.calories || i.protein || i.carbs || i.fat);
    this.editingId = entry._id!;
    this.editMode  = true;
    this.formError = '';
    this.showModal = true;
  }

  confirmDelete(id: string) { this.entryToDelete = id; this.showDeleteConfirm = true; }

  deleteEntry() {
    if (!this.entryToDelete) return;
    this.foodService.deleteFoodEntry(this.entryToDelete).subscribe({
      next: () => {
        this.entries = this.entries.filter(e => e._id !== this.entryToDelete);
        this.showDeleteConfirm = false;
        this.entryToDelete = null;
      },
      error: (err) => console.error(err)
    });
  }

  // ── Dashboard ────────────────────────────────────────────

  get todayStr(): string {
    return new Date().toISOString().split('T')[0];
  }

  get todayEntries(): FoodEntry[] {
    return this.sortedEntries.filter(e => e.date === this.todayStr);
  }

  get last7Days(): { date: string; count: number }[] {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = d.toISOString().split('T')[0];
      const count = this.entries.filter(e => e.date === date).length;
      result.push({ date, count });
    }
    return result;
  }

  getBarHeight(count: number): number {
    const max = Math.max(...this.last7Days.map(d => d.count), 1);
    return Math.round((count / max) * 100);
  }

  // ── History ──────────────────────────────────────────────

  get sortedEntries(): FoodEntry[] {
    return [...this.entries].sort((a, b) => {
      const dt = (e: FoodEntry) => new Date(`${e.date}T${e.time}`).getTime();
      return dt(b) - dt(a);
    });
  }

  // Group entries by date for history view
  get groupedByDay(): { date: string; entries: FoodEntry[] }[] {
    const map = new Map<string, FoodEntry[]>();
    for (const e of this.sortedEntries) {
      if (!map.has(e.date)) map.set(e.date, []);
      map.get(e.date)!.push(e);
    }
    return Array.from(map.entries()).map(([date, entries]) => ({ date, entries }));
  }

  toggleDay(date: string) {
    if (this.expandedDays.has(date)) this.expandedDays.delete(date);
    else this.expandedDays.add(date);
  }

  isDayExpanded(date: string): boolean {
    return this.expandedDays.has(date);
  }

  getMealColor(m: MealType): string { return this.mealColors[m] || '#9ca3af'; }
  getMealIcon(m: MealType): string  { return this.mealIcons[m]  || 'restaurant'; }

  formatTime(time: string): string {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  }

  hasNutrition(items: FoodItem[]): boolean {
    return items.some(i => i.calories || i.protein || i.carbs || i.fat);
  }

  totalCalories(items: FoodItem[]): number {
    return items.reduce((s, i) => s + (i.calories || 0), 0);
  }

  getTotalItems(entries: FoodEntry[]): number {
  return entries.reduce((s, e) => s + e.items.length, 0);
}

  trackByEntry(_: number, e: FoodEntry) { return e._id; }
  trackByDate(_: number, g: any)        { return g.date; }
  
}
