import { TimeWindow } from 'tmdb-ts';

import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { HomeStoreService } from '../home-store.service';
import { MediaCarouselComponent } from '../media-carousel/media-carousel.component';
import { HeroBannerComponent } from '../hero-banner/hero-banner.component';
import { PeopleCarouselComponent } from '../people-carousel/people-carousel.component';
import { PillToggleComponent } from '../../../shared';

@Component({
  selector: 'app-home-page',
  imports: [
    FormsModule,
    AsyncPipe,
    MediaCarouselComponent,
    HeroBannerComponent,
    PeopleCarouselComponent,
    PillToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  trendingOptions = [
    { label: 'Today', value: 'day' as TimeWindow },
    { label: 'This Week', value: 'week' as TimeWindow },
  ];
  popularOptions = [
    { label: 'TV Shows', value: 'tv' },
    { label: 'Movies', value: 'movie' },
  ];
  topRatedOptions = [
    { label: 'Movies', value: 'movie' },
    { label: 'TV Shows', value: 'tv' },
  ];

  constructor(public homeStore: HomeStoreService) {}

  changeTrending(timeWindow: TimeWindow) {
    this.homeStore.updateTrendingTime(timeWindow);
  }

  changePopular(mediaType: string) {
    this.homeStore.updatePopularType(mediaType);
  }

  changeTopRated(mediaType: string) {
    this.homeStore.updateTopRatedType(mediaType);
  }
}
