export type BookStatus = 'want' | 'reading' | 'completed' | 'dnf';

export interface Book {
  _id?: string;
  title: string;
  author: string;
  status: BookStatus;
  genre: string;
  tags: string[];
  pagesTotal: number;
  pagesRead: number;
  startDate: string;
  endDate: string;
  coverUrl: string;
  rating: number;
  review: string;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}
