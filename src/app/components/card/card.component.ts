import { Component, Input } from '@angular/core';
import { Movie, PopularTvShowResult } from 'tmdb-ts';

@Component({
  selector: 'app-card',
  standalone: false,

  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  @Input() public item: Movie | PopularTvShowResult;
  @Input() public type: string;
  constructor() {}
}
