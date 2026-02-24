import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {

  menu = [
    { name: 'Dashboard', icon: 'dashboard', route: '/' },
    { name: 'Diary', icon: 'menu_book', route: '/diary' },
    { name: 'Tasks', icon: 'check_circle', route: '/tasks' },
    { name: 'Habits', icon: 'repeat', route: '/habits' },
    { name: 'Goals', icon: 'flag', route: '/goals' },
    { name: 'Food', icon: 'restaurant', route: '/food' },
    { name: 'Fitness', icon: 'fitness_center', route: '/fitness' },
    { name: 'Sleep', icon: 'bedtime', route: '/sleep' },
    { name: 'Mood', icon: 'mood', route: '/mood' },
    { name: 'Period', icon: 'favorite', route: '/period' },
    { name: 'Medicine', icon: 'medication', route: '/medicine' },
    { name: 'Expenses', icon: 'payments', route: '/expenses' },
    { name: 'Travel', icon: 'flight_takeoff', route: '/travel' },
    { name: 'Relationships', icon: 'groups', route: '/relationships' },
    { name: 'Knowledge', icon: 'psychology', route: '/knowledge' },
    { name: 'Reading', icon: 'auto_stories', route: '/reading' },
    { name: 'Vision Board', icon: 'visibility', route: '/vision-board' },
    { name: 'Pregnancy', icon: 'favorite', route: '/pregnancy' },
  ];

}
