import { Injectable } from '@angular/core';

export interface TravelLink {
  tripId:   string;
  tripName: string;
  date:     string; // ISO date string to pre-fill diary
}

@Injectable({ providedIn: 'root' })
export class ModuleLinkService {
  private pendingTravelLink: TravelLink | null = null;

  /** Called by TravelComponent before navigating to /diary */
  setTravelLink(link: TravelLink): void {
    this.pendingTravelLink = link;
  }

  /** Called by DiaryComponent on init — consumes and clears the link */
  consumeTravelLink(): TravelLink | null {
    const link = this.pendingTravelLink;
    this.pendingTravelLink = null;
    return link;
  }
}
