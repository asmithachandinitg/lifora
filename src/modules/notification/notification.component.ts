
import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, AppNotification } from '../notification/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css']
})
export class NotificationComponent implements OnInit {

  open = false;
 
   constructor(
     public notifService: NotificationService,
     private router: Router,
     private elRef: ElementRef
   ) {}
 
   ngOnInit() {
     this.notifService.start();
   }
 
   toggle() {
     this.open = !this.open;
   }
 
   navigate(n: AppNotification) {
     this.notifService.markRead(n.id);
     this.open = false;
     this.router.navigate([n.route]);
   }
 
   dismiss(e: Event, id: string) {
     e.stopPropagation();
     this.notifService.dismiss(id);
   }
 
   markAllRead() {
     this.notifService.markAllRead();
   }
 
   clearAll() {
     this.notifService.dismissAll();
   }
 
   // Close when clicking outside this component
   @HostListener('document:click', ['$event'])
   onDocClick(e: MouseEvent) {
     if (!this.elRef.nativeElement.contains(e.target)) {
       this.open = false;
     }
   }
}
