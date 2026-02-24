export type FitnessCategory = 'cardio' | 'strength' | 'flexibility' | 'sports';

export interface ExerciseSet {
  reps: number;
  weight?: number;
}

export interface Exercise {
  name: string;
  sets: ExerciseSet[];
}

export interface WorkoutEntry {
  _id?: string;
  title: string;
  category: FitnessCategory;
  duration: number;        // minutes
  caloriesBurned: number;  // from workout
  stepsWalked: number;     // steps for the day
  stepsCalories: number;   // auto-calculated (steps * 0.04)
  workoutTime: string;     // "HH:MM" - time of day
  exercises: Exercise[];
  notes: string;
  date: string;
  createdAt?: string;
}

export interface PersonalRecord {
  exerciseName: string;
  maxWeight: number;
  maxReps: number;
  date: string;
}

export interface DailyChartPoint {
  hour: string;
  duration: number;
  category: FitnessCategory;
  title: string;
}

export interface WeeklyChartPoint {
  date: string;
  label: string;
  duration: number;
  calories: number;
  category: FitnessCategory;
  hasWorkout: boolean;
}

export interface MonthlyChartPoint {
  date: string;
  day: number;
  duration: number;
  calories: number;
  hasWorkout: boolean;
  isToday: boolean;
  isFuture: boolean;
  weekday: number;
}
