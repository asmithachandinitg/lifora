import { Component } from '@angular/core';
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
  status: 'pending' | 'completed';
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, QuillModule],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent {

  showModal = false;

  tasks: Task[] = [];

  existingTags: string[] = [];
  confirmModal = false;
  confirmType: 'complete' | 'delete' | null = null;
  selectedTask: any = null;
  selectedIndex: number = -1;

  newTask = {
    title: '',
    description: '',
    dueDate: '',
    priority: 0,
    tags: [] as string[],
    reminderEnabled: false,
    reminderTime: '',
    status: 'pending' as 'pending'
  };

  tagInput = '';
  errors: any = {};

  quillConfig = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['clean']
    ]
  };

  constructor(
    private taskService: TaskService
  ) { }

  ngOnInit() {
    this.loadTasks();
    this.loadTags();
  }

  loadTasks() {
    this.taskService.getTasks().subscribe({
      next: (data) => {
        this.tasks = data;
      },
      error: (err) => {
        console.error(err);
      }
    });
  }

  openModal() { this.showModal = true; }
  closeModal() { this.showModal = false; }

  validate(): boolean {
    this.errors = {};

    if (!this.newTask.title.trim()) {
      this.errors.title = 'Title is required';
    }

    if (!this.newTask.description.trim()) {
      this.errors.description = 'Description is required';
    }

    if (!this.newTask.priority) {
      this.errors.priority = 'Priority is required';
    }

    return Object.keys(this.errors).length === 0;
  }

  addTag() {
    const tag = this.tagInput.trim();
    if (!tag) return;

    this.taskService.createTag(tag).subscribe({
      next: (res) => {

        if (!this.existingTags.includes(res.name)) {
          this.existingTags.push(res.name);
        }

        if (!this.newTask.tags.includes(res.name)) {
          this.newTask.tags.push(res.name);
        }

        this.tagInput = '';
      }
    });
  }

  selectExistingTag(tag: string) {
    if (!this.newTask.tags.includes(tag)) {
      this.newTask.tags.push(tag);
    }
  }

  removeTag(tag: string) {
    this.newTask.tags = this.newTask.tags.filter(t => t !== tag);
  }

  resetForm() {
    this.newTask = {
      title: '',
      description: '',
      dueDate: '',
      priority: 0,
      tags: [],
      reminderEnabled: false,
      reminderTime: '',
      status: 'pending'
    };
    this.tagInput = '';
    this.errors = {};
  }

  isOverdue(task: any): boolean {
    if (!task.dueDate) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const taskDate = new Date(task.dueDate);
    taskDate.setHours(0, 0, 0, 0);

    return task.status === 'pending' && taskDate < today;
  }

  addTask() {
    if (!this.validate()) return;

    const task: Task = {
      title: this.newTask.title,
      description: this.newTask.description,
      dueDate: this.newTask.dueDate ? new Date(this.newTask.dueDate) : null,
      priority: this.newTask.priority,
      tags: [...this.newTask.tags],
      reminderEnabled: this.newTask.reminderEnabled,
      reminderTime: this.newTask.reminderEnabled && this.newTask.reminderTime
        ? new Date(this.newTask.reminderTime)
        : null,
      status: 'pending'
    };

    this.taskService.createTask(task).subscribe({
      next: (createdTask) => {
        this.tasks.unshift(createdTask);
        this.resetForm();
        this.closeModal();
      },
      error: (err) => console.error(err)
    });
  }

  deleteTask(index: number) {
    const task = this.tasks[index];
    if (!task._id) return;

    this.taskService.deleteTask(task._id).subscribe(() => {
      this.tasks.splice(index, 1);
    });
  }

  confirmComplete(task: any, index: number) {
    if (task.status === 'completed') return;

    this.selectedTask = task;
    this.selectedIndex = index;
    this.confirmType = 'complete';
    this.confirmModal = true;
  }

  confirmDelete(task: any, index: number) {
    this.selectedTask = task;
    this.selectedIndex = index;
    this.confirmType = 'delete';
    this.confirmModal = true;
  }

  closeConfirm() {
    this.confirmModal = false;
    this.selectedTask = null;
    this.selectedIndex = -1;
    this.confirmType = null;
  }

  confirmAction() {
    if (!this.selectedTask) return;

    if (this.confirmType === 'complete') {

      this.taskService.updateTask(this.selectedTask._id!, {
        ...this.selectedTask,
        status: 'completed'
      }).subscribe(updated => {
        this.tasks[this.selectedIndex] = updated;
        this.closeConfirm();
      });

    }

    if (this.confirmType === 'delete') {

      this.taskService.deleteTask(this.selectedTask._id!)
        .subscribe(() => {
          this.tasks.splice(this.selectedIndex, 1);
          this.closeConfirm();
        });
    }
  }

  loadTags() {
    this.taskService.getTags().subscribe({
      next: (tags) => {
        this.existingTags = tags;
      },
      error: (err) => {
        console.error('Tag fetch error:', err);
      }
    });
  }
}
