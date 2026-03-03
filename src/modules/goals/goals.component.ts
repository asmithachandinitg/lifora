import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Goal, GoalStatus, GoalPriority, GoalCategory, Milestone } from './goals.model';
import { GoalsService } from './goals.service';
import { Router } from '@angular/router';
import { ModuleLinkService } from '../../shared/module-link.service';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.css']
})
export class GoalsComponent implements OnInit {

  goals: Goal[] = [];
  filteredGoals: Goal[] = [];
  activeFilter: GoalStatus | 'all' = 'all';
  activeCategory: GoalCategory | 'all' = 'all';
  showModal = false;
  showDeleteConfirm = false;
  goalToDelete: string | null = null;
  expandedGoals: Set<string> = new Set();
  editingGoal: Goal | null = null;
  loading = false;
  errorMsg = '';
showCompletionModal = false;
completedGoalTitle = '';
showReopenConfirm = false;
goalToReopen: Goal | null = null;
dropdownOpen = false;

  form: {
    title: string;
    description: string;
    category: GoalCategory;
    priority: GoalPriority;
    status: GoalStatus;
    progress: number;
    deadline: string;
    milestones: { title: string }[];
  } = this.getEmptyForm();

  formError = '';

  categories: GoalCategory[] = ['personal', 'career', 'health', 'finance', 'education', 'other'];
  priorities: GoalPriority[] = ['high', 'medium', 'low'];
  statuses: GoalStatus[] = ['not-started', 'in-progress', 'completed'];

  categoryIcons: Record<GoalCategory, string> = {
    personal: '🌱', career: '💼', health: '💪', finance: '💰', education: '📚', other: '✨'
  };

  // Material Icons equivalents
  categoryMIcons: Record<GoalCategory, string> = {
    personal: 'self_improvement',
    career: 'work',
    health: 'favorite',
    finance: 'savings',
    education: 'menu_book',
    other: 'star'
  };

  priorityMIcons: Record<GoalPriority, string> = {
    high: 'keyboard_double_arrow_up',
    medium: 'remove',
    low: 'keyboard_double_arrow_down'
  };

  priorityColors: Record<GoalPriority, string> = {
    high: '#ef4444', medium: '#f59e0b', low: '#22c55e'
  };

  statusColors: Record<GoalStatus, string> = {
    'not-started': '#d35ab5',
    'in-progress': '#0be5f5',
    'completed': '#22c55e'
  };

  statusLabels: Record<GoalStatus, string> = {
    'not-started': 'Not Started',
    'in-progress': 'In Progress',
    'completed': 'Completed'
  };

  goalToHabitCategory: Record<string, string> = {
  personal:  'personal',
  career:    'work',
  health:    'health',
  finance:   'finance',
  education: 'learning',
  other:     'personal'
};

  constructor(private goalsService: GoalsService,
    private moduleLinkService: ModuleLinkService,
    private router: Router) { }

  ngOnInit() {
    this.loadGoals();
  }

  loadGoals() {
    this.loading = true;
    this.goalsService.getGoals().subscribe({
      next: (data) => {
        this.goals = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.errorMsg = 'Failed to load goals.';
        this.loading = false;
      }
    });
  }

  getEmptyForm() {
    return {
      title: '',
      description: '',
      category: 'personal' as GoalCategory,
      priority: 'medium' as GoalPriority,
      status: 'not-started' as GoalStatus,
      progress: 0,
      deadline: '',
      milestones: [{ title: '' }]
    };
  }

  applyFilters() {
    this.filteredGoals = this.goals.filter(g => {
      const statusMatch = this.activeFilter === 'all' || g.status === this.activeFilter;
      const catMatch = this.activeCategory === 'all' || g.category === this.activeCategory;
      return statusMatch && catMatch;
    });
    this.filteredGoals.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }

  setFilter(filter: GoalStatus | 'all') {
    this.activeFilter = filter;
    this.applyFilters();
  }

  setCategoryFilter(cat: GoalCategory | 'all') {
    this.activeCategory = cat;
    this.applyFilters();
  }

  toggleExpand(id: string) {
    this.expandedGoals.has(id) ? this.expandedGoals.delete(id) : this.expandedGoals.add(id);
  }

  isExpanded(id: string) { return this.expandedGoals.has(id); }

  openAddModal() {
    this.editingGoal = null;
    this.form = this.getEmptyForm();
    this.formError = '';
    this.showModal = true;
  }

  openEditModal(goal: Goal) {
  if (goal.status === 'completed') {
    this.goalToReopen = goal;
    this.showReopenConfirm = true;
    return;
  }
  this.startEditing(goal);
  }

  startEditing(goal: Goal) {
  this.editingGoal = goal;

  this.form = {
    title: goal.title,
    description: goal.description,
    category: goal.category,
    priority: goal.priority,
    status: goal.status,
    progress: goal.progress,
    deadline: goal.deadline.toString().split('T')[0],
    milestones: goal.milestones.map(m => ({ title: m.title }))
  };

  this.formError = '';
  this.showModal = true;
}

  closeModal() { this.showModal = false; }

  addMilestone() { this.form.milestones.push({ title: '' }); }

