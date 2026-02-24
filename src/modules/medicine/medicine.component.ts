import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Medicine, DoseLog, MedicineFrequency, MedicineStatus } from './medicine.model';
import { MedicineService } from './medicine.service';

@Component({
  selector: 'app-medicine',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './medicine.component.html',
  styleUrls: ['./medicine.component.css']
})
export class MedicineComponent implements OnInit {

  activeTab: 'today' | 'medicines' | 'history' = 'today';
  medicines: Medicine[] = [];
  doseLogs: DoseLog[] = [];

  showMedicineModal = false;
  showDeleteConfirm = false;
  showLogModal = false;
  editMode = false;
  editingId: string | null = null;
  deletingId: string | null = null;
  deletingType: 'medicine' | 'log' = 'medicine';
  selectedMedicineForLog: Medicine | null = null;

  form = this.getEmptyForm();
  formError = '';
  logNote = '';

  frequencyOptions: MedicineFrequency[] = ['daily', 'weekly', 'as-needed'];
  statusOptions: MedicineStatus[] = ['active', 'paused', 'completed'];

  frequencyConfig: Record<MedicineFrequency, { label: string; icon: string; color: string }> = {
    'daily':     { label: 'Daily',     icon: 'today',         color: '#8B5CF6' },
    'weekly':    { label: 'Weekly',    icon: 'date_range',    color: '#06b6d4' },
    'as-needed': { label: 'As Needed', icon: 'help_outline',  color: '#f59e0b' }
  };

  statusConfig: Record<MedicineStatus, { label: string; color: string }> = {
    'active':    { label: 'Active',    color: '#22c55e' },
    'paused':    { label: 'Paused',    color: '#f59e0b' },
    'completed': { label: 'Completed', color: '#9ca3af' }
  };

  constructor(private medicineService: MedicineService) {}

  ngOnInit() {
    this.loadMedicines();
    this.loadDoseLogs();
  }

  loadMedicines() {
    this.medicineService.getMedicines().subscribe({
      next: (data) => this.medicines = data,
      error: (err) => console.error(err)
    });
  }

  loadDoseLogs() {
    this.medicineService.getDoseLogs().subscribe({
      next: (data) => this.doseLogs = data,
      error: (err) => console.error(err)
    });
  }

  getEmptyForm() {
    return {
      name: '',
      dosage: '',
      frequency: 'daily' as MedicineFrequency,
      reminders: [{ time: '08:00' }],
      stock: 30,
      lowStockThreshold: 5,
      notes: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'active' as MedicineStatus
    };
  }

  openAddModal() {
    this.form = this.getEmptyForm();
    this.formError = '';
    this.editMode = false;
    this.editingId = null;
    this.showMedicineModal = true;
  }

  openEditModal(med: Medicine) {
    this.form = {
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      reminders: med.reminders.length ? [...med.reminders] : [{ time: '08:00' }],
      stock: med.stock,
      lowStockThreshold: med.lowStockThreshold,
      notes: med.notes,
      startDate: med.startDate.slice(0, 10),
      endDate: med.endDate ? med.endDate.slice(0, 10) : '',
      status: med.status
    };
    this.editingId = med._id!;
    this.editMode = true;
    this.formError = '';
    this.showMedicineModal = true;
  }

  closeModal() {
    this.showMedicineModal = false;
    this.editMode = false;
    this.editingId = null;
  }

  addReminder() { this.form.reminders.push({ time: '12:00' }); }
  removeReminder(i: number) { if (this.form.reminders.length > 1) this.form.reminders.splice(i, 1); }

