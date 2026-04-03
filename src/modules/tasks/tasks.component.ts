import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { TaskService } from './tasks.service';

interface Task {
  _id?: string;
  title: string;
  description: string;
  dueDate: Date | null;
  priority: number;
  tags: string[];
  reminderEnabled: boolean;
  reminderTime: Date | null;
  status: 'pending' | 'in-progress' | 'completed';
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit {

  showModal = false;
  editMode = false;
  editingId: string | null = null;
  loading = false;

  tasks: Task[] = [];
  existingTags: string[] = [];

  confirmModal = false;
  confirmType: 'complete' | 'delete' | null = null;
  selectedTask: any = null;
  selectedIndex: number = -1;

  // ── Filters ────────────────────────────────────────────────
  filterPriority: number = 0;
  sortBy: 'dueDate' | 'priority' | 'createdAt' = 'createdAt';

  newTask = this.emptyTask();
  tagInput = '';
  errors: any = {};

  quillConfig = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean']
    ]
  };

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    this.loadTasks();
    this.loadTags();
  }

  emptyTask() {
    return {
      title: '',
      description: '',
      dueDate: '',
      priority: 0,
      tags: [] as string[],
      reminderEnabled: false,
      reminderTime: '',
      status: 'pending' as 'pending'
    };
  }

  loadTasks() {
    this.loading = true;
    this.taskService.getTasks().subscribe({
      next: (data) => { this.tasks = data; this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; }
    });
  }

  // ── Filtered + sorted columns ──────────────────────────────
  private get filtered(): Task[] {
    let list = [...this.tasks];
    if (this.filterPriority) list = list.filter(t => t.priority === this.filterPriority);
    if (this.sortBy === 'priority') {
      list.sort((a, b) => b.priority - a.priority);
    } else if (this.sortBy === 'dueDate') {
      list.sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }
    return list;
  }

  get pendingTasks():    Task[] { return this.filtered.filter(t => t.status === 'pending'); }
  get inProgressTasks(): Task[] { return this.filtered.filter(t => t.status === 'in-progress'); }
  get completedTasks():  Task[] { return this.filtered.filter(t => t.status === 'completed'); }

  // ── Modal ──────────────────────────────────────────────────
  openModal() {
    this.newTask = this.emptyTask();
    this.errors = {};
    this.editMode = false;
    this.editingId = null;
    this.showModal = true;
  }

  openEditModal(task: Task) {
    this.newTask = {
      title: task.title,
      description: task.description,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      priority: task.priority,
      tags: [...task.tags],
      reminderEnabled: task.reminderEnabled,
      reminderTime: task.reminderTime
        ? new Date(task.reminderTime).toISOString().slice(0, 16)
        : '',
      status: task.status as any
    };
    this.editingId = task._id!;
    this.editMode = true;
    this.errors = {};
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editMode = false;
    this.editingId = null;
  }

  validate(): boolean {
    this.errors = {};
    if (!this.newTask.title.trim())       this.errors.title = 'Title is required';
    if (!this.newTask.description.trim()) this.errors.description = 'Description is required';
    if (!this.newTask.priority)           this.errors.priority = 'Priority is required';
    return Object.keys(this.errors).length === 0;
  }

  saveTask() {
    if (!this.validate()) return;

    const payload: Task = {
      title: this.newTask.title,
      description: this.newTask.description,
      dueDate: this.newTask.dueDate ? new Date(this.newTask.dueDate) : null,
      priority: this.newTask.priority,
      tags: [...this.newTask.tags],
      reminderEnabled: this.newTask.reminderEnabled,
      reminderTime: this.newTask.reminderEnabled && this.newTask.reminderTime
        ? new Date(this.newTask.reminderTime) : null,
      status: 'pending'
    };

    if (this.editMode && this.editingId) {
      this.taskService.updateTask(this.editingId, payload).subscribe({
        next: (updated) => {
          const idx = this.tasks.findIndex(t => t._id === this.editingId);
          if (idx > -1) this.tasks[idx] = updated;
          this.closeModal();
        },
        error: (err) => console.error(err)
      });
    } else {
      this.taskService.createTask(payload).subscribe({
        next: (created) => { this.tasks.unshift(created); this.closeModal(); },
        error: (err) => console.error(err)
      });
    }
  }

  // ── Move between kanban columns ────────────────────────────
  moveTask(task: Task, status: 'pending' | 'in-progress' | 'completed') {
    this.taskService.updateTask(task._id!, { ...task, status }).subscribe(updated => {
      const idx = this.tasks.findIndex(t => t._id === task._id);
      if (idx > -1) this.tasks[idx] = updated;
    });
  }

  // ── Tags ───────────────────────────────────────────────────
  addTag() {
    const tag = this.tagInput.trim();
    if (!tag) return;
    this.taskService.createTag(tag).subscribe({
      next: (res) => {
        if (!this.existingTags.includes(res.name)) this.existingTags.push(res.name);
        if (!this.newTask.tags.includes(res.name)) this.newTask.tags.push(res.name);
        this.tagInput = '';
      }
    });
  }

  selectExistingTag(tag: string) {
    if (tag && !this.newTask.tags.includes(tag)) this.newTask.tags.push(tag);
  }

  removeTag(tag: string) {
    this.newTask.tags = this.newTask.tags.filter(t => t !== tag);
  }

  loadTags() {
    this.taskService.getTags().subscribe({
      next: (tags) => { this.existingTags = tags; },
      error: (err) => console.error('Tag fetch error:', err)
    });
  }

  // ── Delete / Complete confirm ──────────────────────────────
  confirmDelete(task: any) {
    this.selectedTask = task;
    this.confirmType = 'delete';
    this.confirmModal = true;
  }

  closeConfirm() {
    this.confirmModal = false;
    this.selectedTask = null;
    this.confirmType = null;
  }

  confirmAction() {
    if (!this.selectedTask) return;
    if (this.confirmType === 'delete') {
      this.taskService.deleteTask(this.selectedTask._id!).subscribe(() => {
        this.tasks = this.tasks.filter(t => t._id !== this.selectedTask._id);
        this.closeConfirm();
      });
    }
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'completed') return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(task.dueDate); d.setHours(0, 0, 0, 0);
    return d < today;
  }

  priorityLabel(p: number): string {
    return ['', 'Normal', 'Low', 'Medium', 'High'][p] || '';
  }
}
