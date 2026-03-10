import { Component,  OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.css'
})
export class TermsComponent implements OnInit, OnDestroy {

ngOnInit() {
  document.body.style.overflow = 'auto';
  window.scrollTo(0, 0);
}

ngOnDestroy() {
  document.body.style.overflow = '';
}

}
