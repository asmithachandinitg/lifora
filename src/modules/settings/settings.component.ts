import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { ThemePickerComponent } from '../../shared/theme-picker/theme-picker.component';
import { AuthService } from '../../core/auth/auth.service';
import { ExportService } from '../../core/services/export.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ThemePickerComponent],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {

  activeSection: 'appearance' | 'account' | 'data' | 'about' = 'appearance';

  user: any = {};

  showDeleteConfirm = false;
  deleteInput       = '';

  notifHabits   = true;
  notifTasks    = true;
  notifMood     = false;
  notifWeekly   = true;

  exportingBackup = false;
  backupDone      = false;

  constructor(
    public  themeService: ThemeService,
    private authService:  AuthService,
    private exportService: ExportService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.loadUser().subscribe({
      next:  u => this.user = u,
      error: () => this.user = this.authService.getUser()
    });
  }

  setSection(s: 'appearance' | 'account' | 'data' | 'about') {
    this.activeSection = s;
  }

  goProfile() {
    this.router.navigate(['/profile']);
  }

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  downloadBackup() {
    this.exportingBackup = true;
    this.exportService.exportFullBackup();
    setTimeout(() => {
      this.exportingBackup = false;
      this.backupDone      = true;
      setTimeout(() => this.backupDone = false, 3000);
    }, 1500);
  }

  get userInitial(): string {
    return this.user?.firstName?.charAt(0)?.toUpperCase() || '?';
  }

  get userName(): string {
    if (!this.user) return '';
    return `${this.user.firstName || ''} ${this.user.lastName || ''}`.trim();
  }
}
