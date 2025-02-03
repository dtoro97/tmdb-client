import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Movie, PopularTvShowResult } from 'tmdb-ts';
import { ImagePipe } from '../../pipes/image.pipe';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

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
