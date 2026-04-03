export type HabitCategory = 'health' | 'fitness' | 'mindfulness' | 'work' | 'personal' | 'social' | 'finance' | 'learning';
export type HabitFrequency = 'daily' | 'weekly' | 'monthly';

export interface HabitCompletion {
  date: string;
  completed: boolean;
  note?: string;
}

export interface Habit {
  _id?: string;
  name: string;
  description?: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  targetDays?: number[];
  color: string;
  icon: string;
  completions: HabitCompletion[];
  currentStreak: number;
  longestStreak: number;
  notes?: string;
  createdAt?: string;

  deadline?: string | null;

  // ── Goal link ──────────────────────────────────────────────
  linkedGoalId?:    string;
  linkedGoalTitle?: string;
}

export interface HabitWithStats extends Habit {
  completedToday: boolean;
  completionRate: number;
}

export interface WeeklyStats {
  label: string;
  date: string;
  completed: number;
  total: number;
}

export interface MonthlyStats {
  date: string;
  day: number;
  completed: number;
  total: number;
  isToday: boolean;
  isFuture: boolean;
  weekday: number;
}
