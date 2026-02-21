import { CarouselModule } from 'primeng/carousel';
import { SelectButtonModule } from 'primeng/selectbutton';

import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CAROUSEL_BREAKPOINTS } from '../../constants';
import { HomeQuery, HomeService } from '../../core';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-home',
  imports: [
    SelectButtonModule,
    CarouselModule,
    FormsModule,
    CardComponent,
    AsyncPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  breakpoints = CAROUSEL_BREAKPOINTS;
  trendingOptions = [
    { label: 'Today', value: 'day' },
    { label: 'This Week', value: 'week' },
  ];
  popularOptions = [
    {
      label: 'TV Shows',
      value: 'tv',
    },
    {
      label: 'Movies',
      value: 'movie',
    },
  ];
  constructor(
    public homeQuery: HomeQuery,
    public homeService: HomeService,
  ) {}

  changeTrending(timeWindow: 'day' | 'week') {
    this.homeService.updateTrendingTime(timeWindow);
  }
  changePopular(mediaType: string) {
    this.homeService.updatePopularType(mediaType);
  }
}
