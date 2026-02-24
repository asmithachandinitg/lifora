import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Trip, TripStatus, PackingItem, ItineraryDay, TripExpense } from './travel.model';
import { TravelService } from './travel.service';

@Component({
  selector: 'app-travel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './travel.component.html',
  styleUrls: ['./travel.component.css']
})
export class TravelComponent implements OnInit {

  // Views
  view: 'dashboard' | 'detail' = 'dashboard';
  detailTab: 'overview' | 'packing' | 'itinerary' | 'budget' = 'overview';
  selectedTrip: Trip | null = null;

  // Modals
  showTripModal = false;
  showDeleteConfirm = false;
  showExpenseModal = false;
  editMode = false;
  editingId: string | null = null;
  deletingId: string | null = null;

  trips: Trip[] = [];

  tripForm = this.getEmptyTripForm();
  tripFormError = '';

  expenseForm = { title: '', amount: 0, category: 'food', date: new Date().toISOString().split('T')[0] };

  newPackingItem = { name: '', category: 'essentials' };
  newActivity = '';
  newItineraryDay = { date: '', title: '' };

  statusOptions: TripStatus[] = ['planned', 'ongoing', 'completed'];

  statusConfig: Record<TripStatus, { label: string; color: string; icon: string }> = {
    planned:   { label: 'Planned',   color: '#8B5CF6', icon: 'event'        },
    ongoing:   { label: 'Ongoing',   color: '#22c55e', icon: 'flight_takeoff'},
    completed: { label: 'Completed', color: '#9ca3af', icon: 'check_circle' }
  };

  coverColors = ['#8B5CF6', '#06b6d4', '#f59e0b', '#ef4444', '#22c55e', '#ec4899', '#f97316', '#3b82f6'];

  packingCategories = ['essentials', 'clothes', 'toiletries', 'electronics', 'documents', 'medicine', 'other'];
  expenseCategories = ['food', 'transport', 'accommodation', 'activities', 'shopping', 'other'];

  expenseCategoryIcons: Record<string, string> = {
    food: 'restaurant', transport: 'directions_car', accommodation: 'hotel',
    activities: 'local_activity', shopping: 'shopping_bag', other: 'receipt'
  };

  constructor(private travelService: TravelService) {}

  ngOnInit() { this.loadTrips(); }

  loadTrips() {
    this.travelService.getTrips().subscribe({
      next: (data) => this.trips = data,
      error: (err) => console.error(err)
    });
  }

  getEmptyTripForm() {
    return {
      name: '',
      destination: '',
      startDate: '',
      endDate: '',
      status: 'planned' as TripStatus,
      budget: 0,
      notes: '',
      coverColor: '#8B5CF6'
    };
  }

  // ── Trip CRUD ──────────────────────────────────────────────

  openAddTrip() {
    this.tripForm = this.getEmptyTripForm();
    this.tripFormError = '';
    this.editMode = false;
    this.editingId = null;
    this.showTripModal = true;
  }

  openEditTrip(trip: Trip) {
    this.tripForm = {
      name: trip.name,
      destination: trip.destination,
      startDate: trip.startDate.slice(0, 10),
      endDate: trip.endDate.slice(0, 10),
      status: trip.status,
      budget: trip.budget,
      notes: trip.notes,
      coverColor: trip.coverColor || '#8B5CF6'
    };
    this.editingId = trip._id!;
    this.editMode = true;
    this.tripFormError = '';
    this.showTripModal = true;
  }

  closeTripModal() {
    this.showTripModal = false;
    this.editMode = false;
    this.editingId = null;
  }

  saveTrip() {
    if (!this.tripForm.name.trim())        { this.tripFormError = 'Trip name is required.'; return; }
    if (!this.tripForm.destination.trim()) { this.tripFormError = 'Destination is required.'; return; }
    if (!this.tripForm.startDate)          { this.tripFormError = 'Start date is required.'; return; }

    const payload: Partial<Trip> = {
      name:        this.tripForm.name.trim(),
      destination: this.tripForm.destination.trim(),
      startDate:   this.tripForm.startDate,
      endDate:     this.tripForm.endDate,
      status:      this.tripForm.status,
      budget:      this.tripForm.budget,
      notes:       this.tripForm.notes,
      coverColor:  this.tripForm.coverColor
    };

    if (this.editMode && this.editingId) {
      this.travelService.updateTrip(this.editingId, payload).subscribe({
        next: (updated) => {
          const idx = this.trips.findIndex(t => t._id === this.editingId);
          if (idx > -1) this.trips[idx] = updated;
          if (this.selectedTrip?._id === this.editingId) this.selectedTrip = updated;
          this.closeTripModal();
        },
        error: (err) => { console.error(err); this.tripFormError = 'Failed to update.'; }
      });
    } else {
      const newTrip: Partial<Trip> = { ...payload, expenses: [], packingList: [], itinerary: [] };
      this.travelService.createTrip(newTrip).subscribe({
        next: (created) => { this.trips.unshift(created); this.closeTripModal(); },
        error: (err) => { console.error(err); this.tripFormError = 'Failed to save.'; }
      });
    }
  }

  confirmDelete(id: string) {
    this.deletingId = id;
    this.showDeleteConfirm = true;
  }

  doDelete() {
    if (!this.deletingId) return;
    this.travelService.deleteTrip(this.deletingId).subscribe({
      next: () => {
        this.trips = this.trips.filter(t => t._id !== this.deletingId);
        if (this.selectedTrip?._id === this.deletingId) { this.selectedTrip = null; this.view = 'dashboard'; }
        this.showDeleteConfirm = false;
        this.deletingId = null;
      },
      error: (err) => console.error(err)
    });
  }

