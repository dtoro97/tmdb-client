import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ImagePipe } from '../../shared/pipes/image.pipe';
import { MovieDetails200Response, TvSeriesDetails200Response } from '../../api';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  imports: [ImagePipe, DatePipe, DecimalPipe, RouterLink],
  styleUrl: './card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  @Input() public item: MovieDetails200Response | TvSeriesDetails200Response;
  @Input() public type: string;
  constructor() {}
}
