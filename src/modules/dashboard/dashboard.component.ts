import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardService } from './dashboard.service';
import { RecentActivity, UpcomingTask } from './dashboard.model';
import { forkJoin } from 'rxjs';

export interface DailyInsight {
  icon: string;
  color: string;
  bg: string;
  message: string;
  priority: number;
}

export interface DailyInsight {
  icon: string; color: string; bg: string; message: string; priority: number;
}

export interface WeeklyInsight {
  label: string; value: string; icon: string; color: string; bg: string; sub?: string;
}

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

  // ── Raw data kept for insights ─────────────────────────────
  private rawHabits: any[] = [];
  private rawWorkouts: any[] = [];
  private rawMoods: any[] = [];
  private rawTasks: any[] = [];
  private rawGoals: any[] = [];
  private rawDiary: any[] = [];

  // ── Insights ───────────────────────────────────────────────
  insights: DailyInsight[] = [];
  weeklyInsights: WeeklyInsight[] = [];
  weekLabel = '';

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
    great: { icon: '😄', color: '#10b981', label: 'Great' },
    good: { icon: '🙂', color: '#8B5CF6', label: 'Good' },
    okay: { icon: '😐', color: '#f59e0b', label: 'Okay' },
    bad: { icon: '😔', color: '#ef4444', label: 'Bad' },
    awful: { icon: '😞', color: '#6b7280', label: 'Awful' },
    sad: { icon: '😢', color: '#3b82f6', label: 'Sad' },
    angry: { icon: '😡', color: '#ef4444', label: 'Angry' },
    happy: { icon: '😄', color: '#10b981', label: 'Happy' },
    excited: { icon: '🤩', color: '#f59e0b', label: 'Excited' },
    neutral: { icon: '😐', color: '#6b7280', label: 'Neutral' },
  };


  constructor(private dashboardService: DashboardService) { }

  ngOnInit() {
    this.pickRandomQuote();
    this.setWeekLabel();
    this.loadAllData();
  }

  pickRandomQuote() {
    const idx = Math.floor(Math.random() * this.quotes.length);
    this.quote = this.quotes[idx];
  }

  loadAllData() {
    this.loading = true;
    forkJoin({
      habits: this.dashboardService.getHabitSummary(),
      workouts: this.dashboardService.getFitnessSummary(),
      food: this.dashboardService.getFoodSummary(),
      mood: this.dashboardService.getMoodSummary(),
      tasks: this.dashboardService.getTasksSummary(),
      goals: this.dashboardService.getGoalsSummary(),
      diary: this.dashboardService.getDiarySummary(),
    }).subscribe({
      next: ({ habits, workouts, food, mood, tasks, goals, diary }) => {
        // store raw data for insights
        this.rawHabits = habits || [];
        this.rawWorkouts = workouts || [];
        this.rawMoods = mood || [];
        this.rawTasks = tasks || [];
        this.rawGoals = goals || [];
        this.rawDiary = diary || [];

        // your existing processors — unchanged
        this.processHabits(habits);
        this.processWorkouts(workouts);
        this.processFood(food);
        this.processMood(mood);
        this.processTasks(tasks);
        this.buildRecentActivity(habits, workouts, food, mood);

        // new
        this.generateInsights();
        this.generateWeeklyInsights();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  setWeekLabel() {
    const now = new Date();
    const start = new Date(now); start.setDate(now.getDate() - now.getDay());
    const end = new Date(now); end.setDate(now.getDate() + (6 - now.getDay()));
    const fmt = (d: Date) => d.toLocaleDateString('en', { day: 'numeric', month: 'short' });
    this.weekLabel = `${fmt(start)} – ${fmt(end)}`;
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

    this.workoutsThisWeek = workouts.filter(w => w.date?.slice(0, 10) >= weekAgoStr).length;

    const todayWorkouts = workouts.filter(w => w.date?.slice(0, 10) === this.todayStr);
    this.caloriesToday = todayWorkouts.reduce((s: number, w: any) => s + (w.caloriesBurned || 0), 0);
  }

  processFood(food: any[]) {
    if (!food?.length) return;
    const todayFood = food.filter(f => f.date?.slice(0, 10) === this.todayStr);
    this.foodLoggedToday = todayFood.reduce((s: number, f: any) => s + (f.items?.length || 0), 0);
  }

  processMood(moods: any[]) {
    if (!moods?.length) { this.moodToday = null; return; }
    const todayMood = moods.find(m => m.datetime?.slice(0, 10) === this.todayStr);
    this.moodToday = todayMood?.mood || null;
  }

  processTasks(tasks: any[]) {
    if (!tasks?.length) return;
    const dueTasks = tasks.filter(t => !t.completed && t.dueDate?.slice(0, 10) <= this.todayStr);
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

    const todayMood = (mood || []).find(m => m.datetime?.slice(0, 10) === this.todayStr);
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

  // ── Daily Insights Generator ───────────────────────────────

  generateInsights() {
    const list: DailyInsight[] = [];

    if (this.habitsTotal > 0) {
      if (this.habitsCompleted === this.habitsTotal) {
        list.push({ icon: 'emoji_events', color: '#10b981', bg: '#f0fdf4', message: `🎉 All ${this.habitsTotal} habits done today! Perfect day!`, priority: 1 });
      } else {
        const left = this.habitsTotal - this.habitsCompleted;
        list.push({ icon: 'repeat', color: '#8B5CF6', bg: '#f5f3ff', message: `You have ${left} habit${left > 1 ? 's' : ''} left to complete today`, priority: 2 });
      }
    }

    const bestStreak = Math.max(...(this.rawHabits.map(h => h.currentStreak || 0)), 0);
    if (bestStreak >= 3) {
      const sh = this.rawHabits.find(h => h.currentStreak === bestStreak);
      list.push({ icon: 'local_fire_department', color: '#ef4444', bg: '#fef2f2', message: `🔥 ${bestStreak}-day streak on "${sh?.name}"! Keep it going!`, priority: 3 });
    }

    if (!this.moodToday) {
      list.push({ icon: 'mood', color: '#06b6d4', bg: '#ecfeff', message: `You haven't logged your mood today — how are you feeling?`, priority: 4 });
    }

    if (this.workoutsThisWeek === 0) {
      list.push({ icon: 'fitness_center', color: '#8B5CF6', bg: '#f5f3ff', message: `No workouts logged this week yet — time to move! 💪`, priority: 6 });
    } else if (this.workoutsThisWeek >= 4) {
      list.push({ icon: 'fitness_center', color: '#10b981', bg: '#f0fdf4', message: `💪 ${this.workoutsThisWeek} workouts this week — you're crushing it!`, priority: 5 });
    }

    const overdue = this.rawTasks.filter(t => !t.completed && t.dueDate?.slice(0, 10) < this.todayStr);
    if (overdue.length) {
      list.push({ icon: 'warning', color: '#ef4444', bg: '#fef2f2', message: `⚠️ ${overdue.length} overdue task${overdue.length > 1 ? 's' : ''} — tackle them today!`, priority: 1 });
    }

    const inProgress = this.rawGoals.filter(g => g.status === 'in-progress')
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    if (inProgress.length > 0) {
      const s = inProgress[0];
      const dLeft = Math.ceil((new Date(s.deadline).getTime() - Date.now()) / 86400000);
      list.push({
        icon: 'track_changes', color: '#6366f1', bg: '#eef2ff',
        message: dLeft <= 30 ? `🎯 "${s.title}" is at ${s.progress}% — ${dLeft} days left!` : `🎯 "${s.title}" is ${s.progress}% complete — keep pushing!`,
        priority: dLeft <= 30 ? 2 : 6
      });
    }

    if (new Date().getHours() >= 21 && this.habitsCompleted < this.habitsTotal) {
      list.push({ icon: 'bedtime', color: '#6366f1', bg: '#eef2ff', message: `It's late — don't forget to finish your habits before bed 🌙`, priority: 2 });
    }

    this.insights = list.sort((a, b) => a.priority - b.priority).slice(0, 5);
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

  generateWeeklyInsights() {
    const now = new Date();
    const weekDates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      weekDates.push(d.toISOString().split('T')[0]);
    }

    const items: WeeklyInsight[] = [];

    // Habit rate
    if (this.rawHabits.length > 0) {
      let possible = 0, done = 0;
      weekDates.forEach(date => {
        possible += this.rawHabits.length;
        done += this.rawHabits.filter(h => h.completions?.some((c: any) => c.date === date && c.completed)).length;
      });
      const pct = possible > 0 ? Math.round((done / possible) * 100) : 0;
      items.push({ label: 'Habit Rate', value: `${pct}%`, icon: 'repeat', color: '#8B5CF6', bg: '#f5f3ff', sub: `${done}/${possible} check-ins` });
    }

    // Workouts
    const weekW = this.rawWorkouts.filter(w => weekDates.includes(w.date?.slice(0, 10)));
    const weekCal = weekW.reduce((s: number, w: any) => s + (w.caloriesBurned || 0), 0);
    items.push({ label: 'Workouts', value: `${weekW.length}`, icon: 'fitness_center', color: '#ef4444', bg: '#fef2f2', sub: weekCal > 0 ? `${weekCal} kcal burned` : 'this week' });

    // Dominant mood
    const weekMoods = this.rawMoods.filter(m => weekDates.includes(m.datetime?.slice(0, 10)));
    if (weekMoods.length > 0) {
      const counts: Record<string, number> = {};
      weekMoods.forEach(m => { counts[m.mood] = (counts[m.mood] || 0) + 1; });
      const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      const cfg = this.moodConfig[dominant] || { icon: '😐', color: '#6b7280', label: dominant };
      items.push({ label: 'Mood Trend', value: cfg.icon, icon: 'mood', color: cfg.color, bg: cfg.color + '18', sub: `${cfg.label} (${weekMoods.length} logs)` });
    }

    // Diary entries
    const weekDiary = this.rawDiary.filter(e => weekDates.includes(e.entryDate?.slice(0, 10)));
    items.push({ label: 'Journal', value: `${weekDiary.length}`, icon: 'menu_book', color: '#6366f1', bg: '#eef2ff', sub: `${weekDiary.length} entries this week` });

    // Goals avg progress
    const active = this.rawGoals.filter(g => g.status === 'in-progress');
    if (active.length > 0) {
      const avg = Math.round(active.reduce((s: number, g: any) => s + (g.progress || 0), 0) / active.length);
      items.push({ label: 'Goals', value: `${avg}%`, icon: 'track_changes', color: '#f59e0b', bg: '#fffbeb', sub: `avg across ${active.length} active` });
    }

    // Best streak
    const best = Math.max(...this.rawHabits.map(h => h.currentStreak || 0), 0);
    if (best > 0) {
      const sh = this.rawHabits.find(h => h.currentStreak === best);
      items.push({ label: 'Best Streak', value: `${best}d`, icon: 'local_fire_department', color: '#f97316', bg: '#fff7ed', sub: sh?.name || 'habit' });
    }

    this.weeklyInsights = items;
  }
}
