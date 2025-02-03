import { Movie, PopularTvShowResult } from 'tmdb-ts';

import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ImagePipe } from '../../shared/pipes/image.pipe';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  imports: [ImagePipe, DatePipe, DecimalPipe, RouterLink],
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  @Input() public item: Movie | PopularTvShowResult;
  @Input() public type: string;
  constructor() {}
}
