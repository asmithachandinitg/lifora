import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.css'
})
export class PrivacyComponent implements OnInit, OnDestroy {

ngOnInit() {
  document.body.style.overflow = 'auto';
  window.scrollTo(0, 0);
}

ngOnDestroy() {
  document.body.style.overflow = '';
}

}
