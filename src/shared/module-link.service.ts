import { Injectable } from '@angular/core';

export interface TravelLink {
  tripId:   string;
  tripName: string;
  date:     string;
}

export interface GoalLink {
  goalId:    string;
  goalTitle: string;
  category:  string; 
}

@Injectable({ providedIn: 'root' })
export class ModuleLinkService {

  private pendingTravelLink: TravelLink | null = null;
  private pendingGoalLink:   GoalLink   | null = null;

  // ── Travel ────────────────────────────────────────────────
  setTravelLink(link: TravelLink): void  { this.pendingTravelLink = link; }
  consumeTravelLink(): TravelLink | null {
    const l = this.pendingTravelLink;
    this.pendingTravelLink = null;
    return l;
  }

  // ── Goal → Habit ──────────────────────────────────────────
  setGoalLink(link: GoalLink): void  { this.pendingGoalLink = link; }
  consumeGoalLink(): GoalLink | null {
    const l = this.pendingGoalLink;
    this.pendingGoalLink = null;
    return l;
  }
}
