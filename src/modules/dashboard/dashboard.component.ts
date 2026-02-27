import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from './dashboard.service';
import { RecentActivity, UpcomingTask } from './dashboard.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  loading = true;
  today = new Date();
  todayStr = new Date().toISOString().split('T')[0];

  // ── Stats ──────────────────────────────────────────────────
  habitsCompleted = 0;
  habitsTotal = 0;
  caloriesToday = 0;
  tasksDueToday = 0;
  moodToday: string | null = null;
  workoutsThisWeek = 0;
  foodLoggedToday = 0;

  // ── Today's Habits ─────────────────────────────────────────
  todayHabits: { name: string; icon: string; color: string; completed: boolean }[] = [];

  // ── Recent Activity ────────────────────────────────────────
  recentActivity: RecentActivity[] = [];

  // ── Upcoming Tasks ─────────────────────────────────────────
  upcomingTasks: UpcomingTask[] = [];

  // ── Quote ──────────────────────────────────────────────────
  quote = { text: '', author: '' };

  private quotes = [
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Act as if what you do makes a difference. It does.", author: "William James" },
    { text: "Little by little, one travels far.", author: "J.R.R. Tolkien" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
    { text: "Progress, not perfection.", author: "Unknown" },
    { text: "Small daily improvements lead to stunning results.", author: "Robin Sharma" },
  ];

  moodConfig: Record<string, { icon: string; color: string; label: string }> = {
    great:   { icon: '😄', color: '#10b981', label: 'Great' },
    good:    { icon: '🙂', color: '#8B5CF6', label: 'Good' },
    okay:    { icon: '😐', color: '#f59e0b', label: 'Okay' },
    bad:     { icon: '😔', color: '#ef4444', label: 'Bad' },
    awful:   { icon: '😞', color: '#6b7280', label: 'Awful' },
  };

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.pickRandomQuote();
    this.loadAllData();
  }

  pickRandomQuote() {
    const idx = Math.floor(Math.random() * this.quotes.length);
    this.quote = this.quotes[idx];
  }

  loadAllData() {
    this.loading = true;
    forkJoin({
      habits:   this.dashboardService.getHabitSummary(),
      workouts: this.dashboardService.getFitnessSummary(),
      food:     this.dashboardService.getFoodSummary(),
      mood:     this.dashboardService.getMoodSummary(),
      tasks:    this.dashboardService.getTasksSummary(),
    }).subscribe({
      next: ({ habits, workouts, food, mood, tasks }) => {
        this.processHabits(habits);
        this.processWorkouts(workouts);
        this.processFood(food);
        this.processMood(mood);
        this.processTasks(tasks);
        this.buildRecentActivity(habits, workouts, food, mood);
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  // ── Processors ─────────────────────────────────────────────

  processHabits(habits: any[]) {
    if (!habits?.length) return;
    this.habitsTotal = habits.length;
    this.habitsCompleted = habits.filter(h =>
      h.completions?.some((c: any) => c.date === this.todayStr && c.completed)
    ).length;

    this.todayHabits = habits.map(h => ({
      name: h.name,
      icon: h.icon || 'repeat',
      color: h.color || '#8B5CF6',
      completed: h.completions?.some((c: any) => c.date === this.todayStr && c.completed) ?? false
    }));
  }

  processWorkouts(workouts: any[]) {
    if (!workouts?.length) return;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    this.workoutsThisWeek = workouts.filter(w =>
      w.date?.slice(0, 10) >= weekAgoStr
    ).length;

    const todayWorkouts = workouts.filter(w => w.date?.slice(0, 10) === this.todayStr);
    this.caloriesToday = todayWorkouts.reduce((s: number, w: any) =>
      s + (w.caloriesBurned || 0), 0
    );

    // add to recent activity
    todayWorkouts.slice(0, 2).forEach(w => {
      this.recentActivity.push({
        type: 'workout',
        title: w.title || 'Workout logged',
        subtitle: `${w.duration}min · ${w.caloriesBurned} kcal`,
        time: w.workoutTime,
        icon: 'fitness_center',
        color: '#8B5CF6'
      });
    });
  }

  processFood(food: any[]) {
    if (!food?.length) return;
    const todayFood = food.filter(f => f.date?.slice(0, 10) === this.todayStr);
    this.foodLoggedToday = todayFood.reduce((s: number, f: any) =>
      s + (f.items?.length || 0), 0
    );
  }

processMood(moods: any[]) {
  if (!moods?.length) {
    this.moodToday = null;
    return;
  }

  const todayMood = moods.find(m =>
    m.datetime?.slice(0, 10) === this.todayStr
  );

  this.moodToday = todayMood?.mood || null;
}

  processTasks(tasks: any[]) {
    if (!tasks?.length) return;
    const dueTasks = tasks.filter(t =>
      !t.completed && t.dueDate?.slice(0, 10) <= this.todayStr
    );
    this.tasksDueToday = dueTasks.length;
    this.upcomingTasks = dueTasks.slice(0, 5).map(t => ({
      _id: t._id,
      title: t.title,
      dueDate: t.dueDate,
      priority: t.priority || 'medium'
    }));
  }

  buildRecentActivity(habits: any[], workouts: any[], food: any[], mood: any[]) {
    const activity: RecentActivity[] = [];

    // habits completed today
    const completedHabits = (habits || []).filter(h =>
      h.completions?.some((c: any) => c.date === this.todayStr && c.completed)
    );
    if (completedHabits.length) {
      activity.push({
        type: 'habit',
        title: `${completedHabits.length} habit${completedHabits.length > 1 ? 's' : ''} completed`,
        subtitle: completedHabits.slice(0, 2).map((h: any) => h.name).join(', '),
        icon: 'repeat',
        color: '#8B5CF6'
      });
    }

    // today's workouts
    (workouts || []).filter(w => w.date?.slice(0, 10) === this.todayStr)
      .slice(0, 2).forEach(w => {
        activity.push({
          type: 'workout',
          title: w.title || 'Workout logged',
          subtitle: `${w.duration}min · ${w.caloriesBurned} kcal`,
          time: w.workoutTime,
          icon: 'fitness_center',
          color: '#ef4444'
        });
      });

    // food today
    const todayFood = (food || []).filter(f => f.date?.slice(0, 10) === this.todayStr);
    if (todayFood.length) {
      activity.push({
        type: 'food',
        title: `${todayFood.length} meal${todayFood.length > 1 ? 's' : ''} logged`,
        subtitle: todayFood[0]?.items?.slice(0, 2).map((i: any) => i.name).join(', '),
        icon: 'restaurant',
        color: '#f59e0b'
      });
    }

    // mood today
    const todayMood = (mood || []).find(m => m.date?.slice(0, 10) === this.todayStr);
    if (todayMood) {
      activity.push({
        type: 'mood',
        title: `Mood: ${todayMood.mood}`,
        subtitle: todayMood.note || '',
        icon: 'mood',
        color: '#10b981'
      });
    }

    this.recentActivity = activity;
  }

  // ── Helpers ────────────────────────────────────────────────

  get habitsPercent(): number {
    if (!this.habitsTotal) return 0;
    return Math.round((this.habitsCompleted / this.habitsTotal) * 100);
  }

  get todayLabel(): string {
    return this.today.toLocaleDateString('en', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  }

  get moodEmoji(): string {
    if (!this.moodToday) return '—';
    return this.moodConfig[this.moodToday]?.icon || '—';
  }

  get moodColor(): string {
    if (!this.moodToday) return '#9ca3af';
    return this.moodConfig[this.moodToday]?.color || '#9ca3af';
  }

  priorityColor(priority: string): string {
    return priority === 'high' ? '#ef4444'
      : priority === 'medium' ? '#f59e0b'
      : '#10b981';
  }

  priorityIcon(priority: string): string {
    return priority === 'high' ? 'keyboard_double_arrow_up'
      : priority === 'medium' ? 'drag_handle'
      : 'keyboard_double_arrow_down';
  }
}