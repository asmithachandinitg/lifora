import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { Subscription } from 'rxjs';

interface MenuItem {
  name: string;
  icon: string;
  route: string;
  key: string;
  femaleOnly?: boolean;
}

interface MenuGroup {
  group: string;
  icon: string;
  key: string;
  collapsed: boolean;
  items: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {

  private sub!: Subscription;

  allMenuGroups: MenuGroup[] = [
    {
      group: 'Productivity',
      icon: 'bar_chart',
      key: 'productivity',
      collapsed: true,
      items: [
        { name: 'Dashboard', icon: 'dashboard',     route: '/dashboard', key: 'dashboard' },
        { name: 'Tasks',     icon: 'check_circle',  route: '/tasks',     key: 'tasks'     },
        { name: 'Habits',    icon: 'repeat',        route: '/habits',    key: 'habits'    },
        { name: 'Goals',     icon: 'flag',          route: '/goals',     key: 'goals'     },
      ]
    },
    {
      group: 'Health',
      icon: 'favorite',
      key: 'health',
      collapsed: true,
      items: [
        { name: 'Food',      icon: 'restaurant',    route: '/food',      key: 'food'      },
        { name: 'Fitness',   icon: 'fitness_center',route: '/fitness',   key: 'fitness'   },
        { name: 'Sleep',     icon: 'bedtime',       route: '/sleep',     key: 'sleep'     },
        { name: 'Mood',      icon: 'mood',          route: '/mood',      key: 'mood'      },
        { name: 'Medicine',  icon: 'medication',    route: '/medicine',  key: 'medicine'  },
        { name: 'Period',    icon: 'water_drop',    route: '/period',    key: 'period',   femaleOnly: true },
        { name: 'Pregnancy', icon: 'child_care',    route: '/pregnancy', key: 'pregnancy',femaleOnly: true },
      ]
    },
    {
      group: 'Finance',
      icon: 'account_balance_wallet',
      key: 'finance',
      collapsed: true,
      items: [
        { name: 'Finance',   icon: 'payments',      route: '/expenses',  key: 'expenses'  },
      ]
    },
    {
      group: 'Growth & Lifestyle',
      icon: 'auto_awesome',
      key: 'lifestyle',
      collapsed: true,
      items: [
        { name: 'Journal',   icon: 'menu_book',     route: '/diary',     key: 'diary'     },
        { name: 'Reading',   icon: 'auto_stories',  route: '/reading',   key: 'reading'   },
        { name: 'Travel',    icon: 'flight_takeoff',route: '/travel',    key: 'travel'    },
        { name: 'Knowledge', icon: 'lightbulb',     route: '/knowledge', key: 'knowledge' },
        { name: 'Vision Board',  icon: 'grid_view', route: '/vision',    key: 'vision'    },
      ]
    },
  ];

  menuGroups: MenuGroup[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.buildMenu();
    this.sub = this.authService.user$.subscribe(() => this.buildMenu());
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  buildMenu() {
    const user    = this.authService.getUser();
    const gender  = user?.gender  || 'female';
    const modules: { key: string; enabled: boolean }[] = user?.modules || [];

    this.menuGroups = this.allMenuGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => {
          if (item.key === 'dashboard') return true;
          if (item.femaleOnly && gender === 'male') return false;
          if (modules.length) {
            const mod = modules.find(m => m.key === item.key);
            return mod ? mod.enabled : true;
          }
          return true;
        })
      }))
      .filter(group => group.items.length > 0); // hide empty groups
  }

  toggleGroup(group: MenuGroup) {
    group.collapsed = !group.collapsed;
  }
}