  // ── Detail view ────────────────────────────────────────────

  openTrip(trip: Trip) {
    this.travelService.getTrip(trip._id!).subscribe({
      next: (full) => { this.selectedTrip = full; this.view = 'detail'; this.detailTab = 'overview'; },
      error: (err) => console.error(err)
    });
  }

  backToDashboard() { this.view = 'dashboard'; this.selectedTrip = null; }

  saveTrip$() {
    if (!this.selectedTrip) return;
    this.travelService.updateTrip(this.selectedTrip._id!, this.selectedTrip).subscribe({
      next: (updated) => {
        this.selectedTrip = updated;
        const idx = this.trips.findIndex(t => t._id === updated._id);
        if (idx > -1) this.trips[idx] = updated;
      },
      error: (err) => console.error(err)
    });
  }

  // ── Packing ────────────────────────────────────────────────

  addPackingItem() {
    if (!this.newPackingItem.name.trim() || !this.selectedTrip) return;
    this.selectedTrip.packingList.push({
      _id: Date.now().toString(),
      name: this.newPackingItem.name.trim(),
      packed: false,
      category: this.newPackingItem.category
    });
    this.newPackingItem.name = '';
    this.saveTrip$();
  }

  togglePacked(item: PackingItem) {
    item.packed = !item.packed;
    this.saveTrip$();
  }

  removePackingItem(item: PackingItem) {
    if (!this.selectedTrip) return;
    this.selectedTrip.packingList = this.selectedTrip.packingList.filter(p => p._id !== item._id);
    this.saveTrip$();
  }

  get packingByCategory(): Record<string, PackingItem[]> {
    if (!this.selectedTrip) return {};
    return this.selectedTrip.packingList.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, PackingItem[]>);
  }

  get packedCount(): number { return this.selectedTrip?.packingList.filter(p => p.packed).length || 0; }
  get totalPacking(): number { return this.selectedTrip?.packingList.length || 0; }

  // ── Itinerary ──────────────────────────────────────────────

  addItineraryDay() {
    if (!this.newItineraryDay.date || !this.selectedTrip) return;
    this.selectedTrip.itinerary.push({
      _id: Date.now().toString(),
      date: this.newItineraryDay.date,
      title: this.newItineraryDay.title || 'Day Plan',
      activities: []
    });
    this.selectedTrip.itinerary.sort((a, b) => a.date.localeCompare(b.date));
    this.newItineraryDay = { date: '', title: '' };
    this.saveTrip$();
  }

  addActivity(day: ItineraryDay) {
    if (!this.newActivity.trim()) return;
    day.activities.push(this.newActivity.trim());
    this.newActivity = '';
    this.saveTrip$();
  }

  removeActivity(day: ItineraryDay, i: number) {
    day.activities.splice(i, 1);
    this.saveTrip$();
  }

  removeItineraryDay(day: ItineraryDay) {
    if (!this.selectedTrip) return;
    this.selectedTrip.itinerary = this.selectedTrip.itinerary.filter(d => d._id !== day._id);
    this.saveTrip$();
  }

  // ── Expenses ───────────────────────────────────────────────

  addExpense() {
    if (!this.expenseForm.title.trim() || !this.selectedTrip) return;
    this.selectedTrip.expenses.push({
      _id: Date.now().toString(),
      title: this.expenseForm.title.trim(),
      amount: this.expenseForm.amount,
      category: this.expenseForm.category,
      date: this.expenseForm.date
    });
    this.expenseForm = { title: '', amount: 0, category: 'food', date: new Date().toISOString().split('T')[0] };
    this.showExpenseModal = false;
    this.saveTrip$();
  }

  removeExpense(exp: TripExpense) {
    if (!this.selectedTrip) return;
    this.selectedTrip.expenses = this.selectedTrip.expenses.filter(e => e._id !== exp._id);
    this.saveTrip$();
  }

  get totalSpent(): number { return this.selectedTrip?.expenses.reduce((s, e) => s + e.amount, 0) || 0; }
  get budgetLeft(): number { return (this.selectedTrip?.budget || 0) - this.totalSpent; }
  get budgetPercent(): number {
    if (!this.selectedTrip?.budget) return 0;
    return Math.min(Math.round((this.totalSpent / this.selectedTrip.budget) * 100), 100);
  }

  get expensesByCategory(): { cat: string; total: number; icon: string }[] {
    if (!this.selectedTrip) return [];
    const map: Record<string, number> = {};
    this.selectedTrip.expenses.forEach(e => { map[e.category] = (map[e.category] || 0) + e.amount; });
    return Object.entries(map).map(([cat, total]) => ({ cat, total, icon: this.expenseCategoryIcons[cat] || 'receipt' }))
      .sort((a, b) => b.total - a.total);
  }

  // ── Dashboard helpers ──────────────────────────────────────

  get upcomingTrips(): Trip[] {
    return this.trips.filter(t => t.status === 'planned').sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  get ongoingTrips(): Trip[] { return this.trips.filter(t => t.status === 'ongoing'); }
  get completedTrips(): Trip[] { return this.trips.filter(t => t.status === 'completed'); }

  getDaysUntil(dateStr: string): number {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getTripDuration(trip: Trip): number {
    if (!trip.endDate) return 0;
    const diff = new Date(trip.endDate).getTime() - new Date(trip.startDate).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  getPackingProgress(trip: Trip): number {
    if (!trip.packingList?.length) return 0;
    return Math.round((trip.packingList.filter(p => p.packed).length / trip.packingList.length) * 100);
  }

  trackById(_: number, item: any) { return item._id; }
}
