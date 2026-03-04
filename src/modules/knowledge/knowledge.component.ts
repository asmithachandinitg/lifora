// src/modules/knowledge/knowledge.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeEntry, KnowledgeCategory, SourceType } from './knowledge.model';
import { ToastService } from '../../core/auth/toast.service';

@Component({
  selector: 'app-knowledge',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './knowledge.component.html',
  styleUrls: ['./knowledge.component.css']
})
export class KnowledgeComponent implements OnInit {

  entries: KnowledgeEntry[] = [];
  filtered: KnowledgeEntry[] = [];
  loading = true;
  showForm = false;
  editingId: string | null = null;
  confirmDeleteId: string | null = null;

  // Search & filter
  searchQuery = '';
  activeCategory = 'all';
  activeSource = 'all';

  // Tag input
  tagInput = '';

  // Form
  form: Partial<KnowledgeEntry> = this.emptyForm();

  categories: { value: KnowledgeCategory | 'all'; label: string; icon: string; color: string }[] = [
    { value: 'all',          label: 'All',          icon: 'apps',            color: '#8B5CF6' },
    { value: 'technology',   label: 'Technology',   icon: 'computer',        color: '#3b82f6' },
    { value: 'science',      label: 'Science',      icon: 'science',         color: '#10b981' },
    { value: 'health',       label: 'Health',       icon: 'favorite',        color: '#ef4444' },
    { value: 'finance',      label: 'Finance',      icon: 'savings',         color: '#f59e0b' },
    { value: 'productivity', label: 'Productivity', icon: 'bolt',            color: '#8B5CF6' },
    { value: 'philosophy',   label: 'Philosophy',   icon: 'psychology',      color: '#6366f1' },
    { value: 'history',      label: 'History',      icon: 'history_edu',     color: '#84cc16' },
    { value: 'other',        label: 'Other',        icon: 'category',        color: '#9ca3af' },
  ];

  sourceTypes: { value: SourceType; label: string; icon: string }[] = [
    { value: 'book',    label: 'Book',    icon: 'menu_book' },
    { value: 'course',  label: 'Course',  icon: 'school' },
    { value: 'article', label: 'Article', icon: 'article' },
    { value: 'video',   label: 'Video',   icon: 'play_circle' },
    { value: 'podcast', label: 'Podcast', icon: 'podcasts' },
    { value: 'other',   label: 'Other',   icon: 'category' },
  ];

  constructor(
    private knowledgeService: KnowledgeService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.knowledgeService.getAll().subscribe({
      next: (data) => {
        this.entries = data;
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilters() {
    let result = [...this.entries];

    if (this.activeCategory !== 'all') {
      result = result.filter(e => e.category === this.activeCategory);
    }
    if (this.activeSource !== 'all') {
      result = result.filter(e => e.sourceType === this.activeSource);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.notes.toLowerCase().includes(q) ||
        e.tags.some(t => t.includes(q)) ||
        e.source.toLowerCase().includes(q)
      );
    }

    this.filtered = result;
  }

  openAdd() {
    this.form = this.emptyForm();
    this.tagInput = '';
    this.editingId = null;
    this.showForm = true;
  }

  openEdit(entry: KnowledgeEntry) {
    this.form = { ...entry, keyTakeaways: [...entry.keyTakeaways], tags: [...entry.tags] };
    this.tagInput = '';
    this.editingId = entry._id!;
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.editingId = null;
  }

  addTakeaway() {
    if (!this.form.keyTakeaways) this.form.keyTakeaways = [];
    this.form.keyTakeaways.push('');
  }

  removeTakeaway(index: number) {
    this.form.keyTakeaways?.splice(index, 1);
  }

  trackTakeaway(index: number) { return index; }

  addTag() {
    const tag = this.tagInput.trim().toLowerCase();
    if (!tag) return;
    if (!this.form.tags) this.form.tags = [];
    if (!this.form.tags.includes(tag)) this.form.tags.push(tag);
    this.tagInput = '';
  }

  removeTag(tag: string) {
    this.form.tags = this.form.tags?.filter(t => t !== tag);
  }

  onTagKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      this.addTag();
    }
  }

  save() {
    if (!this.form.title?.trim()) {
      this.toast.show('Title is required', 'warning');
      return;
    }

    const payload = { ...this.form };

    if (this.editingId) {
      this.knowledgeService.update(this.editingId, payload).subscribe({
        next: (updated) => {
          const idx = this.entries.findIndex(e => e._id === this.editingId);
          if (idx > -1) this.entries[idx] = updated;
          this.applyFilters();
          this.closeForm();
          this.toast.show('Entry updated', 'success');
        },
        error: () => this.toast.show('Failed to update entry', 'error')
      });
    } else {
      this.knowledgeService.create(payload).subscribe({
        next: (created) => {
          this.entries.unshift(created);
          this.applyFilters();
          this.closeForm();
          this.toast.show('Entry saved', 'success');
        },
        error: () => this.toast.show('Failed to save entry', 'error')
      });
    }
  }

  confirmDelete(id: string) {
    this.confirmDeleteId = id;
  }

  cancelDelete() {
    this.confirmDeleteId = null;
  }

  delete() {
    if (!this.confirmDeleteId) return;
    this.knowledgeService.delete(this.confirmDeleteId).subscribe({
      next: () => {
        this.entries = this.entries.filter(e => e._id !== this.confirmDeleteId);
        this.applyFilters();
        this.confirmDeleteId = null;
        this.toast.show('Entry deleted', 'success');
      },
      error: () => this.toast.show('Failed to delete entry', 'error')
    });
  }

  getCategoryConfig(value: string) {
    return this.categories.find(c => c.value === value) || this.categories[this.categories.length - 1];
  }

  getSourceConfig(value: string) {
    return this.sourceTypes.find(s => s.value === value) || this.sourceTypes[this.sourceTypes.length - 1];
  }

  stars(rating: number | null): number[] {
    return [1, 2, 3, 4, 5];
  }

  emptyForm(): Partial<KnowledgeEntry> {
    return {
      title: '',
      category: 'other',
      sourceType: 'book',
      source: '',
      notes: '',
      keyTakeaways: [''],
      tags: [],
      rating: null,
      date: new Date().toISOString().split('T')[0]
    };
  }

  get totalEntries() { return this.entries.length; }
  get totalTags() {
    const all = this.entries.flatMap(e => e.tags);
    return new Set(all).size;
  }
}
