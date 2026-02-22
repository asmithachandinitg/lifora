import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { DiaryService } from '../diary/diary.service';

@Component({
  selector: 'app-diary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    QuillModule
  ],
  templateUrl: './diary.component.html',
  styleUrls: ['./diary.component.css']
})
export class DiaryComponent implements OnInit {
  showForm = false;
  submitted = false;
  title = '';
  content = '';
  mood = '';
  entryDate: any = new Date();
  editingId: string | null = null;
  entries: any[] = [];
  wordCount = 0;
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
    private diaryService: DiaryService
  ) { }

  ngOnInit() {
    this.loadEntries();
    this.loadDraft();
  }

  openForm() {
    this.showForm = true;
  }

  closeForm() {
    this.showForm = false;
    this.resetForm();
  }

loadEntries() {
  this.diaryService
    .getEntries()
    .subscribe((res: any) => {

      // Calendar style sorting (old → new)
      this.entries = [...res].sort(
        (a, b) =>
          new Date(a.entryDate).getTime() -
          new Date(b.entryDate).getTime()
      );
    });
}

  onContentChange() {

    const text =
      this.content
        ?.replace(/<[^>]*>/g, '') || '';

    this.wordCount =
      text.trim()
        .split(/\s+/)
        .filter(w => w).length;

    this.saveDraft();
  }

  isValid() {
    return (
      this.title &&
      this.content &&
      this.mood &&
      this.entryDate
    );
  }

  saveEntry() {

    this.submitted = true;

    if (!this.isValid()) return;

    const payload = {
      title: this.title,
      content: this.content,
      mood: this.mood,
      entryDate: this.entryDate
    };

    if (this.editingId) {

      this.diaryService
        .updateEntry(
          this.editingId,
          payload
        )
        .subscribe(() => {
          this.afterSave();
        });

    } else {

      this.diaryService
        .createEntry(payload)
        .subscribe(() => {
          this.afterSave();
        });
    }
  }

  afterSave() {
  this.clearDraft();
  this.closeForm();
  this.loadEntries();

  setTimeout(() => {
    const container = document.querySelector('.entries');
    container?.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth'
    });
  }, 200);
}

  editEntry(entry: any) {
    this.title = entry.title;
    this.content = entry.content;
    this.mood = entry.mood;
    this.entryDate = entry.entryDate;
    this.editingId = entry._id;
    this.showForm = true;
  }

  resetForm() {
    this.title = '';
    this.content = '';
    this.mood = '';
    this.entryDate = new Date();
    this.editingId = null;
    this.submitted = false;
  }

  saveDraft() {

    const draft = {
      title: this.title,
      content: this.content,
      mood: this.mood,
      entryDate: this.entryDate,
      savedAt: Date.now()
    };

    localStorage.setItem(
      'lifora_draft',
      JSON.stringify(draft)
    );
  }

  loadDraft() {

    const draft =
      localStorage.getItem(
        'lifora_draft'
      );

    if (!draft) return;

    const data = JSON.parse(draft);

    const FIVE_HOURS =
      5 * 60 * 60 * 1000;

    if (
      Date.now() - data.savedAt >
      FIVE_HOURS
    ) {
      localStorage.removeItem(
        'lifora_draft'
      );
      return;
    }

    this.title = data.title;
    this.content = data.content;
    this.mood = data.mood;
    this.entryDate = data.entryDate;
  }

  clearDraft() {
    localStorage.removeItem(
      'lifora_draft'
    );
  }

  selectMood(value: string) {
    this.mood = value;

  }

  isContentEmpty(): boolean {
    const text = this.content?.replace(/<[^>]*>/g, '').trim();
    return !text;
  }

  getMoodIcon(mood: string): string {
    switch (mood) {
      case 'happy': return 'sentiment_very_satisfied';
      case 'sad': return 'sentiment_dissatisfied';
      case 'angry': return 'sentiment_very_dissatisfied';
      case 'excited': return 'mood';
      case 'neutral': return 'sentiment_neutral';
      default: return 'sentiment_neutral';
    }
  }

  deleteEntry(id: string) {

  const confirmDelete = confirm('Delete this entry?');

  if (!confirmDelete) return;

  this.diaryService
    .deleteEntry(id)
    .subscribe(() => {
      this.loadEntries();
    });
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

  this.diaryService
    .deleteEntry(this.deleteId)
    .subscribe(() => {
      this.closeDeleteModal();
      this.loadEntries();
    });
}

@HostListener('document:keydown.escape', ['$event'])
handleEscape() {
  if (this.showDeleteModal) {
    this.closeDeleteModal();
  }
}

}
