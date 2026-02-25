export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface FoodItem {
  name: string;
  quantity?: string;       // e.g. "1 cup", "2 pieces" — optional
  calories?: number;       // optional
  protein?: number;        // grams, optional
  carbs?: number;          // grams, optional
  fat?: number;            // grams, optional
}

export interface FoodEntry {
  _id?: string;
  date: string;            // YYYY-MM-DD
  mealType: MealType;
  time: string;            // HH:MM
  items: FoodItem[];
  notes?: string;
  createdAt?: string;
}
