export type MedicineFrequency = 'daily' | 'weekly' | 'as-needed';
export type MedicineStatus = 'active' | 'completed' | 'paused';

export interface MedicineReminder {
  time: string; // "08:00"
}

export interface Medicine {
  _id?: string;
  name: string;
  dosage: string;           // e.g. "500mg", "1 tablet"
  frequency: MedicineFrequency;
  reminders: MedicineReminder[];
  stock: number;            // current quantity
  lowStockThreshold: number;
  notes: string;
  startDate: string;        // ISO date
  endDate: string;          // ISO date, empty if ongoing
  status: MedicineStatus;
  createdAt?: string;
}

export interface DoseLog {
  _id?: string;
  medicineId: string;
  medicineName: string;
  dosage: string;
  takenAt: string;          // ISO datetime
  notes: string;
}
