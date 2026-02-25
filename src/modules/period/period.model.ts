export type FlowLevel = 'spotting' | 'light' | 'medium' | 'heavy';

export type PeriodSymptom =
  | 'cramps' | 'pelvic_pain' | 'back_pain' | 'low_back_pain' | 'shoulder_aches'
  | 'neck_aches' | 'migraines' | 'headache' | 'muscle_pain'
  | 'bloating' | 'nausea' | 'diarrhea' | 'constipation' | 'hunger' | 'cravings'
  | 'fatigue' | 'swelling' | 'weight_gain' | 'breast_tenderness' | 'breast_sensitivity'
  | 'hot_flashes' | 'night_sweats' | 'chills' | 'fever' | 'itchiness' | 'rashes'
  | 'dizziness' | 'ovulation_pain' | 'acne'
  | 'mood_swings' | 'irritation' | 'anxiety' | 'stress' | 'tension'
  | 'confusion' | 'insomnia' | 'moodiness' | 'pms'
  | 'illness';

export interface SymptomMeta     { key: PeriodSymptom; label: string; icon: string; }
export interface SymptomCategory { label: string; icon: string; symptoms: SymptomMeta[]; }

export interface PeriodEntry {
  _id?: string;
  startDate: string;
  endDate?: string;
  flow: FlowLevel;
  painLevel: number;
  mood: number;
  symptoms: PeriodSymptom[];
  notes?: string;
  cycleLength?: number;
  periodLength?: number;
  createdAt?: string;
}

export interface DailySymptomLog {
  _id?: string;
  date: string;
  mood: number;
  painLevel: number;
  symptoms: PeriodSymptom[];
  notes?: string;
  createdAt?: string;
}
