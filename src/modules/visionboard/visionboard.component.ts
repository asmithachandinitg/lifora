// src/modules/visionboard/visionboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisionboardService } from './visionboard.service';
import { VisionItem, VisionCategory } from './visionboard.model';
import { ToastService } from '../../core/auth/toast.service';

@Component({
  selector: 'app-visionboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visionboard.component.html',
  styleUrls: ['./visionboard.component.css']
})
export class VisionboardComponent implements OnInit {

  items: VisionItem[] = [];
  filtered: VisionItem[] = [];
  loading = true;
  showForm = false;
  editingId: string | null = null;
  confirmDeleteId: string | null = null;
  previewItem: VisionItem | null = null;

  activeCategory: VisionCategory | 'all' = 'all';
  showAchieved = false;

  form: Partial<VisionItem> = this.emptyForm();

  categories: { value: VisionCategory | 'all'; label: string; icon: string; gradient: string; color: string }[] = [
    { value: 'all',           label: 'All',          icon: 'apps',          gradient: 'linear-gradient(135deg,#8B5CF6,#6366f1)', color: '#8B5CF6' },
    { value: 'career',        label: 'Career',        icon: 'work',          gradient: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#3b82f6' },
    { value: 'health',        label: 'Health',        icon: 'favorite',      gradient: 'linear-gradient(135deg,#ef4444,#f43f5e)', color: '#ef4444' },
    { value: 'finance',       label: 'Finance',       icon: 'savings',       gradient: 'linear-gradient(135deg,#10b981,#059669)', color: '#10b981' },
    { value: 'personal',      label: 'Personal',      icon: 'self_improvement', gradient: 'linear-gradient(135deg,#8B5CF6,#a855f7)', color: '#8B5CF6' },
    { value: 'travel',        label: 'Travel',        icon: 'flight',        gradient: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', color: '#0ea5e9' },
    { value: 'relationships', label: 'Relationships', icon: 'people',        gradient: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#f59e0b' },
    { value: 'learning',      label: 'Learning',      icon: 'school',        gradient: 'linear-gradient(135deg,#84cc16,#22c55e)', color: '#84cc16' },
  ];

  formCategories: { value: VisionCategory; label: string; icon: string; gradient: string; color: string }[] = [
  { value: 'career',        label: 'Career',        icon: 'work',             gradient: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: '#3b82f6' },
  { value: 'health',        label: 'Health',        icon: 'favorite',         gradient: 'linear-gradient(135deg,#ef4444,#f43f5e)', color: '#ef4444' },
  { value: 'finance',       label: 'Finance',       icon: 'savings',          gradient: 'linear-gradient(135deg,#10b981,#059669)', color: '#10b981' },
  { value: 'personal',      label: 'Personal',      icon: 'self_improvement', gradient: 'linear-gradient(135deg,#8B5CF6,#a855f7)', color: '#8B5CF6' },
  { value: 'travel',        label: 'Travel',        icon: 'flight',           gradient: 'linear-gradient(135deg,#0ea5e9,#06b6d4)', color: '#0ea5e9' },
  { value: 'relationships', label: 'Relationships', icon: 'people',           gradient: 'linear-gradient(135deg,#f59e0b,#f97316)', color: '#f59e0b' },
  { value: 'learning',      label: 'Learning',      icon: 'school',           gradient: 'linear-gradient(135deg,#84cc16,#22c55e)', color: '#84cc16' },
];

  constructor(
    private visionService: VisionboardService,
    private toast: ToastService
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.visionService.getAll().subscribe({
      next: (data) => {
        this.items = data;
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilters() {
    let result = [...this.items];
    if (this.activeCategory !== 'all') {
      result = result.filter(i => i.category === this.activeCategory);
    }
    if (!this.showAchieved) {
      result = result.filter(i => !i.achieved);
    }
    this.filtered = result;
  }

  openAdd() {
    this.form = this.emptyForm();
    this.editingId = null;
    this.showForm = true;
  }

  openEdit(item: VisionItem) {
    this.form = { ...item };
    this.editingId = item._id!;
    this.showForm = true;
  }

  openPreview(item: VisionItem) {
    this.previewItem = item;
  }

  closeForm() { this.showForm = false; this.editingId = null; }
  closePreview() { this.previewItem = null; }

  save() {
    if (!this.form.title?.trim()) {
      this.toast.show('Title is required', 'warning');
      return;
    }
    if (!this.form.category) {
      this.toast.show('Please select a category', 'warning');
      return;
    }

    const payload = { ...this.form };

    if (this.editingId) {
      this.visionService.update(this.editingId, payload).subscribe({
        next: (updated) => {
          const idx = this.items.findIndex(i => i._id === this.editingId);
          if (idx > -1) this.items[idx] = updated;
          this.applyFilters();
          this.closeForm();
          this.toast.show('Goal updated', 'success');
        },
        error: () => this.toast.show('Failed to update', 'error')
      });
    } else {
      this.visionService.create(payload).subscribe({
        next: (created) => {
          this.items.unshift(created);
          this.applyFilters();
          this.closeForm();
          this.toast.show('Goal added to your vision board! ✨', 'success');
        },
        error: () => this.toast.show('Failed to save', 'error')
      });
    }
  }

  markAchieved(item: VisionItem) {
    this.visionService.markAchieved(item._id!).subscribe({
      next: (updated) => {
        const idx = this.items.findIndex(i => i._id === item._id);
        if (idx > -1) this.items[idx] = updated;
        this.applyFilters();
        this.toast.show('🎉 Congratulations! Goal achieved!', 'success');
      },
      error: () => this.toast.show('Failed to update', 'error')
    });
  }

  confirmDelete(id: string) { this.confirmDeleteId = id; }
  cancelDelete() { this.confirmDeleteId = null; }

  delete() {
    if (!this.confirmDeleteId) return;
    this.visionService.delete(this.confirmDeleteId).subscribe({
      next: () => {
        this.items = this.items.filter(i => i._id !== this.confirmDeleteId);
        this.applyFilters();
        this.confirmDeleteId = null;
        this.toast.show('Goal removed', 'success');
      },
      error: () => this.toast.show('Failed to delete', 'error')
    });
  }

  getCategoryConfig(value: string) {
    return this.categories.find(c => c.value === value) || this.categories[0];
  }

  get totalGoals() { return this.items.length; }
  get achievedGoals() { return this.items.filter(i => i.achieved).length; }
  get progressPct() {
    if (!this.totalGoals) return 0;
    return Math.round((this.achievedGoals / this.totalGoals) * 100);
  }

  emptyForm(): Partial<VisionItem> {
    return {
      title: '',
      description: '',
      category: 'personal',
      imageUrl: '',
      targetDate: '',
      achieved: false,
      achievedDate: '',
      affirmation: ''
    };
  }
}
