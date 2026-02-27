import { Routes } from '@angular/router';
import { moduleGuard } from '../core/auth/module.guard';
import { AuthGuard } from '../core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    // Your layout wrapper
    loadComponent: () => import('../layout/layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard',  loadComponent: () => import('../modules/dashboard/dashboard.component').then(m => m.DashboardComponent) },

      // ↓ Add canActivate: [moduleGuard] to every module route
      { path: 'diary',     canActivate: [moduleGuard], loadComponent: () => import('../modules/diary/diary.component').then(m => m.DiaryComponent) },
      { path: 'tasks',     canActivate: [moduleGuard], loadComponent: () => import('../modules/tasks/tasks.component').then(m => m.TasksComponent) },
      { path: 'habits',    canActivate: [moduleGuard], loadComponent: () => import('../modules/habits/habits.component').then(m => m.HabitsComponent) },
      { path: 'goals',     canActivate: [moduleGuard], loadComponent: () => import('../modules/goals/goals.component').then(m => m.GoalsComponent) },
      { path: 'food',      canActivate: [moduleGuard], loadComponent: () => import('../modules/food/food.component').then(m => m.FoodComponent) },
      { path: 'fitness',   canActivate: [moduleGuard], loadComponent: () => import('../modules/fitness/fitness.component').then(m => m.FitnessComponent) },
      { path: 'sleep',     canActivate: [moduleGuard], loadComponent: () => import('../modules/sleep/sleep.component').then(m => m.SleepComponent) },
      { path: 'mood',      canActivate: [moduleGuard], loadComponent: () => import('../modules/mood/mood.component').then(m => m.MoodComponent) },
      { path: 'period',    canActivate: [moduleGuard], loadComponent: () => import('../modules/period/period.component').then(m => m.PeriodComponent) },
      { path: 'medicine',  canActivate: [moduleGuard], loadComponent: () => import('../modules/medicine/medicine.component').then(m => m.MedicineComponent) },
      { path: 'expenses',  canActivate: [moduleGuard], loadComponent: () => import('../modules/expenses/expenses.component').then(m => m.ExpensesComponent) },
      { path: 'travel',    canActivate: [moduleGuard], loadComponent: () => import('../modules/travel/travel.component').then(m => m.TravelComponent) },
      { path: 'reading',   canActivate: [moduleGuard], loadComponent: () => import('../modules/reading/reading.component').then(m => m.ReadingComponent) },
      { path: 'pregnancy', canActivate: [moduleGuard], loadComponent: () => import('../modules/pregnancy/pregnancy.component').then(m => m.PregnancyComponent) },

      { path: 'profile',   loadComponent: () => import('../modules/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'settings',  loadComponent: () => import('../modules/settings/settings.component').then(m => m.SettingsComponent) },
    ]
  },

  { path: 'login',    loadComponent: () => import('../modules/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('../modules/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: '**', redirectTo: '/dashboard' }
];