import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { Router } from '@angular/router';
import { NotificationComponent } from '../../modules/notification/notification.component';


@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, NotificationComponent],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent {

  today = new Date();
  user: any;
  menuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

ngOnInit() {
  if (this.authService.isLoggedIn()) {
    this.authService.loadUser()
      .subscribe({
        next: (user) => {
          console.log('User loaded:', user);
          this.user = user;  
        },
        error: (err) => {
          console.error('Error loading user:', err);
          this.user = this.authService.getUser();
        }
      });
  } else {
    this.user = this.authService.getUser();
  }
}

  getGreeting() {
    const hour = this.today.getHours();

    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  goProfile() {
    this.router.navigate(['/profile']);
    this.menuOpen = false;
  }

    goSettings() {
    this.router.navigate(['/settings']);
    this.menuOpen = false;
  }
}
