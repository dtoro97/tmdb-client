import { Cast } from 'tmdb-ts';

import { Component, Input, Signal, inject } from '@angular/core';

import { ImagePipe } from '../../pipes/image.pipe';
import { RouterLink } from '@angular/router';
import { AppStoreService } from '../../../core/app-store.service';

@Component({
  selector: 'app-person-card',
  imports: [ImagePipe, RouterLink],
  templateUrl: './person-card.component.html',
  styleUrl: './person-card.component.scss',
})
export class PersonCardComponent {
  @Input() person: Cast;
  isMobile: Signal<boolean>;

  private appStore = inject(AppStoreService);

  constructor() {
    this.isMobile = this.appStore.isMobile;
  }
}
