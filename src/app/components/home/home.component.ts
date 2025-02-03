import { CarouselModule } from 'primeng/carousel';
import { SelectButtonModule } from 'primeng/selectbutton';
import { from, map } from 'rxjs';
import { Movie, PopularTvShowResult, TimeWindow } from 'tmdb-ts';

import {
  ChangeDetectionStrategy,
  Component,
  effect,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CAROUSEL_BREAKPOINTS } from '../../carousel-breakpoints';
import { StateService } from '../../core';
import { TmdbService } from '../../shared';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-home',
  imports: [SelectButtonModule, CarouselModule, FormsModule, CardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  trending = signal<any>(undefined);
  popular = signal<Movie[] | PopularTvShowResult[]>([]);
  upcomingMovies = signal<Movie[]>([]);
  selectedTrending = signal<string>('day');
  selectedPopular = signal<string>('tv');
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
  constructor(private tmdb: TmdbService, private stateService: StateService) {
    effect(() => {
      const popular = this.selectedPopular();
      from(
        popular === 'tv'
          ? this.tmdb.tvShows.popular()
          : this.tmdb.movies.popular()
      )
        .pipe(map((data) => data.results))
        .subscribe((data) => {
          this.popular.set(data);
          this.stateService.setLoading(false);
        });
    });

    effect(() => {
      const trending = this.selectedTrending();
      from(this.tmdb.trending.trending('all', trending as TimeWindow))
        .pipe(map((data) => data.results))
        .subscribe((data) => {
          this.trending.set(data);
          this.stateService.setLoading(false);
        });
    });

    from(this.tmdb.movies.popular())
      .pipe(map((data) => data.results))
      .subscribe((data) => this.upcomingMovies.set(data));
  }

  changeTrending(timeWindow: string) {
    if (timeWindow && this.selectedTrending() !== timeWindow) {
      this.stateService.setLoading(true);
      this.selectedTrending.set(timeWindow);
    }
  }
  changePopular(mediaType: string) {
    if (mediaType && this.selectedPopular() !== mediaType) {
      this.stateService.setLoading(true);
      this.selectedPopular.set(mediaType);
    }
  }
}