  removeMilestone(index: number) { this.form.milestones.splice(index, 1); }

saveGoal() {
  if (!this.form.title.trim()) { 
    this.formError = 'Goal title is required.'; 
    return; 
  }

  if (!this.form.deadline) { 
    this.formError = 'Please set a deadline.'; 
    return; 
  }

  const payload = {
    title: this.form.title,
    description: this.form.description,
    category: this.form.category,
    priority: this.form.priority,
    status: this.form.status,
    progress: this.form.progress,
    deadline: this.form.deadline,
    milestones: this.form.milestones
      .filter(m => m.title.trim())
      .map(m => ({ title: m.title.trim(), completed: false }))
  };

  if (this.editingGoal) {
    this.goalsService.updateGoal(this.editingGoal._id!, payload).subscribe({
      next: (updated) => {

        const idx = this.goals.findIndex(g => g._id === updated._id);
        this.goals[idx] = updated;

        this.applyFilters();
        this.showModal = false; 

        if (updated.status === 'completed' || updated.progress === 100) {
          this.openCompletionModal(updated.title);
        }
      },
      error: () => this.formError = 'Failed to update goal.'
    });

  } else {

    this.goalsService.createGoal(payload).subscribe({
      next: (created) => {

        this.goals.push(created);

        this.applyFilters();
        this.showModal = false; 

        if (created.status === 'completed' || created.progress === 100) {
          this.openCompletionModal(created.title);
        }
      },
      error: () => this.formError = 'Failed to create goal.'
    });

  }
}

  confirmDelete(id: string) {
    this.goalToDelete = id;
    this.showDeleteConfirm = true;
  }

  deleteGoal() {
    if (!this.goalToDelete) return;
    this.goalsService.deleteGoal(this.goalToDelete).subscribe({
      next: () => {
        this.goals = this.goals.filter(g => g._id !== this.goalToDelete);
        this.applyFilters();
        this.showDeleteConfirm = false;
        this.goalToDelete = null;
      },
      error: () => {
        this.showDeleteConfirm = false;
      }
    });
  }


toggleMilestone(goal: Goal, milestoneId: string) {
  this.goalsService.toggleMilestone(goal._id!, milestoneId).subscribe({
    next: (updated) => {

      const total = updated.milestones.length;
      const completed = updated.milestones.filter(m => m.completed).length;

      if (total > 0) {
        updated.progress = Math.round((completed / total) * 100);

        if (updated.progress === 100 && goal.status !== 'completed') {
          updated.status = 'completed';
        } 
        else if (updated.progress > 0) {
          updated.status = 'in-progress';
        } 
        else {
          updated.status = 'not-started';
        }
      }

      const idx = this.goals.findIndex(g => g._id === updated._id);
      this.goals[idx] = updated;
      this.applyFilters();
    }
  });
}

openCompletionModal(title: string) {
  this.completedGoalTitle = title;
  this.showCompletionModal = true;
}

closeCompletionModal() {
  this.showCompletionModal = false;
  this.completedGoalTitle = '';
}

syncStatusAndProgress() {

  if (this.form.progress === 100 && this.form.status !== 'completed') {
    this.form.status = 'completed';
    return;
  }

  if (this.form.progress > 0 && this.form.progress < 100) {
    this.form.status = 'in-progress';
    return;
  }

  if (this.form.progress === 0) {
    this.form.status = 'not-started';
  }
}
  getDaysLeft(deadline: string): number {
    const today = new Date();
    const due = new Date(deadline);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  getDaysLeftLabel(deadline: string): string {
    const days = this.getDaysLeft(deadline);
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today!';
    if (days === 1) return '1 day left';
    return `${days} days left`;
  }

  getDaysLeftClass(deadline: string, status: GoalStatus): string {
    if (status === 'completed') return 'days-done';
    const days = this.getDaysLeft(deadline);
    if (days < 0) return 'days-overdue';
    if (days <= 7) return 'days-urgent';
    if (days <= 30) return 'days-soon';
    return 'days-ok';
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return '#22c55e';
    if (progress >= 50) return '#A78BFA';
    if (progress >= 25) return '#f59e0b';
    return '#e5e7eb';
  }

  getTotalStats() {
    return {
      total: this.goals.length,
      completed: this.goals.filter(g => g.status === 'completed').length,
      inProgress: this.goals.filter(g => g.status === 'in-progress').length,
      notStarted: this.goals.filter(g => g.status === 'not-started').length,
      avgProgress: this.goals.length
        ? Math.round(this.goals.reduce((a, g) => a + g.progress, 0) / this.goals.length)
        : 0
    };
  }

  trackByGoal(index: number, goal: Goal) { return goal._id; }

confirmReopen() {

  if (!this.goalToReopen) return;

  const goal = this.goalToReopen;

  const total = goal.milestones.length;
  const completed = goal.milestones.filter(m => m.completed).length;

  if (total > 0) {
    goal.progress = Math.round((completed / total) * 100);
  } else {
    goal.progress = 0;
  }

  if (goal.progress === 0) {
    goal.status = 'not-started';
  } else if (goal.progress < 100) {
    goal.status = 'in-progress';
  }

  this.showReopenConfirm = false;
  this.goalToReopen = null;

  this.startEditing(goal);
}

cancelReopen() {
  this.showReopenConfirm = false;
  this.goalToReopen = null;
}


toggleDropdown() {
  this.dropdownOpen = !this.dropdownOpen;
}

selectCategory(cat: GoalCategory | 'all', event: Event) {
  event.stopPropagation();
  this.activeCategory = cat;
  this.setCategoryFilter(cat);
  this.dropdownOpen = false;
}

createHabitFromGoal(goal: Goal, event: Event) {
  event.stopPropagation();
  this.moduleLinkService.setGoalLink({
    goalId:    goal._id!,
    goalTitle: goal.title,
    category:  this.goalToHabitCategory[goal.category] || 'personal'
  });
  this.router.navigate(['/habits']);
}

getLinkedHabitCount(goal: Goal): number {
  return goal.linkedHabitIds?.length || 0;
}
}
