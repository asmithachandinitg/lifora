// src/modules/visionboard/visionboard.model.ts
export type VisionCategory =
  'career' | 'health' | 'finance' | 'personal' |
  'travel' | 'relationships' | 'learning';

export interface VisionItem {
  _id?: string;
  title: string;
  description: string;
  category: VisionCategory;
  imageUrl: string;
  targetDate: string;
  achieved: boolean;
  achievedDate: string;
  affirmation: string;
  createdAt?: string;
}
