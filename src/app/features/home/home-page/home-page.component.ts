import { SelectButtonModule } from 'primeng/selectbutton';
import { TimeWindow } from 'tmdb-ts';

import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { HomeStoreService } from '../home-store.service';
import { MediaCarouselComponent } from '../media-carousel/media-carousel.component';

@Component({
  selector: 'app-home-page',
  imports: [SelectButtonModule, FormsModule, AsyncPipe, MediaCarouselComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
})
export class HomePageComponent {
  trendingOptions = [
    { label: 'Today', value: 'day' },
    { label: 'This Week', value: 'week' },
  ];
  popularOptions = [
    { label: 'TV Shows', value: 'tv' },
    { label: 'Movies', value: 'movie' },
  ];

  constructor(public homeStore: HomeStoreService) {}

  changeTrending(timeWindow: TimeWindow) {
    this.homeStore.updateTrendingTime(timeWindow);
  }

  changePopular(mediaType: string) {
    this.homeStore.updatePopularType(mediaType);
  }
}
