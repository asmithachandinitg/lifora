export type TripStatus = 'planned' | 'ongoing' | 'completed';

export interface PackingItem {
  _id: string;
  name: string;
  packed: boolean;
  category: string;
}

export interface ItineraryDay {
  _id: string;
  date: string;
  title: string;
  activities: string[];
}

export interface TripExpense {
  _id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
}

export interface Trip {
  _id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  budget: number;
  expenses: TripExpense[];
  packingList: PackingItem[];
  itinerary: ItineraryDay[];
  notes: string;
  coverColor: string;
  createdAt?: string;
}
