import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ToastService } from '../auth/toast.service';

// Map of route path → module key
const ROUTE_MODULE_MAP: Record<string, string> = {
  'diary':     'diary',
  'tasks':     'tasks',
  'habits':    'habits',
  'goals':     'goals',
  'food':      'food',
  'fitness':   'fitness',
  'sleep':     'sleep',
  'mood':      'mood',
  'period':    'period',
  'medicine':  'medicine',
  'expenses':  'expenses',
  'travel':    'travel',
  'reading':   'reading',
  'pregnancy': 'pregnancy',
};

export const moduleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router      = inject(Router);
  const toast       = inject(ToastService);

  const user    = authService.getUser();
  const modules: { key: string; enabled: boolean }[] = user?.modules || [];
  const gender  = user?.gender || 'female';

  // Get the module key for this route
  const routePath = route.routeConfig?.path || '';
  const moduleKey = ROUTE_MODULE_MAP[routePath];

  // No key = unprotected route
  if (!moduleKey) return true;

  // Female-only modules blocked for males
  const femaleOnly = ['period', 'pregnancy'];
  if (femaleOnly.includes(moduleKey) && gender === 'male') {
    toast.show('This module is not available for your profile.', 'warning');
    router.navigate(['/dashboard']);
    return false;
  }

  // Check if module is disabled in profile settings
  if (modules.length) {
    const mod = modules.find(m => m.key === moduleKey);
    if (mod && !mod.enabled) {
      toast.show(`${getModuleName(moduleKey)} module is turned off. Enable it in your Profile.`, 'warning');
      router.navigate(['/dashboard']);
      return false;
    }
  }

  return true;
};

function getModuleName(key: string): string {
  const names: Record<string, string> = {
    diary: 'Diary', tasks: 'Tasks', habits: 'Habits', goals: 'Goals',
    food: 'Food', fitness: 'Fitness', sleep: 'Sleep', mood: 'Mood',
    period: 'Period', medicine: 'Medicine', expenses: 'Expenses',
    travel: 'Travel', reading: 'Reading', pregnancy: 'Pregnancy'
  };
  return names[key] || key;
}
