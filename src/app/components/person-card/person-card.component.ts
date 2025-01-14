import { Observable } from 'rxjs';
import { Cast } from 'tmdb-ts';

import { Component, Input, OnInit } from '@angular/core';

import { StateQuery } from '../../state/state.query';

@Component({
  selector: 'app-person-card',
  standalone: false,

  templateUrl: './person-card.component.html',
  styleUrl: './person-card.component.scss',
})
export class PersonCardComponent implements OnInit {
  @Input() person: Cast;
  isMobile$: Observable<boolean>;

  constructor(private stateQuery: StateQuery) {}

  ngOnInit(): void {
    this.isMobile$ = this.stateQuery.isMobile$;
  }
}
