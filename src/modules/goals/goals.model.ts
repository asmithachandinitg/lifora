export type GoalStatus   = 'not-started' | 'in-progress' | 'completed';
export type GoalPriority = 'high' | 'medium' | 'low';
export type GoalCategory = 'personal' | 'career' | 'health' | 'finance' | 'education' | 'other';

export interface Milestone {
  _id?: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  _id?: string;
  title: string;
  description: string;
  category: GoalCategory;
  priority: GoalPriority;
  status: GoalStatus;
  progress: number;
  deadline: string;
  createdAt?: string;
  milestones: Milestone[];
  linkedHabitIds?: string[]; // ← habits spawned from this goal
}
