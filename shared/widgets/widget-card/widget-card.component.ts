import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-widget-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './widget-card.component.html',
  styleUrls: ['./widget-card.component.css']
})
export class WidgetCardComponent {

  @Input() title = '';
  @Input() icon = '';

}
