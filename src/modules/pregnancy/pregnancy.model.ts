export type PregnancySymptom = 'nausea' | 'fatigue' | 'back_pain' | 'heartburn' |
  'swelling' | 'headache' | 'cramps' | 'spotting' | 'mood_swings' | 'insomnia' | 'cravings';

export interface PregnancyEntry {
  _id?: string;
  date: string;          // YYYY-MM-DD — the log date
  week: number;          // gestational week (1–42)
  weight?: number;       // kg
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  babyMovements?: number; // count (kicks/movements in the day)
  symptoms: PregnancySymptom[];
  mood: number;           // 1–5
  notes: string;
  createdAt?: string;
}

export interface PregnancyProfile {
  _id?: string;
  dueDate: string;      // YYYY-MM-DD
  lmpDate?: string;     // last menstrual period
  createdAt?: string;
}
