import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfile, Gender, ModuleToggle } from './profile.model';
import { ProfileService } from './profile.service';
import { AuthService } from '../../core/auth/auth.service';
import { Country, State, City } from 'country-state-city';
import { NgSelectModule } from '@ng-select/ng-select';
import { allCountries } from 'country-telephone-data';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  activeTab: 'personal' | 'body' | 'modules' | 'security' = 'personal';
  loading = false;
  saving = false;
  successMsg = '';
  errorMsg = '';

  profile: UserProfile = this.emptyProfile();

  // Password
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordError = '';
  passwordSuccess = '';
  showCurrentPwd = false;
  showNewPwd = false;
  showConfirmPwd = false;

  // Math reference for template
  Math = Math;

  allModules: ModuleToggle[] = [
    { key: 'dashboard', label: 'Dashboard', icon: 'dashboard',      enabled: true },
    { key: 'diary',     label: 'Diary',      icon: 'menu_book',      enabled: true },
    { key: 'tasks',     label: 'Tasks',      icon: 'check_circle',   enabled: true },
    { key: 'habits',    label: 'Habits',     icon: 'repeat',         enabled: true },
    { key: 'goals',     label: 'Goals',      icon: 'flag',           enabled: true },
    { key: 'food',      label: 'Food',       icon: 'restaurant',     enabled: true },
    { key: 'fitness',   label: 'Fitness',    icon: 'fitness_center', enabled: true },
    { key: 'sleep',     label: 'Sleep',      icon: 'bedtime',        enabled: true },
    { key: 'mood',      label: 'Mood',       icon: 'mood',           enabled: true },
    { key: 'period',    label: 'Period',     icon: 'favorite',       enabled: true },
    { key: 'medicine',  label: 'Medicine',   icon: 'medication',     enabled: true },
    { key: 'expenses',  label: 'Expenses',   icon: 'payments',       enabled: true },
    { key: 'travel',    label: 'Travel',     icon: 'flight_takeoff', enabled: true },
    { key: 'reading',   label: 'Reading',    icon: 'auto_stories',   enabled: true },
    { key: 'pregnancy', label: 'Pregnancy',  icon: 'child_care',     enabled: true },
    { key: 'knowledge',  label: 'Knowledge', icon: 'lightbulb', enabled: true },

  ];

  genderOptions: { value: Gender; label: string; icon: string }[] = [
    { value: 'female', label: 'Female', icon: '♀' },
    { value: 'male', label: 'Male', icon: '♂' },
    { value: 'other', label: 'Other', icon: '⚧' },
  ];

  countries: any[] = [];
  states: any[] = [];
  cities: any[] = [];

  selectedCountry: any;
  selectedState: any;
  selectedCity: any;

   countryCodes = allCountries.map(c => ({
    name: c.name,
    code: '+' + c.dialCode,
    iso2: c.iso2
  }));