  saveMedicine() {
    if (!this.form.name.trim()) { this.formError = 'Medicine name is required.'; return; }
    if (!this.form.dosage.trim()) { this.formError = 'Dosage is required.'; return; }

    const payload: Partial<Medicine> = {
      name: this.form.name.trim(),
      dosage: this.form.dosage.trim(),
      frequency: this.form.frequency,
      reminders: this.form.reminders,
      stock: this.form.stock,
      lowStockThreshold: this.form.lowStockThreshold,
      notes: this.form.notes,
      startDate: this.form.startDate,
      endDate: this.form.endDate || '',
      status: this.form.status
    };

    if (this.editMode && this.editingId) {
      this.medicineService.updateMedicine(this.editingId, payload).subscribe({
        next: (updated) => {
          const idx = this.medicines.findIndex(m => m._id === this.editingId);
          if (idx > -1) this.medicines[idx] = updated;
          this.closeModal();
        },
        error: (err) => { console.error(err); this.formError = 'Failed to update.'; }
      });
    } else {
      this.medicineService.createMedicine(payload).subscribe({
        next: (created) => { this.medicines.push(created); this.closeModal(); },
        error: (err) => { console.error(err); this.formError = 'Failed to save.'; }
      });
    }
  }

  // Dose logging
  openLogModal(med: Medicine) {
    this.selectedMedicineForLog = med;
    this.logNote = '';
    this.showLogModal = true;
  }

  closeLogModal() {
    this.showLogModal = false;
    this.selectedMedicineForLog = null;
  }

  logDose() {
    if (!this.selectedMedicineForLog) return;
    const payload: Partial<DoseLog> = {
      medicineId:  this.selectedMedicineForLog._id!,
      medicineName: this.selectedMedicineForLog.name,
      dosage:      this.selectedMedicineForLog.dosage,
      takenAt:     new Date().toISOString(),
      notes:       this.logNote
    };

    this.medicineService.logDose(payload).subscribe({
      next: (log) => {
        this.doseLogs.unshift(log);
        // Decrease stock
        const med = this.medicines.find(m => m._id === this.selectedMedicineForLog!._id);
        if (med && med.stock > 0) {
          med.stock--;
          this.medicineService.updateMedicine(med._id!, { stock: med.stock }).subscribe();
        }
        this.closeLogModal();
      },
      error: (err) => console.error(err)
    });
  }

  // Delete
  confirmDelete(id: string, type: 'medicine' | 'log') {
    this.deletingId = id;
    this.deletingType = type;
    this.showDeleteConfirm = true;
  }

  doDelete() {
    if (!this.deletingId) return;
    if (this.deletingType === 'medicine') {
      this.medicineService.deleteMedicine(this.deletingId).subscribe({
        next: () => {
          this.medicines = this.medicines.filter(m => m._id !== this.deletingId);
          this.showDeleteConfirm = false;
        },
        error: (err) => console.error(err)
      });
    } else {
      this.medicineService.deleteDoseLog(this.deletingId).subscribe({
        next: () => {
          this.doseLogs = this.doseLogs.filter(l => l._id !== this.deletingId);
          this.showDeleteConfirm = false;
        },
        error: (err) => console.error(err)
      });
    }
  }

  // ── Computed ───────────────────────────────────────────────

  get todayMedicines(): Medicine[] {
    const today = new Date();
    const dayName = today.toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
    return this.medicines.filter(m => {
      if (m.status !== 'active') return false;
      if (m.frequency === 'daily') return true;
      if (m.frequency === 'as-needed') return true;
      return false; // weekly - could expand later
    });
  }

  get activeMedicines(): Medicine[] {
    return this.medicines.filter(m => m.status === 'active');
  }

  get lowStockMedicines(): Medicine[] {
    return this.medicines.filter(m => m.stock <= m.lowStockThreshold && m.status === 'active');
  }

  get todayDoses(): DoseLog[] {
    const today = new Date().toDateString();
    return this.doseLogs.filter(l => new Date(l.takenAt).toDateString() === today);
  }

  get sortedLogs(): DoseLog[] {
    return [...this.doseLogs].sort((a, b) =>
      new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime()
    );
  }

  isTakenToday(med: Medicine): boolean {
    return this.todayDoses.some(l => l.medicineId === med._id);
  }

  getStockPercent(med: Medicine): number {
    const max = Math.max(med.stock + 10, 30);
    return Math.min(Math.round((med.stock / max) * 100), 100);
  }

  isLowStock(med: Medicine): boolean {
    return med.stock <= med.lowStockThreshold;
  }

  formatTime(dt: string): string {
    return new Date(dt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(dt: string): string {
    return new Date(dt).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  trackById(_: number, item: any) { return item._id; }
}
