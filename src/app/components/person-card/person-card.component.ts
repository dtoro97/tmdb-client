import { Component, Input, OnInit, Signal } from '@angular/core';

import { ImagePipe } from '../../shared/pipes/image.pipe';
import { RouterLink } from '@angular/router';
import { StateQuery } from '../../core';
import {
  PersonCombinedCredits200ResponseCastInner,
  PersonDetails200Response,
} from '../../api';

@Component({
  selector: 'app-person-card',
  imports: [ImagePipe, RouterLink],
  templateUrl: './person-card.component.html',
  styleUrl: './person-card.component.scss',
})
export class PersonCardComponent implements OnInit {
  @Input() person: any;
  isMobile: Signal<boolean>;

  constructor(private stateQuery: StateQuery) {}

  ngOnInit(): void {
    this.isMobile = this.stateQuery.isMobile;
  }
}
