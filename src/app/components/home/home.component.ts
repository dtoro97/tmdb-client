import { CarouselModule } from 'primeng/carousel';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TimeWindow } from 'tmdb-ts';

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CAROUSEL_BREAKPOINTS } from '../../carousel-breakpoints';
import { HomeQuery, HomeService } from '../../core';
import { CardComponent } from '../card/card.component';
import { AsyncPipe } from '@angular/common';

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
  constructor(public homeQuery: HomeQuery, public homeService: HomeService) {
    this.homeService.init();
  }

  changeTrending(timeWindow: TimeWindow) {
    this.homeService.updateTrendingTime(timeWindow);
  }
  changePopular(mediaType: string) {
    this.homeService.updatePopularType(mediaType);
  }
}
