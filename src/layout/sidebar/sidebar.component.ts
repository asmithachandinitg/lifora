import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  private sub!: Subscription;

  allMenu = [
    { name: 'Dashboard', icon: 'dashboard',      route: '/dashboard',  key: 'dashboard'                    },
    { name: 'Journal',     icon: 'menu_book',       route: '/diary',      key: 'diary'                        },
    { name: 'Tasks',     icon: 'check_circle',    route: '/tasks',      key: 'tasks'                        },
    { name: 'Habits',    icon: 'repeat',          route: '/habits',     key: 'habits'                       },
    { name: 'Goals',     icon: 'flag',            route: '/goals',      key: 'goals'                        },
    { name: 'Food',      icon: 'restaurant',      route: '/food',       key: 'food'                         },
    { name: 'Fitness',   icon: 'fitness_center',  route: '/fitness',    key: 'fitness'                      },
    { name: 'Sleep',     icon: 'bedtime',         route: '/sleep',      key: 'sleep'                        },
    { name: 'Mood',      icon: 'mood',            route: '/mood',       key: 'mood'                         },
    { name: 'Period',    icon: 'favorite',        route: '/period',     key: 'period',    femaleOnly: true   },
    { name: 'Medicine',  icon: 'medication',      route: '/medicine',   key: 'medicine'                     },
    { name: 'Finance',  icon: 'payments',        route: '/expenses',   key: 'expenses'                     },
    { name: 'Travel',    icon: 'flight_takeoff',  route: '/travel',     key: 'travel'                       },
    { name: 'Reading',   icon: 'auto_stories',    route: '/reading',    key: 'reading'                      },
    { name: 'Pregnancy', icon: 'child_care',      route: '/pregnancy',  key: 'pregnancy', femaleOnly: true   },
  ];

  menu: any[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.buildMenu();
    this.sub = this.authService.user$.subscribe(() => this.buildMenu());
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  buildMenu() {
    const user = this.authService.getUser();
    const gender  = user?.gender  || 'female';
    const modules: { key: string; enabled: boolean }[] = user?.modules || [];

    this.menu = this.allMenu.filter(item => {
      if (item.key === 'dashboard') return true;

      if ((item as any).femaleOnly && gender === 'male') return false;

      if (modules.length) {
        const mod = modules.find(m => m.key === item.key);
        return mod ? mod.enabled : true;
      }

      return true;
    });
  }
}
