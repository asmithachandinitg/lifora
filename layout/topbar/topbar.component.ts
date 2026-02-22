import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
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

    this.user = this.authService.getUser();

    if (!this.user && this.authService.isLoggedIn()) {
      this.authService.loadUser()
        .subscribe(user => this.user = user);
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
}
