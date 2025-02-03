import { Cast } from 'tmdb-ts';

import { Component, Input, OnInit, Signal } from '@angular/core';

import { StateQuery } from '../../state/state.query';
import { ImagePipe } from '../../pipes/image.pipe';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-person-card',
  imports: [ImagePipe, AsyncPipe, RouterLink],
  templateUrl: './person-card.component.html',
  styleUrl: './person-card.component.scss',
})
export class PersonCardComponent implements OnInit {
  @Input() person: Cast;
  isMobile: Signal<boolean>;

  constructor(private stateQuery: StateQuery) {}

  ngOnInit(): void {
    this.isMobile = this.stateQuery.isMobile;
  }
}
