import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: false,

  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  @Input() public item?: any;
  @Input() public type?: string;
  @Input() public person = false;

  constructor() {}
}
