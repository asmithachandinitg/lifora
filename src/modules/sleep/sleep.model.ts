export type SleepQuality = number;

export interface SleepStages {
  deep: number;   // minutes
  light: number;  // minutes
  rem: number;    // minutes
}

export interface SleepEntry {
  _id?: string;
  sleepTime: string;   // ISO datetime string
  wakeTime: string;    // ISO datetime string
  duration: number;    // minutes (auto calculated)
  quality: SleepQuality;
  stages: SleepStages;
  notes: string;
  createdAt?: string;
}
