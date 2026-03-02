import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { Router } from '@angular/router';
import { DiaryService } from '../diary/diary.service';
import { ModuleLinkService } from '../../shared/module-link.service';

@Component({
  selector: 'app-diary',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule],
  templateUrl: './diary.component.html',
  styleUrls: ['./diary.component.css']
})
export class DiaryComponent implements OnInit {

  showForm  = false;
  submitted = false;
  title     = '';
  content   = '';
  mood      = '';
  entryDate: any = new Date();
  editingId: string | null = null;
  entries:   any[] = [];
  wordCount  = 0;

  // ── Travel link state ──────────────────────────────
  linkedTripId:   string | null = null;
  linkedTripName: string | null = null;
  // ──────────────────────────────────────────────────

  quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ size: ['small', false, 'large'] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean']
    ]
  };

  showDeleteModal = false;
  deleteId: string | null = null;

  constructor(
    private diaryService: DiaryService,
    private moduleLinkService: ModuleLinkService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadEntries();
    this.loadDraft();

    // ── Pick up any pending travel link ──
    const link = this.moduleLinkService.consumeTravelLink();
    if (link) {
      this.linkedTripId   = link.tripId;
      this.linkedTripName = link.tripName;
      this.entryDate      = link.date;         // pre-fill date to match trip
      this.title          = `${link.tripName} — Travel Journal`; // helpful default title
      this.openForm();
    }
  }

  openForm() {
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.resetForm();
  }

  clearTravelLink() {
    this.linkedTripId   = null;
    this.linkedTripName = null;
  }

  loadEntries() {
    this.diaryService.getEntries().subscribe((res: any) => {
      this.entries = [...res].sort(
        (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
      );
    });
  }

  onContentChange() {
    const text  = this.content?.replace(/<[^>]*>/g, '') || '';
    this.wordCount = text.trim().split(/\s+/).filter(w => w).length;
    this.saveDraft();
  }

  isValid() {
    return this.title && this.content && this.mood && this.entryDate;
  }

  saveEntry() {
    this.submitted = true;
    if (!this.isValid()) return;

    const payload: any = {
      title:     this.title,
      content:   this.content,
      mood:      this.mood,
      entryDate: this.entryDate
    };

    // ── Attach travel link if present ──
    if (this.linkedTripId) {
      payload.linkedTripId   = this.linkedTripId;
      payload.linkedTripName = this.linkedTripName;
    }

    if (this.editingId) {
      this.diaryService.updateEntry(this.editingId, payload).subscribe(() => this.afterSave());
    } else {
      this.diaryService.createEntry(payload).subscribe(() => this.afterSave());
    }
  }

  afterSave() {
    this.clearDraft();
    this.closeForm();
    this.loadEntries();
    setTimeout(() => {
      const container = document.querySelector('.entries');
      container?.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }, 200);
  }

  editEntry(entry: any) {
    this.title          = entry.title;
    this.content        = entry.content;
    this.mood           = entry.mood;
    this.entryDate      = entry.entryDate;
    this.editingId      = entry._id;
    this.linkedTripId   = entry.linkedTripId   || null;
    this.linkedTripName = entry.linkedTripName || null;
    this.showForm       = true;
  }

  resetForm() {
    this.title          = '';
    this.content        = '';
    this.mood           = '';
    this.entryDate      = new Date();
    this.editingId      = null;
    this.submitted      = false;
    this.linkedTripId   = null;
    this.linkedTripName = null;
  }

  saveDraft() {
    const draft = {
      title: this.title, content: this.content, mood: this.mood,
      entryDate: this.entryDate, savedAt: Date.now()
    };
    localStorage.setItem('lifora_draft', JSON.stringify(draft));
  }

  loadDraft() {
    const raw = localStorage.getItem('lifora_draft');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Date.now() - data.savedAt > 5 * 60 * 60 * 1000) {
      localStorage.removeItem('lifora_draft');
      return;
    }
    this.title     = data.title;
    this.content   = data.content;
    this.mood      = data.mood;
    this.entryDate = data.entryDate;
  }

  clearDraft() {
    localStorage.removeItem('lifora_draft');
  }

  selectMood(value: string) { this.mood = value; }

  isContentEmpty(): boolean {
    return !this.content?.replace(/<[^>]*>/g, '').trim();
  }

  getMoodIcon(mood: string): string {
    const map: Record<string, string> = {
      happy:   'sentiment_very_satisfied',
      sad:     'sentiment_dissatisfied',
      angry:   'sentiment_very_dissatisfied',
      excited: 'mood',
      neutral: 'sentiment_neutral'
    };
    return map[mood] || 'sentiment_neutral';
  }

  openDeleteModal(id: string) {
    this.deleteId = id;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.deleteId = null;
    this.showDeleteModal = false;
  }

  confirmDelete() {
    if (!this.deleteId) return;
    this.diaryService.deleteEntry(this.deleteId).subscribe(() => {
      this.closeDeleteModal();
      this.loadEntries();
    });
  }

  goToTravel(tripId: string) {
    this.router.navigate(['/travel'], { queryParams: { highlightTrip: tripId } });
  }

  @HostListener('document:keydown.escape')
  handleEscape() {
    if (this.showDeleteModal) this.closeDeleteModal();
  }
}
