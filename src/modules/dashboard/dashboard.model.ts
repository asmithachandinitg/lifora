export interface DashboardStats {
  habitsCompleted: number;
  habitsTotal: number;
  caloriesToday: number;
  tasksDueToday: number;
  moodToday: string | null;
  workoutsThisWeek: number;
  foodLoggedToday: number;
}

export interface RecentActivity {
  type: 'habit' | 'workout' | 'food' | 'mood' | 'task' | 'journal';
  title: string;
  subtitle?: string;
  time?: string;
  icon: string;
  color: string;
}

export interface UpcomingTask {
  _id?: string;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
}