selectedCode: any = null;
  constructor(
    private profileService: ProfileService,
    private authService: AuthService
  ) { }

  ngOnInit() 
  { 
    this.loadProfile(); 
    this.countries = Country.getAllCountries();
  }

  loadProfile() {
    this.loading = true;
    this.profileService.getProfile().subscribe({
      next: (data) => {
        this.profile = { ...this.emptyProfile(), ...data };
           if (this.profile.phoneCode) {
        this.selectedCode = this.countryCodes.find(
          c => c.code.replace('+', '') === this.profile.phoneCode.replace('+', '').trim()
        );
      }
        if (data.modules?.length) {
          this.allModules = this.allModules.map(m => {
            const saved = data.modules!.find(s => s.key === m.key);
            return saved ? { ...m, enabled: saved.enabled } : m;
          });
        }
        this.loading = false;
      },
      error: () => { this.errorMsg = 'Failed to load profile.'; this.loading = false; }
    });
  }

  emptyProfile(): UserProfile {
    return {
      firstName: '', lastName: '', email: '', phone: '', phoneCode: '',
      gender: '', dob: '', country: '', state: '', city: '',
      weight: 0, height: 0
    };
  }

  // ── Computed ──────────────────────────────────────────────

  get isMale(): boolean { return this.profile.gender === 'male'; }

  get visibleModules(): ModuleToggle[] {
    if (this.isMale) return this.allModules.filter(m => m.key !== 'period' && m.key !== 'pregnancy');
    return this.allModules;
  }

  get calculatedAge(): number {
    if (!this.profile.dob) return 0;
    const today = new Date();
    const birth = new Date(this.profile.dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  get calculatedBMI(): number {
    if (!this.profile.weight || !this.profile.height) return 0;
    const h = this.profile.height / 100;
    return parseFloat((this.profile.weight / (h * h)).toFixed(1));
  }

  get bmiCategory(): { label: string; color: string } {
    const bmi = this.calculatedBMI;
    if (!bmi)        return { label: '—',           color: '#9ca3af' };
    if (bmi < 18.5)  return { label: 'Underweight', color: '#3b82f6' };
    if (bmi < 25)    return { label: 'Normal',      color: '#22c55e' };
    if (bmi < 30)    return { label: 'Overweight',  color: '#f59e0b' };
    return             { label: 'Obese',          color: '#ef4444' };
  }

  get avatarInitials(): string {
    const f = this.profile.firstName?.charAt(0) || '';
    const l = this.profile.lastName?.charAt(0) || '';
    return (f + l).toUpperCase() || '?';
  }

  get enabledModulesCount(): number {
    return this.visibleModules.filter(m => m.enabled).length;
  }

  // ── Actions ───────────────────────────────────────────────

  onTabChange(tab: 'personal' | 'body' | 'modules' | 'security') {
    this.activeTab = tab;
    this.clearMessages();
  }

  saveProfile() {
    if (!this.profile.firstName.trim()) { this.errorMsg = 'First name is required.'; return; }
    this.saving = true;
    const payload = { ...this.profile, phoneCode: this.selectedCode?.code || '', age: this.calculatedAge, bmi: this.calculatedBMI };
    this.profileService.updateProfile(payload).subscribe({
      next: (updated) => {
        this.profile = { ...this.emptyProfile(), ...updated };
        this.authService.setUser(updated);
        this.successMsg = 'Profile updated successfully!';
        this.saving = false;
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: () => { this.errorMsg = 'Failed to update profile.'; this.saving = false; }
    });
  }

  saveModules() {
    this.saving = true;
    const payload = this.visibleModules.map(m => ({ key: m.key, enabled: m.enabled }));
    this.profileService.updateModules(payload).subscribe({
      next: () => {
        this.authService.updateModules(this.visibleModules);
        this.successMsg = 'Module preferences saved!';
        this.saving = false;
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: () => { this.errorMsg = 'Failed to save modules.'; this.saving = false; }
    });
  }

  changePassword() {
    this.passwordError = ''; this.passwordSuccess = '';
    if (!this.currentPassword) { this.passwordError = 'Current password is required.'; return; }
    if (this.newPassword.length < 6) { this.passwordError = 'New password must be at least 6 characters.'; return; }
    if (this.newPassword !== this.confirmPassword) { this.passwordError = 'Passwords do not match.'; return; }
    this.saving = true;
    this.profileService.changePassword({ currentPassword: this.currentPassword, newPassword: this.newPassword }).subscribe({
      next: () => {
        this.passwordSuccess = 'Password changed successfully!';
        this.currentPassword = ''; this.newPassword = ''; this.confirmPassword = '';
        this.saving = false;
        setTimeout(() => this.passwordSuccess = '', 3000);
      },
      error: (err) => { this.passwordError = err?.error?.message || 'Failed to change password.'; this.saving = false; }
    });
  }

  toggleModule(mod: ModuleToggle) { mod.enabled = !mod.enabled; }
  enableAll()  { this.visibleModules.forEach(m => m.enabled = true); }
  disableAll() { this.visibleModules.forEach(m => m.enabled = false); }
  clearMessages() { this.successMsg = ''; this.errorMsg = ''; this.passwordError = ''; this.passwordSuccess = ''; }

  onCountryChange(country: any) {
  this.selectedCountry = country;

  this.states = State.getStatesOfCountry(country.isoCode);
  this.cities = [];

  this.profile.country = country.name;
}

onStateChange(state: any) {
  this.selectedState = state;

  this.cities = City.getCitiesOfState(
    this.selectedCountry.isoCode,
    state.isoCode
  );

  this.profile.state = state.name;
}

onCityChange(city: any) {
  this.selectedCity = city;

  this.profile.city = city.name;
}

  allowOnlyNumbers(event: any) {
  const input = event.target;
  input.value = input.value.replace(/[^0-9]/g, '');
  this.profile.phone = input.value;
}
}
