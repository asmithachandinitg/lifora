import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WidgetCardComponent } from '../../shared/widgets/widget-card/widget-card.component';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [WidgetCardComponent, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
user: any;

constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {

    this.user = this.authService.getUser();

    if (!this.user && this.authService.isLoggedIn()) {
      this.authService.loadUser()
        .subscribe(user => this.user = user);
    }
  }
  
}
