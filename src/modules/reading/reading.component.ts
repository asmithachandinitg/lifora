import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Book, BookStatus } from './reading.model';
import { ReadingService } from './reading.service';

@Component({
  selector: 'app-reading',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reading.component.html',
  styleUrls: ['./reading.component.css']
})
export class ReadingComponent implements OnInit {

  activeTab: 'all' | 'reading' | 'want' | 'completed' | 'dnf' = 'all';
  viewMode: 'grid' | 'list' = 'grid';
  showModal = false;
  showDeleteConfirm = false;
  entryToDelete: string | null = null;
  editMode = false;
  editingId: string | null = null;
  loading = false;
  error = '';
  formError = '';
statuses: BookStatus[] = ['reading', 'completed', 'want', 'dnf'];

  books: Book[] = [];
  searchQuery = '';
  tagsInput = '';
  selectedRating = 0;
  today = new Date().toISOString().split('T')[0];

  form = this.getEmptyForm();

  statusConfig: Record<BookStatus, { label: string; icon: string; color: string; badgeClass: string }> = {
    reading:   { label: 'Reading',      icon: '📖', color: '#8B5CF6', badgeClass: 'badge-reading'   },
    completed: { label: 'Completed',    icon: '✅', color: '#22c55e', badgeClass: 'badge-completed' },
    want:      { label: 'Want to Read', icon: '🔖', color: '#3b82f6', badgeClass: 'badge-want'      },
    dnf:       { label: 'Dropped',      icon: '🚫', color: '#ef4444', badgeClass: 'badge-dnf'       },
  };

  coverColors = ['cover-a', 'cover-b', 'cover-c', 'cover-d', 'cover-e'];

  constructor(private readingService: ReadingService) {}

  ngOnInit() { this.loadBooks(); }

  loadBooks() {
    this.loading = true;
    this.readingService.getBooks().subscribe({
      next: (data) => { this.books = data; this.loading = false; },
      error: (err) => { console.error(err); this.error = 'Failed to load books.'; this.loading = false; }
    });
  }

  onTabChange(tab: 'all' | 'reading' | 'want' | 'completed' | 'dnf') {
    this.activeTab = tab;
  }

  // ── Computed ──────────────────────────────────────────────

  get filteredBooks(): Book[] {
    let result = [...this.books];
    if (this.activeTab !== 'all') result = result.filter(b => b.status === this.activeTab);
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.genre.toLowerCase().includes(q)
      );
    }
    return result;
  }

  getBooksForStatus(status: BookStatus): Book[] {
    return this.activeTab === 'all'
      ? this.filteredBooks.filter(b => b.status === status)
      : this.activeTab === status ? this.filteredBooks : [];
  }

  get totalBooks():     number { return this.books.length; }
  get readingCount():   number { return this.books.filter(b => b.status === 'reading').length; }
  get completedCount(): number { return this.books.filter(b => b.status === 'completed').length; }
  get wantCount():      number { return this.books.filter(b => b.status === 'want').length; }

  getProgress(book: Book): number {
    if (!book.pagesTotal) return 0;
    return Math.round((book.pagesRead / book.pagesTotal) * 100);
  }

  getStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  getCoverColor(book: Book): string {
    if (!book._id) return 'cover-a';
    return this.coverColors[book._id.charCodeAt(book._id.length - 1) % this.coverColors.length];
  }

  trackById(_: number, b: Book) { return b._id; }

  // ── Form ──────────────────────────────────────────────────

  getEmptyForm(): Partial<Book> {
    return {
      title: '', author: '', status: 'want', genre: '',
      tags: [], pagesTotal: 0, pagesRead: 0,
      startDate: '', endDate: '', coverUrl: '',
      rating: 0, review: '', notes: ''
    };
  }

  openModal() {
    this.form = this.getEmptyForm();
    this.tagsInput = '';
    this.selectedRating = 0;
    this.formError = '';
    this.editMode = false;
    this.editingId = null;
    this.showModal = true;
  }

  openEditModal(book: Book) {
    this.form = {
      title:      book.title,
      author:     book.author,
      status:     book.status,
      genre:      book.genre,
      tags:       [...(book.tags || [])],
      pagesTotal: book.pagesTotal,
      pagesRead:  book.pagesRead,
      startDate:  book.startDate,
      endDate:    book.endDate,
      coverUrl:   book.coverUrl,
      rating:     book.rating,
      review:     book.review,
      notes:      book.notes,
    };
    this.tagsInput = (book.tags || []).join(', ');
    this.selectedRating = book.rating || 0;
    this.editingId = book._id!;
    this.editMode = true;
    this.formError = '';
    this.showModal = true;
  }

  closeModal() { this.showModal = false; this.editMode = false; this.editingId = null; }

  setRating(r: number) { this.selectedRating = r; this.form.rating = r; }

  saveBook() {
    if (!this.form.title?.trim()) { this.formError = 'Book title is required.'; return; }

    const payload: Partial<Book> = {
      ...this.form,
      title:  this.form.title!.trim(),
      tags:   this.tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      rating: this.selectedRating,
    };

    if (this.editMode && this.editingId) {
      this.readingService.updateBook(this.editingId, payload).subscribe({
        next: (updated) => {
          const idx = this.books.findIndex(b => b._id === this.editingId);
          if (idx > -1) this.books[idx] = updated;
          this.closeModal();
        },
        error: (err) => { console.error(err); this.formError = 'Failed to update.'; }
      });
    } else {
      this.readingService.createBook(payload).subscribe({
        next: (created) => { this.books.unshift(created); this.closeModal(); },
        error: (err) => { console.error(err); this.formError = 'Failed to save.'; }
      });
    }
  }

  confirmDelete(id: string) { this.entryToDelete = id; this.showDeleteConfirm = true; }

  deleteBook() {
    if (!this.entryToDelete) return;
    this.readingService.deleteBook(this.entryToDelete).subscribe({
      next: () => {
        this.books = this.books.filter(b => b._id !== this.entryToDelete);
        this.showDeleteConfirm = false;
        this.entryToDelete = null;
      },
      error: (err) => console.error(err)
    });
  }
}
