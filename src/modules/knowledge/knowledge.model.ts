// src/modules/knowledge/knowledge.model.ts
export type KnowledgeCategory =
  'technology' | 'science' | 'health' | 'finance' |
  'productivity' | 'philosophy' | 'history' | 'other';

export type SourceType =
  'book' | 'course' | 'article' | 'video' | 'podcast' | 'other';

export interface KnowledgeEntry {
  _id?: string;
  title: string;
  category: KnowledgeCategory;
  sourceType: SourceType;
  source: string;
  notes: string;
  keyTakeaways: string[];
  tags: string[];
  rating: number | null;
  date: string;
  createdAt?: string;
}
