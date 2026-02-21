import { Cast, Crew } from 'tmdb-ts';

import { Component, Input, Signal } from '@angular/core';

import { ImagePipe } from '../../pipes/image.pipe';
import { RouterLink } from '@angular/router';
import { GlobalStore } from '../../../core/global.store';

@Component({
  selector: 'app-person-card',
  imports: [ImagePipe, RouterLink],
  templateUrl: './person-card.component.html',
  styleUrl: './person-card.component.scss',
})
export class PersonCardComponent {
  @Input() person: Cast | Crew;
  @Input() mode: 'cast' | 'crew' = 'cast';
  isMobile: Signal<boolean>;

  constructor(private globalStore: GlobalStore) {
    this.isMobile = this.globalStore.isMobile;
  }

  get subtitle(): string {
    if (this.mode === 'crew') {
      return (this.person as Crew).job || '';
    }
    return (this.person as Cast).character || '';
  }
}
