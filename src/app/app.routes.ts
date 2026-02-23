import { Routes } from '@angular/router';
import { DashboardComponent }
    from '../modules/dashboard/dashboard.component';
import { DiaryComponent }
    from '../modules/diary/diary.component';
import { RegisterComponent }
    from '../modules/auth/register/register.component';
import { LoginComponent }
    from '../modules/auth/login/login.component';
import { AuthGuard }
    from '../core/auth/auth.guard';
import { LayoutComponent } from '../layout/layout/layout.component';
import { ForgotPasswordComponent } from '../modules/auth/forgot-password/forgot-password.component';
import { TasksComponent } from '../modules/tasks/tasks.component';
import { ExpensesComponent } from '../modules/expenses/expenses.component';
import { MoodComponent } from '../modules/mood/mood.component';
import { GoalsComponent } from '../modules/goals/goals.component';
import { SleepComponent } from '../modules/sleep/sleep.component';


export const routes: Routes = [

    /* Public Routes */
    {
        path: 'login',
        component: LoginComponent
    },
    {
        path: 'register',
        component: RegisterComponent
    },
    {
        path: 'forgot-password',
        component: ForgotPasswordComponent
    },

    /* Protected App Layout */
    {
        path: '',
        component: LayoutComponent,
        canActivate: [AuthGuard],
        children: [
            {
                path: '',
                component: DashboardComponent
            },
            {
                path: 'diary',
                component: DiaryComponent
            },
            {
                path: 'tasks',
                component: TasksComponent
            },
             {
                path: 'expenses',
                component: ExpensesComponent
            },
            {
                path: 'mood',
                component: MoodComponent
            },
             {
                path: 'goals',
                component: GoalsComponent
            },
             {
                path: 'sleep',
                component: SleepComponent
            }
        ]
    },

    /* Fallback */
    {
        path: '**',
        redirectTo: ''
    }
];